// Calculadoras Esportivas - Funcionalidades para versão compacta
document.addEventListener('DOMContentLoaded', function() {
    // Elementos da navegação entre calculadoras
    const calcNavBtns = document.querySelectorAll('.calc-nav-btn');
    const calculadoraCards = document.querySelectorAll('.calculadora-card');
    
    // Elementos da calculadora de pace
    const distanciaInput = document.getElementById('distancia');
    const unidadeDistancia = document.getElementById('unidade-distancia');
    const tempoHoras = document.getElementById('tempo-horas');
    const tempoMinutos = document.getElementById('tempo-minutos');
    const tempoSegundos = document.getElementById('tempo-segundos');
    const paceMinutos = document.getElementById('pace-minutos');
    const paceSegundos = document.getElementById('pace-segundos');
    const paceUnidade = document.querySelector('.pace-unidade');
    
    // Elementos de resultado
    const resultadoPace = document.getElementById('resultado-pace');
    const resultadoTempo = document.getElementById('resultado-tempo');
    const resultadoVelocidade = document.getElementById('resultado-velocidade');
    
    // Variáveis de estado
    let ultimoCampoEditado = null;
    let calculando = false;
    
    // Navegação entre calculadoras
    calcNavBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const calcTipo = this.dataset.calc;
            
            // Atualizar botões de navegação
            calcNavBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Mostrar calculadora correspondente
            calculadoraCards.forEach(card => {
                card.classList.remove('active');
                if (card.id === `calculadora-${calcTipo}`) {
                    card.classList.add('active');
                }
            });
        });
    });
    
    // Funções de conversão
    function converterParaKm(valor, unidade) {
        if (unidade === 'km') return valor;
        if (unidade === 'mi') return valor * 1.60934;
        if (unidade === 'm') return valor / 1000;
        return valor;
    }
    
    function converterDeKm(valor, unidade) {
        if (unidade === 'km') return valor;
        if (unidade === 'mi') return valor / 1.60934;
        if (unidade === 'm') return valor * 1000;
        return valor;
    }
    
    function segundosParaHMS(totalSegundos) {
        const horas = Math.floor(totalSegundos / 3600);
        const minutos = Math.floor((totalSegundos % 3600) / 60);
        const segundos = Math.floor(totalSegundos % 60);
        
        return {
            horas,
            minutos,
            segundos
        };
    }
    
    function formatarTempo(horas, minutos, segundos) {
        return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
    }
    
    function formatarPace(minutos, segundos, unidade = 'km') {
        return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')} min/${unidade}`;
    }
    
    // Função principal de cálculo
    function calcular() {
        if (calculando) return;
        calculando = true;
        
        try {
            const distancia = parseFloat(distanciaInput.value) || 0;
            const unidade = unidadeDistancia.value;
            const distanciaKm = converterParaKm(distancia, unidade);
            
            const horas = parseInt(tempoHoras.value) || 0;
            const minutos = parseInt(tempoMinutos.value) || 0;
            const segundos = parseInt(tempoSegundos.value) || 0;
            const tempoTotalSegundos = horas * 3600 + minutos * 60 + segundos;
            
            const paceMin = parseInt(paceMinutos.value) || 0;
            const paceSec = parseInt(paceSegundos.value) || 0;
            const paceTotalSegundos = paceMin * 60 + paceSec;
            
            // Cálculos baseados no último campo editado
            if (ultimoCampoEditado === 'distancia') {
                if (tempoTotalSegundos > 0) {
                    // Calcular pace baseado em distância e tempo
                    const paceSegundosPorKm = tempoTotalSegundos / distanciaKm;
                    const paceObj = segundosParaHMS(paceSegundosPorKm);
                    
                    if (!isNaN(paceObj.minutos)) {
                        paceMinutos.value = paceObj.minutos;
                        paceSegundos.value = paceObj.segundos;
                        
                        // Atualizar resultados
                        resultadoPace.textContent = formatarPace(paceObj.minutos, paceObj.segundos, unidade === 'mi' ? 'mi' : 'km');
                        resultadoTempo.textContent = formatarTempo(horas, minutos, segundos);
                        resultadoVelocidade.textContent = (distanciaKm / (tempoTotalSegundos / 3600)).toFixed(2) + ' km/h';
                    }
                } else if (paceTotalSegundos > 0) {
                    // Calcular tempo baseado em distância e pace
                    const tempoTotal = distanciaKm * paceTotalSegundos;
                    const tempoObj = segundosParaHMS(tempoTotal);
                    
                    tempoHoras.value = tempoObj.horas;
                    tempoMinutos.value = tempoObj.minutos;
                    tempoSegundos.value = tempoObj.segundos;
                    
                    // Atualizar resultados
                    resultadoPace.textContent = formatarPace(paceMin, paceSec, unidade === 'mi' ? 'mi' : 'km');
                    resultadoTempo.textContent = formatarTempo(tempoObj.horas, tempoObj.minutos, tempoObj.segundos);
                    resultadoVelocidade.textContent = (60 / paceTotalSegundos * 60).toFixed(2) + ' km/h';
                }
            } else if (ultimoCampoEditado === 'tempo') {
                if (distancia > 0) {
                    // Calcular pace baseado em distância e tempo
                    const paceSegundosPorKm = tempoTotalSegundos / distanciaKm;
                    const paceObj = segundosParaHMS(paceSegundosPorKm);
                    
                    paceMinutos.value = paceObj.minutos;
                    paceSegundos.value = paceObj.segundos;
                    
                    // Atualizar resultados
                    resultadoPace.textContent = formatarPace(paceObj.minutos, paceObj.segundos, unidade === 'mi' ? 'mi' : 'km');
                    resultadoTempo.textContent = formatarTempo(horas, minutos, segundos);
                    resultadoVelocidade.textContent = (distanciaKm / (tempoTotalSegundos / 3600)).toFixed(2) + ' km/h';
                } else if (paceTotalSegundos > 0) {
                    // Calcular distância baseado em tempo e pace
                    const distanciaCalculada = tempoTotalSegundos / paceTotalSegundos;
                    const distanciaConvertida = converterDeKm(distanciaCalculada, unidade);
                    
                    distanciaInput.value = distanciaConvertida.toFixed(2);
                    
                    // Atualizar resultados
                    resultadoPace.textContent = formatarPace(paceMin, paceSec, unidade === 'mi' ? 'mi' : 'km');
                    resultadoTempo.textContent = formatarTempo(horas, minutos, segundos);
                    resultadoVelocidade.textContent = (distanciaCalculada / (tempoTotalSegundos / 3600)).toFixed(2) + ' km/h';
                }
            } else if (ultimoCampoEditado === 'pace') {
                if (distancia > 0) {
                    // Calcular tempo baseado em distância e pace
                    const tempoTotal = distanciaKm * paceTotalSegundos;
                    const tempoObj = segundosParaHMS(tempoTotal);
                    
                    tempoHoras.value = tempoObj.horas;
                    tempoMinutos.value = tempoObj.minutos;
                    tempoSegundos.value = tempoObj.segundos;
                    
                    // Atualizar resultados
                    resultadoPace.textContent = formatarPace(paceMin, paceSec, unidade === 'mi' ? 'mi' : 'km');
                    resultadoTempo.textContent = formatarTempo(tempoObj.horas, tempoObj.minutos, tempoObj.segundos);
                    resultadoVelocidade.textContent = (60 / paceTotalSegundos * 60).toFixed(2) + ' km/h';
                } else if (tempoTotalSegundos > 0) {
                    // Calcular distância baseado em tempo e pace
                    const distanciaCalculada = tempoTotalSegundos / paceTotalSegundos;
                    const distanciaConvertida = converterDeKm(distanciaCalculada, unidade);
                    
                    distanciaInput.value = distanciaConvertida.toFixed(2);
                    
                    // Atualizar resultados
                    resultadoPace.textContent = formatarPace(paceMin, paceSec, unidade === 'mi' ? 'mi' : 'km');
                    resultadoTempo.textContent = formatarTempo(horas, minutos, segundos);
                    resultadoVelocidade.textContent = (distanciaCalculada / (tempoTotalSegundos / 3600)).toFixed(2) + ' km/h';
                }
            } else if (ultimoCampoEditado === 'unidade') {
                // Recalcular tudo quando a unidade muda
                if (distancia > 0 && tempoTotalSegundos > 0) {
                    // Recalcular pace
                    const paceSegundosPorKm = tempoTotalSegundos / distanciaKm;
                    const paceObj = segundosParaHMS(paceSegundosPorKm);
                    
                    paceMinutos.value = paceObj.minutos;
                    paceSegundos.value = paceObj.segundos;
                    
                    // Atualizar resultados
                    resultadoPace.textContent = formatarPace(paceObj.minutos, paceObj.segundos, unidade === 'mi' ? 'mi' : 'km');
                    resultadoTempo.textContent = formatarTempo(horas, minutos, segundos);
                    resultadoVelocidade.textContent = (distanciaKm / (tempoTotalSegundos / 3600)).toFixed(2) + ' km/h';
                } else if (distancia > 0 && paceTotalSegundos > 0) {
                    // Recalcular tempo
                    const tempoTotal = distanciaKm * paceTotalSegundos;
                    const tempoObj = segundosParaHMS(tempoTotal);
                    
                    tempoHoras.value = tempoObj.horas;
                    tempoMinutos.value = tempoObj.minutos;
                    tempoSegundos.value = tempoObj.segundos;
                    
                    // Atualizar resultados
                    resultadoPace.textContent = formatarPace(paceMin, paceSec, unidade === 'mi' ? 'mi' : 'km');
                    resultadoTempo.textContent = formatarTempo(tempoObj.horas, tempoObj.minutos, tempoObj.segundos);
                    resultadoVelocidade.textContent = (60 / paceTotalSegundos * 60).toFixed(2) + ' km/h';
                }
                
                // Atualizar unidade no texto do pace
                paceUnidade.textContent = unidade === 'mi' ? 'min/mi' : 'min/km';
            }
        } catch (error) {
            console.error('Erro no cálculo:', error);
        }
        
        calculando = false;
    }
    
    // Event listeners para campos de entrada
    distanciaInput.addEventListener('input', function() {
        ultimoCampoEditado = 'distancia';
        calcular();
    });
    
    unidadeDistancia.addEventListener('change', function() {
        ultimoCampoEditado = 'unidade';
        calcular();
    });
    
    [tempoHoras, tempoMinutos, tempoSegundos].forEach(input => {
        input.addEventListener('input', function() {
            ultimoCampoEditado = 'tempo';
            calcular();
        });
    });
    
    [paceMinutos, paceSegundos].forEach(input => {
        input.addEventListener('input', function() {
            ultimoCampoEditado = 'pace';
            calcular();
        });
    });
    
    // Validação de entrada para limitar valores
    tempoMinutos.addEventListener('blur', function() {
        if (this.value > 59) this.value = 59;
    });
    
    tempoSegundos.addEventListener('blur', function() {
        if (this.value > 59) this.value = 59;
    });
    
    paceSegundos.addEventListener('blur', function() {
        if (this.value > 59) this.value = 59;
    });
});
