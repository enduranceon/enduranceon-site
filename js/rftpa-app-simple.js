// Aplicativo de Teste rFTPa Simplificado - Endurance On
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
    
    // Elementos para cálculo do rFTPa
    const pace3minInput = document.getElementById('pace-3min');
    const pace9minInput = document.getElementById('pace-9min');
    const calcularRftpaBtn = document.getElementById('calcular-rftpa');
    const paceMediaElement = document.getElementById('pace-medio');
    const rftpaValueElement = document.getElementById('rftpa-value');
    const nivelAtletaElement = document.getElementById('nivel-atleta');
    
    // Função para converter pace (min:seg) para segundos totais
    function paceParaSegundos(paceStr) {
        const [min, seg] = paceStr.split(':').map(num => parseInt(num));
        return min * 60 + seg;
    }
    
    // Função para converter segundos totais para pace (min:seg)
    function segundosParaPace(segundos) {
        const min = Math.floor(segundos / 60);
        const seg = Math.round(segundos % 60);
        return `${min}:${seg.toString().padStart(2, '0')}`;
    }
    
    // Calcular rFTPa quando o botão é clicado
    calcularRftpaBtn.addEventListener('click', () => {
        // Verificar se os paces foram inseridos
        if (!pace3minInput.value || !pace9minInput.value) {
            alert('Por favor, insira o pace para ambos os intervalos.');
            return;
        }
        
        // Converter paces para segundos
        const pace3minSegundos = paceParaSegundos(pace3minInput.value);
        const pace9minSegundos = paceParaSegundos(pace9minInput.value);
        
        // Calcular média dos paces em segundos
        const paceMediaSegundos = (pace3minSegundos + pace9minSegundos) / 2;
        
        // Adicionar 10% à média
        const rftpaSegundos = paceMediaSegundos * 1.1;
        
        // Converter de volta para formato min:seg
        const paceMediaStr = segundosParaPace(paceMediaSegundos);
        const rftpaStr = segundosParaPace(rftpaSegundos);
        
        // Atualizar elementos na página
        paceMediaElement.textContent = `${paceMediaStr} min/km`;
        rftpaValueElement.textContent = `${rftpaStr} min/km`;
        
        // Determinar nível do atleta
        // N1: rFTPa >= 4:31 min/km (271 segundos)
        // N2: rFTPa <= 4:30 min/km (270 segundos)
        const nivel = rftpaSegundos >= 271 ? 'N1' : 'N2';
        nivelAtletaElement.textContent = nivel;
        
        // Destacar o nível com cor
        nivelAtletaElement.style.fontWeight = 'bold';
        nivelAtletaElement.style.color = nivel === 'N1' ? '#38B6FF' : '#FF8012';
    });
    
    // Formulário de registro de teste
    const formTeste = document.getElementById('form-teste');
    
    formTeste.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Verificar se o rFTPa foi calculado
        if (rftpaValueElement.textContent === '-') {
            alert('Por favor, calcule o rFTPa antes de gerar o relatório.');
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
        
        const pace3min = pace3minInput.value;
        const pace9min = pace9minInput.value;
        const paceMedia = paceMediaElement.textContent.replace(' min/km', '');
        const rftpaValue = rftpaValueElement.textContent.replace(' min/km', '');
        const nivelAtleta = nivelAtletaElement.textContent;
        
        const testeData = {
            alunoNome: alunoNome,
            dataTeste: dataTeste,
            pace3min: pace3min,
            pace9min: pace9min,
            paceMedia: paceMedia,
            rftpa: rftpaValue,
            nivel: nivelAtleta,
            tipoTeste: 'rftpa'
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
    window.open(`report-rftpa.html?data=${encodedData}`, '_blank');
}
