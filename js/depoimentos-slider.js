document.addEventListener('DOMContentLoaded', function() {
    // Variáveis para o slider de depoimentos
    const depoimentoSlides = document.querySelectorAll('.depoimento-slide');
    const prevButton = document.querySelector('.depoimento-prev');
    const nextButton = document.querySelector('.depoimento-next');
    const dots = document.querySelectorAll('.depoimento-dot');
    
    let currentSlide = 0;
    
    // Função para mostrar um slide específico
    function showSlide(n) {
        if (depoimentoSlides.length === 0) return;
        
        // Remover classe active de todos os slides
        depoimentoSlides.forEach(slide => {
            slide.classList.remove('active');
            slide.style.opacity = '0';
            slide.style.transform = 'translateX(100%)';
            slide.style.zIndex = '0';
        });
        
        // Remover classe active de todos os dots
        if (dots.length > 0) {
            dots.forEach(dot => {
                dot.classList.remove('active');
            });
        }
        
        // Garantir que o índice esteja dentro dos limites
        currentSlide = (n + depoimentoSlides.length) % depoimentoSlides.length;
        
        // Adicionar classe active ao slide atual com animação
        if (depoimentoSlides[currentSlide]) {
            depoimentoSlides[currentSlide].classList.add('active');
            depoimentoSlides[currentSlide].style.opacity = '1';
            depoimentoSlides[currentSlide].style.transform = 'translateX(0)';
            depoimentoSlides[currentSlide].style.zIndex = '1';
        }
        
        // Adicionar classe active ao dot atual
        if (dots.length > 0 && dots[currentSlide]) {
            dots[currentSlide].classList.add('active');
        }
    }
    
    // Inicializar o slider se houver depoimentos
    if (depoimentoSlides.length > 0) {
        // Mostrar o primeiro slide
        showSlide(0);
        
        // Configurar autoplay
        let slideInterval = setInterval(() => {
            showSlide(currentSlide + 1);
        }, 5000);
        
        // Botões de navegação
        if (prevButton) {
            prevButton.addEventListener('click', () => {
                clearInterval(slideInterval);
                showSlide(currentSlide - 1);
                slideInterval = setInterval(() => {
                    showSlide(currentSlide + 1);
                }, 5000);
            });
        }
        
        if (nextButton) {
            nextButton.addEventListener('click', () => {
                clearInterval(slideInterval);
                showSlide(currentSlide + 1);
                slideInterval = setInterval(() => {
                    showSlide(currentSlide + 1);
                }, 5000);
            });
        }
        
        // Dots de navegação
        if (dots.length > 0) {
            dots.forEach((dot, index) => {
                dot.addEventListener('click', () => {
                    clearInterval(slideInterval);
                    showSlide(index);
                    slideInterval = setInterval(() => {
                        showSlide(currentSlide + 1);
                    }, 5000);
                });
            });
        }
        
        // Pausar autoplay quando o mouse estiver sobre o slider
        const sliderContainer = document.querySelector('.depoimentos-slider');
        if (sliderContainer) {
            sliderContainer.addEventListener('mouseenter', () => {
                clearInterval(slideInterval);
            });
            
            sliderContainer.addEventListener('mouseleave', () => {
                slideInterval = setInterval(() => {
                    showSlide(currentSlide + 1);
                }, 5000);
            });
        }
    }
});
