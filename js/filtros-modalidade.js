document.addEventListener('DOMContentLoaded', function() {
    // Seleciona os elementos de filtro de modalidade
    const filtrosModalidade = document.querySelectorAll('.filtro-modalidade');
    
    // Valores para cada modalidade
    const precos = {
        corrida: {
            essencial: {
                mensal: 240,
                trimestral: 220,
                semestral: 200
            },
            premium: {
                mensal: 320,
                trimestral: 305,
                semestral: 290
            }
        },
        triathlon: {
            essencial: {
                mensal: 380,
                trimestral: 360,
                semestral: 340
            },
            premium: {
                mensal: 450,
                trimestral: 435,
                semestral: 420
            }
        }
    };

    // Valores totais para cada periodicidade
    const totais = {
        corrida: {
            essencial: {
                trimestral: 660,
                semestral: 1200
            },
            premium: {
                trimestral: 915,
                semestral: 1740
            }
        },
        triathlon: {
            essencial: {
                trimestral: 1080,
                semestral: 2040
            },
            premium: {
                trimestral: 1305,
                semestral: 2520
            }
        }
    };
    
    // Adiciona evento de clique para cada filtro de modalidade
    filtrosModalidade.forEach(filtro => {
        filtro.addEventListener('click', function() {
            // Remove a classe 'ativo' de todos os filtros
            filtrosModalidade.forEach(f => f.classList.remove('ativo'));
            
            // Adiciona a classe 'ativo' ao filtro clicado
            this.classList.add('ativo');
            
            // Obtém a modalidade selecionada
            const modalidade = this.getAttribute('data-modalidade');
            
            // Atualiza os preços e links para a modalidade selecionada
            atualizarPrecos(modalidade);
        });
    });
    
    // Adiciona evento de clique para cada card de período
    function inicializarCardsPeriodo() {
        const periodoCards = document.querySelectorAll('.periodo-card');
        periodoCards.forEach(card => {
            card.addEventListener('click', function() {
                // Remove a classe 'ativo' de todos os cards
                periodoCards.forEach(c => c.classList.remove('ativo'));
                
                // Adiciona a classe 'ativo' ao card clicado
                this.classList.add('ativo');
                
                // Obtém o período selecionado
                const periodo = this.getAttribute('data-periodo');
                
                // Atualiza a visibilidade dos botões de contratação
                atualizarBotoesContratacao(periodo);
            });
        });
    }
    
    // Função para atualizar a visibilidade dos botões de contratação
    function atualizarBotoesContratacao(periodo) {
        // Esconde todos os botões
        document.querySelectorAll('.periodo-botao').forEach(botao => {
            botao.style.display = 'none';
        });
        
        // Mostra apenas os botões do período selecionado
        document.querySelectorAll(`.periodo-botao[data-periodo="${periodo}"]`).forEach(botao => {
            botao.style.display = 'inline-block';
        });
    }
    
    // Função para atualizar os preços e links com base na modalidade
    function atualizarPrecos(modalidade) {
        // Atualiza preços do plano Essencial (se existir)
        if (document.querySelector('#essencial-mensal-preco')) {
            document.querySelector('#essencial-mensal-preco').textContent = `${precos[modalidade].essencial.mensal}`;
        }
        if (document.querySelector('#essencial-trimestral-preco')) {
            document.querySelector('#essencial-trimestral-preco').textContent = `${totais[modalidade].essencial.trimestral}`;
        }
        if (document.querySelector('#essencial-trimestral-equivalente')) {
            document.querySelector('#essencial-trimestral-equivalente').textContent = `Equivale a R$ ${precos[modalidade].essencial.trimestral}/mês`;
        }
        if (document.querySelector('#essencial-semestral-preco')) {
            document.querySelector('#essencial-semestral-preco').textContent = `${totais[modalidade].essencial.semestral}`;
        }
        if (document.querySelector('#essencial-semestral-equivalente')) {
            document.querySelector('#essencial-semestral-equivalente').textContent = `Equivale a R$ ${precos[modalidade].essencial.semestral}/mês`;
        }
        
        // Atualiza preços do plano Premium (se existir)
        if (document.querySelector('#premium-mensal-preco')) {
            document.querySelector('#premium-mensal-preco').textContent = `${precos[modalidade].premium.mensal}`;
        }
        if (document.querySelector('#premium-trimestral-preco')) {
            document.querySelector('#premium-trimestral-preco').textContent = `${totais[modalidade].premium.trimestral}`;
        }
        if (document.querySelector('#premium-trimestral-equivalente')) {
            document.querySelector('#premium-trimestral-equivalente').textContent = `Equivale a R$ ${precos[modalidade].premium.trimestral}/mês`;
        }
        if (document.querySelector('#premium-semestral-preco')) {
            document.querySelector('#premium-semestral-preco').textContent = `${totais[modalidade].premium.semestral}`;
        }
        if (document.querySelector('#premium-semestral-equivalente')) {
            document.querySelector('#premium-semestral-equivalente').textContent = `Equivale a R$ ${precos[modalidade].premium.semestral}/mês`;
        }
        
        // Atualiza os links de contratação
        const treinador = window.location.pathname.split('/').pop().replace('.html', '');
        
        // Links do plano Essencial
        document.querySelectorAll('.essencial-link-mensal').forEach(link => {
            link.href = `../cadastro-unificado.html?modalidade=${modalidade}&plano=essencial&treinador=${treinador}&periodo=mensal`;
        });
        
        document.querySelectorAll('.essencial-link-trimestral').forEach(link => {
            link.href = `../cadastro-unificado.html?modalidade=${modalidade}&plano=essencial&treinador=${treinador}&periodo=trimestral`;
        });
        
        document.querySelectorAll('.essencial-link-semestral').forEach(link => {
            link.href = `../cadastro-unificado.html?modalidade=${modalidade}&plano=essencial&treinador=${treinador}&periodo=semestral`;
        });
        
        // Links do plano Premium
        document.querySelectorAll('.premium-link-mensal').forEach(link => {
            link.href = `../cadastro-unificado.html?modalidade=${modalidade}&plano=premium&treinador=${treinador}&periodo=mensal`;
        });

        document.querySelectorAll('.premium-link-trimestral').forEach(link => {
            link.href = `../cadastro-unificado.html?modalidade=${modalidade}&plano=premium&treinador=${treinador}&periodo=trimestral`;
        });

        document.querySelectorAll('.premium-link-semestral').forEach(link => {
            link.href = `../cadastro-unificado.html?modalidade=${modalidade}&plano=premium&treinador=${treinador}&periodo=semestral`;
        });
    }
    
    // Inicializa com a modalidade ativa
    const modalidadeAtiva = document.querySelector('.filtro-modalidade.ativo');
    if (modalidadeAtiva) {
        const modalidade = modalidadeAtiva.getAttribute('data-modalidade');
        atualizarPrecos(modalidade);
        inicializarCardsPeriodo();
        
        // Inicializa com o período mensal ativo
        const periodoAtivo = document.querySelector('.periodo-card.ativo');
        if (periodoAtivo) {
            const periodo = periodoAtivo.getAttribute('data-periodo');
            atualizarBotoesContratacao(periodo);
        }
    }
});
