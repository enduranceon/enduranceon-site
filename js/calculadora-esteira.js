// Calculadora de Esteira - Conversão Pace/Velocidade

// Variáveis globais
let isDragging = false;
let sliderHandle = null;
let sliderTrack = null;

// Faixas de valores (pace de 8:00 a 2:50)
const MIN_PACE_SECONDS = 170; // 2:50 em segundos
const MAX_PACE_SECONDS = 480; // 8:00 em segundos

// Inicialização quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    initializeCalculator();
});

function initializeCalculator() {
    sliderHandle = document.getElementById('slider-handle');
    sliderTrack = document.querySelector('.slider-track');
    
    if (sliderHandle && sliderTrack) {
        setupSliderEvents();
        setupInputEvents();
        
        // Definir posição inicial (pace 5:00)
        const initialPaceSeconds = 300; // 5:00
        updateFromPaceSeconds(initialPaceSeconds);
    }
}

function setupSliderEvents() {
    // Mouse events
    sliderHandle.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
    
    // Touch events para mobile
    sliderHandle.addEventListener('touchstart', startDrag);
    document.addEventListener('touchmove', drag);
    document.addEventListener('touchend', endDrag);
    
    // Click no track
    sliderTrack.addEventListener('click', handleTrackClick);
}

function setupInputEvents() {
    const paceEdit = document.getElementById('pace-edit');
    const speedEdit = document.getElementById('speed-edit');
    
    if (paceEdit) {
        paceEdit.addEventListener('input', handlePaceInput);
        paceEdit.addEventListener('blur', handlePaceBlur);
    }
    
    if (speedEdit) {
        speedEdit.addEventListener('input', handleSpeedInput);
        speedEdit.addEventListener('blur', handleSpeedBlur);
    }
}

function startDrag(e) {
    isDragging = true;
    e.preventDefault();
}

function drag(e) {
    if (!isDragging) return;
    
    e.preventDefault();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    
    if (clientX) {
        updateSliderPosition(clientX);
    }
}

function endDrag() {
    isDragging = false;
}

function handleTrackClick(e) {
    if (e.target === sliderHandle) return;
    updateSliderPosition(e.clientX);
}

function updateSliderPosition(clientX) {
    const rect = sliderTrack.getBoundingClientRect();
    const trackWidth = rect.width;
    const handleWidth = sliderHandle.offsetWidth;
    
    let position = clientX - rect.left - (handleWidth / 2);
    position = Math.max(0, Math.min(position, trackWidth - handleWidth));
    
    const percentage = position / (trackWidth - handleWidth);
    
    // Converter porcentagem para pace em segundos (invertido: 0% = pace mais rápido)
    const paceSeconds = MIN_PACE_SECONDS + (percentage * (MAX_PACE_SECONDS - MIN_PACE_SECONDS));
    
    updateFromPaceSeconds(paceSeconds);
}

function updateFromPaceSeconds(paceSeconds) {
    // Limitar aos valores mínimo e máximo
    paceSeconds = Math.max(MIN_PACE_SECONDS, Math.min(MAX_PACE_SECONDS, paceSeconds));
    
    // Calcular velocidade em km/h
    const speedKmh = 3600 / paceSeconds;
    
    // Atualizar displays
    updateDisplays(paceSeconds, speedKmh);
    
    // Atualizar posição do slider
    updateSliderHandlePosition(paceSeconds);
    
    // Atualizar campos editáveis
    updateEditableFields(paceSeconds, speedKmh);
}

function updateFromSpeed(speedKmh) {
    // Limitar velocidade
    speedKmh = Math.max(6, Math.min(21.4, speedKmh));
    
    // Calcular pace em segundos
    const paceSeconds = 3600 / speedKmh;
    
    updateFromPaceSeconds(paceSeconds);
}

function updateDisplays(paceSeconds, speedKmh) {
    const paceInput = document.getElementById('pace-input');
    const speedInput = document.getElementById('speed-input');
    
    if (paceInput) {
        paceInput.value = formatPace(paceSeconds) + '/km';
    }
    
    if (speedInput) {
        speedInput.value = speedKmh.toFixed(1) + ' km/h';
    }
}

function updateSliderHandlePosition(paceSeconds) {
    const percentage = (paceSeconds - MIN_PACE_SECONDS) / (MAX_PACE_SECONDS - MIN_PACE_SECONDS);
    const trackWidth = sliderTrack.offsetWidth;
    const handleWidth = sliderHandle.offsetWidth;
    const position = percentage * (trackWidth - handleWidth);
    
    sliderHandle.style.left = position + 'px';
}

function updateEditableFields(paceSeconds, speedKmh) {
    const paceEdit = document.getElementById('pace-edit');
    const speedEdit = document.getElementById('speed-edit');
    
    if (paceEdit && document.activeElement !== paceEdit) {
        paceEdit.value = formatPace(paceSeconds);
    }
    
    if (speedEdit && document.activeElement !== speedEdit) {
        speedEdit.value = speedKmh.toFixed(1);
    }
}

function formatPace(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return minutes + ':' + (secs < 10 ? '0' : '') + secs;
}

function parsePace(paceStr) {
    const parts = paceStr.split(':');
    if (parts.length === 2) {
        const minutes = parseInt(parts[0]);
        const seconds = parseInt(parts[1]);
        if (!isNaN(minutes) && !isNaN(seconds)) {
            return minutes * 60 + seconds;
        }
    }
    return null;
}

function handlePaceInput(e) {
    const paceStr = e.target.value;
    const paceSeconds = parsePace(paceStr);
    
    if (paceSeconds && paceSeconds >= MIN_PACE_SECONDS && paceSeconds <= MAX_PACE_SECONDS) {
        updateFromPaceSeconds(paceSeconds);
    }
}

function handlePaceBlur(e) {
    const paceStr = e.target.value;
    const paceSeconds = parsePace(paceStr);
    
    if (!paceSeconds || paceSeconds < MIN_PACE_SECONDS || paceSeconds > MAX_PACE_SECONDS) {
        // Restaurar valor válido
        const currentPaceSeconds = getCurrentPaceSeconds();
        e.target.value = formatPace(currentPaceSeconds);
    }
}

function handleSpeedInput(e) {
    const speed = parseFloat(e.target.value);
    
    if (!isNaN(speed) && speed >= 6 && speed <= 21.4) {
        updateFromSpeed(speed);
    }
}

function handleSpeedBlur(e) {
    const speed = parseFloat(e.target.value);
    
    if (isNaN(speed) || speed < 6 || speed > 21.4) {
        // Restaurar valor válido
        const currentSpeed = getCurrentSpeed();
        e.target.value = currentSpeed.toFixed(1);
    }
}

function getCurrentPaceSeconds() {
    const paceInput = document.getElementById('pace-input');
    if (paceInput) {
        const paceStr = paceInput.value.replace('/km', '');
        return parsePace(paceStr) || 300;
    }
    return 300;
}

function getCurrentSpeed() {
    const speedInput = document.getElementById('speed-input');
    if (speedInput) {
        const speedStr = speedInput.value.replace(' km/h', '');
        return parseFloat(speedStr) || 12;
    }
    return 12;
}

// Funções para abrir e fechar o modal
function abrirCalculadoraEsteira() {
    const modal = document.getElementById('modal-calculadora-esteira');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Reinicializar a calculadora
        setTimeout(() => {
            initializeCalculator();
        }, 100);
    }
}

function fecharCalculadoraEsteira() {
    const modal = document.getElementById('modal-calculadora-esteira');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Fechar modal ao clicar fora
document.addEventListener('click', function(e) {
    const modal = document.getElementById('modal-calculadora-esteira');
    if (e.target === modal) {
        fecharCalculadoraEsteira();
    }
});

// Fechar modal com ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        fecharCalculadoraEsteira();
    }
});

