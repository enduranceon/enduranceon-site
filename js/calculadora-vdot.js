// Calculadora VDOT - Baseada no método Jack Daniels
document.addEventListener('DOMContentLoaded', function() {
    // Elementos da calculadora
    const distanciaInput = document.getElementById('distancia');
    const tempoInput = document.getElementById('tempo');
    const ritmoInput = document.getElementById('ritmo');
    const distanciaBtns = document.querySelectorAll('.distancia-btn');
    
    // Elementos de resultado
    const vdotValue = document.getElementById('vdot-value');
    const vdotClassification = document.getElementById('vdot-classification');
    const vdotDescription = document.getElementById('vdot-description');
    
    // Elementos de ritmos
    const paceRecovery = document.getElementById('pace-recovery');
    const paceEasy = document.getElementById('pace-easy');
    const paceMarathon = document.getElementById('pace-marathon');
    const paceThreshold = document.getElementById('pace-threshold');
    const paceInterval = document.getElementById('pace-interval');
    const paceRepetition = document.getElementById('pace-repetition');
    
    // Elementos de tempos previstos
    const time5k = document.getElementById('time-5k');
    const time10k = document.getElementById('time-10k');
    const timeHalf = document.getElementById('time-half');
    const timeFull = document.getElementById('time-full');
    
    // Variáveis de estado
    let ultimoCampoEditado = null;
    let calculando = false;
    
    // Botões de distância
    distanciaBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Atualizar botões
            distanciaBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Atualizar input
            distanciaInput.value = this.dataset.value;
            ultimoCampoEditado = 'distancia';
            calcularVDOT();
        });
    });
    
    // Event listeners para inputs
    distanciaInput.addEventListener('input', function() {
        ultimoCampoEditado = 'distancia';
        calcularVDOT();
    });
    
    tempoInput.addEventListener('input', function() {
        ultimoCampoEditado = 'tempo';
        calcularVDOT();
    });
    
    ritmoInput.addEventListener('input', function() {
        ultimoCampoEditado = 'ritmo';
        calcularVDOT();
    });
    
    // Formatação de inputs
    tempoInput.addEventListener('blur', function() {
        this.value = formatarTempoInput(this.value);
    });
    
    ritmoInput.addEventListener('blur', function() {
        this.value = formatarRitmoInput(this.value);
    });
    
    // Função principal de cálculo do VDOT
    function calcularVDOT() {
        if (calculando) return;
        calculando = true;
        
        try {
            const distancia = parseFloat(distanciaInput.value) || 0;
            
            // Verificar se temos tempo ou ritmo
            if (ultimoCampoEditado === 'tempo' || ultimoCampoEditado === 'distancia') {
                const tempoSegundos = converterTempoParaSegundos(tempoInput.value);
                
                if (distancia > 0 && tempoSegundos > 0) {
                    // Calcular ritmo
                    const ritmoSegundos = tempoSegundos / distancia;
                    ritmoInput.value = formatarSegundosParaRitmo(ritmoSegundos);
                    
                    // Calcular VDOT
                    const vdot = calcularVDOTDeTempo(distancia, tempoSegundos);
                    atualizarResultados(vdot);
                }
            } else if (ultimoCampoEditado === 'ritmo') {
                const ritmoSegundos = converterRitmoParaSegundos(ritmoInput.value);
                
                if (distancia > 0 && ritmoSegundos > 0) {
                    // Calcular tempo
                    const tempoSegundos = ritmoSegundos * distancia;
                    tempoInput.value = formatarSegundosParaTempo(tempoSegundos);
                    
                    // Calcular VDOT
                    const vdot = calcularVDOTDeTempo(distancia, tempoSegundos);
                    atualizarResultados(vdot);
                }
            }
        } catch (error) {
            console.error('Erro no cálculo:', error);
        }
        
        calculando = false;
    }
    
    // Função para calcular VDOT a partir de distância e tempo
    function calcularVDOTDeTempo(distancia, tempoSegundos) {
        // Velocidade em metros por segundo
        const velocidade = (distancia * 1000) / tempoSegundos;
        
        // Fórmula de Daniels para estimar VO2max a partir da velocidade
        // VO2 = (-4.60 + 0.182258 * velocidade + 0.000104 * velocidade^2) / (0.8 + 0.1894393 * e^(-0.012778 * tempo) + 0.2989558 * e^(-0.1932605 * tempo))
        // Esta é uma versão simplificada da fórmula
        
        // Para simplificar, usamos uma aproximação baseada em tabelas de Daniels
        let vdot;
        
        // Aproximação baseada em tabelas de Daniels para 5k
        if (distancia === 5) {
            if (tempoSegundos < 900) vdot = 80; // Menos de 15:00
            else if (tempoSegundos < 960) vdot = 75; // 15:00 - 16:00
            else if (tempoSegundos < 1020) vdot = 70; // 16:00 - 17:00
            else if (tempoSegundos < 1080) vdot = 65; // 17:00 - 18:00
            else if (tempoSegundos < 1140) vdot = 60; // 18:00 - 19:00
            else if (tempoSegundos < 1200) vdot = 55; // 19:00 - 20:00
            else if (tempoSegundos < 1260) vdot = 50; // 20:00 - 21:00
            else if (tempoSegundos < 1320) vdot = 45; // 21:00 - 22:00
            else if (tempoSegundos < 1380) vdot = 40; // 22:00 - 23:00
            else if (tempoSegundos < 1440) vdot = 35; // 23:00 - 24:00
            else if (tempoSegundos < 1500) vdot = 30; // 24:00 - 25:00
            else vdot = 25; // Mais de 25:00
        }
        // Aproximação para 10k
        else if (distancia === 10) {
            if (tempoSegundos < 1860) vdot = 80; // Menos de 31:00
            else if (tempoSegundos < 1980) vdot = 75; // 31:00 - 33:00
            else if (tempoSegundos < 2100) vdot = 70; // 33:00 - 35:00
            else if (tempoSegundos < 2220) vdot = 65; // 35:00 - 37:00
            else if (tempoSegundos < 2340) vdot = 60; // 37:00 - 39:00
            else if (tempoSegundos < 2460) vdot = 55; // 39:00 - 41:00
            else if (tempoSegundos < 2580) vdot = 50; // 41:00 - 43:00
            else if (tempoSegundos < 2700) vdot = 45; // 43:00 - 45:00
            else if (tempoSegundos < 2820) vdot = 40; // 45:00 - 47:00
            else if (tempoSegundos < 2940) vdot = 35; // 47:00 - 49:00
            else if (tempoSegundos < 3060) vdot = 30; // 49:00 - 51:00
            else vdot = 25; // Mais de 51:00
        }
        // Aproximação para meia maratona (21.1km)
        else if (Math.abs(distancia - 21.1) < 0.1) {
            if (tempoSegundos < 3960) vdot = 80; // Menos de 1:06:00
            else if (tempoSegundos < 4200) vdot = 75; // 1:06:00 - 1:10:00
            else if (tempoSegundos < 4440) vdot = 70; // 1:10:00 - 1:14:00
            else if (tempoSegundos < 4680) vdot = 65; // 1:14:00 - 1:18:00
            else if (tempoSegundos < 4920) vdot = 60; // 1:18:00 - 1:22:00
            else if (tempoSegundos < 5160) vdot = 55; // 1:22:00 - 1:26:00
            else if (tempoSegundos < 5400) vdot = 50; // 1:26:00 - 1:30:00
            else if (tempoSegundos < 5640) vdot = 45; // 1:30:00 - 1:34:00
            else if (tempoSegundos < 5880) vdot = 40; // 1:34:00 - 1:38:00
            else if (tempoSegundos < 6120) vdot = 35; // 1:38:00 - 1:42:00
            else if (tempoSegundos < 6360) vdot = 30; // 1:42:00 - 1:46:00
            else vdot = 25; // Mais de 1:46:00
        }
        // Aproximação para maratona (42.2km)
        else if (Math.abs(distancia - 42.2) < 0.1) {
            if (tempoSegundos < 8100) vdot = 80; // Menos de 2:15:00
            else if (tempoSegundos < 8700) vdot = 75; // 2:15:00 - 2:25:00
            else if (tempoSegundos < 9300) vdot = 70; // 2:25:00 - 2:35:00
            else if (tempoSegundos < 9900) vdot = 65; // 2:35:00 - 2:45:00
            else if (tempoSegundos < 10500) vdot = 60; // 2:45:00 - 2:55:00
            else if (tempoSegundos < 11100) vdot = 55; // 2:55:00 - 3:05:00
            else if (tempoSegundos < 11700) vdot = 50; // 3:05:00 - 3:15:00
            else if (tempoSegundos < 12300) vdot = 45; // 3:15:00 - 3:25:00
            else if (tempoSegundos < 12900) vdot = 40; // 3:25:00 - 3:35:00
            else if (tempoSegundos < 13500) vdot = 35; // 3:35:00 - 3:45:00
            else if (tempoSegundos < 14100) vdot = 30; // 3:45:00 - 3:55:00
            else vdot = 25; // Mais de 3:55:00
        }
        // Para outras distâncias, usamos uma aproximação baseada na velocidade
        else {
            if (velocidade > 5.5) vdot = 80;
            else if (velocidade > 5.2) vdot = 75;
            else if (velocidade > 4.9) vdot = 70;
            else if (velocidade > 4.6) vdot = 65;
            else if (velocidade > 4.3) vdot = 60;
            else if (velocidade > 4.0) vdot = 55;
            else if (velocidade > 3.7) vdot = 50;
            else if (velocidade > 3.4) vdot = 45;
            else if (velocidade > 3.1) vdot = 40;
            else if (velocidade > 2.8) vdot = 35;
            else if (velocidade > 2.5) vdot = 30;
            else vdot = 25;
        }
        
        return vdot;
    }
    
    // Função para atualizar todos os resultados
    function atualizarResultados(vdot) {
        // Atualizar valor VDOT
        vdotValue.textContent = vdot;
        
        // Atualizar classificação
        atualizarClassificacao(vdot);
        
        // Atualizar ritmos de treino
        atualizarRitmos(vdot);
        
        // Atualizar tempos previstos
        atualizarTemposPrevistos(vdot);
    }
    
    // Função para atualizar classificação
    function atualizarClassificacao(vdot) {
        let classificacao, descricao;
        
        // Remover classes anteriores
        vdotClassification.classList.remove('poor', 'fair', 'good', 'excellent', 'superior');
        
        if (vdot < 30) {
            classificacao = 'Fraco';
            descricao = 'Fraco (< 30 ml/kg/min): Condição física abaixo da média, típica de iniciantes ou pessoas sedentárias.';
            vdotClassification.classList.add('poor');
        } else if (vdot < 40) {
            classificacao = 'Regular';
            descricao = 'Regular (30-39 ml/kg/min): Condição física média, típica de pessoas moderadamente ativas.';
            vdotClassification.classList.add('fair');
        } else if (vdot < 55) {
            classificacao = 'Bom';
            descricao = 'Bom (40-54 ml/kg/min): Boa condição física, típica de corredores regulares e praticantes de esportes.';
            vdotClassification.classList.add('good');
        } else if (vdot < 70) {
            classificacao = 'Excelente';
            descricao = 'Excelente (55-69 ml/kg/min): Condição física superior, típica de corredores competitivos e atletas treinados.';
            vdotClassification.classList.add('excellent');
        } else {
            classificacao = 'Superior';
            descricao = 'Superior (≥ 70 ml/kg/min): Condição física excepcional, típica de atletas de elite e corredores profissionais.';
            vdotClassification.classList.add('superior');
        }
        
        vdotClassification.textContent = classificacao;
        vdotDescription.textContent = descricao;
    }
    
    // Função para atualizar ritmos de treino
    function atualizarRitmos(vdot) {
        // Ritmo de recuperação (65-75% do limiar)
        const recoveryPaceMin = calcularRitmoPorVDOT(vdot, 0.65);
        const recoveryPaceMax = calcularRitmoPorVDOT(vdot, 0.75);
        paceRecovery.textContent = `${formatarSegundosParaRitmo(recoveryPaceMin)}-${formatarSegundosParaRitmo(recoveryPaceMax)}/km`;
        
        // Ritmo fácil (75-85% do limiar)
        const easyPaceMin = calcularRitmoPorVDOT(vdot, 0.75);
        const easyPaceMax = calcularRitmoPorVDOT(vdot, 0.85);
        paceEasy.textContent = `${formatarSegundosParaRitmo(easyPaceMin)}-${formatarSegundosParaRitmo(easyPaceMax)}/km`;
        
        // Ritmo de maratona (85-90% do limiar)
        const marathonPace = calcularRitmoPorVDOT(vdot, 0.85);
        paceMarathon.textContent = `${formatarSegundosParaRitmo(marathonPace)}/km`;
        
        // Ritmo de limiar (100% do limiar)
        const thresholdPace = calcularRitmoPorVDOT(vdot, 1.0);
        paceThreshold.textContent = `${formatarSegundosParaRitmo(thresholdPace)}/km`;
        
        // Ritmo de intervalo (112-120% do limiar)
        const intervalPace = calcularRitmoPorVDOT(vdot, 1.12);
        paceInterval.textContent = `${formatarSegundosParaRitmo(intervalPace)}/km`;
        
        // Ritmo de repetição (120-130% do limiar)
        const repetitionPace = calcularRitmoPorVDOT(vdot, 1.3);
        paceRepetition.textContent = `${formatarSegundosParaRitmo(repetitionPace)}/km`;
    }
    
    // Função para calcular ritmo baseado no VDOT e percentual do limiar
    function calcularRitmoPorVDOT(vdot, percentualLimiar) {
        // Tabela aproximada de ritmos de limiar por VDOT (segundos por km)
        const ritmosPorVDOT = {
            30: 360, // 6:00/km
            35: 330, // 5:30/km
            40: 300, // 5:00/km
            45: 280, // 4:40/km
            50: 260, // 4:20/km
            55: 245, // 4:05/km
            60: 230, // 3:50/km
            65: 220, // 3:40/km
            70: 210, // 3:30/km
            75: 200, // 3:20/km
            80: 190  // 3:10/km
        };
        
        // Encontrar os valores mais próximos na tabela
        const vdotKeys = Object.keys(ritmosPorVDOT).map(Number);
        let lowerKey = vdotKeys[0];
        let upperKey = vdotKeys[vdotKeys.length - 1];
        
        for (let i = 0; i < vdotKeys.length; i++) {
            if (vdotKeys[i] <= vdot && vdotKeys[i] > lowerKey) {
                lowerKey = vdotKeys[i];
            }
            if (vdotKeys[i] >= vdot && vdotKeys[i] < upperKey) {
                upperKey = vdotKeys[i];
            }
        }
        
        // Interpolação linear
        let ritmoLimiar;
        if (lowerKey === upperKey) {
            ritmoLimiar = ritmosPorVDOT[lowerKey];
        } else {
            const ratio = (vdot - lowerKey) / (upperKey - lowerKey);
            ritmoLimiar = ritmosPorVDOT[lowerKey] - ratio * (ritmosPorVDOT[lowerKey] - ritmosPorVDOT[upperKey]);
        }
        
        // Ajustar pelo percentual do limiar (inverso, pois ritmo mais rápido = menos segundos)
        return ritmoLimiar / percentualLimiar;
    }
    
    // Função para atualizar tempos previstos
    function atualizarTemposPrevistos(vdot) {
        // Tempos previstos para diferentes distâncias
        const tempo5k = calcularTempoPrevisto(5, vdot);
        const tempo10k = calcularTempoPrevisto(10, vdot);
        const tempoMeia = calcularTempoPrevisto(21.1, vdot);
        const tempoMaratona = calcularTempoPrevisto(42.2, vdot);
        
        time5k.textContent = formatarSegundosParaTempo(tempo5k);
        time10k.textContent = formatarSegundosParaTempo(tempo10k);
        timeHalf.textContent = formatarSegundosParaTempo(tempoMeia);
        timeFull.textContent = formatarSegundosParaTempo(tempoMaratona);
    }
    
    // Função para calcular tempo previsto baseado na distância e VDOT
    function calcularTempoPrevisto(distancia, vdot) {
        // Ritmo de corrida para a distância específica
        let ritmoSegundos;
        
        if (distancia === 5) {
            // Ritmo para 5k (aproximadamente 105-110% do limiar)
            ritmoSegundos = calcularRitmoPorVDOT(vdot, 1.07);
        } else if (distancia === 10) {
            // Ritmo para 10k (aproximadamente 100-105% do limiar)
            ritmoSegundos = calcularRitmoPorVDOT(vdot, 1.03);
        } else if (Math.abs(distancia - 21.1) < 0.1) {
            // Ritmo para meia maratona (aproximadamente 95-100% do limiar)
            ritmoSegundos = calcularRitmoPorVDOT(vdot, 0.97);
        } else if (Math.abs(distancia - 42.2) < 0.1) {
            // Ritmo para maratona (aproximadamente 85-90% do limiar)
            ritmoSegundos = calcularRitmoPorVDOT(vdot, 0.87);
        } else {
            // Para outras distâncias, usar aproximação
            ritmoSegundos = calcularRitmoPorVDOT(vdot, 1.0);
        }
        
        // Tempo total em segundos
        return ritmoSegundos * distancia;
    }
    
    // Funções auxiliares para conversão e formatação
    function converterTempoParaSegundos(tempo) {
        if (!tempo) return 0;
        
        const partes = tempo.split(':');
        let segundos = 0;
        
        if (partes.length === 3) {
            segundos = parseInt(partes[0]) * 3600 + parseInt(partes[1]) * 60 + parseInt(partes[2]);
        } else if (partes.length === 2) {
            segundos = parseInt(partes[0]) * 60 + parseInt(partes[1]);
        } else {
            segundos = parseInt(partes[0]);
        }
        
        return isNaN(segundos) ? 0 : segundos;
    }
    
    function converterRitmoParaSegundos(ritmo) {
        if (!ritmo) return 0;
        
        const partes = ritmo.split(':');
        let segundos = 0;
        
        if (partes.length === 2) {
            segundos = parseInt(partes[0]) * 60 + parseInt(partes[1]);
        } else {
            segundos = parseInt(partes[0]);
        }
        
        return isNaN(segundos) ? 0 : segundos;
    }
    
    function formatarSegundosParaTempo(segundos) {
        if (!segundos) return '00:00:00';
        
        const horas = Math.floor(segundos / 3600);
        const minutos = Math.floor((segundos % 3600) / 60);
        const segs = Math.floor(segundos % 60);
        
        return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
    }
    
    function formatarSegundosParaRitmo(segundos) {
        if (!segundos) return '0:00';
        
        const minutos = Math.floor(segundos / 60);
        const segs = Math.floor(segundos % 60);
        
        return `${minutos}:${String(segs).padStart(2, '0')}`;
    }
    
    function formatarTempoInput(valor) {
        if (!valor) return '';
        
        // Remover caracteres não numéricos, exceto ':'
        valor = valor.replace(/[^\d:]/g, '');
        
        const partes = valor.split(':');
        
        // Se já tem formato hh:mm:ss
        if (partes.length === 3) {
            const horas = parseInt(partes[0]) || 0;
            const minutos = parseInt(partes[1]) || 0;
            const segundos = parseInt(partes[2]) || 0;
            
            return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
        }
        // Se tem formato mm:ss
        else if (partes.length === 2) {
            const minutos = parseInt(partes[0]) || 0;
            const segundos = parseInt(partes[1]) || 0;
            
            // Se minutos > 59, converter para horas
            if (minutos > 59) {
                const horas = Math.floor(minutos / 60);
                const mins = minutos % 60;
                return `${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
            }
            
            return `00:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
        }
        // Se tem apenas segundos
        else {
            const segundos = parseInt(partes[0]) || 0;
            
            // Converter para minutos se > 59
            if (segundos > 59) {
                const minutos = Math.floor(segundos / 60);
                const segs = segundos % 60;
                
                // Converter para horas se minutos > 59
                if (minutos > 59) {
                    const horas = Math.floor(minutos / 60);
                    const mins = minutos % 60;
                    return `${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
                }
                
                return `00:${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
            }
            
            return `00:00:${String(segundos).padStart(2, '0')}`;
        }
    }
    
    function formatarRitmoInput(valor) {
        if (!valor) return '';
        
        // Remover caracteres não numéricos, exceto ':'
        valor = valor.replace(/[^\d:]/g, '');
        
        const partes = valor.split(':');
        
        // Se já tem formato mm:ss
        if (partes.length === 2) {
            const minutos = parseInt(partes[0]) || 0;
            const segundos = parseInt(partes[1]) || 0;
            
            return `${minutos}:${String(segundos).padStart(2, '0')}`;
        }
        // Se tem apenas segundos
        else {
            const segundos = parseInt(partes[0]) || 0;
            
            // Converter para minutos se > 59
            if (segundos > 59) {
                const minutos = Math.floor(segundos / 60);
                const segs = segundos % 60;
                return `${minutos}:${String(segs).padStart(2, '0')}`;
            }
            
            return `0:${String(segundos).padStart(2, '0')}`;
        }
    }
    
    // Inicializar calculadora com valores padrão
    calcularVDOT();
});
