document.addEventListener('DOMContentLoaded', function() {
    console.log("Script de formulário carregado");
    
    // Elementos do formulário
    const formCadastro = document.getElementById('form-cadastro');
    const planoSelect = document.getElementById('plano');
    const treinadorSelect = document.getElementById('treinador');
    const periodicidadeSelect = document.getElementById('periodicidade');
    
    console.log("Elementos do formulário:", {
        formCadastro: formCadastro,
        planoSelect: planoSelect,
        treinadorSelect: treinadorSelect,
        periodicidadeSelect: periodicidadeSelect
    });
    
    // Detectar modalidade com base na URL atual
    const currentPage = window.location.pathname;
    let modalidade = '';
    
    if (currentPage.includes('corrida')) {
        modalidade = 'corrida';
    } else if (currentPage.includes('multisport')) {
        modalidade = 'multisport';
    }
    
    console.log("Modalidade detectada:", modalidade);
    
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
        console.log("Função atualizarTreinadores chamada");
        
        if (!treinadorSelect) {
            console.log("Select de treinador não encontrado");
            return;
        }
        
        // Limpar opções atuais
        treinadorSelect.innerHTML = '<option value="">Selecione um treinador</option>';
        
        // Obter o plano selecionado
        const planoSelecionado = planoSelect.value.toLowerCase();
        let tipoPlano = '';
        
        if (planoSelecionado.includes('essencial')) {
            tipoPlano = 'essencial';
        } else if (planoSelecionado.includes('premium')) {
            tipoPlano = 'premium';
        }
        
        console.log("Plano selecionado:", planoSelecionado, "Tipo de plano:", tipoPlano);
        
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
            
            console.log("Treinadores adicionados:", treinadoresDisponiveis.length);
        } else {
            console.log("Não foi possível determinar os treinadores para:", {modalidade, tipoPlano});
        }
    }
    
    // Função para atualizar a periodicidade
    function atualizarPeriodicidade() {
        console.log("Função atualizarPeriodicidade chamada");
        
        if (!periodicidadeSelect) {
            console.log("Select de periodicidade não encontrado");
            return;
        }
        
        // Limpar opções atuais
        periodicidadeSelect.innerHTML = '<option value="">Selecione a periodicidade</option>';
        
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
            
            // Destacar a opção semestral
            if (periodicidade.valor === 'semestral') {
                option.classList.add('melhor-opcao');
            }
            
            periodicidadeSelect.appendChild(option);
        });
        
        console.log("Periodicidades adicionadas");
    }
    
    // Inicializar os selects quando a página carregar
    if (planoSelect) {
        console.log("Inicializando selects");
        
        // Inicializar periodicidade
        atualizarPeriodicidade();
        
        // Evento de mudança no select de plano
        planoSelect.addEventListener('change', function() {
            console.log("Evento change do plano disparado");
            atualizarTreinadores();
        });
        
        // Inicializar treinadores se já tiver um plano selecionado
        if (planoSelect.value) {
            console.log("Plano já selecionado, atualizando treinadores");
            atualizarTreinadores();
        }
    } else {
        console.log("Select de plano não encontrado");
        
        // Tentar selecionar por name como fallback
        const planoSelectByName = document.querySelector('select[name="plano"]');
        const treinadorSelectByName = document.querySelector('select[name="treinador"]');
        const periodicidadeSelectByName = document.querySelector('select[name="periodicidade"]');
        
        console.log("Elementos por name:", {
            planoSelectByName: planoSelectByName,
            treinadorSelectByName: treinadorSelectByName,
            periodicidadeSelectByName: periodicidadeSelectByName
        });
        
        if (planoSelectByName && treinadorSelectByName) {
            console.log("Elementos encontrados por name, adicionando event listeners");
            
            // Atualizar referências
            const planoSelect = planoSelectByName;
            const treinadorSelect = treinadorSelectByName;
            const periodicidadeSelect = periodicidadeSelectByName;
            
            // Inicializar periodicidade
            if (periodicidadeSelect) {
                atualizarPeriodicidade();
            }
            
            // Evento de mudança no select de plano
            planoSelect.addEventListener('change', function() {
                console.log("Evento change do plano (por name) disparado");
                
                // Limpar opções atuais
                treinadorSelect.innerHTML = '<option value="">Selecione um treinador</option>';
                
                // Obter o plano selecionado
                const planoSelecionado = planoSelect.value.toLowerCase();
                let tipoPlano = '';
                
                if (planoSelecionado.includes('essencial')) {
                    tipoPlano = 'essencial';
                } else if (planoSelecionado.includes('premium')) {
                    tipoPlano = 'premium';
                }
                
                console.log("Plano selecionado:", planoSelecionado, "Tipo de plano:", tipoPlano);
                
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
                    
                    console.log("Treinadores adicionados:", treinadoresDisponiveis.length);
                } else {
                    console.log("Não foi possível determinar os treinadores para:", {modalidade, tipoPlano});
                }
            });
            
            // Inicializar treinadores se já tiver um plano selecionado
            if (planoSelect.value) {
                console.log("Plano já selecionado (por name), disparando evento change");
                planoSelect.dispatchEvent(new Event('change'));
            }
        }
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
    } else {
        console.log("Formulário não encontrado por ID");
        
        // Tentar selecionar o formulário diretamente
        const form = document.querySelector('form');
        if (form) {
            console.log("Formulário encontrado diretamente");
            
            form.addEventListener('submit', function(event) {
                event.preventDefault();
                
                // Obter os valores dos campos
                const planoSelect = document.querySelector('select[name="plano"]');
                const treinadorSelect = document.querySelector('select[name="treinador"]');
                const periodicidadeSelect = document.querySelector('select[name="periodicidade"]');
                
                const planoSelecionado = planoSelect ? planoSelect.value : '';
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
    }
    
    // Adicionar event listener diretamente ao select de plano como fallback final
    const allPlanoSelects = document.querySelectorAll('select');
    allPlanoSelects.forEach(select => {
        if (select.id === 'plano' || select.name === 'plano' || 
            (select.options && select.options.length > 0 && 
             (select.options[0].text.includes('plano') || 
              select.options[1] && select.options[1].text.includes('Essencial')))) {
            
            console.log("Select de plano encontrado por heurística:", select);
            
            // Verificar se já tem um event listener
            const hasListener = select.getAttribute('data-has-listener');
            if (!hasListener) {
                select.setAttribute('data-has-listener', 'true');
                
                select.addEventListener('change', function() {
                    console.log("Evento change do plano (fallback) disparado");
                    
                    // Encontrar o select de treinador
                    const treinadorSelect = document.querySelector('select[name="treinador"], select#treinador');
                    if (!treinadorSelect) {
                        console.log("Select de treinador não encontrado (fallback)");
                        return;
                    }
                    
                    // Limpar opções atuais
                    treinadorSelect.innerHTML = '<option value="">Selecione um treinador</option>';
                    
                    // Obter o plano selecionado
                    const planoSelecionado = select.value.toLowerCase();
                    let tipoPlano = '';
                    
                    if (planoSelecionado.includes('essencial')) {
                        tipoPlano = 'essencial';
                    } else if (planoSelecionado.includes('premium')) {
                        tipoPlano = 'premium';
                    }
                    
                    console.log("Plano selecionado (fallback):", planoSelecionado, "Tipo de plano:", tipoPlano);
                    
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
                        
                        console.log("Treinadores adicionados (fallback):", treinadoresDisponiveis.length);
                    } else {
                        console.log("Não foi possível determinar os treinadores para (fallback):", {modalidade, tipoPlano});
                    }
                });
                
                // Inicializar treinadores se já tiver um plano selecionado
                if (select.value) {
                    console.log("Plano já selecionado (fallback), disparando evento change");
                    select.dispatchEvent(new Event('change'));
                }
            }
        }
    });
});
