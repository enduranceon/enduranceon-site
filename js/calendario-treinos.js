// Calendário de Treinos Coletivos - Funcionalidade Interativa
document.addEventListener('DOMContentLoaded', function() {
    // Dados dos treinos
    const treinosData = {
        'corrida-manha-segunda': {
            titulo: 'Corrida Manhã',
            modalidade: 'Corrida',
            dia: 'Segunda-feira',
            horario: '06h00 às 07h30',
            local: 'Beira-Mar Norte - Trapiche',
            descricao: 'Treino de corrida matinal na Beira-Mar Norte, com foco em resistência aeróbica e adaptação a diferentes ritmos. Ideal para começar a semana com energia.',
            observacoes: 'Traga água e use tênis adequado para corrida. Treino focado em volume e resistência aeróbica.',
            nivel: 'Todos os níveis',
            duracao: '90 minutos'
        },
        'corrida-tarde-segunda': {
            titulo: 'Corrida Tarde',
            modalidade: 'Corrida',
            dia: 'Segunda-feira',
            horario: '18h30 às 19h00',
            local: 'Coqueiros - Escritório da Endurance On (Em Frente ao Parque)',
            descricao: 'Treino de corrida no final do dia, próximo ao escritório da Endurance On. Sessão mais curta e intensa para quem prefere treinar após o trabalho.',
            observacoes: 'Traga água e lanterna/luz se necessário. Treino focado em intensidade e técnica.',
            nivel: 'Todos os níveis',
            duracao: '30 minutos'
        },
        'ciclismo-beira-mar': {
            titulo: 'Ciclismo na Beira-Mar',
            modalidade: 'Ciclismo',
            dia: 'Terça-feira',
            horario: '05h30',
            local: 'Beira Mar Norte - Trapiche',
            descricao: 'Treino de ciclismo em pelotão, com percurso até o Aeroporto e retorno. Indicado para todos os níveis, com orientação de segurança e técnica.',
            observacoes: 'Traga sua bike em bom estado, capacete obrigatório, água e lanche. Percurso de aproximadamente 40km.',
            nivel: 'Todos os níveis',
            duracao: '2-2.5 horas'
        },
        'pista-feira': {
            titulo: 'Pista-feira (Educativos)',
            modalidade: 'Corrida',
            dia: 'Quarta-feira',
            horario: '05h40 - Educativos | 06h00 - Início do treino',
            local: 'Pista de Corrida Parque de Coqueiros',
            descricao: 'Sessão técnica com foco em mecânica de corrida, técnica, intervalados e controle de ritmo. Treino estruturado para melhoria da performance.',
            observacoes: 'Chegue às 05h40 para os educativos. Traga água e tênis de corrida. Treino técnico focado em velocidade e resistência.',
            nivel: 'Intermediário/Avançado',
            duracao: '60-75 minutos'
        },
        'aguas-abertas': {
            titulo: 'Travessia em Águas Abertas',
            modalidade: 'Natação',
            dia: 'Sexta-feira',
            horario: '05h40 - Apenas no Verão',
            local: 'Praia da Daniela',
            descricao: 'Treino de natação em águas abertas, com foco em adaptação ao mar, navegação, respiração e segurança. Ativo apenas durante o período de verão.',
            observacoes: 'Apenas no verão (dezembro a março). Traga óculos de natação, touca e roupa de neoprene se necessário. Acompanhamento com caiaque de segurança.',
            nivel: 'Intermediário/Avançado',
            duracao: '45-60 minutos'
        },
        'corrida-beira-mar': {
            titulo: 'Corrida na Beira-Mar Norte',
            modalidade: 'Corrida',
            dia: 'Sábado',
            horario: '06h30',
            local: 'Beira Mar Norte - Bolsão da Casan',
            descricao: 'Treino longo de corrida, com distâncias progressivas conforme o período da temporada. Ideal para quem busca volume e adaptação a diferentes ritmos.',
            observacoes: 'Traga água, gel energético e use tênis adequado para longas distâncias. Treino focado em resistência aeróbica.',
            nivel: 'Todos os níveis',
            duracao: '60-120 minutos'
        },
        'multisport-triathlon': {
            titulo: 'Treino Multisport (Triathlon)',
            modalidade: 'Multisport',
            dia: 'Sábado',
            horario: '06h00',
            local: 'Praia de Jurerê',
            descricao: 'Sessões combinadas de Natação + Ciclismo + Corrida, simulando condições de prova. Foco em transições, pacing e estratégia de competição.',
            observacoes: 'Traga equipamentos das três modalidades. Treino completo com transições. Ideal para triatletas ou quem quer experimentar o multisport.',
            nivel: 'Intermediário/Avançado',
            duracao: '2.5-3 horas'
        }
    };

    // Elementos do DOM
    const treinoItems = document.querySelectorAll('.treino-item');
    const modal = document.getElementById('treino-modal');
    const modalContent = document.querySelector('.modal-content');
    const closeBtn = document.querySelector('.modal-close');

    // Função para abrir modal
    function abrirModal(treinoId) {
        const treino = treinosData[treinoId];
        if (!treino) return;

        const modalHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${treino.titulo}</h3>
                <button class="modal-close" onclick="fecharModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="modal-info-item">
                    <i class="fas fa-calendar-alt"></i>
                    <div class="modal-info-content">
                        <h4>Dia e Horário</h4>
                        <p>${treino.dia} - ${treino.horario}</p>
                    </div>
                </div>
                
                <div class="modal-info-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <div class="modal-info-content">
                        <h4>Local</h4>
                        <p>${treino.local}</p>
                    </div>
                </div>
                
                <div class="modal-info-item">
                    <i class="fas fa-info-circle"></i>
                    <div class="modal-info-content">
                        <h4>Descrição</h4>
                        <p>${treino.descricao}</p>
                    </div>
                </div>
            </div>
        `;

        modalContent.innerHTML = modalHTML;
        modal.style.display = 'block';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // Função para fechar modal
    window.fecharModal = function() {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }, 300);
    };

    // Event listeners para os treinos
    treinoItems.forEach(item => {
        item.addEventListener('click', function() {
            const treinoId = this.getAttribute('data-treino');
            abrirModal(treinoId);
        });
    });

    // Fechar modal clicando fora
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            fecharModal();
        }
    });

    // Fechar modal com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            fecharModal();
        }
    });

    // Animação dos cards
    function animarCards() {
        const cards = document.querySelectorAll('.dia-semana');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    // Observador de interseção para animações
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                if (entry.target.id === 'treinos-coletivos') {
                    setTimeout(() => {
                        animarCards();
                    }, 200);
                }
            }
        });
    }, observerOptions);

    // Observa a seção de treinos
    const secaoTreinos = document.getElementById('treinos-coletivos');
    if (secaoTreinos) {
        observer.observe(secaoTreinos);
    }

    // Função para adicionar contadores de participantes - REMOVIDA
    function adicionarContadores() {
        // Função removida conforme solicitação do usuário
    }

    // Adiciona efeito de pulse nos badges especiais
    function adicionarEfeitoPulse() {
        const badges = document.querySelectorAll('.treino-badge.hoje, .treino-badge.verao');
        badges.forEach(badge => {
            badge.style.animation = 'pulse 2s infinite';
        });
    }

    // CSS para animação de pulse
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(style);

    setTimeout(adicionarEfeitoPulse, 1500);
});

