// Origem de campanha nesta aba. Só os cinco parâmetros UTM são guardados;
// dados do formulário, URLs de WhatsApp e identificadores pessoais não entram aqui.
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory;
  if (!root || !root.document) return;
  let storage;
  try { storage = root.sessionStorage; } catch (_) { /* Navegação funciona sem storage. */ }
  const officialHost = ['www.enduranceon.com.br', 'enduranceon.com.br'].includes(root.location.hostname);
  const acquisition = factory({
    location: root.location,
    storage,
    track(name, parameters) {
      if (!officialHost || typeof root.gtag !== 'function') return false;
      root.gtag('event', name, parameters);
      return true;
    }
  });
  root.EonAcquisition = acquisition;
  root.document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button > 0) return;
    const link = event.target?.closest?.('a[href]');
    if (!link || link.hasAttribute('download')) return;
    try {
      const url = new URL(link.href, root.location.href);
      // Não transforme rolagem dentro da página em uma navegação com nova query.
      if ((link.getAttribute('href') || '').trim().startsWith('#') ||
          (url.origin === root.location.origin && url.pathname === root.location.pathname &&
           url.search === root.location.search && url.hash)) return;
      if (url.protocol === 'https:' && ['wa.me', 'api.whatsapp.com'].includes(url.hostname)) {
        acquisition.trackWhatsApp(link.classList.contains('wa-float') ? 'botao_flutuante' : 'link_site');
      } else if (url.origin === root.location.origin) {
        link.href = acquisition.decorateUrl(url).href;
      }
    } catch (_) { /* Um link inválido não interrompe a navegação. */ }
  });
})(typeof window === 'undefined' ? null : window, function createAcquisition(options) {
  'use strict';
  const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const KEY = 'eon.acquisition.v1';
  const LEADS_KEY = 'eon.confirmed-leads.v1';
  const FORM_NAMES = ['onboarding_assessoria', 'contato_site'];
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const location = options.location;
  const storage = options.storage;

  function cleanCampaign(input) {
    const result = {};
    for (const key of UTM_KEYS) {
      const value = input && input[key];
      if (typeof value !== 'string') continue;
      const clean = value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 160);
      if (clean) result[key] = clean;
    }
    return result;
  }
  function read(key) {
    try { return JSON.parse(storage?.getItem(key) || 'null'); } catch (_) { return null; }
  }
  function save(key, value) {
    try { storage?.setItem(key, JSON.stringify(value)); } catch (_) { /* Continua em memória. */ }
  }
  const stored = read(KEY);
  let first = cleanCampaign(stored?.first);
  let current = cleanCampaign(stored?.current);
  const incoming = cleanCampaign(Object.fromEntries(new URLSearchParams(location.search)));
  if (Object.keys(incoming).length) {
    // Uma nova campanha substitui o conjunto completo: nunca combina dados de
    // campanhas diferentes quando a nova entrada não tem todos os parâmetros.
    current = incoming;
    if (!Object.keys(first).length) first = incoming;
  }
  if (Object.keys(current).length) save(KEY, { first, current });

  const storedLeads = read(LEADS_KEY);
  const confirmed = new Set(Array.isArray(storedLeads) ? storedLeads.filter(value =>
    typeof value === 'string' && FORM_NAMES.some(name => value.startsWith(name + ':') && UUID.test(value.slice(name.length + 1)))
  ).slice(-50) : []);
  function track(name, parameters) {
    try { return options.track?.(name, parameters) === true; } catch (_) { return false; }
  }

  return Object.freeze({
    getUtm: () => ({ ...current }),
    getFirstUtm: () => ({ ...first }),
    decorateUrl(input) {
      const url = new URL(input, location.href);
      if (url.origin !== location.origin || !['http:', 'https:'].includes(url.protocol)) return url;
      // A campanha explicitamente definida no destino tem prioridade.
      if (!UTM_KEYS.some(key => url.searchParams.has(key))) {
        for (const [key, value] of Object.entries(current)) url.searchParams.set(key, value);
      }
      return url;
    },
    trackLead(formName, requestId) {
      if (!FORM_NAMES.includes(formName) || !UUID.test(requestId || '')) return false;
      const id = formName + ':' + requestId;
      if (confirmed.has(id) || !track('submit_lead_form', { form_name: formName })) return false;
      confirmed.add(id);
      // O identificador serve apenas à deduplicação local; não é enviado ao GA4.
      save(LEADS_KEY, [...confirmed].slice(-50));
      return true;
    },
    trackWhatsApp(position) {
      return track('whatsapp_click', { link_location: position === 'botao_flutuante' ? position : 'link_site' });
    }
  });
});
