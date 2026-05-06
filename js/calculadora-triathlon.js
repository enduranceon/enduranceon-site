// Calculadora de Triathlon - Endurance On
// Versão com Distâncias Personalizadas

// Configurações de distâncias predefinidas
const distancePresets = {
    sprint: { swim: 0.75, bike: 20, run: 5 },
    standard: { swim: 1.5, bike: 40, run: 10 },
    half: { swim: 1.9, bike: 90, run: 21 },
    full: { swim: 3.8, bike: 180, run: 42 }
};

// Estado atual da calculadora
let currentDistances = { ...distancePresets.sprint };
let isCustomMode = false;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeDistanceTabs();
    initializeInputListeners();
    updateDistanceDisplays();
});

// Inicializar tabs de distância
function initializeDistanceTabs() {
    const tabs = document.querySelectorAll('.distance-tab');
    const customDistances = document.getElementById('custom-distances');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active de todas as tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Adiciona active na tab clicada
            this.classList.add('active');
            
            const distance = this.dataset.distance;
            
            if (distance === 'custom') {
                // Modo personalizado
                isCustomMode = true;
                customDistances.style.display = 'block';
                // Usar valores dos campos personalizados se preenchidos
                updateCustomDistances();
            } else {
                // Modo preset
                isCustomMode = false;
                customDistances.style.display = 'none';
                currentDistances = { ...distancePresets[distance] };
                updateDistanceDisplays();
            }
            
            // Recalcular com as novas distâncias
            calculateAll();
        });
    });
    
    // Listeners para campos personalizados
    const customInputs = ['custom-swim', 'custom-bike', 'custom-run', 'custom-swim-unit'];
    customInputs.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('input', updateCustomDistances);
        }
    });
}

// Atualizar distâncias personalizadas
function updateCustomDistances() {
    if (!isCustomMode) return;
    
    const swimValue = parseFloat(document.getElementById('custom-swim').value) || 0;
    const swimUnit = document.getElementById('custom-swim-unit').value;
    const bikeValue = parseFloat(document.getElementById('custom-bike').value) || 0;
    const runValue = parseFloat(document.getElementById('custom-run').value) || 0;
    
    // Converter natação para km se necessário
    const swimKm = swimUnit === 'm' ? swimValue / 1000 : swimValue;
    
    currentDistances = {
        swim: swimKm,
        bike: bikeValue,
        run: runValue
    };
    
    updateDistanceDisplays();
    calculateAll();
}

// Atualizar displays de distância
function updateDistanceDisplays() {
    const swimDisplay = document.getElementById('swim-distance');
    const bikeDisplay = document.getElementById('bike-distance');
    const runDisplay = document.getElementById('run-distance');
    
    if (swimDisplay) {
        const swimText = currentDistances.swim < 1 ? 
            `${Math.round(currentDistances.swim * 1000)}m` : 
            `${currentDistances.swim}km`;
        swimDisplay.textContent = swimText;
    }
    
    if (bikeDisplay) {
        bikeDisplay.textContent = `${currentDistances.bike}km`;
    }
    
    if (runDisplay) {
        runDisplay.textContent = `${currentDistances.run}km`;
    }
}

// Inicializar listeners dos inputs
function initializeInputListeners() {
    // Inputs de tempo
    const timeInputs = ['swim-time', 'bike-time', 'run-time', 't1-time', 't2-time'];
    timeInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function() {
                calculateFromTime(id);
            });
        }
    });
    
    // Inputs de pace/velocidade
    const paceInputs = ['swim-pace', 'bike-speed', 'run-pace'];
    paceInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function() {
                calculateFromPace(id);
            });
        }
    });
}

// Calcular a partir do tempo
function calculateFromTime(inputId) {
    const timeValue = document.getElementById(inputId).value;
    if (!timeValue) return;
    
    const timeInMinutes = parseTimeToMinutes(timeValue);
    if (timeInMinutes <= 0) return;
    
    switch(inputId) {
        case 'swim-time':
            if (currentDistances.swim > 0) {
                const pacePerKm = timeInMinutes / currentDistances.swim;
                const pacePer100m = pacePerKm / 10;
                document.getElementById('swim-pace').value = formatTime(pacePer100m);
            }
            break;
            
        case 'bike-time':
            if (currentDistances.bike > 0) {
                const speed = (currentDistances.bike / timeInMinutes) * 60;
                document.getElementById('bike-speed').value = speed.toFixed(1);
            }
            break;
            
        case 'run-time':
            if (currentDistances.run > 0) {
                const pace = timeInMinutes / currentDistances.run;
                document.getElementById('run-pace').value = formatTime(pace);
            }
            break;
    }
    
    calculateTotal();
}

// Calcular a partir do pace/velocidade
function calculateFromPace(inputId) {
    const value = document.getElementById(inputId).value;
    if (!value) return;
    
    switch(inputId) {
        case 'swim-pace':
            const paceMinutes = parseTimeToMinutes(value);
            if (paceMinutes > 0 && currentDistances.swim > 0) {
                const totalTime = (paceMinutes * 10) * currentDistances.swim;
                document.getElementById('swim-time').value = formatTime(totalTime);
            }
            break;
            
        case 'bike-speed':
            const speed = parseFloat(value);
            if (speed > 0 && currentDistances.bike > 0) {
                const totalTime = (currentDistances.bike / speed) * 60;
                document.getElementById('bike-time').value = formatTime(totalTime);
            }
            break;
            
        case 'run-pace':
            const runPace = parseTimeToMinutes(value);
            if (runPace > 0 && currentDistances.run > 0) {
                const totalTime = runPace * currentDistances.run;
                document.getElementById('run-time').value = formatTime(totalTime);
            }
            break;
    }
    
    calculateTotal();
}

// Calcular todos os valores
function calculateAll() {
    // Recalcular baseado nos valores existentes
    const inputs = ['swim-time', 'swim-pace', 'bike-time', 'bike-speed', 'run-time', 'run-pace'];
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input && input.value) {
            if (id.includes('time')) {
                calculateFromTime(id);
            } else {
                calculateFromPace(id);
            }
        }
    });
    
    calculateTotal();
}

// Calcular tempo total
function calculateTotal() {
    const swimTime = parseTimeToMinutes(document.getElementById('swim-time').value) || 0;
    const bikeTime = parseTimeToMinutes(document.getElementById('bike-time').value) || 0;
    const runTime = parseTimeToMinutes(document.getElementById('run-time').value) || 0;
    const t1Time = parseTimeToMinutes(document.getElementById('t1-time').value) || 0;
    const t2Time = parseTimeToMinutes(document.getElementById('t2-time').value) || 0;
    
    const totalMinutes = swimTime + t1Time + bikeTime + t2Time + runTime;
    
    // Atualizar display total
    const totalDisplay = document.getElementById('total-time');
    if (totalDisplay) {
        totalDisplay.textContent = totalMinutes > 0 ? formatTimeHMS(totalMinutes) : '--:--:--';
    }
    
    // Atualizar breakdown
    updateBreakdown(swimTime, t1Time, bikeTime, t2Time, runTime);
    
    // Animação de atualização
    const resultDisplay = document.querySelector('.result-display');
    if (resultDisplay) {
        resultDisplay.classList.add('updated');
        setTimeout(() => resultDisplay.classList.remove('updated'), 600);
    }
}

// Atualizar breakdown
function updateBreakdown(swim, t1, bike, t2, run) {
    const breakdownElements = {
        'breakdown-swim': swim,
        'breakdown-t1': t1,
        'breakdown-bike': bike,
        'breakdown-t2': t2,
        'breakdown-run': run
    };
    
    Object.entries(breakdownElements).forEach(([id, time]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = time > 0 ? formatTime(time) : '--:--';
        }
    });
}

// Converter tempo string para minutos
function parseTimeToMinutes(timeStr) {
    if (!timeStr) return 0;
    
    const parts = timeStr.split(':');
    if (parts.length === 2) {
        return parseInt(parts[0]) + parseInt(parts[1]) / 60;
    } else if (parts.length === 3) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]) + parseInt(parts[2]) / 60;
    }
    
    return 0;
}

// Formatar minutos para tempo MM:SS
function formatTime(minutes) {
    if (minutes <= 0) return '';
    
    const mins = Math.floor(minutes);
    const secs = Math.round((minutes - mins) * 60);
    
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Formatar minutos para tempo HH:MM:SS
function formatTimeHMS(minutes) {
    if (minutes <= 0) return '--:--:--';
    
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    const secs = Math.round((minutes % 1) * 60);
    
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

