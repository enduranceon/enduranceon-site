// Aplicativo de Teste de FTP para Ciclismo
// Endurance On Assessoria Esportiva

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
    
    // Elementos para cálculo do FTP
    const potencia20minInput = document.getElementById('potencia-20min');
    const pesoAtletaInput = document.getElementById('peso-atleta');
    const fcMedia20minInput = document.getElementById('fc-media-20min');
    const calcularFtpBtn = document.getElementById('calcular-ftp');
    const ftpValueElement = document.getElementById('ftp-value');
    const wattsKgValueElement = document.getElementById('watts-kg-value');
    
    // Calcular FTP quando o botão é clicado
    calcularFtpBtn.addEventListener('click', () => {
        // Verificar se os valores foram inseridos
        if (!potencia20minInput.value || !pesoAtletaInput.value) {
            alert('Por favor, insira a potência de 20 minutos e o peso do atleta.');
            return;
        }
        
        // Obter valores
        const potencia20min = parseFloat(potencia20minInput.value);
        const pesoAtleta = parseFloat(pesoAtletaInput.value);
        
        // Calcular FTP (95% da potência de 20 minutos)
        const ftp = Math.round(potencia20min * 0.95);
        
        // Calcular relação watts/kg
        const wattsKg = (ftp / pesoAtleta).toFixed(2);
        
        // Atualizar elementos na página
        ftpValueElement.textContent = `${ftp} watts`;
        wattsKgValueElement.textContent = `${wattsKg} w/kg`;
    });
    
    // Formulário de registro de teste
    const formTeste = document.getElementById('form-teste');
    
    formTeste.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Verificar se o FTP foi calculado
        if (ftpValueElement.textContent === '-') {
            alert('Por favor, calcule o FTP antes de gerar o relatório.');
            return;
        }
        
        // Validar formulário
        if (!formTeste.checkValidity()) {
            formTeste.reportValidity();
            return;
        }
        
        // Preparar dados
        const alunoNome = document.getElementById('aluno-nome').value;
        const dataTeste = document.getElementById('data-teste').value;
        const pesoAtleta = parseFloat(pesoAtletaInput.value);
        const potencia20min = parseFloat(potencia20minInput.value);
        const fcMedia20min = fcMedia20minInput.value ? parseInt(fcMedia20minInput.value) : null;
        
        // Obter FTP e watts/kg
        const ftp = parseInt(ftpValueElement.textContent.replace(' watts', ''));
        const wattsKg = parseFloat(wattsKgValueElement.textContent.replace(' w/kg', ''));
        
        // Calcular zonas de potência
        const zonasPotencia = calcularZonasPotencia(ftp);
        
        // Calcular zonas de frequência cardíaca (se disponível)
        const zonasFC = fcMedia20min ? calcularZonasFC(fcMedia20min) : null;
        
        // Calcular recomendações de potência para provas
        const recomendacoesProvas = calcularRecomendacoesProvas(ftp);
        
        const testeData = {
            alunoNome: alunoNome,
            dataTeste: dataTeste,
            pesoAtleta: pesoAtleta,
            potencia20min: potencia20min,
            fcMedia20min: fcMedia20min,
            ftp: ftp,
            wattsKg: wattsKg,
            zonasPotencia: zonasPotencia,
            zonasFC: zonasFC,
            recomendacoesProvas: recomendacoesProvas,
            tipoTeste: 'ftp-ciclismo'
        };
        
        // Gerar relatório
        gerarRelatorio(testeData);
    });
    
    // Função para calcular zonas de potência
    function calcularZonasPotencia(ftp) {
        return [
            { zona: 'Z1', nome: 'Recuperação Ativa', min: Math.round(ftp * 0.40), max: Math.round(ftp * 0.55) },
            { zona: 'Z2', nome: 'Resistência', min: Math.round(ftp * 0.56), max: Math.round(ftp * 0.75) },
            { zona: 'Z3', nome: 'Tempo/Ritmo', min: Math.round(ftp * 0.76), max: Math.round(ftp * 0.90) },
            { zona: 'Z4', nome: 'Limiar', min: Math.round(ftp * 0.91), max: Math.round(ftp * 1.05) },
            { zona: 'Z5', nome: 'VO2 Max', min: Math.round(ftp * 1.06), max: Math.round(ftp * 1.20) },
            { zona: 'Z6', nome: 'Capacidade Anaeróbica', min: Math.round(ftp * 1.21), max: Math.round(ftp * 1.50) },
            { zona: 'Z7', nome: 'Potência Neuromuscular', min: Math.round(ftp * 1.51), max: Math.round(ftp * 1.80) }
        ];
    }
    
    // Função para calcular zonas de frequência cardíaca
    function calcularZonasFC(fcMedia) {
        return [
            { zona: 'Z1', nome: 'Recuperação Ativa', min: Math.round(fcMedia * 0.75), max: Math.round(fcMedia * 0.81) },
            { zona: 'Z2', nome: 'Resistência', min: Math.round(fcMedia * 0.8101), max: Math.round(fcMedia * 0.89) },
            { zona: 'Z3', nome: 'Tempo/Ritmo', min: Math.round(fcMedia * 0.8901), max: Math.round(fcMedia * 0.93) },
            { zona: 'Z4', nome: 'Limiar', min: Math.round(fcMedia * 0.9301), max: Math.round(fcMedia * 0.99) },
            { zona: 'Z5', nome: 'VO2 Max', min: Math.round(fcMedia * 0.9901), max: Math.round(fcMedia * 1.02) },
            { zona: 'Z6', nome: 'Capacidade Anaeróbica', min: Math.round(fcMedia * 1.0201), max: Math.round(fcMedia * 1.08) }
        ];
    }
    
    // Função para calcular recomendações de potência para provas
    function calcularRecomendacoesProvas(ftp) {
        return [
            { prova: 'Sprint (até 1h)', potenciaMin: Math.round(ftp * 0.88), potenciaMax: Math.round(ftp * 0.98), percentualMin: 88, percentualMax: 98 },
            { prova: 'Standard/Olímpico (1-2h)', potenciaMin: Math.round(ftp * 0.83), potenciaMax: Math.round(ftp * 0.90), percentualMin: 83, percentualMax: 90 },
            { prova: 'Half Distance (2-4h)', potenciaMin: Math.round(ftp * 0.75), potenciaMax: Math.round(ftp * 0.85), percentualMin: 75, percentualMax: 85 },
            { prova: 'Full Distance (4-8h)', potenciaMin: Math.round(ftp * 0.65), potenciaMax: Math.round(ftp * 0.75), percentualMin: 65, percentualMax: 75 }
        ];
    }
});

// Função para gerar relatório
function gerarRelatorio(data) {
    // Codificar dados para URL
    const jsonData = JSON.stringify(data);
    const encodedData = encodeURIComponent(jsonData);
    
    // Abrir relatório em nova janela
    window.open(`report-ftp.html?data=${encodedData}`, '_blank');
}
