document.addEventListener('DOMContentLoaded', function () {
  const section = document.getElementById('home-assessoria-cards');
  if (!section) return;

  const endpoint = 'https://bsiljrrodgtmtdilnuxr.supabase.co/functions/v1/public-assessment-prospect';
  const regiaoButtons = section.querySelectorAll('[data-regiao]');
  const modalidadeButtons = section.querySelectorAll('[data-modalidade]');
  const cardsContainer = document.getElementById('home-cards-grid');
  const status = document.getElementById('home-cards-status');
  const currency = new Intl.NumberFormat('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 2
  });
  const periods = { mensal: 0, trimestral: 1, semestral: 2 };
  const labels = { mensal: 'Mensal', trimestral: 'Trimestral', semestral: 'Semestral' };
  let regiaoAtual = 'florianopolis';
  let modalidadeAtual = 'corrida';
  let catalog = null;
  let loadError = false;

  const featuresComSede = [
    { text: 'Treinos individuais e personalizados', ok: true },
    { text: 'Acesso ao app TrainingPeaks', ok: true },
    { text: 'Contato direto com o treinador', ok: true },
    { text: 'Estrutura e hidratação nos pontos de apoio', ok: true },
  ];
  const featuresSemSede = [
    { text: 'Treinos individuais e personalizados', ok: true },
    { text: 'Acesso ao app TrainingPeaks', ok: true },
    { text: 'Contato direto com o treinador', ok: true },
    { text: 'Acesso à estrutura ao visitar nossas sedes físicas', ok: 'partial' },
  ];

  function slug(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  function plansForSelectedModality() {
    const modality = catalog.modalities.find((item) => slug(item.name) === modalidadeAtual);
    if (!modality) return [];
    const hasCoach = catalog.coaches.some((coach) =>
      Array.isArray(coach.modality_ids) && coach.modality_ids.includes(modality.id)
    );
    if (!hasCoach) return [];
    const plans = catalog.plans.filter((plan) => plan.modality_id === modality.id);
    const regular = plans.filter((plan) => !slug(plan.name).includes('essencial'));
    const offered = regular.length ? regular : plans;
    return offered.filter((plan) => Object.prototype.hasOwnProperty.call(periods, slug(plan.period)))
      .sort((a, b) => periods[slug(a.period)] - periods[slug(b.period)]);
  }

  function featureItem(feature) {
    const li = document.createElement('li');
    li.className = feature.ok === true ? 'ok' : 'partial';
    const icon = document.createElement('i');
    icon.className = feature.ok === true ? 'fas fa-check-circle' : 'fas fa-info-circle';
    if (feature.ok === 'partial') icon.style.color = '#f5a623';
    icon.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.textContent = feature.text;
    li.append(icon, label);
    return li;
  }

  function card(plan) {
    const period = slug(plan.period);
    const months = Number(plan.period_months) || 1;
    const article = document.createElement('article');
    article.className = 'home-period-card' + (period === 'semestral' ? ' highlight' : '');

    const chip = document.createElement('span');
    chip.className = 'home-period-chip';
    chip.textContent = labels[period];
    const price = document.createElement('div');
    price.className = 'home-price';
    price.append(document.createTextNode(currency.format(Number(plan.price_monthly))));
    const perMonth = document.createElement('small');
    perMonth.textContent = '/mês';
    price.append(perMonth);
    const foot = document.createElement('div');
    foot.className = 'home-price-foot';
    foot.textContent = months === 1
      ? 'Cobrança mensal recorrente'
      : 'Total ' + currency.format(Number(plan.price_total)) +
        ' · parcelado em até ' + (Number(plan.max_installments) || months) + 'x · cobrança única';

    const features = document.createElement('ul');
    features.className = 'home-feature-list';
    const items = regiaoAtual === 'outras' ? featuresSemSede : featuresComSede;
    features.replaceChildren(...items.map(featureItem));

    const link = new URL('pages/cadastro-unificado.html', window.location.href);
    link.searchParams.set('modalidade', modalidadeAtual);
    link.searchParams.set('periodicidade', period);
    link.searchParams.set('plan_id', plan.id);
    link.searchParams.set('regiao', regiaoAtual === 'outras' ? 'online' : regiaoAtual);
    const cta = document.createElement('a');
    cta.className = 'home-cta';
    cta.href = link.href;
    cta.textContent = 'Quero treinar';
    article.append(chip, price, foot, features, cta);
    return article;
  }

  function render() {
    cardsContainer.replaceChildren();
    if (!catalog) {
      status.hidden = false;
      status.textContent = loadError
        ? 'Não foi possível carregar os planos agora. Atualize a página e tente novamente.'
        : 'Carregando planos disponíveis...';
      return;
    }
    const plans = plansForSelectedModality();
    if (!plans.length) {
      status.hidden = false;
      status.textContent = 'Não há planos e treinadores disponíveis para esta modalidade no momento.';
      return;
    }
    status.hidden = true;
    cardsContainer.replaceChildren(...plans.map(card));
  }

  function selectModality(key) {
    modalidadeAtual = key;
    modalidadeButtons.forEach((button) => {
      const selected = button.dataset.modalidade === key;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    render();
  }

  regiaoButtons.forEach((button) => button.addEventListener('click', function () {
    regiaoAtual = this.dataset.regiao;
    regiaoButtons.forEach((item) => {
      const selected = item === this;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    render();
  }));

  modalidadeButtons.forEach((button) => button.addEventListener('click', function () {
    selectModality(this.dataset.modalidade);
  }));
  document.querySelectorAll('[data-goto-modalidade]').forEach((button) => {
    button.addEventListener('click', function (event) {
      event.preventDefault();
      selectModality(this.dataset.gotoModalidade);
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  render();
  void (async function loadCatalog() {
    try {
      const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error('Catálogo indisponível');
      catalog = {
        modalities: Array.isArray(data.modalities) ? data.modalities : [],
        plans: Array.isArray(data.plans) ? data.plans : [],
        coaches: Array.isArray(data.coaches) ? data.coaches : [],
      };
    } catch (error) {
      loadError = true;
      console.error('home assessment catalog', error);
    }
    render();
  })();
});
