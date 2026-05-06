// Aplicativo de Testes de Lactato - Versão Geral
// Endurance On Assessoria Esportiva

// Variáveis globais
let estagiosCount = 1;

// Elementos DOM
document.addEventListener('DOMContentLoaded', () => {
    // Navegação entre seções
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-target');
            
            // Atualizar links ativos
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Mostrar seção alvo
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetId) {
                    section.classList.add('active');
                }
            });
        });
    });
    
    // Adicionar estágio
    const adicionarEstagio = document.getElementById('adicionar-estagio');
    const estagiosContainer = document.getElementById('estagios-container');
    
    adicionarEstagio.addEventListener('click', () => {
        const index = estagiosCount;
        estagiosCount++;
        
        const estagioHtml = `
            <div class="estagio-item" data-index="${index}">
                <div class="estagio-header">
                    <h4>Estágio ${estagiosCount}</h4>
                    <button type="button" class="btn-icon remover-estagio"><i class="fas fa-trash"></i></button>
                </div>
                <div class="estagio-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="velocidade-${index}">Velocidade (km/h)*</label>
                            <input type="number" id="velocidade-${index}" name="estagios[${index}][velocidade]" step="0.1" min="0" required>
                        </div>
                        <div class="form-group">
                            <label for="lactato-${index}">Lactato (mmol/L)*</label>
                            <input type="number" id="lactato-${index}" name="estagios[${index}][lactato]" step="0.1" min="0" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="fc-media-${index}">FC Média</label>
                            <input type="number" id="fc-media-${index}" name="estagios[${index}][fcMedia]" min="0">
                        </div>
                        <div class="form-group">
                            <label for="fc-final-${index}">FC Final</label>
                            <input type="number" id="fc-final-${index}" name="estagios[${index}][fcFinal]" min="0">
                        </div>
                        <div class="form-group">
                            <label for="pse-${index}">PSE (0-10)</label>
                            <input type="number" id="pse-${index}" name="estagios[${index}][pse]" min="0" max="10" step="1">
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        estagiosContainer.insertAdjacentHTML('beforeend', estagioHtml);
        
        // Adicionar evento para remover estágio
        adicionarEventosRemoverEstagio();
        
        // Adicionar eventos para detectar limiares ao alterar valores
        adicionarEventosDetectarLimiares();
    });
    
    // Função para adicionar eventos de remover estágio
    function adicionarEventosRemoverEstagio() {
        const removerBtns = document.querySelectorAll('.remover-estagio');
        removerBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const estagioItem = e.target.closest('.estagio-item');
                if (document.querySelectorAll('.estagio-item').length > 1) {
                    estagioItem.remove();
                    atualizarNumeracaoEstagios();
                    detectarLimiares();
                }
            });
        });
    }
    
    // Função para adicionar eventos de detectar limiares
    function adicionarEventosDetectarLimiares() {
        const inputsLactato = document.querySelectorAll('input[name*="[lactato]"]');
        const inputsFcMedia = document.querySelectorAll('input[name*="[fcMedia]"]');
        const inputsVelocidade = document.querySelectorAll('input[name*="[velocidade]"]');
        
        inputsLactato.forEach(input => {
            input.addEventListener('input', detectarLimiares);
        });
        
        inputsFcMedia.forEach(input => {
            input.addEventListener('input', detectarLimiares);
        });
        
        inputsVelocidade.forEach(input => {
            input.addEventListener('input', detectarLimiares);
        });
    }
    
    // Inicializar eventos
    adicionarEventosRemoverEstagio();
    adicionarEventosDetectarLimiares();
    
    // Atualizar numeração dos estágios
    function atualizarNumeracaoEstagios() {
        const estagioItems = document.querySelectorAll('.estagio-item');
        estagioItems.forEach((item, index) => {
            const header = item.querySelector('.estagio-header h4');
            header.textContent = `Estágio ${index + 1}`;
        });
    }
    
    // Detectar limiares LT1 (2.0 mmol/L) e LT2 (4.0 mmol/L)
    function detectarLimiares() {
        const estagioItems = document.querySelectorAll('.estagio-item');
        const estagios = [];
        
        // Coletar dados dos estágios
        estagioItems.forEach(item => {
            const index = item.getAttribute('data-index');
            const velocidadeInput = document.getElementById(`velocidade-${index}`);
            const lactatoInput = document.getElementById(`lactato-${index}`);
            const fcMediaInput = document.getElementById(`fc-media-${index}`);
            
            if (velocidadeInput && velocidadeInput.value && 
                lactatoInput && lactatoInput.value) {
                estagios.push({
                    velocidade: parseFloat(velocidadeInput.value),
                    lactato: parseFloat(lactatoInput.value),
                    fcMedia: fcMediaInput && fcMediaInput.value ? parseInt(fcMediaInput.value) : null
                });
            }
        });
        
        // Ordenar estágios por velocidade
        estagios.sort((a, b) => a.velocidade - b.velocidade);
        
        // Detectar LT1 (2.0 mmol/L)
        const lt1 = detectarLimiar(estagios, 2.0);
        const lt1VelocidadeElement = document.getElementById('lt1-velocidade');
        const lt1FcElement = document.getElementById('lt1-fc');
        const lt1PaceElement = document.getElementById('lt1-pace');
        
        if (lt1) {
            lt1VelocidadeElement.textContent = lt1.velocidade.toFixed(1);
            lt1FcElement.textContent = lt1.fcMedia || '-';
            lt1PaceElement.textContent = velocidadeParaPace(lt1.velocidade);
        } else {
            lt1VelocidadeElement.textContent = '-';
            lt1FcElement.textContent = '-';
            lt1PaceElement.textContent = '-';
        }
        
        // Detectar LT2 (4.0 mmol/L)
        const lt2 = detectarLimiar(estagios, 4.0);
        const lt2VelocidadeElement = document.getElementById('lt2-velocidade');
        const lt2FcElement = document.getElementById('lt2-fc');
        const lt2PaceElement = document.getElementById('lt2-pace');
        
        if (lt2) {
            lt2VelocidadeElement.textContent = lt2.velocidade.toFixed(1);
            lt2FcElement.textContent = lt2.fcMedia || '-';
            lt2PaceElement.textContent = velocidadeParaPace(lt2.velocidade);
        } else {
            lt2VelocidadeElement.textContent = '-';
            lt2FcElement.textContent = '-';
            lt2PaceElement.textContent = '-';
        }
    }
    
    // Função para detectar limiar usando interpolação linear
    function detectarLimiar(estagios, valorLimiar) {
        // Verificar se há estágios suficientes
        if (estagios.length < 2) {
            return null;
        }
        
        // Encontrar estágios que contêm o valor do limiar
        for (let i = 0; i < estagios.length - 1; i++) {
            const estagio1 = estagios[i];
            const estagio2 = estagios[i + 1];
            
            if ((estagio1.lactato <= valorLimiar && estagio2.lactato >= valorLimiar) ||
                (estagio1.lactato >= valorLimiar && estagio2.lactato <= valorLimiar)) {
                
                // Interpolação linear para velocidade
                const percentual = (valorLimiar - estagio1.lactato) / (estagio2.lactato - estagio1.lactato);
                const velocidade = estagio1.velocidade + percentual * (estagio2.velocidade - estagio1.velocidade);
                
                // Interpolação linear para FC (se disponível)
                let fcMedia = null;
                if (estagio1.fcMedia && estagio2.fcMedia) {
                    fcMedia = Math.round(estagio1.fcMedia + percentual * (estagio2.fcMedia - estagio1.fcMedia));
                }
                
                return {
                    velocidade: velocidade,
                    fcMedia: fcMedia
                };
            }
        }
        
        return null;
    }
    
    // Converter velocidade (km/h) para pace (min/km)
    function velocidadeParaPace(velocidade) {
        if (!velocidade || velocidade <= 0) {
            return '-';
        }
        
        // Calcular minutos por km
        const minutesPerkm = 60 / velocidade;
        
        // Converter para formato min:sec
        const minutes = Math.floor(minutesPerkm);
        const seconds = Math.round((minutesPerkm - minutes) * 60);
        
        return `${minutes}:${seconds.toString().padStart(2, '0')} min/km`;
    }
    
    // Formulário de registro de teste
    const formTeste = document.getElementById('form-teste');
    
    formTeste.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Validar formulário
        if (!formTeste.checkValidity()) {
            formTeste.reportValidity();
            return;
        }
        
        // Preparar dados
        const alunoNome = document.getElementById('aluno-nome').value;
        const dataTeste = document.getElementById('data-teste').value;
        
        const estagios = [];
        const estagioItems = document.querySelectorAll('.estagio-item');
        
        estagioItems.forEach(item => {
            const index = item.getAttribute('data-index');
            const velocidade = document.getElementById(`velocidade-${index}`).value;
            const lactato = document.getElementById(`lactato-${index}`).value;
            const fcMedia = document.getElementById(`fc-media-${index}`).value || null;
            const fcFinal = document.getElementById(`fc-final-${index}`).value || null;
            const pse = document.getElementById(`pse-${index}`).value || null;
            
            estagios.push({
                velocidade: parseFloat(velocidade),
                lactato: parseFloat(lactato),
                fcMedia: fcMedia ? parseInt(fcMedia) : null,
                fcFinal: fcFinal ? parseInt(fcFinal) : null,
                pse: pse ? parseInt(pse) : null
            });
        });
        
        // Obter valores de LT1 e LT2
        const lt1Velocidade = document.getElementById('lt1-velocidade').textContent;
        const lt1Fc = document.getElementById('lt1-fc').textContent;
        const lt2Velocidade = document.getElementById('lt2-velocidade').textContent;
        const lt2Fc = document.getElementById('lt2-fc').textContent;
        
        const testeData = {
            alunoNome: alunoNome,
            dataTeste: dataTeste,
            estagios: estagios,
            lt1: {
                velocidade: lt1Velocidade !== '-' ? parseFloat(lt1Velocidade) : null,
                fcMedia: lt1Fc !== '-' ? parseInt(lt1Fc) : null
            },
            lt2: {
                velocidade: lt2Velocidade !== '-' ? parseFloat(lt2Velocidade) : null,
                fcMedia: lt2Fc !== '-' ? parseInt(lt2Fc) : null
            },
            tipoTeste: 'geral' // Identificador para o tipo de teste
        };
        
        // Gerar relatório
        gerarRelatorio(testeData);
    });
});

// Função para gerar relatório
function gerarRelatorio(data) {
    // Codificar dados para URL
    const jsonData = JSON.stringify(data);
    const encodedData = encodeURIComponent(jsonData);
    
    // Abrir relatório em nova janela
    window.open(`report-geral.html?data=${encodedData}`, '_blank');
}
