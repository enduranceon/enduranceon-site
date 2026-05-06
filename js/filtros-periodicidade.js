/**
 * Endurance On - Assessoria Esportiva
 * Script para gerenciar os filtros de periodicidade nas páginas de treinadores
 */

document.addEventListener('DOMContentLoaded', function() {
    // Selecionar todos os botões de filtro de periodicidade
    const filtrosPeriodo = document.querySelectorAll('.filtro-opcao.filtro-periodo');
    
    // Adicionar evento de clique a cada botão de filtro
    filtrosPeriodo.forEach(filtro => {
        filtro.addEventListener('click', function() {
            const periodo = this.getAttribute('data-periodo');
            
            // Remover classe ativo de todos os botões de filtro
            document.querySelectorAll('.filtro-opcao.filtro-periodo').forEach(f => {
                f.classList.remove('ativo');
            });
            
            // Adicionar classe ativo ao botão clicado
            this.classList.add('ativo');
            
            // Ocultar todos os cards de periodicidade
            document.querySelectorAll('.periodo-card').forEach(card => {
                card.style.display = 'none';
            });
            
            // Mostrar apenas os cards correspondentes ao período selecionado
            document.querySelectorAll(`.periodo-card[data-periodo="${periodo}"]`).forEach(card => {
                card.style.display = 'block';
                card.classList.add('ativo');
            });
            
            // Atualizar exibição dos botões de contratação
            atualizarBotoesContratacao();
        });
    });
    
    // Função para atualizar a exibição dos botões de contratação
    function atualizarBotoesContratacao() {
        // Para cada plano (essencial e premium)
        ['essencial', 'premium'].forEach(planoTipo => {
            // Encontrar o card ativo
            const cardAtivo = document.querySelector(`.bio-plano.${planoTipo} .periodo-card.ativo`);
            if (!cardAtivo) return;
            
            const periodo = cardAtivo.getAttribute('data-periodo');
            
            // Ocultar todos os botões deste plano
            document.querySelectorAll(`.${planoTipo}-link-mensal, .${planoTipo}-link-trimestral, .${planoTipo}-link-semestral`).forEach(botao => {
                botao.style.display = 'none';
            });
            
            // Mostrar apenas o botão do período selecionado
            const botaoAtivo = document.querySelector(`.${planoTipo}-link-${periodo}`);
            if (botaoAtivo) {
                botaoAtivo.style.display = 'inline-block';
            }
        });
    }
    
    // Inicializar a exibição - mostrar apenas os cards do período ativo (mensal por padrão)
    const periodoAtivo = document.querySelector('.filtro-opcao.filtro-periodo.ativo').getAttribute('data-periodo');
    
    // Ocultar todos os cards de periodicidade
    document.querySelectorAll('.periodo-card').forEach(card => {
        card.style.display = 'none';
    });
    
    // Mostrar apenas os cards correspondentes ao período ativo
    document.querySelectorAll(`.periodo-card[data-periodo="${periodoAtivo}"]`).forEach(card => {
        card.style.display = 'block';
        card.classList.add('ativo');
    });
    
    // Inicializar os botões de contratação
    atualizarBotoesContratacao();
});
