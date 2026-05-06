document.addEventListener('DOMContentLoaded', function() {
    // Elementos do formulário
    const formCadastro = document.getElementById('form-cadastro');
    const planoSelect = document.getElementById('plano');
    const treinadorSelect = document.getElementById('treinador');
    const modalidadeInput = document.getElementById('modalidade');
    const periodicidadeSelect = document.getElementById('periodicidade');
    
    // Detectar modalidade com base na URL atual
    const currentPage = window.location.pathname;
    let modalidade = '';
    
    if (currentPage.includes('corrida.html')) {
        modalidade = 'corrida';
    } else if (currentPage.includes('multisport.html')) {
        modalidade = 'multisport';
    }
    
    // Definir o valor do campo de modalidade (hidden)
    if (modalidadeInput) {
        modalidadeInput.value = modalidade;
    }
    
    // Treinadores por modalidade e plano
    // TREINADORES DESATIVADOS: 'Ian Ribeiro', 'William Dutra', 'Luis Fernando', 'Gabriel Hermann'
    // Guto Fernandes agora está disponível em Essencial e Premium de Corrida
    const treinadores = {
        corrida: {
            essencial: [
                'Bruno Jeremias',
                'Jéssica Rodrigues',
                'Thais Prando',
                'Guto Fernandes'
            ],
            premium: [
                'Bruno Jeremias',
                'Jéssica Rodrigues',
                'Thais Prando',
                'Elinai Freitas',
                'Guto Fernandes'
            ]
        },
        multisport: {
            essencial: [
                'Jéssica Rodrigues',
                'Thais Prando'
            ],
            premium: [
                'Jéssica Rodrigues',
                'Thais Prando',
                'Elinai Freitas',
                'Guto Fernandes'
            ]
        }
    };
    
    // Função para atualizar os treinadores com base no plano selecionado
    function atualizarTreinadores() {
        if (!treinadorSelect) return;
        
        // Limpar opções atuais
        treinadorSelect.innerHTML = '<option value="">Selecione um treinador</option>';
        
        // Obter o plano selecionado
        const planoCompleto = planoSelect.value;
        let tipoPlano = '';
        
        if (planoCompleto.includes('essencial')) {
            tipoPlano = 'essencial';
        } else if (planoCompleto.includes('premium')) {
            tipoPlano = 'premium';
        }
        
        // Se temos modalidade e tipo de plano válidos, preencher os treinadores
        if (modalidade && tipoPlano && treinadores[modalidade] && treinadores[modalidade][tipoPlano]) {
            const treinadoresDisponiveis = treinadores[modalidade][tipoPlano];
            
            treinadoresDisponiveis.forEach(treinador => {
                const option = document.createElement('option');
                option.value = treinador.toLowerCase().replace(/\s+/g, '-');
                option.textContent = treinador;
                
                // Destacar treinadores exclusivos do plano premium
                if (tipoPlano === 'premium' && (treinador === 'Elinai Freitas' || treinador === 'Guto Fernandes')) {
                    option.classList.add('premium-exclusive');
                }
                
                treinadorSelect.appendChild(option);
            });
        }
    }
    
    // Função para atualizar a periodicidade com base no plano selecionado
    function atualizarPeriodicidade() {
        if (!periodicidadeSelect) return;
        
        // Limpar opções atuais
        periodicidadeSelect.innerHTML = '<option value="">Selecione a periodicidade</option>';
        
        // Obter o plano selecionado
        const planoCompleto = planoSelect.value;
        
        // Adicionar opções de periodicidade
        const periodicidades = [
            { valor: 'mensal', texto: 'Mensal' },
            { valor: 'trimestral', texto: 'Trimestral' },
            { valor: 'semestral', texto: 'Semestral (Melhor custo-benefício)' }
        ];
        
        periodicidades.forEach(periodicidade => {
            const option = document.createElement('option');
            option.value = periodicidade.valor;
            option.textContent = periodicidade.texto;
            
            // Pré-selecionar a periodicidade se estiver no plano
            if (planoCompleto.includes(periodicidade.valor)) {
                option.selected = true;
            }
            
            // Destacar a opção semestral
            if (periodicidade.valor === 'semestral') {
                option.classList.add('melhor-opcao');
            }
            
            periodicidadeSelect.appendChild(option);
        });
    }
    
    // Evento de mudança no select de plano
    if (planoSelect) {
        planoSelect.addEventListener('change', function() {
            atualizarTreinadores();
            atualizarPeriodicidade();
        });
        
        // Inicializar os selects quando a página carregar
        atualizarTreinadores();
        atualizarPeriodicidade();
    }
    
    // Evento de envio do formulário
    if (formCadastro) {
        formCadastro.addEventListener('submit', function(event) {
            event.preventDefault();
            
            // Aqui você pode adicionar a lógica para enviar os dados para um email
            // ou redirecionar para uma página de checkout
            
            // Exemplo de redirecionamento baseado no plano e treinador selecionados
            const planoSelecionado = planoSelect.value;
            const treinadorSelecionado = treinadorSelect ? treinadorSelect.value : '';
            const periodicidadeSelecionada = periodicidadeSelect ? periodicidadeSelect.value : '';
            
            // Construir URL de checkout (placeholder)
            const checkoutUrl = `#checkout?plano=${planoSelecionado}&treinador=${treinadorSelecionado}&periodicidade=${periodicidadeSelecionada}`;
            
            // Alerta temporário para demonstração
            alert(`Formulário enviado com sucesso!\n\nModalidade: ${modalidade}\nPlano: ${planoSelecionado}\nTreinador: ${treinadorSelecionado}\nPeriodicidade: ${periodicidadeSelecionada}\n\nEm um ambiente de produção, o usuário seria redirecionado para: ${checkoutUrl}`);
            
            // Descomente para implementar o redirecionamento real
            // window.location.href = checkoutUrl;
        });
    }
});
