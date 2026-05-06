// Calculadora de Tempo, Pace e Distância - Campos Únicos

document.addEventListener('DOMContentLoaded', function() {
    setupTempoCalculator();
    setupPaceCalculator();
    setupDistanciaCalculator();
});

// Funções auxiliares para conversão
function parseTimeToSeconds(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    if (parts.length === 2) {
        // Formato mm:ss
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else if (parts.length === 3) {
        // Formato hh:mm:ss
        return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    }
    return 0;
}

function parsePaceToSeconds(paceStr) {
    if (!paceStr) return 0;
    const parts = paceStr.split(':');
    if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
}

function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.round(totalSeconds % 60);
    
    if (hours > 0) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

function formatPace(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.round(totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// ===== CALCULADORA DE TEMPO =====
function setupTempoCalculator() {
    const distanciaInput = document.getElementById('tempo-distancia');
    const paceInput = document.getElementById('tempo-pace');
    const resultadoElement = document.getElementById('resultado-tempo');
    const card = document.getElementById('card-tempo');
    
    [distanciaInput, paceInput].forEach(input => {
        input.addEventListener('input', () => calcularTempo(card));
    });
}

function calcularTempo(card) {
    const distancia = parseFloat(document.getElementById('tempo-distancia').value) || 0;
    const paceStr = document.getElementById('tempo-pace').value;
    const resultadoElement = document.getElementById('resultado-tempo');
    
    if (distancia > 0 && paceStr) {
        const paceSegundos = parsePaceToSeconds(paceStr);
        
        if (paceSegundos > 0) {
            const tempoTotalSegundos = distancia * paceSegundos;
            const tempoFormatado = formatTime(tempoTotalSegundos);
            
            resultadoElement.textContent = tempoFormatado;
            
            // Efeitos visuais
            card.classList.add('calculating');
            document.querySelector('.tempo-result').classList.add('updated');
            
            setTimeout(() => {
                card.classList.remove('calculating');
                document.querySelector('.tempo-result').classList.remove('updated');
            }, 600);
        }
    } else {
        resultadoElement.textContent = '--:--:--';
    }
}

// ===== CALCULADORA DE PACE =====
function setupPaceCalculator() {
    const distanciaInput = document.getElementById('pace-distancia');
    const tempoInput = document.getElementById('pace-tempo');
    const resultadoElement = document.getElementById('resultado-pace');
    const card = document.getElementById('card-pace');
    
    [distanciaInput, tempoInput].forEach(input => {
        input.addEventListener('input', () => calcularPace(card));
    });
}

function calcularPace(card) {
    const distancia = parseFloat(document.getElementById('pace-distancia').value) || 0;
    const tempoStr = document.getElementById('pace-tempo').value;
    const resultadoElement = document.getElementById('resultado-pace');
    
    if (distancia > 0 && tempoStr) {
        const tempoSegundos = parseTimeToSeconds(tempoStr);
        
        if (tempoSegundos > 0) {
            const paceSegundos = tempoSegundos / distancia;
            const paceFormatado = formatPace(paceSegundos);
            
            resultadoElement.textContent = paceFormatado + '/km';
            
            // Efeitos visuais
            card.classList.add('calculating');
            document.querySelector('.pace-result').classList.add('updated');
            
            setTimeout(() => {
                card.classList.remove('calculating');
                document.querySelector('.pace-result').classList.remove('updated');
            }, 600);
        }
    } else {
        resultadoElement.textContent = '--:--/km';
    }
}

// ===== CALCULADORA DE DISTÂNCIA =====
function setupDistanciaCalculator() {
    const tempoInput = document.getElementById('dist-tempo');
    const paceInput = document.getElementById('dist-pace');
    const resultadoElement = document.getElementById('resultado-distancia');
    const card = document.getElementById('card-distancia');
    
    [tempoInput, paceInput].forEach(input => {
        input.addEventListener('input', () => calcularDistancia(card));
    });
}

function calcularDistancia(card) {
    const tempoStr = document.getElementById('dist-tempo').value;
    const paceStr = document.getElementById('dist-pace').value;
    const resultadoElement = document.getElementById('resultado-distancia');
    
    if (tempoStr && paceStr) {
        const tempoSegundos = parseTimeToSeconds(tempoStr);
        const paceSegundos = parsePaceToSeconds(paceStr);
        
        if (tempoSegundos > 0 && paceSegundos > 0) {
            const distancia = tempoSegundos / paceSegundos;
            const distanciaFormatada = distancia.toFixed(2);
            
            resultadoElement.textContent = distanciaFormatada + ' km';
            
            // Efeitos visuais
            card.classList.add('calculating');
            document.querySelector('.distancia-result').classList.add('updated');
            
            setTimeout(() => {
                card.classList.remove('calculating');
                document.querySelector('.distancia-result').classList.remove('updated');
            }, 600);
        }
    } else {
        resultadoElement.textContent = '-- km';
    }
}

