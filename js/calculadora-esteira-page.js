// Calculadora de Esteira - Página Separada

// Configurações da calculadora
const MIN_PACE = 2.83; // 2:50/km em minutos
const MAX_PACE = 8.0;   // 8:00/km em minutos
const MIN_SPEED = 7.5;  // km/h correspondente a 8:00/km
const MAX_SPEED = 21.2; // km/h correspondente a 2:50/km

let isDragging = false;

// Inicializar a calculadora quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    initCalculadora();
    setupEventListeners();
});

function initCalculadora() {
    // Definir valores iniciais
    const initialPace = 5.0; // 5:00/km
    const initialSpeed = 60 / initialPace; // 12 km/h
    
    updateDisplays(initialPace, initialSpeed);
    updateSliderPosition(initialPace);
}

function setupEventListeners() {
    const sliderHandle = document.getElementById('slider-handle');
    const sliderTrack = document.querySelector('.slider-track');
    const paceEdit = document.getElementById('pace-edit');
    const speedEdit = document.getElementById('speed-edit');
    
    // Event listeners para o slider
    sliderHandle.addEventListener('mousedown', startDrag);
    sliderTrack.addEventListener('click', handleTrackClick);
    
    // Event listeners para os campos editáveis
    paceEdit.addEventListener('input', handlePaceInput);
    paceEdit.addEventListener('blur', handlePaceBlur);
    speedEdit.addEventListener('input', handleSpeedInput);
    speedEdit.addEventListener('blur', handleSpeedBlur);
    
    // Event listeners globais para drag
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    
    // Touch events para mobile
    sliderHandle.addEventListener('touchstart', startDragTouch);
    document.addEventListener('touchmove', dragTouch);
    document.addEventListener('touchend', stopDrag);
}

function startDrag(e) {
    isDragging = true;
    e.preventDefault();
}

function startDragTouch(e) {
    isDragging = true;
    e.preventDefault();
}

function drag(e) {
    if (!isDragging) return;
    
    const sliderTrack = document.querySelector('.slider-track');
    const rect = sliderTrack.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    
    updateFromSlider(percentage);
}

function dragTouch(e) {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const sliderTrack = document.querySelector('.slider-track');
    const rect = sliderTrack.getBoundingClientRect();
    const x = Math.max(0, Math.min(touch.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    
    updateFromSlider(percentage);
}

function stopDrag() {
    isDragging = false;
}

function handleTrackClick(e) {
    if (isDragging) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    
    updateFromSlider(percentage);
}

function updateFromSlider(percentage) {
    // Converter percentage para pace (invertido porque pace menor = velocidade maior)
    const pace = MAX_PACE - (percentage * (MAX_PACE - MIN_PACE));
    const speed = 60 / pace;
    
    updateDisplays(pace, speed);
    updateSliderPosition(pace);
}

function updateDisplays(pace, speed) {
    const paceInput = document.getElementById('pace-input');
    const speedInput = document.getElementById('speed-input');
    
    // Formatar pace como min:seg/km
    const paceFormatted = formatPace(pace);
    const speedFormatted = speed.toFixed(1);
    
    paceInput.value = paceFormatted;
    speedInput.value = `${speedFormatted} km/h`;
}

function updateSliderPosition(pace) {
    const sliderHandle = document.getElementById('slider-handle');
    const sliderTrack = document.querySelector('.slider-track');
    
    // Calcular posição (invertido porque pace menor = posição mais à direita)
    const percentage = (MAX_PACE - pace) / (MAX_PACE - MIN_PACE);
    const trackWidth = sliderTrack.offsetWidth;
    const handleWidth = sliderHandle.offsetWidth;
    const position = (percentage * (trackWidth - handleWidth));
    
    sliderHandle.style.left = `${position}px`;
}

function formatPace(paceMinutes) {
    const minutes = Math.floor(paceMinutes);
    const seconds = Math.round((paceMinutes - minutes) * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
}

function parsePace(paceString) {
    // Remover "/km" se presente
    paceString = paceString.replace('/km', '').trim();
    
    // Verificar formato min:seg
    const match = paceString.match(/^(\d+):(\d+)$/);
    if (match) {
        const minutes = parseInt(match[1]);
        const seconds = parseInt(match[2]);
        return minutes + (seconds / 60);
    }
    
    // Tentar como número decimal
    const decimal = parseFloat(paceString);
    if (!isNaN(decimal)) {
        return decimal;
    }
    
    return null;
}

function handlePaceInput(e) {
    const value = e.target.value;
    const pace = parsePace(value);
    
    if (pace && pace >= MIN_PACE && pace <= MAX_PACE) {
        const speed = 60 / pace;
        updateDisplays(pace, speed);
        updateSliderPosition(pace);
        
        // Atualizar campo de velocidade
        document.getElementById('speed-edit').value = speed.toFixed(1);
    }
}

function handlePaceBlur(e) {
    const value = e.target.value;
    const pace = parsePace(value);
    
    if (!pace || pace < MIN_PACE || pace > MAX_PACE) {
        // Restaurar valor válido
        const currentPace = getCurrentPaceFromDisplay();
        e.target.value = formatPace(currentPace).replace('/km', '');
    }
}

function handleSpeedInput(e) {
    const speed = parseFloat(e.target.value);
    
    if (speed && speed >= MIN_SPEED && speed <= MAX_SPEED) {
        const pace = 60 / speed;
        updateDisplays(pace, speed);
        updateSliderPosition(pace);
        
        // Atualizar campo de pace
        document.getElementById('pace-edit').value = formatPace(pace).replace('/km', '');
    }
}

function handleSpeedBlur(e) {
    const speed = parseFloat(e.target.value);
    
    if (!speed || speed < MIN_SPEED || speed > MAX_SPEED) {
        // Restaurar valor válido
        const currentSpeed = getCurrentSpeedFromDisplay();
        e.target.value = currentSpeed.toFixed(1);
    }
}

function getCurrentPaceFromDisplay() {
    const paceInput = document.getElementById('pace-input');
    const paceString = paceInput.value;
    return parsePace(paceString) || 5.0;
}

function getCurrentSpeedFromDisplay() {
    const speedInput = document.getElementById('speed-input');
    const speedString = speedInput.value.replace(' km/h', '');
    return parseFloat(speedString) || 12.0;
}

// Função para validar entrada de pace em tempo real
function validatePaceInput(input) {
    // Permitir apenas números, dois pontos e ponto
    input.value = input.value.replace(/[^0-9:.]/g, '');
    
    // Limitar formato a X:XX
    const parts = input.value.split(':');
    if (parts.length > 2) {
        input.value = parts[0] + ':' + parts[1];
    }
    if (parts[1] && parts[1].length > 2) {
        input.value = parts[0] + ':' + parts[1].substring(0, 2);
    }
}

// Adicionar validação em tempo real
document.addEventListener('DOMContentLoaded', function() {
    const paceEdit = document.getElementById('pace-edit');
    if (paceEdit) {
        paceEdit.addEventListener('input', function() {
            validatePaceInput(this);
        });
    }
});

