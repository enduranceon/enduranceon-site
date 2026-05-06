// Calculadora de Tempo, Pace e Distância

// Funções para abrir e fechar o modal
function abrirCalculadoraTempo() {
    const modal = document.getElementById('modal-calculadora-tempo');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

function fecharCalculadoraTempo() {
    const modal = document.getElementById('modal-calculadora-tempo');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Limpar todos os campos
function limparCalculadoraTempo() {
    // Limpar campos de tempo
    document.getElementById('tempo-horas').value = '';
    document.getElementById('tempo-minutos').value = '';
    document.getElementById('tempo-segundos').value = '';
    
    // Limpar campos de pace
    document.getElementById('pace-minutos').value = '';
    document.getElementById('pace-segundos-input').value = '';
    
    // Limpar campo de distância
    document.getElementById('distancia-input').value = '';
    
    // Esconder resultado
    document.getElementById('resultado-calculo').style.display = 'none';
}

// Função principal de cálculo
function calcularValores() {
    // Obter valores dos campos
    const tempoHoras = parseFloat(document.getElementById('tempo-horas').value) || 0;
    const tempoMinutos = parseFloat(document.getElementById('tempo-minutos').value) || 0;
    const tempoSegundos = parseFloat(document.getElementById('tempo-segundos').value) || 0;
    
    const paceMinutos = parseFloat(document.getElementById('pace-minutos').value) || 0;
    const paceSegundosInput = parseFloat(document.getElementById('pace-segundos-input').value) || 0;
    
    const distancia = parseFloat(document.getElementById('distancia-input').value) || 0;
    
    // Converter tempo total para segundos
    const tempoTotalSegundos = (tempoHoras * 3600) + (tempoMinutos * 60) + tempoSegundos;
    
    // Converter pace para segundos por km
    const paceSegundosPorKm = (paceMinutos * 60) + paceSegundosInput;
    
    // Contar quantos valores foram preenchidos
    const tempoPreenchido = tempoTotalSegundos > 0;
    const pacePreenchido = paceSegundosPorKm > 0;
    const distanciaPreenchida = distancia > 0;
    
    const valoresPreenchidos = [tempoPreenchido, pacePreenchido, distanciaPreenchida].filter(Boolean).length;
    
    if (valoresPreenchidos < 2) {
        mostrarErro('Preencha pelo menos 2 campos para calcular o terceiro.');
        return;
    }
    
    if (valoresPreenchidos === 3) {
        // Verificar se os valores são consistentes
        const tempoCalculado = distancia * paceSegundosPorKm;
        const diferenca = Math.abs(tempoTotalSegundos - tempoCalculado);
        
        if (diferenca > 5) { // Tolerância de 5 segundos
            mostrarErro('Os valores informados não são consistentes entre si. Verifique os dados.');
            return;
        } else {
            mostrarResultado('Todos os valores estão corretos e consistentes!');
            return;
        }
    }
    
    // Calcular o valor faltante
    let resultado = '';
    
    if (!tempoPreenchido && pacePreenchido && distanciaPreenchida) {
        // Calcular tempo
        const tempoCalculadoSegundos = distancia * paceSegundosPorKm;
        const tempoFormatado = formatarTempo(tempoCalculadoSegundos);
        resultado = `Tempo necessário: <strong>${tempoFormatado}</strong>`;
        
        // Preencher campos de tempo
        const horas = Math.floor(tempoCalculadoSegundos / 3600);
        const minutos = Math.floor((tempoCalculadoSegundos % 3600) / 60);
        const segundos = Math.round(tempoCalculadoSegundos % 60);
        
        document.getElementById('tempo-horas').value = horas;
        document.getElementById('tempo-minutos').value = minutos;
        document.getElementById('tempo-segundos').value = segundos;
        
    } else if (tempoPreenchido && !pacePreenchido && distanciaPreenchida) {
        // Calcular pace
        const paceCalculadoSegundos = tempoTotalSegundos / distancia;
        const paceFormatado = formatarPace(paceCalculadoSegundos);
        resultado = `Pace necessário: <strong>${paceFormatado}</strong>`;
        
        // Preencher campos de pace
        const minutos = Math.floor(paceCalculadoSegundos / 60);
        const segundos = Math.round(paceCalculadoSegundos % 60);
        
        document.getElementById('pace-minutos').value = minutos;
        document.getElementById('pace-segundos-input').value = segundos;
        
    } else if (tempoPreenchido && pacePreenchido && !distanciaPreenchida) {
        // Calcular distância
        const distanciaCalculada = tempoTotalSegundos / paceSegundosPorKm;
        resultado = `Distância percorrida: <strong>${distanciaCalculada.toFixed(2)} km</strong>`;
        
        // Preencher campo de distância
        document.getElementById('distancia-input').value = distanciaCalculada.toFixed(2);
    }
    
    mostrarResultado(resultado);
}

// Formatar tempo em horas, minutos e segundos
function formatarTempo(segundosTotais) {
    const horas = Math.floor(segundosTotais / 3600);
    const minutos = Math.floor((segundosTotais % 3600) / 60);
    const segundos = Math.round(segundosTotais % 60);
    
    let resultado = '';
    
    if (horas > 0) {
        resultado += `${horas}h `;
    }
    
    if (minutos > 0 || horas > 0) {
        resultado += `${minutos}min `;
    }
    
    resultado += `${segundos}seg`;
    
    return resultado.trim();
}

// Formatar pace em min:seg/km
function formatarPace(segundosPorKm) {
    const minutos = Math.floor(segundosPorKm / 60);
    const segundos = Math.round(segundosPorKm % 60);
    
    return `${minutos}:${segundos.toString().padStart(2, '0')}/km`;
}

// Mostrar resultado
function mostrarResultado(texto) {
    const resultadoContainer = document.getElementById('resultado-calculo');
    const resultadoTexto = document.getElementById('resultado-texto');
    
    resultadoTexto.innerHTML = texto;
    resultadoContainer.style.display = 'block';
    
    // Scroll suave para o resultado
    resultadoContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Mostrar erro
function mostrarErro(texto) {
    const resultadoContainer = document.getElementById('resultado-calculo');
    const resultadoTexto = document.getElementById('resultado-texto');
    const resultadoBox = document.querySelector('.resultado-box');
    
    // Temporariamente mudar a cor para erro
    resultadoBox.style.background = '#dc3545';
    resultadoTexto.innerHTML = `⚠️ ${texto}`;
    resultadoContainer.style.display = 'block';
    
    // Restaurar cor original após 3 segundos
    setTimeout(() => {
        resultadoBox.style.background = 'linear-gradient(135deg, #FF6B35, #2E86AB)';
    }, 3000);
    
    // Scroll suave para o resultado
    resultadoContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Event listeners para fechar modal
document.addEventListener('click', function(e) {
    const modal = document.getElementById('modal-calculadora-tempo');
    if (e.target === modal) {
        fecharCalculadoraTempo();
    }
});

document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        fecharCalculadoraTempo();
    }
});

// Event listeners para calcular automaticamente quando o usuário digita
document.addEventListener('DOMContentLoaded', function() {
    const inputs = [
        'tempo-horas', 'tempo-minutos', 'tempo-segundos',
        'pace-minutos', 'pace-segundos-input', 'distancia-input'
    ];
    
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', function() {
                // Pequeno delay para evitar cálculos excessivos
                clearTimeout(this.calcTimeout);
                this.calcTimeout = setTimeout(() => {
                    // Verificar se há pelo menos 2 campos preenchidos
                    const valoresPreenchidos = contarValoresPreenchidos();
                    if (valoresPreenchidos >= 2) {
                        calcularValores();
                    }
                }, 500);
            });
        }
    });
});

// Função auxiliar para contar valores preenchidos
function contarValoresPreenchidos() {
    const tempoHoras = parseFloat(document.getElementById('tempo-horas').value) || 0;
    const tempoMinutos = parseFloat(document.getElementById('tempo-minutos').value) || 0;
    const tempoSegundos = parseFloat(document.getElementById('tempo-segundos').value) || 0;
    
    const paceMinutos = parseFloat(document.getElementById('pace-minutos').value) || 0;
    const paceSegundosInput = parseFloat(document.getElementById('pace-segundos-input').value) || 0;
    
    const distancia = parseFloat(document.getElementById('distancia-input').value) || 0;
    
    const tempoTotalSegundos = (tempoHoras * 3600) + (tempoMinutos * 60) + tempoSegundos;
    const paceSegundosPorKm = (paceMinutos * 60) + paceSegundosInput;
    
    const tempoPreenchido = tempoTotalSegundos > 0;
    const pacePreenchido = paceSegundosPorKm > 0;
    const distanciaPreenchida = distancia > 0;
    
    return [tempoPreenchido, pacePreenchido, distanciaPreenchida].filter(Boolean).length;
}

