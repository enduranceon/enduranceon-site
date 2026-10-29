(() => {
  'use strict';

  const MODALITY_LABELS = {
    run: 'Corrida',
    trail_run: 'Trail Run',
    triathlon: 'Triathlon',
    duathlon: 'Duathlon',
    aquathlon: 'Aquathlon',
    bike: 'Ciclismo',
    cycling: 'Ciclismo',
    swim: 'Natação',
    swimming: 'Natação'
  };
  const MODALITY_ORDER = Object.keys(MODALITY_LABELS);

  const COUNTRIES = [
    'Brasil', 'Estados Unidos', 'Portugal', 'Argentina', 'Chile', 'Uruguai', 'Paraguai', 'Colômbia', 'Peru',
    'México', 'Alemanha', 'França', 'Espanha', 'Itália', 'Reino Unido', 'Austrália', 'Japão', 'África do Sul',
    'Nova Zelândia', 'Áustria', 'Suíça', 'Canadá', 'Holanda', 'Bélgica', 'Suécia', 'Noruega', 'Dinamarca',
    'Finlândia', 'China', 'Coreia do Sul', 'Israel', 'Emirados Árabes', 'Outro'
  ];

  const BRAZIL_STATES = [
    ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'], ['BA', 'Bahia'], ['CE', 'Ceará'],
    ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'], ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'],
    ['MS', 'Mato Grosso do Sul'], ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'],
    ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'],
    ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'],
    ['SP', 'São Paulo'], ['SE', 'Sergipe'], ['TO', 'Tocantins']
  ];

  const ICONS = {
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-5.6-7-11a7 7 0 1 1 14 0c0 5.4-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>'
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const els = {
    search: $('#cal-search'),
    filters: $('#cal-filters'),
    count: $('#cal-count'),
    status: $('#cal-status'),
    grid: $('#cal-grid'),
    outside: $('#cal-outside'),
    dialog: $('#cal-dialog'),
    dialogTitle: $('#cal-dialog-title'),
    dialogBody: $('#cal-dialog-body'),
    menuButton: $('.menu-button'),
    nav: $('#main-nav')
  };

  const config = readConfig();
  const state = { events: [], coaches: [], coachesFailed: false, query: '', modality: 'all' };
  const citiesByUf = new Map();

  function readConfig() {
    try {
      const value = JSON.parse(document.getElementById('eon-calendar-config').textContent);
      return value && value.hub_url && value.publishable_key ? value : null;
    } catch {
      return null;
    }
  }

  function h(tag, props, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props || {})) {
      if (value == null || value === false) continue;
      if (key === 'class') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? '' : value);
    }
    for (const child of children.flat()) {
      if (child == null || child === false) continue;
      node.append(child.nodeType ? child : document.createTextNode(String(child)));
    }
    return node;
  }

  function icon(name) {
    const span = h('span', { class: 'icon', 'aria-hidden': 'true' });
    span.innerHTML = ICONS[name];
    return span;
  }

  // ---------- Menu ----------
  function setMenu(open) {
    els.nav.classList.toggle('open', open);
    els.menuButton.setAttribute('aria-expanded', String(open));
    els.menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  }
  els.menuButton.addEventListener('click', () => setMenu(els.menuButton.getAttribute('aria-expanded') !== 'true'));
  els.nav.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && els.nav.classList.contains('open')) { setMenu(false); els.menuButton.focus(); }
  });
  matchMedia('(min-width: 851px)').addEventListener('change', event => { if (event.matches) setMenu(false); });

  // ---------- Dados do EON Hub ----------
  async function timedFetch(url, options) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeout_ms || 12000);
    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  function authHeaders() {
    return { apikey: config.publishable_key };
  }

  async function fetchRows(table, columns, params) {
    const url = new URL(`${config.hub_url}/rest/v1/${table}`);
    url.searchParams.set('select', columns);
    Object.entries(params || {}).forEach(([key, value]) => url.searchParams.set(key, value));
    const response = await timedFetch(url, { headers: authHeaders() });
    if (!response.ok) throw new Error(`${table}: ${response.status}`);
    return response.json();
  }

  async function loadCalendar() {
    setStatus('Carregando provas do EON Hub...');
    els.grid.setAttribute('aria-busy', 'true');
    els.grid.replaceChildren(...[0, 1, 2].map(() => h('div', { class: 'race-skeleton', 'aria-hidden': 'true' })));
    if (!config) {
      showLoadError();
      return;
    }

    const today = toIsoDate(new Date());
    try {
      const [series, editions, courses] = await Promise.all([
        fetchRows('race_series', 'id,name,city,state,country,main_modality,modality,image_url,logo_url,website_url,is_active,active,is_deleted', { limit: '5000' }),
        fetchRows('race_event_editions', 'id,series_id,race_series_id,year,is_official,is_public,active,is_deleted,image_url,website_url,city,state,country,name,short_name', {
          is_official: 'eq.true', is_deleted: 'neq.true', active: 'neq.false', limit: '5000'
        }),
        fetchRows('race_courses', 'id,race_event_edition_id,name,short_label,distance_km,total_distance_km,race_date,modality,is_active,is_deleted', {
          race_date: `gte.${today}`, is_active: 'neq.false', is_deleted: 'neq.true', order: 'race_date.asc', limit: '5000'
        })
      ]);
      state.events = buildEvents(series, editions, courses);
    } catch (error) {
      console.error('[calendario] Erro ao carregar o EON Hub', error);
      showLoadError();
      return;
    }

    try {
      const coaches = await fetchRows('coaches', 'id,name,active,show_on_site,role,roles', {
        active: 'eq.true', show_on_site: 'eq.true', order: 'name.asc', limit: '500'
      });
      state.coaches = filterCoaches(coaches);
    } catch (error) {
      console.error('[calendario] Erro ao carregar treinadores', error);
      state.coaches = [];
      state.coachesFailed = true;
    }

    els.search.disabled = false;
    els.outside.disabled = false;
    setStatus('');
    renderFilters();
    render();
  }

  function showLoadError() {
    els.grid.setAttribute('aria-busy', 'false');
    els.grid.replaceChildren();
    els.count.textContent = '';
    setStatus('Não foi possível carregar as provas agora. Tente novamente em alguns instantes.', true);
    els.status.append(h('button', { class: 'text-button', type: 'button', text: 'Tentar de novo', onclick: loadCalendar }));
  }

  function setStatus(message, isError) {
    els.status.textContent = message;
    els.status.classList.toggle('is-error', Boolean(isError));
    els.status.hidden = !message;
  }

  function buildEvents(seriesRows, editionRows, courseRows) {
    const seriesById = new Map(seriesRows
      .filter(item => item && item.is_deleted !== true && item.is_active !== false && item.active !== false)
      .map(item => [item.id, item]));
    const editionsById = new Map(editionRows
      .filter(item => item && item.is_deleted !== true && item.active !== false && item.is_official === true)
      .map(item => [item.id, item]));
    const groups = new Map();

    courseRows
      .filter(course => course && course.is_deleted !== true && course.is_active !== false && course.race_date)
      .forEach(course => {
        const edition = editionsById.get(course.race_event_edition_id);
        if (!edition) return;
        const series = seriesById.get(edition.series_id || edition.race_series_id);
        if (!series) return;

        if (!groups.has(edition.id)) {
          groups.set(edition.id, {
            editionId: edition.id,
            name: series.name || edition.short_name || edition.name || 'Prova',
            year: edition.year || '',
            city: series.city || edition.city || '',
            state: series.state || edition.state || '',
            modality: series.main_modality || series.modality || course.modality || '',
            imageUrl: edition.image_url || series.image_url || series.logo_url || '',
            courses: [],
            minDate: null
          });
        }
        const group = groups.get(edition.id);
        group.courses.push(course);
        const date = parseDateLocal(course.race_date);
        if (date && (!group.minDate || date < group.minDate)) group.minDate = date;
      });

    return Array.from(groups.values())
      .map(event => ({ ...event, courses: event.courses.sort(compareCourses) }))
      .sort((a, b) => (a.minDate || 0) - (b.minDate || 0));
  }

  function filterCoaches(rows) {
    const visibleRoles = new Set(['coach', 'head_coach']);
    return rows
      .filter(coach => {
        if (!coach || coach.active !== true || coach.show_on_site !== true) return false;
        return visibleRoles.has(String(coach.role || '')) || normalizeRoles(coach.roles).some(role => visibleRoles.has(role));
      })
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'pt-BR'));
  }

  function normalizeRoles(value) {
    if (Array.isArray(value)) return value.map(role => String(role || ''));
    if (typeof value === 'string' && value.trim()) {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.map(role => String(role || '')) : [];
      } catch {
        return [value];
      }
    }
    return [];
  }

  function compareCourses(a, b) {
    const byDate = String(a.race_date || '').localeCompare(String(b.race_date || ''));
    if (byDate !== 0) return byDate;
    return Number(a.distance_km || a.total_distance_km || 0) - Number(b.distance_km || b.total_distance_km || 0);
  }

  // ---------- Lista ----------
  function fold(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function visibleEvents() {
    const query = fold(state.query.trim());
    return state.events.filter(event => {
      const target = fold(`${event.name} ${event.city} ${event.state} ${event.courses.map(course => course.name).join(' ')}`);
      const matchesSearch = !query || target.includes(query);
      const matchesModality = state.modality === 'all' || event.modality === state.modality ||
        event.courses.some(course => course.modality === state.modality);
      return matchesSearch && matchesModality;
    });
  }

  function renderFilters() {
    const present = [...new Set(state.events.map(event => event.modality).filter(Boolean))]
      .sort((a, b) => {
        const left = MODALITY_ORDER.indexOf(a);
        const right = MODALITY_ORDER.indexOf(b);
        return (left < 0 ? 99 : left) - (right < 0 ? 99 : right);
      });
    els.filters.replaceChildren(...['all', ...present].map(modality => h('button', {
      class: 'chip',
      type: 'button',
      'data-modality': modality,
      'aria-pressed': 'false',
      text: modality === 'all' ? 'Todas' : modalityLabel(modality)
    })));
  }

  function syncFilters() {
    els.filters.querySelectorAll('button[data-modality]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.modality === state.modality));
    });
  }

  function render() {
    syncFilters();
    const events = visibleEvents();
    els.grid.setAttribute('aria-busy', 'false');

    if (state.events.length === 0) {
      els.count.textContent = '';
      els.grid.replaceChildren(emptyState('Nenhuma prova futura encontrada no EON Hub.', 'Volte em breve: novas provas entram no calendário durante a temporada.'));
      return;
    }
    els.count.textContent = events.length === 1 ? '1 prova' : `${events.length} provas`;
    if (events.length === 0) {
      els.grid.replaceChildren(emptyState('Nenhuma prova encontrada com esses filtros.', 'Tente outro nome, outra cidade ou limpe o filtro de modalidade.'));
      return;
    }
    els.grid.replaceChildren(...events.map(renderCard));
  }

  function renderCard(event) {
    const location = [event.city, event.state].filter(Boolean).join(', ') || 'Local a definir';
    const courses = event.courses.slice(0, 8).map(course => h('li', { text: courseLabel(course) }));
    if (event.courses.length > 8) courses.push(h('li', { text: `+${event.courses.length - 8}` }));
    const title = event.year ? `${event.name} ${event.year}` : event.name;

    return h('article', { class: 'race-card' },
      h('div', { class: 'race-media' }, raceImage(event, title), h('span', { class: 'race-tag', text: modalityLabel(event.modality) })),
      h('div', { class: 'race-body' },
        h('h3', { text: title }),
        h('ul', { class: 'race-meta' },
          h('li', {}, icon('pin'), h('span', { text: location })),
          h('li', {}, icon('calendar'), h('span', { text: eventDateLabel(event) }))
        ),
        h('ul', { class: 'race-courses', 'aria-label': 'Percursos' }, courses),
        h('button', {
          class: 'button dark race-action',
          type: 'button',
          'aria-label': `Participar: ${title}`,
          onclick: () => openCourseChooser(event)
        }, 'Participar', h('span', { class: 'arrow', 'aria-hidden': 'true', text: '↗' }))
      )
    );
  }

  function raceImage(event, title) {
    const src = safeImageUrl(event.imageUrl);
    if (!src) return placeholder(title);
    const image = h('img', { src, alt: title, loading: 'lazy', decoding: 'async' });
    image.addEventListener('error', () => image.replaceWith(placeholder(title)), { once: true });
    return image;
  }

  function placeholder(title) {
    const box = h('div', { class: 'race-placeholder' });
    box.innerHTML = ICONS.flag;
    box.append(h('span', { text: title || 'Prova' }));
    return box;
  }

  function emptyState(title, detail) {
    return h('div', { class: 'empty' }, icon('calendar'), h('strong', { text: title }), h('p', { text: detail }));
  }

  els.search.addEventListener('input', () => { state.query = els.search.value; render(); });
  els.filters.addEventListener('click', event => {
    const button = event.target.closest('button[data-modality]');
    if (!button) return;
    state.modality = button.dataset.modality;
    render();
  });

  // ---------- Janela (percurso e formulários) ----------
  function openDialog(title, content) {
    els.dialogTitle.textContent = title;
    els.dialogBody.replaceChildren(content);
    if (!els.dialog.open) {
      els.dialog.showModal();
      document.body.classList.add('modal-open');
    }
    els.dialog.scrollTop = 0;
  }
  els.dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    els.dialogBody.replaceChildren();
  });
  els.dialog.addEventListener('click', event => {
    if (event.target === els.dialog || event.target.closest('[data-close-dialog]')) els.dialog.close();
  });

  function openCourseChooser(event) {
    if (event.courses.length === 1) {
      openOfficialForm(event, event.courses[0], false);
      return;
    }
    const title = event.year ? `${event.name} ${event.year}` : event.name;
    openDialog('Escolha o percurso', h('div', {},
      h('p', { class: 'dialog-lead' }, h('strong', { text: title }), h('br'), [event.city, event.state].filter(Boolean).join(', ') || 'Local a definir'),
      h('div', { class: 'course-list' }, event.courses.map(course => h('button', {
        class: 'course-button',
        type: 'button',
        onclick: () => openOfficialForm(event, course, true)
      }, h('span', {}, h('strong', { text: courseLabel(course) }), h('small', { text: formatDateBR(course.race_date) })),
        h('span', { class: 'arrow', 'aria-hidden': 'true', text: '→' }))))
    ));
  }

  function openOfficialForm(event, course, canGoBack) {
    const title = event.year ? `${event.name} ${event.year}` : event.name;
    const form = h('form', { class: 'cal-form' },
      commonFields(),
      field('Distância da prova', h('input', { type: 'text', value: courseLabel(course), readonly: true })),
      debutFields(),
      formMessage(),
      formActions('Confirmar interesse', canGoBack ? () => openCourseChooser(event) : null)
    );
    form.addEventListener('submit', async submitEvent => {
      submitEvent.preventDefault();
      const data = new FormData(form);
      await submitInterest(form, {
        type: 'official',
        raceCourseId: course.id,
        coachId: data.get('coachId'),
        athleteName: data.get('athleteName'),
        isModalityDebut: data.get('isModalityDebut') === 'yes',
        isDistanceDebut: data.get('isDistanceDebut') === 'yes'
      }, 'Confirmar interesse');
    });
    openDialog('Manifestar interesse', h('div', {},
      demoNote(),
      h('p', { class: 'dialog-lead' }, h('strong', { text: courseLabel(course) }), h('br'), `${title} · ${formatDateBR(course.race_date)}`),
      form
    ));
  }

  function openOutsideForm() {
    const countrySelect = h('select', { name: 'country', required: true }, COUNTRIES.map(country => h('option', { value: country, text: country })));
    const stateSelect = h('select', { name: 'state', required: true },
      h('option', { value: '', text: 'Selecione o estado' }),
      BRAZIL_STATES.map(([uf, name]) => h('option', { value: uf, text: `${uf} - ${name}` })));
    const citySelect = h('select', { name: 'city', required: true, disabled: true }, h('option', { value: '', text: 'Selecione o estado primeiro' }));
    const brazilFields = [field('Estado *', stateSelect), field('Cidade *', citySelect)];
    const foreignNote = h('p', { class: 'field-note', hidden: true, text: 'Para provas fora do Brasil, cidade e estado não são obrigatórios.' });

    const form = h('form', { class: 'cal-form' },
      commonFields(),
      field('Nome da prova *', h('input', { name: 'eventName', type: 'text', minlength: '3', maxlength: '180', required: true })),
      field('Modalidade *', h('select', { name: 'modality', required: true },
        h('option', { value: '', text: 'Selecione' }),
        Object.entries(MODALITY_LABELS).filter(([value]) => value !== 'cycling' && value !== 'swimming')
          .map(([value, label]) => h('option', { value, text: label })))),
      h('div', { class: 'field-pair' },
        field('Distância *', h('input', { name: 'distanceText', type: 'text', maxlength: '80', placeholder: 'Ex.: 21K, Sprint, 70.3', required: true })),
        field('Data da prova *', h('input', { name: 'raceDate', type: 'date', required: true }))),
      field('País *', countrySelect),
      ...brazilFields,
      foreignNote,
      debutFields(),
      formMessage(),
      formActions('Enviar para meu treinador', null)
    );

    let latestCityRequest = 0;
    const updateCountry = () => {
      const isBrazil = countrySelect.value === 'Brasil';
      brazilFields.forEach(node => { node.hidden = !isBrazil; });
      foreignNote.hidden = isBrazil;
      stateSelect.required = isBrazil;
      citySelect.required = isBrazil;
      if (!isBrazil) {
        latestCityRequest += 1;
        stateSelect.value = '';
        resetCitySelect(citySelect, 'Selecione o estado primeiro', true);
      }
    };
    countrySelect.addEventListener('change', updateCountry);
    stateSelect.addEventListener('change', async () => {
      const uf = stateSelect.value;
      const requestId = ++latestCityRequest;
      if (!uf) { resetCitySelect(citySelect, 'Selecione o estado primeiro', true); return; }
      resetCitySelect(citySelect, 'Carregando cidades...', true);
      try {
        let cities = citiesByUf.get(uf);
        if (!cities) {
          const response = await timedFetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${encodeURIComponent(uf)}/municipios?orderBy=nome`);
          if (!response.ok) throw new Error(`IBGE: ${response.status}`);
          const rows = await response.json();
          cities = Array.isArray(rows) ? rows.map(item => item.nome).filter(Boolean) : [];
          citiesByUf.set(uf, cities);
        }
        if (requestId !== latestCityRequest || countrySelect.value !== 'Brasil') return;
        citySelect.replaceChildren(h('option', { value: '', text: 'Selecione a cidade' }), ...cities.map(city => h('option', { value: city, text: city })));
        citySelect.disabled = false;
      } catch (error) {
        console.error('[calendario] Erro ao carregar cidades do IBGE', error);
        if (requestId === latestCityRequest) resetCitySelect(citySelect, 'Não foi possível carregar as cidades', true);
      }
    });
    updateCountry();

    form.addEventListener('submit', async submitEvent => {
      submitEvent.preventDefault();
      const data = new FormData(form);
      const isBrazil = data.get('country') === 'Brasil';
      await submitInterest(form, {
        type: 'outside',
        coachId: data.get('coachId'),
        athleteName: data.get('athleteName'),
        eventName: data.get('eventName'),
        modality: data.get('modality'),
        distanceText: data.get('distanceText'),
        raceDate: data.get('raceDate'),
        city: isBrazil ? data.get('city') : '',
        state: isBrazil ? data.get('state') : '',
        country: data.get('country'),
        isModalityDebut: data.get('isModalityDebut') === 'yes',
        isDistanceDebut: data.get('isDistanceDebut') === 'yes'
      }, 'Enviar para meu treinador');
    });

    openDialog('Prova fora do calendário', h('div', {}, demoNote(), form));
  }
  els.outside.addEventListener('click', openOutsideForm);

  function resetCitySelect(select, message, disabled) {
    select.replaceChildren(h('option', { value: '', text: message }));
    select.disabled = disabled;
    select.value = '';
  }

  function field(label, control) {
    return h('label', { class: 'field' }, h('span', { class: 'field-label', text: label }), control);
  }

  function commonFields() {
    const coachSelect = h('select', { name: 'coachId', required: true, disabled: state.coaches.length === 0 },
      h('option', { value: '', text: state.coaches.length ? 'Selecione seu treinador' : 'Lista de treinadores indisponível' }),
      state.coaches.map(coach => h('option', { value: coach.id, text: coach.name })));
    return [
      field('Nome do atleta *', h('input', { name: 'athleteName', type: 'text', minlength: '3', maxlength: '120', autocomplete: 'name', required: true })),
      field('Treinador *', coachSelect),
      state.coachesFailed ? h('p', { class: 'field-note', text: 'Não foi possível carregar a lista de treinadores agora. Feche esta janela e tente de novo em instantes.' }) : null
    ];
  }

  function debutFields() {
    const yesNo = name => h('select', { name, required: true },
      h('option', { value: '', text: 'Selecione' }),
      h('option', { value: 'yes', text: 'Sim' }),
      h('option', { value: 'no', text: 'Não' }));
    return h('div', { class: 'field-pair' },
      field('Estreia na modalidade? *', yesNo('isModalityDebut')),
      field('Estreia na distância? *', yesNo('isDistanceDebut')));
  }

  function formMessage() {
    return h('div', { class: 'form-message', role: 'alert', 'data-message': '' });
  }

  function formActions(submitLabel, onBack) {
    return h('div', { class: 'form-actions' },
      onBack ? h('button', { class: 'text-button', type: 'button', text: '← Escolher outro percurso', onclick: onBack }) : null,
      h('button', { class: 'button', type: 'submit' }, submitLabel, h('span', { class: 'arrow', 'aria-hidden': 'true', text: '↗' })));
  }

  function demoNote() {
    if (!config || config.mode !== 'demo') return null;
    return h('p', { class: 'demo-note', text: 'Prévia do site novo: este formulário não envia nenhum dado ao EON Hub.' });
  }

  function showFormMessage(node, text) {
    node.textContent = text;
    node.classList.toggle('is-visible', Boolean(text));
    node.classList.toggle('is-error', Boolean(text));
  }

  async function submitInterest(form, payload, submitLabel) {
    const button = $('[type="submit"]', form);
    const message = $('[data-message]', form);
    showFormMessage(message, '');

    if (!config || (config.mode !== 'demo' && config.mode !== 'live')) {
      showFormMessage(message, 'O envio está indisponível no momento. Fale com a equipe pelo WhatsApp (48) 99117-8688.');
      return;
    }
    if (config.mode === 'demo') {
      showSuccess({ demo: true });
      return;
    }

    button.disabled = true;
    button.firstChild.textContent = 'Enviando...';
    try {
      const response = await timedFetch(`${config.hub_url}/functions/v1/${config.interest_function}`, {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) throw new Error(result.error || 'Não foi possível registrar seu interesse.');
      showSuccess({ deduplicated: Boolean(result.deduplicated) });
    } catch (error) {
      showFormMessage(message, error.name === 'AbortError' ? 'A conexão demorou demais. Tente novamente.' : (error.message || 'Erro ao enviar. Tente novamente.'));
    } finally {
      button.disabled = false;
      button.firstChild.textContent = submitLabel;
    }
  }

  function showSuccess({ demo, deduplicated }) {
    let title = deduplicated ? 'Interesse já registrado' : 'Interesse registrado';
    let text = deduplicated
      ? 'Seu treinador já consegue visualizar esse interesse no EON Hub.'
      : 'Obrigado. Seu treinador já consegue visualizar sua participação no EON Hub.';
    if (demo) {
      title = 'Prévia: nada foi enviado';
      text = 'No site publicado, seu treinador passa a ver esse interesse no EON Hub. Nesta prévia nenhum dado foi enviado.';
    }
    const done = h('div', { class: 'success' },
      h('div', { class: 'success-icon', 'aria-hidden': 'true' }),
      h('p', { text }),
      h('button', { class: 'button dark', type: 'button', 'data-close-dialog': '' }, 'Voltar ao calendário'));
    $('.success-icon', done).innerHTML = ICONS.check;
    openDialog(title, done);
  }

  // ---------- Formatação ----------
  function courseLabel(course) {
    return course.short_label || course.name || 'Percurso';
  }

  function modalityLabel(value) {
    return MODALITY_LABELS[value] || value || 'Modalidade';
  }

  function safeImageUrl(value) {
    if (!value) return '';
    try {
      const url = new URL(value, window.location.href);
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
    } catch {
      return '';
    }
  }

  function eventDateLabel(event) {
    const dates = [...new Set(event.courses.map(course => course.race_date).filter(value => parseDateLocal(value)))].sort();
    if (dates.length === 0) return 'Data a definir';
    if (dates.length === 1) return formatDateBR(dates[0]);
    if (dates.length === 2) return formatTwoDates(dates[0], dates[1]);
    return formatDateRange(dates[0], dates[dates.length - 1]);
  }

  function formatTwoDates(startValue, endValue) {
    const start = parseDateLocal(startValue);
    const end = parseDateLocal(endValue);
    if (start.getFullYear() === end.getFullYear()) return `${formatDayMonth(start)} e ${formatDayMonth(end)}/${end.getFullYear()}`;
    return `${formatDateBR(startValue)} e ${formatDateBR(endValue)}`;
  }

  function formatDateRange(startValue, endValue) {
    const start = parseDateLocal(startValue);
    const end = parseDateLocal(endValue);
    if (start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth()) {
      return `${String(start.getDate()).padStart(2, '0')} a ${formatDayMonth(end)}/${end.getFullYear()}`;
    }
    if (start.getFullYear() === end.getFullYear()) return `${formatDayMonth(start)} a ${formatDayMonth(end)}/${end.getFullYear()}`;
    return `${formatDateBR(startValue)} a ${formatDateBR(endValue)}`;
  }

  function formatDayMonth(date) {
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  function parseDateLocal(value) {
    const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : null;
  }

  function toIsoDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  function formatDateBR(value) {
    const date = parseDateLocal(value);
    return date ? date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Data a definir';
  }

  loadCalendar();
})();
