// Endurance On - Link na Bio
// Script principal

document.addEventListener('DOMContentLoaded', function() {
    // Adiciona efeito de carregamento suave
    document.body.classList.add('loaded');
    
    // Adiciona efeito de hover nos cards
    const linkCards = document.querySelectorAll('.link-card');
    linkCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Adiciona efeito de hover nos itens em destaque
    const featuredItems = document.querySelectorAll('.featured-item');
    featuredItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Adiciona efeito de clique nos links
    const allLinks = document.querySelectorAll('a');
    allLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Apenas para demonstração no protótipo
            if (this.getAttribute('href') === '#') {
                e.preventDefault();
                
                // Efeito visual de clique
                this.style.opacity = '0.7';
                setTimeout(() => {
                    this.style.opacity = '1';
                }, 200);
                
                // Feedback visual
                const clickFeedback = document.createElement('div');
                clickFeedback.classList.add('click-feedback');
                clickFeedback.style.position = 'fixed';
                clickFeedback.style.top = '50%';
                clickFeedback.style.left = '50%';
                clickFeedback.style.transform = 'translate(-50%, -50%)';
                clickFeedback.style.background = 'rgba(0,0,0,0.7)';
                clickFeedback.style.color = 'white';
                clickFeedback.style.padding = '10px 20px';
                clickFeedback.style.borderRadius = '5px';
                clickFeedback.style.zIndex = '1000';
                clickFeedback.textContent = 'Link será implementado na versão final';
                
                document.body.appendChild(clickFeedback);
                
                setTimeout(() => {
                    clickFeedback.style.opacity = '0';
                    setTimeout(() => {
                        document.body.removeChild(clickFeedback);
                    }, 300);
                }, 1500);
            }
        });
    });
});
