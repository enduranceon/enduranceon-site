/**
 * Calculadora de Match de Treinadores - Endurance On
 * Implementação baseada no prompt detalhado fornecido pelo cliente
 */

// Dados reais dos treinadores coletados via formulário
const treinadores = [
    {
        id: 'thais-prando',
        nome: 'Thaís Prando',
        foto: '../images/treinadores/thais-prando.jpg',
        genero: 'feminino',
        faixaEtaria: '31-50',
        modalidade: 'corrida',
        nivel: 'intermediario',
        acompanhamento: 'intermediario',
        perfil: 'lesao',
        regioes: ['florianopolis', 'online'],
        url: '../pages/treinadores/thais-prando.html'
    },
    /* TREINADOR DESATIVADO - William Dutra
    {
        id: 'william-dutra',
        nome: 'William Dutra',
        foto: '../images/treinadores/william-dutra.jpg',
        genero: 'masculino',
        faixaEtaria: '31-50',
        modalidade: 'triathlon',
        nivel: 'intermediario',
        acompanhamento: 'muito-proximo',
        perfil: 'performance',
        regioes: ['florianopolis'],
        url: '../pages/treinadores/william-dutra.html'
    },
    FIM TREINADOR DESATIVADO */
    /* TREINADOR DESATIVADO - Luis Fernando
    {
        id: 'luis-fernando',
        nome: 'Luis Fernando',
        foto: '../images/treinadores/luis-fernando.jpg',
        genero: 'masculino',
        faixaEtaria: '31-50',
        modalidade: 'triathlon',
        nivel: 'intermediario',
        acompanhamento: 'intermediario',
        perfil: 'performance',
        regioes: ['florianopolis', 'online'],
        url: '../pages/treinadores/luis-fernando.html'
    },
    FIM TREINADOR DESATIVADO */
    {
        id: 'guto-fernandes',
        nome: 'Guto Fernandes',
        foto: '../images/treinadores/guto-fernandes.jpg',
        genero: 'masculino',
        faixaEtaria: '30-menos',
        modalidade: 'corrida',
        nivel: 'avancado',
        acompanhamento: 'intermediario',
        perfil: 'alto-rendimento',
        regioes: ['florianopolis'],
        url: '../pages/treinadores/guto-fernandes.html'
    },
    {
        id: 'bruno-jeremias',
        nome: 'Bruno Jeremias',
        foto: '../images/treinadores/bruno-jeremias.jpg',
        genero: 'masculino',
        faixaEtaria: '30-menos',
        modalidade: 'corrida-trilha',
        nivel: 'intermediario',
        acompanhamento: 'intermediario',
        perfil: 'saude',
        regioes: ['florianopolis', 'online'],
        url: '../pages/treinadores/bruno-jeremias.html'
    },
    {
        id: 'elinai-freitas',
        nome: 'Elinai Freitas',
        foto: '../images/treinadores/elinai-freitas.jpg',
        genero: 'feminino',
        faixaEtaria: '31-50',
        modalidade: 'corrida',
        nivel: 'iniciante',
        acompanhamento: 'intermediario',
        perfil: 'iniciante',
        regioes: ['florianopolis'],
        url: '../pages/treinadores/elinai-freitas.html'
    },
    /* TREINADOR DESATIVADO - Gabriel Hermann
    {
        id: 'gabriel-hermann',
        nome: 'Gabriel Hermann',
        foto: '../images/treinadores/gabriel-hermann.jpg',
        genero: 'masculino',
        faixaEtaria: '31-50',
        modalidade: 'triathlon',
        nivel: 'avancado',
        acompanhamento: 'intermediario',
        perfil: 'performance',
        regioes: ['florianopolis', 'online'],
        url: '../pages/treinadores/gabriel-hermann.html'
    },
    FIM TREINADOR DESATIVADO */
    {
        id: 'jessica-rodrigues',
        nome: 'Jéssica Rodrigues',
        foto: '../images/treinadores/jessica-rodrigues.jpg',
        genero: 'feminino',
        faixaEtaria: '30-menos',
        modalidade: 'triathlon',
        nivel: 'iniciante',
        acompanhamento: 'intermediario',
        perfil: 'saude',
        regioes: ['online'],
        url: '../pages/treinadores/jessica-rodrigues.html'
    },
    /* TREINADOR DESATIVADO - Ian Ribeiro
    {
        id: 'ian-ribeiro',
        nome: 'Ian Ribeiro',
        foto: '../images/treinadores/ian-ribeiro.jpg',
        genero: 'feminino', // Conforme resposta do formulário, ele prefere treinar mulheres
        faixaEtaria: '30-menos',
        modalidade: 'corrida',
        nivel: 'intermediario',
        acompanhamento: 'intermediario',
        perfil: 'saude',
        regioes: ['florianopolis'],
        url: '../pages/treinadores/ian-ribeiro.html'
    },
    FIM TREINADOR DESATIVADO */
    {
        id: 'denis-santana',
        nome: 'Denis Santana',
        foto: '../images/treinadores/denis-santana.jpg',
        genero: 'masculino',
        faixaEtaria: '30-menos',
        modalidade: 'triathlon',
        nivel: 'avancado',
        acompanhamento: 'intermediario',
        perfil: 'performance',
        regioes: ['sao-paulo'],
        url: '../pages/treinadores/denis-santana.html'
    }
];

// Pesos para cada critério - Região tem maior peso
const pesos = {
    regiao: 8,        // MAIOR PESO - Região é fundamental
    modalidade: 5,    // Alto peso - Especialidade técnica
    perfil: 3,        // Médio peso - Objetivo do atleta
    nivel: 2,         // Baixo peso - Nível técnico
    acompanhamento: 2,// Baixo peso - Estilo de acompanhamento
    faixaEtaria: 1,   // Menor peso - Compatibilidade de idade
    genero: 1         // Menor peso - Preferência de gênero
};

// Pontuação máxima possível (soma de todos os pesos)
const pontuacaoMaxima = Object.values(pesos).reduce((a, b) => a + b, 0);

// Variáveis para armazenar as respostas do usuário
let respostasUsuario = {
    regiao: null,
    faixaEtaria: null,
    genero: null,
    modalidade: null,
    tempo5k: null,
    acompanhamento: null,
    perfil: null
};

// Variável para controlar a etapa atual do quiz
let etapaAtual = 1;
const totalEtapas = 7; // Aumentado para 7 etapas (região + 6 originais)

// Elementos DOM
const quizContainer = document.getElementById('quiz-container');
const progressBar = document.getElementById('progress-bar');
const etapaIndicator = document.getElementById('etapa-indicator');
const resultadosContainer = document.getElementById('resultados-container');

// Inicializar o quiz
document.addEventListener('DOMContentLoaded', () => {
    mostrarEtapa(1);
    atualizarProgressBar();
});

// Função para mostrar uma etapa específica do quiz
function mostrarEtapa(etapa) {
    // Ocultar todas as etapas
    document.querySelectorAll('.etapa').forEach(el => {
        el.style.display = 'none';
    });
    
    // Mostrar a etapa atual
    const etapaElement = document.getElementById(`etapa-${etapa}`);
    if (etapaElement) {
        etapaElement.style.display = 'block';
    }
    
    // Atualizar indicadores
    etapaAtual = etapa;
    atualizarProgressBar();
    
    if (etapaIndicator) {
        etapaIndicator.textContent = `${etapa}/${totalEtapas}`;
    }
}

// Função para atualizar a barra de progresso
function atualizarProgressBar() {
    if (progressBar) {
        const progresso = (etapaAtual / totalEtapas) * 100;
        progressBar.style.width = `${progresso}%`;
    }
}

// Função para avançar para a próxima etapa
function proximaEtapa() {
    if (etapaAtual < totalEtapas) {
        mostrarEtapa(etapaAtual + 1);
    } else {
        calcularResultados();
    }
}

// Função para voltar para a etapa anterior
function etapaAnterior() {
    if (etapaAtual > 1) {
        mostrarEtapa(etapaAtual - 1);
    }
}

// Funções para registrar as respostas do usuário

// Etapa 1: Região
function selecionarRegiao(regiao) {
    respostasUsuario.regiao = regiao;
    
    // Destacar botão selecionado
    document.querySelectorAll('.opcao-regiao').forEach(el => {
        el.classList.remove('selecionado');
    });
    
    document.querySelector(`.opcao-regiao[data-valor="${regiao}"]`).classList.add('selecionado');
    
    // Avançar após um breve delay para feedback visual
    setTimeout(proximaEtapa, 300);
}

// Etapa 2: Faixa Etária
function selecionarFaixaEtaria(faixaEtaria) {
    respostasUsuario.faixaEtaria = faixaEtaria;
    
    // Destacar botão selecionado
    document.querySelectorAll('.opcao-faixa-etaria').forEach(el => {
        el.classList.remove('selecionado');
    });
    
    document.querySelector(`.opcao-faixa-etaria[data-valor="${faixaEtaria}"]`).classList.add('selecionado');
    
    // Avançar após um breve delay para feedback visual
    setTimeout(proximaEtapa, 300);
}

// Etapa 3: Gênero
function selecionarGenero(genero) {
    respostasUsuario.genero = genero;
    
    // Destacar botão selecionado
    document.querySelectorAll('.opcao-genero').forEach(el => {
        el.classList.remove('selecionado');
    });
    
    document.querySelector(`.opcao-genero[data-valor="${genero}"]`).classList.add('selecionado');
    
    // Avançar após um breve delay para feedback visual
    setTimeout(proximaEtapa, 300);
}

// Etapa 4: Modalidade
function selecionarModalidade(modalidade) {
    respostasUsuario.modalidade = modalidade;
    
    // Destacar botão selecionado
    document.querySelectorAll('.opcao-modalidade').forEach(el => {
        el.classList.remove('selecionado');
    });
    
    document.querySelector(`.opcao-modalidade[data-valor="${modalidade}"]`).classList.add('selecionado');
    
    // Avançar após um breve delay para feedback visual
    setTimeout(proximaEtapa, 300);
}

// Etapa 5: Tempo 5k (Nível)
function selecionarTempo5k(tempo) {
    // Converter tempo para nível conforme especificado no prompt
    let nivel;
    if (tempo === 'mais27') {
        nivel = 'iniciante';
    } else if (tempo === 'entre20e27') {
        nivel = 'intermediario';
    } else if (tempo === 'menos20') {
        nivel = 'avancado';
    }
    
    respostasUsuario.tempo5k = tempo;
    respostasUsuario.nivel = nivel;
    
    // Destacar botão selecionado
    document.querySelectorAll('.opcao-tempo').forEach(el => {
        el.classList.remove('selecionado');
    });
    
    document.querySelector(`.opcao-tempo[data-valor="${tempo}"]`).classList.add('selecionado');
    
    // Avançar após um breve delay para feedback visual
    setTimeout(proximaEtapa, 300);
}

// Etapa 6: Estilo de Acompanhamento
function selecionarAcompanhamento(estilo) {
    respostasUsuario.acompanhamento = estilo;
    
    // Destacar botão selecionado
    document.querySelectorAll('.opcao-acompanhamento').forEach(el => {
        el.classList.remove('selecionado');
    });
    
    document.querySelector(`.opcao-acompanhamento[data-valor="${estilo}"]`).classList.add('selecionado');
    
    // Avançar após um breve delay para feedback visual
    setTimeout(proximaEtapa, 300);
}

// Etapa 7: Perfil/Objetivo
function selecionarPerfil(perfil) {
    respostasUsuario.perfil = perfil;
    
    // Destacar botão selecionado
    document.querySelectorAll('.opcao-perfil').forEach(el => {
        el.classList.remove('selecionado');
    });
    
    document.querySelector(`.opcao-perfil[data-valor="${perfil}"]`).classList.add('selecionado');
    
    // Avançar após um breve delay para feedback visual
    setTimeout(calcularResultados, 300);
}

// Função para calcular a pontuação de um treinador
function calcularPontuacao(treinador) {
    let pontuacao = 0;
    
    // Região (peso 8) - PRIMEIRA PRIORIDADE
    if (respostasUsuario.regiao && treinador.regioes && treinador.regioes.includes(respostasUsuario.regiao)) {
        pontuacao += pesos.regiao;
    }
    
    // Gênero (peso 1)
    if (respostasUsuario.genero === 'prefiro-nao-informar' || treinador.genero === respostasUsuario.genero) {
        pontuacao += pesos.genero;
    }
    
    // Faixa Etária (peso 1)
    if (treinador.faixaEtaria === respostasUsuario.faixaEtaria) {
        pontuacao += pesos.faixaEtaria;
    }
    
    // Modalidade (peso 5) - Lógica especial para Bruno Jeremias
    if (respostasUsuario.modalidade === 'indeciso') {
        pontuacao += pesos.modalidade;
    } else if (respostasUsuario.modalidade === 'corrida-trilha') {
        // Se usuário escolheu corrida em trilha
        if (treinador.modalidade === 'corrida-trilha') {
            pontuacao += pesos.modalidade + 2; // Bruno ganha 2 pontos extras em trilha
        } else if (treinador.modalidade === 'corrida') {
            pontuacao += pesos.modalidade - 1; // Outros treinadores de corrida ficam em desvantagem
        } else if (treinador.modalidade === 'triathlon') {
            pontuacao += pesos.modalidade - 2; // Treinadores de triathlon ficam mais em desvantagem
        }
    } else if (respostasUsuario.modalidade === 'corrida') {
        // Se usuário escolheu corrida normal
        if (treinador.modalidade === 'corrida' || treinador.modalidade === 'corrida-trilha') {
            pontuacao += pesos.modalidade; // Bruno fica empatado com outros de corrida
        }
    } else if (respostasUsuario.modalidade === 'triathlon') {
        // Se usuário escolheu triathlon
        if (treinador.modalidade === 'triathlon') {
            pontuacao += pesos.modalidade;
        }
    }
    
    // Nível (peso 2)
    if (treinador.nivel === respostasUsuario.nivel) {
        pontuacao += pesos.nivel;
    }
    
    // Estilo de Acompanhamento (peso 2)
    if (treinador.acompanhamento === respostasUsuario.acompanhamento) {
        pontuacao += pesos.acompanhamento;
    }
    
    // Perfil/Objetivo (peso 3)
    if (treinador.perfil === respostasUsuario.perfil) {
        pontuacao += pesos.perfil;
    }
    
    return pontuacao;
}

// Função para calcular e exibir os resultados
function calcularResultados() {
    // Ocultar o quiz
    quizContainer.style.display = 'none';
    
    // Calcular pontuação para cada treinador
    const pontuacoes = treinadores.map(treinador => {
        const pontos = calcularPontuacao(treinador);
        const percentual = Math.round((pontos / pontuacaoMaxima) * 100);
        
        return {
            treinador,
            pontos,
            percentual
        };
    });
    
    // Ordenar por pontuação (do maior para o menor)
    pontuacoes.sort((a, b) => b.pontos - a.pontos);
    
    // Verificar se há empate na pontuação máxima
    const maxPontos = pontuacoes[0].pontos;
    const empatados = pontuacoes.filter(p => p.pontos === maxPontos);
    
    // Preparar os resultados para exibição
    let resultados;
    if (empatados.length > 1) {
        // Caso haja empate, mostrar todos os empatados
        resultados = empatados;
    } else {
        // Caso contrário, mostrar o primeiro colocado
        resultados = [pontuacoes[0]];
    }
    
    // Gerar HTML para os resultados
    let resultadosHTML = `
        <h2>Seu treinador ideal!</h2>
        <p class="resultado-subtitulo">Baseado nas suas respostas, encontramos ${resultados.length > 1 ? 'estes treinadores' : 'este treinador'} com alta compatibilidade:</p>
        <div class="resultados-grid">
    `;
    
    // Adicionar card para cada treinador no resultado
    resultados.forEach(resultado => {
        resultadosHTML += `
            <div class="resultado-card">
                <div class="resultado-pontuacao-tag">${resultado.pontos} pontos de ${pontuacaoMaxima} possíveis</div>
                <img src="${resultado.treinador.foto}" alt="${resultado.treinador.nome}" class="resultado-foto">
                <h3 class="resultado-nome">${resultado.treinador.nome}</h3>
                <p class="resultado-especialidade">${formatarModalidade(resultado.treinador.modalidade)}</p>
                <p class="resultado-nivel">${formatarNivel(resultado.treinador.nivel)}</p>
                <div class="resultado-acoes">
                    <a href="${resultado.treinador.url}" class="btn-ver-perfil">Ver perfil completo</a>
                    <a href="${resultado.treinador.url}#planos-valores" class="btn-treinar">Treinar com ${resultado.treinador.nome.split(' ')[0]}</a>
                </div>
            </div>
        `;
    });
    
    resultadosHTML += `
        </div>
        <div class="resultado-acoes-finais">
            <button onclick="reiniciarQuiz()" class="btn-reiniciar">Refazer o quiz</button>
            <a href="../index.html#treinadores" class="btn-todos-treinadores">Ver todos os treinadores</a>
        </div>
    `;
    
    // Exibir os resultados
    resultadosContainer.innerHTML = resultadosHTML;
    resultadosContainer.style.display = 'block';
    
    // Rolar para o topo da página
    window.scrollTo(0, 0);
}

// Função para reiniciar o quiz
function reiniciarQuiz() {
    // Limpar respostas
    respostasUsuario = {
        regiao: null,
        faixaEtaria: null,
        genero: null,
        modalidade: null,
        tempo5k: null,
        acompanhamento: null,
        perfil: null
    };
    
    // Resetar seleções visuais
    document.querySelectorAll('.opcao-selecionavel').forEach(el => {
        el.classList.remove('selecionado');
    });
    
    // Resetar campos de formulário
    if (document.getElementById('data-nascimento')) {
        document.getElementById('data-nascimento').value = '';
    }
    
    // Ocultar resultados e mostrar quiz
    resultadosContainer.style.display = 'none';
    quizContainer.style.display = 'block';
    
    // Voltar para a primeira etapa
    mostrarEtapa(1);
}

// Funções auxiliares para formatação
function formatarModalidade(modalidade) {
    const formatacao = {
        'corrida': 'Corrida',
        'triathlon': 'Triathlon',
        'corrida-trilha': 'Corrida em Trilha'
    };
    
    return formatacao[modalidade] || modalidade;
}

function formatarNivel(nivel) {
    const formatacao = {
        'iniciante': 'Especialista em Iniciantes',
        'intermediario': 'Especialista em Nível Intermediário',
        'avancado': 'Especialista em Nível Avançado'
    };
    
    return formatacao[nivel] || nivel;
}
