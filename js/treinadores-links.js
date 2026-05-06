// Função para renderizar os nomes dos treinadores como links clicáveis
function renderizarTreinadoresComoLinks(modalidade, plano) {
    const treinadores = dadosPlanos[modalidade][plano].treinadores;
    
    let html = '<div class="treinadores-lista">';
    
    treinadores.forEach(treinador => {
        // Converter nome do treinador para formato de arquivo (minúsculas, sem acentos, com hífen)
        const nomeArquivo = treinador.nome.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove acentos
            .replace(/\s+/g, '-'); // Substitui espaços por hífens
            
        html += `<a href="../pages/treinadores/${nomeArquivo}.html" target="_blank" class="treinador-badge">${treinador.nome}</a>`;
    });
    
    html += '</div>';
    
    return html;
}
