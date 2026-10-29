// Formulário de contato do site novo.
// Modo "demo": valida os campos e mostra o resultado, mas não envia nada.
// Modo "live": envia para a função pública `public-contact-request` da EON Store, que grava o
// contato em Assessoria > Contatos do site (pull request enduranceon/eon-store#130). Só deve ser
// ligado no www, com a função no ar: a função e o Turnstile só aceitam www.enduranceon.com.br.
(() => {
  'use strict';
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  const flag = document.getElementById('preview-flag');
  const turnstileWrap = document.getElementById('turnstile-wrap');
  const turnstileError = document.getElementById('turnstile-err');
  if (!form || !status) return;

  let config = { mode: 'demo' };
  try { config = { ...config, ...JSON.parse(document.getElementById('eon-contact-config').textContent) }; }
  catch (_) { /* sem configuração válida, continua em demonstração */ }
  const wantsLive = config.mode === 'live';
  const endpoint = String(config.endpoint || '');
  if (flag) flag.hidden = wantsLive;

  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const digits = value => String(value || '').replace(/\D/g, '');

  // Telefone brasileiro: aceita com ou sem +55 e exige DDD (10 ou 11 dígitos).
  function validPhone(value) {
    let number = digits(value);
    if ((number.length === 12 || number.length === 13) && number.startsWith('55')) number = number.slice(2);
    return (number.length === 10 || number.length === 11) && /^[1-9]/.test(number);
  }

  const MESSAGES = {
    full_name: 'Informe seu nome completo.',
    whatsapp: 'Informe um WhatsApp com DDD, por exemplo (48) 99999-9999.',
    email: 'Informe um e-mail válido.',
    subject: 'Informe o assunto.',
    message: 'Escreva sua mensagem, com pelo menos 10 caracteres.'
  };
  const rules = {
    full_name: value => value.trim().length >= 3 || MESSAGES.full_name,
    whatsapp: value => validPhone(value) || MESSAGES.whatsapp,
    email: value => EMAIL.test(value.trim()) || MESSAGES.email,
    subject: value => value.trim().length >= 3 || MESSAGES.subject,
    message: value => value.trim().length >= 10 || MESSAGES.message
  };
  const fieldIds = { full_name: 'c-name', whatsapp: 'c-whatsapp', email: 'c-email', subject: 'c-subject', message: 'c-message' };

  function setError(name, message) {
    const input = document.getElementById(fieldIds[name]);
    const error = document.getElementById(fieldIds[name] + '-err');
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    error.textContent = message || '';
    error.hidden = !message;
  }
  function showStatus(kind, message) {
    status.className = 'form-status' + (kind ? ' ' + kind : '');
    status.textContent = message;
    status.hidden = !message;
  }

  // Identificador do envio: o mesmo em novas tentativas, para o servidor não duplicar.
  const newRequestId = () => {
    if (crypto.randomUUID) return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map(byte => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  };
  let requestId = newRequestId();

  // Verificação de segurança (Cloudflare Turnstile), só no modo real e com a chave configurada.
  let widgetId = null;
  let token = '';
  const setTurnstileError = message => {
    if (!turnstileError) return;
    turnstileError.textContent = message || '';
    turnstileError.hidden = !message;
  };
  function loadTurnstile() {
    return new Promise((resolve, reject) => {
      if (window.turnstile) { resolve(window.turnstile); return; }
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => resolve(window.turnstile);
      script.onerror = reject;
      document.head.append(script);
    });
  }
  async function setupTurnstile() {
    if (!wantsLive || !config.turnstile_site_key || !turnstileWrap) return;
    turnstileWrap.hidden = false;
    try {
      const turnstile = await loadTurnstile();
      widgetId = turnstile.render('#turnstile-box', {
        sitekey: config.turnstile_site_key,
        action: 'contact_submit',
        callback: value => { token = value; setTurnstileError(''); },
        'expired-callback': () => { token = ''; },
        'error-callback': () => { token = ''; setTurnstileError('Não foi possível carregar a verificação de segurança. Atualize a página.'); }
      });
    } catch (_) {
      setTurnstileError('Não foi possível carregar a verificação de segurança. Atualize a página.');
    }
  }
  function resetTurnstile() {
    token = '';
    if (widgetId !== null && window.turnstile) window.turnstile.reset(widgetId);
  }
  setupTurnstile();

  function utmParams() {
    const utm = {};
    for (const [key, value] of new URLSearchParams(location.search)) {
      if (key.startsWith('utm_') && Object.keys(utm).length < 8) utm[key.slice(0, 40)] = value.slice(0, 160);
    }
    return utm;
  }

  async function send(data) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Number(config.timeout_ms) || 15000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId,
          full_name: data.full_name.trim(),
          whatsapp: data.whatsapp.trim(),
          email: data.email.trim(),
          subject: data.subject.trim(),
          message: data.message.trim(),
          turnstile_token: token,
          website: '',
          landing_page: location.origin + location.pathname,
          utm: utmParams()
        }),
        signal: controller.signal
      });
      let body = null;
      try { body = await response.json(); } catch (_) { /* resposta sem JSON */ }
      return { code: response.status, body };
    } finally {
      clearTimeout(timer);
    }
  }

  const SERVER_FIELD_MESSAGES = {
    full_name: MESSAGES.full_name, whatsapp: MESSAGES.whatsapp, email: MESSAGES.email,
    subject: 'O assunto precisa ter entre 3 e 120 caracteres.',
    message: 'A mensagem precisa ter entre 10 e 1500 caracteres.'
  };
  const FALLBACK = 'Não foi possível enviar agora. Tente novamente ou fale pelo WhatsApp.';

  function showServerResult({ code, body }) {
    if (code === 200 || code === 201) {
      showStatus('ok', 'Mensagem enviada! Nossa equipe vai falar com você pelo WhatsApp.');
      form.reset();
      requestId = newRequestId();
      resetTurnstile();
      return;
    }
    const serverFields = Array.isArray(body?.field_errors) ? body.field_errors : [];
    if (code === 400 && serverFields.length) {
      let first = null;
      for (const { field } of serverFields) {
        if (fieldIds[field]) { setError(field, SERVER_FIELD_MESSAGES[field]); first = first || document.getElementById(fieldIds[field]); }
        if (field === 'turnstile_token') setTurnstileError('Marque a verificação de segurança antes de enviar.');
      }
      showStatus('error', body.error || 'Revise os campos destacados antes de enviar.');
      if (first) first.focus();
      return;
    }
    if (code === 403) resetTurnstile();
    if (code === 409) requestId = newRequestId();
    showStatus('error', body?.error || FALLBACK);
  }

  form.addEventListener('input', event => {
    const name = event.target.name;
    if (rules[name] && event.target.getAttribute('aria-invalid') === 'true') {
      const result = rules[name](event.target.value);
      setError(name, result === true ? '' : result);
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const submitButton = form.querySelector('[type="submit"]');
    if (submitButton.disabled) return;
    const data = Object.fromEntries(new FormData(form));
    let firstInvalid = null;
    for (const [name, check] of Object.entries(rules)) {
      const result = check(String(data[name] || ''));
      setError(name, result === true ? '' : result);
      if (result !== true && !firstInvalid) firstInvalid = document.getElementById(fieldIds[name]);
    }
    if (firstInvalid) {
      showStatus('error', 'Revise os campos destacados antes de enviar.');
      firstInvalid.focus();
      return;
    }
    // Campo escondido para robôs: finge sucesso sem enviar.
    if (String(data.website || '').trim()) { showStatus('ok', 'Mensagem recebida.'); return; }
    if (!wantsLive) {
      showStatus('', 'Prévia: os dados estão corretos, mas nada foi enviado. Quando o formulário estiver ligado à EON Store, a mensagem chegará à equipe.');
      return;
    }
    if (!/^https:\/\//.test(endpoint)) {
      showStatus('error', 'O envio ainda não está configurado. Fale com a equipe pelo WhatsApp.');
      return;
    }
    if (config.turnstile_site_key && !token) {
      setTurnstileError('Marque a verificação de segurança antes de enviar.');
      showStatus('error', 'Marque a verificação de segurança antes de enviar.');
      return;
    }
    const label = submitButton.innerHTML;
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando…';
    showStatus('', 'Enviando sua mensagem…');
    try {
      showServerResult(await send(data));
    } catch (_) {
      showStatus('error', 'Sem conexão com o servidor. Tente novamente ou fale pelo WhatsApp.');
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = label;
    }
  });
})();
