document.addEventListener('DOMContentLoaded', function() {
    // Variáveis
    const header = document.getElementById('header');
    const mobileMenuIcon = document.querySelector('.mobile-menu-icon');
    const mobileNav = document.querySelector('.mobile-nav');
    const closeMenu = document.querySelector('.close-menu');
    const faqItems = document.querySelectorAll('.faq-item');
    const depoimentoSlides = document.querySelectorAll('.depoimento-slide');
    const prevButton = document.querySelector('.depoimento-prev');
    const nextButton = document.querySelector('.depoimento-next');
    const dots = document.querySelectorAll('.depoimento-dot');
    const modalidadeCards = document.querySelectorAll('.modalidade-card');
    const steps = document.querySelectorAll('.step');
    const planoCards = document.querySelectorAll('.plano-card');
    const formulario = document.querySelector('.formulario'); // Pode não existir em todas as páginas
    const contatoItems = document.querySelectorAll('.contato-item');
    
    let currentSlide = 0;
    
    // Header fixo com mudança de estilo ao rolar
    if (header) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }
    
    // Menu mobile
    if (mobileMenuIcon && mobileNav) {
        mobileMenuIcon.addEventListener('click', function() {
            mobileNav.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    }
    
    if (closeMenu && mobileNav) {
        closeMenu.addEventListener('click', function() {
            mobileNav.classList.remove('active');
            document.body.style.overflow = 'auto';
        });
    }
    
    // Fechar menu ao clicar em um link
    if (mobileNav) {
        document.querySelectorAll('.mobile-nav a').forEach(link => {
            link.addEventListener('click', function() {
                mobileNav.classList.remove('active');
                document.body.style.overflow = 'auto';
            });
        });
    }
    
    // FAQ Accordion
    if (faqItems.length > 0) {
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            if (question) {
                question.addEventListener('click', function() {
                    faqItems.forEach(otherItem => {
                        if (otherItem !== item && otherItem.classList.contains('active')) {
                            otherItem.classList.remove('active');
                            const otherIcon = otherItem.querySelector('.faq-icon i');
                            if (otherIcon) otherIcon.className = 'fas fa-plus';
                        }
                    });
                    item.classList.toggle('active');
                    const icon = item.querySelector('.faq-icon i');
                    if (icon) {
                        if (item.classList.contains('active')) {
                            icon.className = 'fas fa-minus';
                        } else {
                            icon.className = 'fas fa-plus';
                        }
                    }
                });
            }
        });
    }
    
    // Slider de depoimentos moderno
    function showSlide(n) {
        if (depoimentoSlides.length === 0) return;
        
        // Remover classe active de todos os slides
        depoimentoSlides.forEach(slide => {
            slide.classList.remove('active');
        });
        
        // Remover classe active de todos os dots
        if (dots.length > 0) {
            dots.forEach(dot => {
                dot.classList.remove('active');
            });
        }
        
        // Garantir que o índice esteja dentro dos limites
        currentSlide = (n + depoimentoSlides.length) % depoimentoSlides.length;
        
        // Adicionar classe active ao slide atual
        if (depoimentoSlides[currentSlide]) {
            depoimentoSlides[currentSlide].classList.add('active');
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
    }
    
    // Animação de scroll suave para links internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            try {
                const targetElement = document.querySelector(targetId);
                if (targetElement && header) {
                    const headerHeight = header.offsetHeight;
                    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                } else if (targetElement) { // Fallback if header is not present
                     const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
                     window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            } catch (error) {
                console.warn('Error scrolling to anchor:', targetId, error);
                 // Attempt to scroll even if querySelector on its own fails for some complex selectors (less likely for ID)
                const directTarget = document.getElementById(targetId.substring(1));
                if (directTarget && header) {
                    const headerHeight = header.offsetHeight;
                    const targetPosition = directTarget.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                } else if (directTarget) {
                     const targetPosition = directTarget.getBoundingClientRect().top + window.pageYOffset;
                     window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // Animação de elementos ao rolar a página
    const animateElements = document.querySelectorAll('.section');
    
    function checkScroll() {
        const triggerBottom = window.innerHeight * 0.8;
        animateElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            if (elementTop < triggerBottom) {
                element.classList.add('fade-in');
                if (element.id === 'modalidades' && modalidadeCards.length > 0) {
                    modalidadeCards.forEach(card => card.classList.add('animated'));
                }
                if (element.id === 'como-funciona' && steps.length > 0) {
                    steps.forEach(step => step.classList.add('animated'));
                }
                if (element.id === 'planos' && planoCards.length > 0) {
                    planoCards.forEach(card => card.classList.add('animated'));
                }
                if (element.id === 'cadastro' && formulario) {
                    formulario.classList.add('animated');
                }
                if (element.id === 'contato' && contatoItems.length > 0) {
                    contatoItems.forEach(item => item.classList.add('animated'));
                }
            }
        });
    }
    
    if (animateElements.length > 0) {
        checkScroll();
        window.addEventListener('scroll', checkScroll);
    }
    
    // Formulário de cadastro
    const form = document.getElementById('form-cadastro');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const termosCheckbox = document.getElementById('termos');
            if (termosCheckbox && !termosCheckbox.checked) {
                alert('Você precisa aceitar os termos de contrato para continuar.');
                return;
            }
            const nomeInput = document.getElementById('nome');
            const telefoneInput = document.getElementById('telefone');
            const planoSelectInput = document.getElementById('plano');
            
            const nome = nomeInput ? nomeInput.value : '';
            const telefone = telefoneInput ? telefoneInput.value : '';
            const planoSelecionado = planoSelectInput ? planoSelectInput.value : '';
            
            let checkoutUrl = '#';
            switch(planoSelecionado) {
                case 'essencial-mensal': checkoutUrl = 'https://checkout.exemplo.com/essencial-mensal'; break;
                case 'essencial-trimestral': checkoutUrl = 'https://checkout.exemplo.com/essencial-trimestral'; break;
                case 'essencial-semestral': checkoutUrl = 'https://checkout.exemplo.com/essencial-semestral'; break;
                case 'premium-mensal': checkoutUrl = 'https://checkout.exemplo.com/premium-mensal'; break;
                case 'premium-trimestral': checkoutUrl = 'https://checkout.exemplo.com/premium-trimestral'; break;
                case 'premium-semestral': checkoutUrl = 'https://checkout.exemplo.com/premium-semestral'; break;
                default: checkoutUrl = 'https://checkout.exemplo.com/default';
            }
            console.log(`Enviando dados para o email: Nome: ${nome}, WhatsApp: ${telefone}, Plano: ${planoSelecionado}`);
            // window.location.href = checkoutUrl; 
            alert(`Formulário enviado com sucesso! Em breve entraremos em contato.\nNome: ${nome}\nWhatsApp: ${telefone}\nPlano: ${planoSelecionado}`);
            form.reset();
        });
    }
    
    // Botões de contratar nos cards de planos
    const contratarButtons = document.querySelectorAll('.contratar-button');
    if (contratarButtons.length > 0 && header) {
        contratarButtons.forEach(button => {
            const href = button.getAttribute('href');
            if (href && href.startsWith('#')) {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    const cadastroSection = document.getElementById('cadastro');
                    if (cadastroSection) {
                        const headerHeight = header.offsetHeight;
                        const cadastroPosition = cadastroSection.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                        window.scrollTo({
                            top: cadastroPosition,
                            behavior: 'smooth'
                        });
                        const planoSelect = document.getElementById('plano');
                        const planoCard = button.closest('.plano-card');
                        if (planoSelect && planoCard) {
                            const planoTitleElement = planoCard.querySelector('h4');
                            if (planoTitleElement) {
                                const planoTitle = planoTitleElement.textContent;
                                const planoSectionTitleElement = planoCard.closest('.plano-section')?.querySelector('.plano-title');
                                if (planoSectionTitleElement) {
                                    const planoSectionTitle = planoSectionTitleElement.textContent;
                                    if (planoTitle.includes('mensal')) {
                                        planoSelect.value = planoSectionTitle.includes('ESSENCIAL') ? 'essencial-mensal' : 'premium-mensal';
                                    } else if (planoTitle.includes('trimestral')) {
                                        planoSelect.value = planoSectionTitle.includes('ESSENCIAL') ? 'essencial-trimestral' : 'premium-trimestral';
                                    } else if (planoTitle.includes('semestral')) {
                                        planoSelect.value = planoSectionTitle.includes('ESSENCIAL') ? 'essencial-semestral' : 'premium-semestral';
                                    }
                                }
                            }
                        }
                    }
                });
            }
        });
    }
});

    // ===== FILTRO REGIONAL TREINOS COLETIVOS =====
    const filtroButtons = document.querySelectorAll('.filtro-btn');
    const calendarioFlorianopolis = document.getElementById('calendario-florianopolis');
    const calendarioSaoPaulo = document.getElementById('calendario-sao-paulo');
    
    if (filtroButtons.length > 0) {
        filtroButtons.forEach(button => {
            button.addEventListener('click', function() {
                const regiao = this.getAttribute('data-regiao');
                
                // Remover classe active de todos os botões
                filtroButtons.forEach(btn => btn.classList.remove('active'));
                
                // Adicionar classe active ao botão clicado
                this.classList.add('active');
                
                // Mostrar/ocultar calendários com animação
                if (regiao === 'florianopolis') {
                    if (calendarioSaoPaulo) {
                        calendarioSaoPaulo.style.display = 'none';
                    }
                    if (calendarioFlorianopolis) {
                        calendarioFlorianopolis.style.display = 'grid';
                        calendarioFlorianopolis.classList.add('fade-in');
                    }
                } else if (regiao === 'sao-paulo') {
                    if (calendarioFlorianopolis) {
                        calendarioFlorianopolis.style.display = 'none';
                    }
                    if (calendarioSaoPaulo) {
                        calendarioSaoPaulo.style.display = 'grid';
                        calendarioSaoPaulo.classList.add('fade-in');
                    }
                }
                
                // Analytics tracking
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'filtro_treinos_coletivos', {
                        'event_category': 'Treinos Coletivos',
                        'event_label': regiao,
                        'value': 1
                    });
                }
                
                console.log(`[TREINOS COLETIVOS] Filtro alterado para: ${regiao}`);
            });
        });
    }

