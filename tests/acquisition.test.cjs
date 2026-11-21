const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const createAcquisition = require('../assets/acquisition.js');

const REQUEST_ID = '123e4567-e89b-42d3-a456-426614174000';
function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}
const create = (url, store, track) => createAcquisition({ location: new URL(url), storage: store, track });

test('a campanha da home chega ao formulário após navegação sem parâmetros', () => {
  const store = storage();
  create('https://www.enduranceon.com.br/?utm_source=google&utm_medium=cpc&utm_campaign=corrida', store);
  const form = create('https://www.enduranceon.com.br/cadastro.html?plan_id=plano', store);
  assert.deepEqual(form.getUtm(), { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'corrida' });
  const destination = form.decorateUrl('/contato#formulario');
  assert.equal(destination.pathname, '/contato');
  assert.equal(destination.hash, '#formulario');
  assert.equal(destination.searchParams.get('utm_campaign'), 'corrida');
});

test('nova campanha substitui o conjunto anterior e preserva a primeira entrada', () => {
  const store = storage();
  create('https://www.enduranceon.com.br/?utm_source=google&utm_campaign=corrida&utm_term=assessoria', store);
  const next = create('https://www.enduranceon.com.br/?utm_source=instagram&utm_campaign=triathlon', store);
  assert.deepEqual(next.getUtm(), { utm_source: 'instagram', utm_campaign: 'triathlon' });
  assert.deepEqual(next.getFirstUtm(), { utm_source: 'google', utm_campaign: 'corrida', utm_term: 'assessoria' });
  next.getUtm().utm_source = 'changed';
  assert.equal(next.getUtm().utm_source, 'instagram');
});

test('só UTMs conhecidas, limitadas e sem controles são guardadas; parâmetros pessoais são ignorados', () => {
  const store = storage();
  const campaign = create('https://www.enduranceon.com.br/?cpf=12345678900&email=atleta@example.com&token=secret&utm_email=atleta@example.com&utm_source=%00+google+&utm_campaign=' + 'x'.repeat(300), store);
  assert.deepEqual(campaign.getUtm(), { utm_source: 'google', utm_campaign: 'x'.repeat(160) });
  assert.doesNotMatch(store.getItem('eon.acquisition.v1'), /cpf|email|token|secret|example\.com/);
});

test('storage bloqueado ou inválido não interrompe a navegação e a URL carrega a campanha', () => {
  const blocked = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  const campaign = create('https://www.enduranceon.com.br/?utm_source=google', blocked);
  const target = campaign.decorateUrl('/cadastro.html?plan_id=123');
  assert.equal(target.searchParams.get('plan_id'), '123');
  assert.deepEqual(create(target.href, blocked).getUtm(), { utm_source: 'google' });
  assert.deepEqual(create('https://www.enduranceon.com.br/', { getItem: () => '{broken' }).getUtm(), {});
});

test('links externos e campanhas explícitas no destino não são alterados', () => {
  const campaign = create('https://www.enduranceon.com.br/?utm_source=google', storage());
  assert.equal(campaign.decorateUrl('https://wa.me/123?text=oi').href, 'https://wa.me/123?text=oi');
  assert.equal(campaign.decorateUrl('/contato?utm_source=parceiro').searchParams.get('utm_source'), 'parceiro');
});

test('conversão confirmada é emitida uma vez por requisição, inclusive após recarregar', () => {
  const store = storage();
  const events = [];
  const track = (name, parameters) => { events.push({ name, parameters }); return true; };
  const campaign = create('https://www.enduranceon.com.br/cadastro', store, track);
  assert.equal(campaign.trackLead('onboarding_assessoria', REQUEST_ID), true);
  assert.equal(campaign.trackLead('onboarding_assessoria', REQUEST_ID), false);
  assert.equal(create('https://www.enduranceon.com.br/cadastro', store, track).trackLead('onboarding_assessoria', REQUEST_ID), false);
  assert.deepEqual(events, [{ name: 'submit_lead_form', parameters: { form_name: 'onboarding_assessoria' } }]);
});

test('falha ou ausência do Analytics não impede o fluxo nem marca conversão como emitida', () => {
  const store = storage();
  assert.equal(create('https://www.enduranceon.com.br/', store).trackLead('contato_site', REQUEST_ID), false);
  assert.equal(create('https://www.enduranceon.com.br/', store, () => { throw Error('offline'); }).trackLead('contato_site', REQUEST_ID), false);
  assert.equal(create('https://www.enduranceon.com.br/', store, () => true).trackLead('contato_site', REQUEST_ID), true);
});

test('metadados de eventos são restritos e não recebem telefone, mensagem ou identificador', () => {
  const events = [];
  const campaign = create('https://www.enduranceon.com.br/', storage(), (name, parameters) => { events.push({ name, parameters }); return true; });
  assert.equal(campaign.trackLead('atleta@example.com', REQUEST_ID), false);
  assert.equal(campaign.trackLead('contato_site', 'atleta@example.com'), false);
  campaign.trackWhatsApp('https://wa.me/55123456789?text=dados');
  assert.deepEqual(events, [{ name: 'whatsapp_click', parameters: { link_location: 'link_site' } }]);
});

async function contactScenario({ mode = 'live', code = 201, body, honeypot = '' } = {}) {
  const events = [];
  const listeners = {};
  const button = { disabled: false, innerHTML: 'Enviar' };
  const form = { addEventListener: (event, fn) => { listeners[event] = fn; }, querySelector: () => button, reset() {} };
  const config = { mode, endpoint: 'https://api.example.test/contact' };
  const elements = { 'contact-form': form, 'form-status': {}, 'eon-contact-config': { textContent: JSON.stringify(config) } };
  for (const id of ['c-name', 'c-whatsapp', 'c-email', 'c-subject', 'c-message']) {
    elements[id] = { setAttribute() {}, focus() {} };
    elements[id + '-err'] = {};
  }
  let submitted;
  const context = {
    window: { EonAcquisition: { getUtm: () => ({ utm_source: 'google' }), trackLead: (...args) => events.push(args) } },
    document: { getElementById: key => elements[key] || null },
    crypto: { randomUUID: () => REQUEST_ID },
    location: new URL('https://www.enduranceon.com.br/contato'),
    FormData: class { [Symbol.iterator]() { return Object.entries({ full_name: 'Atleta Teste', whatsapp: '48999991234', email: 'atleta@example.test', subject: 'Corrida', message: 'Gostaria de conhecer os planos.', website: honeypot })[Symbol.iterator](); } },
    fetch: async (_url, options) => { submitted = JSON.parse(options.body); return { status: code, json: async () => body ?? { ok: true, status: 'created', request_id: REQUEST_ID } }; },
    AbortController, setTimeout, clearTimeout, URLSearchParams
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../contato.js'), 'utf8'), context);
  await listeners.submit({ preventDefault() {} });
  return { events, submitted };
}

test('contato envia a campanha persistida e só registra lead com confirmação do servidor', async () => {
  const success = await contactScenario();
  assert.deepEqual(success.events, [['contato_site', REQUEST_ID]]);
  assert.deepEqual(success.submitted.utm, { utm_source: 'google' });
  for (const scenario of [{ mode: 'demo' }, { honeypot: 'bot' }, { code: 500 }, { body: {} }, { body: { ok: true, status: 'created', request_id: 'outro' } }]) {
    assert.deepEqual((await contactScenario(scenario)).events, []);
  }
});

function browser(url, store) {
  const events = [];
  const listeners = {};
  const createLink = href => {
    let raw = href;
    const ownListeners = {};
    const link = {
      className: '',
      get href() { return new URL(raw, url).href; },
      set href(value) { raw = value; },
      getAttribute: key => key === 'href' ? raw : null,
      hasAttribute: () => false,
      setAttribute() {},
      addEventListener: (type, fn) => { ownListeners[type] = fn; },
      closest: () => link,
      click() { ownListeners.click?.({ target: link, button: 0 }); listeners.click({ target: link, button: 0 }); }
    };
    link.classList = { contains: className => link.className.split(' ').includes(className) };
    return link;
  };
  let floating;
  const root = {
    location: new URL(url), sessionStorage: store,
    gtag: (...args) => events.push(JSON.parse(JSON.stringify(args))),
    document: {
      addEventListener: (type, fn) => { listeners[type] = fn; },
      querySelector: () => null,
      createElement: () => createLink(''),
      body: { append: link => { floating = link; } }
    }
  };
  const context = vm.createContext({ window: root, document: root.document, URL, URLSearchParams });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/acquisition.js'), 'utf8'), context);
  return { events, createLink, context, floating: () => floating };
}

test('âncoras na mesma página continuam sendo rolagem, mesmo com campanha na sessão', () => {
  const store = storage();
  create('https://www.enduranceon.com.br/?utm_source=google', store);
  const page = browser('https://www.enduranceon.com.br/', store);
  for (const href of ['#planos', '/#planos', 'https://www.enduranceon.com.br/#planos']) {
    const link = page.createLink(href);
    link.click();
    assert.equal(link.getAttribute('href'), href);
  }
  const next = page.createLink('/cadastro.html?plan_id=1');
  next.click();
  assert.equal(new URL(next.href).searchParams.get('utm_source'), 'google');
});

test('botão flutuante emite um único whatsapp_click; prévias não enviam eventos', () => {
  for (const host of ['www.enduranceon.com.br', 'preview.example.test']) {
    const page = browser('https://' + host + '/', storage());
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/whatsapp.js'), 'utf8'), page.context);
    page.floating().click();
    assert.deepEqual(page.events, host === 'www.enduranceon.com.br'
      ? [['event', 'whatsapp_click', { link_location: 'botao_flutuante' }]] : []);
  }
});
