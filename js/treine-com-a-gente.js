document.addEventListener('DOMContentLoaded', function() {
  let estadoAtual = {
    modalidade: null,
    plano: 'essencial',
    treinador: null,
    etapaAtual: 1,
  };

  const filtroModalidade = document.getElementById('filtro-modalidade');
  const filtroPlano = document.getElementById('filtro-plano');
  const comparativoPlanos = document.getElementById('comparativo-planos');
  const filtroTreinador = document.getElementById('filtro-treinador');
  const filtroPeriodicidade = document.getElementById('filtro-periodicidade');

  const opcoesModalidade = document.querySelectorAll('#filtro-modalidade .filtro-opcao');
  const opcoesPlano = document.getElementById('opcoes-plano');
  const tabelaComparativa = document.getElementById('tabela-comparativa');
  const opcoesTreinador = document.getElementById('opcoes-treinador');
  const opcoesPeriodicidade = document.getElementById('opcoes-periodicidade');
  const progressoPasso = document.querySelectorAll('.progresso-passo');

  const dadosPlanos = {
    corrida: {
      essencial: {
        nome: 'Essencial',
        preco: { mensal: 210, trimestral: 195, semestral: 185 },
        treinadores: [
          { nome: 'Bruno Jeremias', foto: '../images/treinadores/bruno-jeremias.jpg', especialidade: 'Corrida e Trail' },
          { nome: 'Jéssica Rodrigues', foto: '../images/treinadores/jessica-rodrigues.jpg', especialidade: 'Corrida' },
          { nome: 'Thais Prando', foto: '../images/treinadores/thais-prando.jpg', especialidade: 'Corrida' },
        ],
        beneficios: [
          'Anamnese inicial',
          'Planejamento personalizado',
          'Treinos via TrainingPeaks',
          'Suporte de segunda a sábado (9h às 18h)',
          'Ajustes na planilha até 2x/mês',
        ],
      },
    },
    triathlon: {
      essencial: {
        nome: 'Essencial',
        preco: { mensal: 250, trimestral: 265, semestral: 250 },
        treinadores: [
          { nome: 'Jéssica Rodrigues', foto: '../images/treinadores/jessica-rodrigues.jpg', especialidade: 'Triathlon' },
          { nome: 'Thais Prando', foto: '../images/treinadores/thais-prando.jpg', especialidade: 'Triathlon' },
        ],
        beneficios: [
          'Anamnese inicial',
          'Planejamento para as 3 modalidades',
          'Treinos via TrainingPeaks',
          'Suporte de segunda a sábado (9h às 18h)',
          'Ajustes na planilha até 2x/mês',
        ],
      },
    },
  };

  function atualizarProgresso(etapa) {
    estadoAtual.etapaAtual = etapa;
    progressoPasso.forEach((passo) => {
      const n = parseInt(passo.dataset.passo, 10);
      passo.classList.remove('ativo', 'concluido');
      if (n < etapa) passo.classList.add('concluido');
      if (n === etapa) passo.classList.add('ativo');
    });
  }

  function mostrarEtapa(etapa) {
    filtroModalidade.style.display = 'none';
    filtroPlano.style.display = 'none';
    comparativoPlanos.style.display = 'none';
    filtroTreinador.style.display = 'none';
    filtroPeriodicidade.style.display = 'none';

    if (etapa === 1) filtroModalidade.style.display = 'block';
    if (etapa === 2) {
      filtroPlano.style.display = 'block';
      comparativoPlanos.style.display = 'block';
    }
    if (etapa === 3) filtroTreinador.style.display = 'block';
    if (etapa === 4) filtroPeriodicidade.style.display = 'block';

    atualizarProgresso(etapa);
  }

  function slugify(s) {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
  }

  function renderizarOpcoesPlano(modalidade) {
    const essencial = dadosPlanos[modalidade].essencial;
    opcoesPlano.innerHTML = `
      <div class="planos-comparativo">
        <div class="plano-card plano-essencial selecionado" data-plano="essencial">
          <div class="plano-header"><h3>Assessoria</h3><p>Assessoria disponível</p></div>
          <div class="plano-preco-container">
            <div class="plano-preco-label">A partir de</div>
            <div class="plano-preco-valor">R$ ${essencial.preco.mensal.toFixed(2).replace('.', ',')}</div>
            <div class="plano-preco-periodo">por mês</div>
          </div>
          <div class="plano-beneficios">
            <h4 class="plano-beneficios-titulo">O que está incluído:</h4>
            <ul class="plano-beneficios-lista">
              ${essencial.beneficios.map((b) => `<li class="plano-beneficios-item"><i class="fas fa-check"></i>${b}</li>`).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
    estadoAtual.plano = 'essencial';
  }

  function renderizarComparativoPlanos(modalidade) {
    const essencial = dadosPlanos[modalidade].essencial;
    tabelaComparativa.innerHTML = `
      <table class="comparativo-tabela">
        <thead><tr><th>Benefício</th><th>Assessoria</th></tr></thead>
        <tbody>
          ${essencial.beneficios.map((b) => `<tr><td>${b}</td><td><i class="fas fa-check"></i></td></tr>`).join('')}
          <tr><td>Treinadores disponíveis</td><td>${essencial.treinadores.length}</td></tr>
        </tbody>
      </table>
    `;
  }

  function renderizarOpcoesTreinador(modalidade) {
    const treinadores = dadosPlanos[modalidade].essencial.treinadores;
    opcoesTreinador.innerHTML = treinadores.map((t) => `
      <div class="treinador-card" data-treinador="${t.nome}">
        <div class="treinador-foto"><img src="${t.foto}" alt="${t.nome}"></div>
        <div class="treinador-info">
          <h3>${t.nome}</h3>
          <p>${t.especialidade}</p>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('#opcoes-treinador .treinador-card').forEach((card) => {
      card.addEventListener('click', function() {
        document.querySelectorAll('#opcoes-treinador .treinador-card').forEach((c) => c.classList.remove('selecionado'));
        this.classList.add('selecionado');
        estadoAtual.treinador = this.dataset.treinador;
        renderizarOpcoesPeriodicidade(estadoAtual.modalidade);
        mostrarEtapa(4);
      });
    });
  }

  function renderizarOpcoesPeriodicidade(modalidade) {
    const p = dadosPlanos[modalidade].essencial.preco;
    opcoesPeriodicidade.innerHTML = `
      <div class="periodicidade-card" data-periodicidade="mensal"><h3>Mensal</h3><div class="preco">R$ ${p.mensal.toFixed(2).replace('.', ',')}</div><a href="#" class="btn-contratar">Contratar Agora</a></div>
      <div class="periodicidade-card" data-periodicidade="trimestral"><h3>Trimestral</h3><div class="preco">R$ ${(p.trimestral * 3).toFixed(2).replace('.', ',')}</div><a href="#" class="btn-contratar">Contratar Agora</a></div>
      <div class="periodicidade-card destaque" data-periodicidade="semestral"><h3>Semestral</h3><div class="preco">R$ ${(p.semestral * 6).toFixed(2).replace('.', ',')}</div><a href="#" class="btn-contratar">Contratar Agora</a></div>
    `;

    document.querySelectorAll('#opcoes-periodicidade .periodicidade-card').forEach((card) => {
      card.addEventListener('click', function(e) {
        e.preventDefault();
        const periodicidade = this.dataset.periodicidade;
        const treinadorSlug = slugify(estadoAtual.treinador || 'escolha-por-mim');
        const url = `cadastro-unificado.html?modalidade=${estadoAtual.modalidade}&periodicidade=${periodicidade}&treinador=${treinadorSlug}`;
        window.location.href = url;
      });
    });
  }

  opcoesModalidade.forEach((opcao) => {
    opcao.addEventListener('click', function() {
      opcoesModalidade.forEach((o) => o.classList.remove('selecionado'));
      this.classList.add('selecionado');
      estadoAtual.modalidade = this.dataset.modalidade;
      document.getElementById('avancar-para-plano').disabled = false;
    });
  });

  document.getElementById('avancar-para-plano')?.addEventListener('click', function() {
    if (!estadoAtual.modalidade) return;
    renderizarOpcoesPlano(estadoAtual.modalidade);
    renderizarComparativoPlanos(estadoAtual.modalidade);
    mostrarEtapa(2);
    document.getElementById('avancar-para-comparativo').disabled = false;
  });

  document.getElementById('avancar-para-comparativo')?.addEventListener('click', function() {
    renderizarOpcoesTreinador(estadoAtual.modalidade);
    mostrarEtapa(3);
  });

  document.getElementById('voltar-para-modalidade')?.addEventListener('click', () => mostrarEtapa(1));
  document.getElementById('voltar-para-plano')?.addEventListener('click', () => mostrarEtapa(2));
  document.getElementById('voltar-para-treinador')?.addEventListener('click', () => mostrarEtapa(3));

  mostrarEtapa(1);
});
