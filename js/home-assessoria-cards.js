document.addEventListener('DOMContentLoaded', function () {
  const section = document.getElementById('home-assessoria-cards');
  if (!section) return;

  const regiaoButtons = section.querySelectorAll('[data-regiao]');
  const modalidadeButtons = section.querySelectorAll('[data-modalidade]');
  const cardsContainer = document.getElementById('home-cards-grid');

  let regiaoAtual = 'florianopolis';
  let modalidadeAtual = 'corrida';

  const planos = {
    corrida: {
      mensal: { label: 'Mensal', valorMes: 240, total: 240, destaque: false },
      trimestral: { label: 'Trimestral', valorMes: 220, total: 660, destaque: false },
      semestral: { label: 'Semestral', valorMes: 200, total: 1200, destaque: true },
    },
    triathlon: {
      mensal: { label: 'Mensal', valorMes: 380, total: 380, destaque: false },
      trimestral: { label: 'Trimestral', valorMes: 360, total: 1080, destaque: false },
      semestral: { label: 'Semestral', valorMes: 340, total: 2040, destaque: true },
    },
  };

  const config = {
    florianopolis: planos,
    'sao-paulo': planos,
    outras: planos,
  };

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

  function getFeatures() {
    const features = regiaoAtual === 'outras' ? featuresSemSede : featuresComSede;
    return { mensal: features, trimestral: features, semestral: features };
  }

  function brl(n) {
    return `R$${n.toLocaleString('pt-BR')}`;
  }

  function featureIcon(ok) {
    if (ok === 'partial') return '<i class="fas fa-info-circle" style="color:#f5a623"></i>';
    return ok ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-times-circle"></i>';
  }

  function card(periodKey, data) {
    const regiaoParam = regiaoAtual === 'outras' ? 'online' : regiaoAtual;
    const href = `pages/cadastro-unificado.html?modalidade=${modalidadeAtual}&periodicidade=${periodKey}&regiao=${regiaoParam}`;
    const features = getFeatures()[periodKey];
    const parcelas = { mensal: 1, trimestral: 3, semestral: 6 };
    const nParcelas = parcelas[periodKey];
    const isMensal = periodKey === 'mensal';

    const precoHTML = isMensal
      ? `<div class="home-price">${brl(data.valorMes)}<small>/mês</small></div>
         <div class="home-price-foot">Cobrança mensal recorrente</div>`
      : `<div class="home-price">${brl(data.total)}</div>
         <div class="home-price-foot">Em até ${nParcelas}x de ${brl(data.valorMes)} · cobrança única</div>`;

    return `
      <article class="home-period-card ${data.destaque ? 'highlight' : ''}">
        ${data.destaque ? '<div class="home-badge-top">Mais escolhido!</div>' : ''}
        <span class="home-period-chip">${data.label}</span>
        ${precoHTML}
        <ul class="home-feature-list">
          ${features.map((f) => `<li class="${f.ok === true ? 'ok' : f.ok === 'partial' ? 'partial' : 'no'}">${featureIcon(f.ok)}<span>${f.text}</span></li>`).join('')}
        </ul>
        <a class="home-cta" href="${href}">Quero treinar</a>
      </article>
    `;
  }

  function render() {
    const plan = config[regiaoAtual][modalidadeAtual];
    cardsContainer.innerHTML = [
      card('mensal', plan.mensal),
      card('trimestral', plan.trimestral),
      card('semestral', plan.semestral),
    ].join('');
  }

  regiaoButtons.forEach((btn) => {
    btn.addEventListener('click', function () {
      regiaoButtons.forEach((b) => b.classList.remove('active'));
      this.classList.add('active');
      regiaoAtual = this.dataset.regiao;
      render();
    });
  });

  modalidadeButtons.forEach((btn) => {
    btn.addEventListener('click', function () {
      modalidadeButtons.forEach((b) => b.classList.remove('active'));
      this.classList.add('active');
      modalidadeAtual = this.dataset.modalidade;
      render();
    });
  });

  render();

  document.querySelectorAll('[data-goto-modalidade]').forEach((btn) => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      const modalidade = this.dataset.gotoModalidade;
      const tab = section.querySelector(`[data-modalidade="${modalidade}"]`);
      if (tab) {
        modalidadeButtons.forEach((b) => b.classList.remove('active'));
        tab.classList.add('active');
        modalidadeAtual = modalidade;
        render();
      }
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
});
