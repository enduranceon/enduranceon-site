// Script para gerenciar os filtros e valores dos planos nas páginas de treinadores
document.addEventListener('DOMContentLoaded', function() {
    // Valores base para cada plano e modalidade
    const valoresPlanos = {
        corrida: {
            essencial: {
                mensal: 240,
                trimestral: 660, // Equivale a 220/mês
                semestral: 1200  // Equivale a 200/mês
            },
            premium: {
                mensal: 320,
                trimestral: 915, // Equivale a 305/mês
                semestral: 1740  // Equivale a 290/mês
            }
        },
        triathlon: {
            essencial: {
                mensal: 380,
                trimestral: 1080, // Equivale a 360/mês
                semestral: 2040   // Equivale a 340/mês
            },
            premium: {
                mensal: 420,
                trimestral: 1200, // Equivale a 400/mês
                semestral: 2280   // Equivale a 380/mês
            }
        }
    };

    // Valores equivalentes mensais
    const valoresEquivalentes = {
        corrida: {
            essencial: {
                trimestral: 220,
                semestral: 200
            },
            premium: {
                trimestral: 305,
                semestral: 290
            }
        },
        triathlon: {
            essencial: {
                trimestral: 360,
                semestral: 340
            },
            premium: {
                trimestral: 400,
                semestral: 380
            }
        }
    };

    // Elementos do DOM
    const filtroModalidade = document.querySelectorAll('.filtro-modalidade');
    const filtroPeriodo = document.querySelectorAll('.filtro-periodo');
    
    // Valores iniciais
    let modalidadeAtual = 'corrida';
    let periodoAtual = 'mensal';

    // Função para atualizar os preços dos planos
    function atualizarPrecos() {
        // Atualizar preços do Plano Essencial
        const essencialMensal = document.getElementById('essencial-mensal-preco');
        const essencialTrimestral = document.getElementById('essencial-trimestral-preco');
        const essencialSemestral = document.getElementById('essencial-semestral-preco');
        
        // Atualizar preços do Plano Premium
        const premiumMensal = document.getElementById('premium-mensal-preco');
        const premiumTrimestral = document.getElementById('premium-trimestral-preco');
        const premiumSemestral = document.getElementById('premium-semestral-preco');

        if (essencialMensal) essencialMensal.textContent = valoresPlanos[modalidadeAtual].essencial.mensal;
        if (essencialTrimestral) essencialTrimestral.textContent = valoresPlanos[modalidadeAtual].essencial.trimestral;
        if (essencialSemestral) essencialSemestral.textContent = valoresPlanos[modalidadeAtual].essencial.semestral;
        
        if (premiumMensal) premiumMensal.textContent = valoresPlanos[modalidadeAtual].premium.mensal;
        if (premiumTrimestral) premiumTrimestral.textContent = valoresPlanos[modalidadeAtual].premium.trimestral;
        if (premiumSemestral) premiumSemestral.textContent = valoresPlanos[modalidadeAtual].premium.semestral;

        // Atualizar links dos botões
        atualizarLinks();
    }

    // Função para mostrar/esconder cards de período
    function mostrarPeriodo() {
        const periodoCards = document.querySelectorAll('.periodo-card');
        
        periodoCards.forEach(card => {
            const cardPeriodo = card.getAttribute('data-periodo');
            if (cardPeriodo === periodoAtual) {
                card.style.display = 'block';
                card.classList.add('ativo');
            } else {
                card.style.display = 'none';
                card.classList.remove('ativo');
            }
        });
    }

    // Função para atualizar links dos botões
    function atualizarLinks() {
        const treinadorNome = document.querySelector('.bio-nome').textContent.toLowerCase().replace(' ', '-');
        
        // Atualizar links do Essencial
        const essencialLinks = document.querySelectorAll('[class*="essencial-link"]');
        essencialLinks.forEach(link => {
            const periodo = link.getAttribute('data-periodo') || periodoAtual;
            link.href = `../cadastro-unificado.html?modalidade=${modalidadeAtual}&plano=essencial&treinador=${treinadorNome}&periodo=${periodo}`;
        });

        // Atualizar links do Premium
        const premiumLinks = document.querySelectorAll('[class*="premium-link"]');
        premiumLinks.forEach(link => {
            const periodo = link.getAttribute('data-periodo') || periodoAtual;
            link.href = `../cadastro-unificado.html?modalidade=${modalidadeAtual}&plano=premium&treinador=${treinadorNome}&periodo=${periodo}`;
        });
    }

    // Event listeners para filtros de modalidade
    filtroModalidade.forEach(filtro => {
        filtro.addEventListener('click', function() {
            // Remover classe ativo de todos os filtros de modalidade
            filtroModalidade.forEach(f => f.classList.remove('ativo'));
            // Adicionar classe ativo ao filtro clicado
            this.classList.add('ativo');
            // Atualizar modalidade atual
            modalidadeAtual = this.getAttribute('data-modalidade');
            // Atualizar preços e links
            atualizarPrecos();
        });
    });

    // Event listeners para filtros de período
    filtroPeriodo.forEach(filtro => {
        filtro.addEventListener('click', function() {
            // Remover classe ativo de todos os filtros de período
            filtroPeriodo.forEach(f => f.classList.remove('ativo'));
            // Adicionar classe ativo ao filtro clicado
            this.classList.add('ativo');
            // Atualizar período atual
            periodoAtual = this.getAttribute('data-periodo');
            // Mostrar período correspondente
            mostrarPeriodo();
        });
    });

    // Inicializar
    atualizarPrecos();
    mostrarPeriodo();
});

