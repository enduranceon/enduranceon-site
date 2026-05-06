document.addEventListener("DOMContentLoaded", function() {
    let modalidade = document.body.dataset.modalidade || "";

    if (!modalidade) {
        const currentPage = window.location.pathname;
        if (currentPage.includes("corrida.html")) {
            modalidade = "corrida";
        } else if (currentPage.includes("triathlon.html")) {
            modalidade = "triathlon";
        }
    }
    
    if (!modalidade) {
        console.error("MODALIDADE NÃO DETERMINADA: Verifique o atributo 'data-modalidade' no body ou o nome do arquivo HTML.");
        return;
    }

    const formIdSuffix = modalidade;
    const formCadastro = document.getElementById(`cadastro-form-${formIdSuffix}`);
    const nomeInput = document.getElementById(`nome-${formIdSuffix}`);
    const telefoneInput = document.getElementById(`whatsapp-${formIdSuffix}`);
    const planoSelect = document.getElementById(`plano-${formIdSuffix}`);
    const treinadorSelect = document.getElementById(`treinador-${formIdSuffix}`);
    const periodicidadeSelect = document.getElementById(`periodicidade-${formIdSuffix}`);
    const termosCheckbox = document.getElementById(`termos-${formIdSuffix}`);
    
    const planoSelecionadoHidden = document.getElementById(`plano_selecionado_${formIdSuffix}`);
    const periodicidadeSelecionadaHidden = document.getElementById(`periodicidade_selecionada_${formIdSuffix}`);

    if (!formCadastro || !nomeInput || !telefoneInput || !planoSelect || !treinadorSelect || !periodicidadeSelect || !termosCheckbox) {
        console.error("ERRO FORMULÁRIO: Um ou mais elementos essenciais do formulário não foram encontrados. Verifique os IDs no HTML (ex: nome-" + formIdSuffix + ", whatsapp-" + formIdSuffix + ", etc.) e se o script está sendo carregado corretamente.");
        return;
    }

    // TREINADORES DESATIVADOS: "Ian Ribeiro", "William Dutra", "Luis Fernando", "Gabriel Hermann"
    const treinadores = {
        corrida: {
            essencial: ["Bruno Jeremias", "Jéssica Rodrigues", "Thais Prando"],
            premium: ["Bruno Jeremias", "Jéssica Rodrigues", "Thais Prando", "Elinai Freitas"]
        },
        triathlon: { 
            essencial: ["Jéssica Rodrigues", "Thais Prando"],
            premium: ["Jéssica Rodrigues", "Thais Prando", "Elinai Freitas"]
        }
    };

    const tecnoFitLinks = {
        triathlon: {
            essencial: {
                mensal: "https://app.tecnofit.com.br/ng/online-sale/MjA5NjA/checkout/OTk5MTEy",
                trimestral: "https://app.tecnofit.com.br/ng/online-sale/MjA5NjA/checkout/OTk5MTE2",
                semestral: "https://app.tecnofit.com.br/ng/online-sale/MjA5NjA/checkout/OTk5MTE3"
            },
            premium: {
                mensal: "https://app.tecnofit.com.br/ng/online-sale/MjA5NjA/checkout/OTk5MTIx",
                trimestral: "https://app.tecnofit.com.br/ng/online-sale/MjA5NjA/checkout/OTk5MTIy",
                semestral: "https://app.tecnofit.com.br/ng/online-sale/MjA5NjA/checkout/OTk5MTI1"
            }
        },
        corrida: {
            essencial: {
                mensal: "https://app.tecnofit.com.br/ng/online-sale/MjA5NjA/checkout/OTk5MDkz",
                trimestral: "https://app.tecnofit.com.br/ng/online-sale/MjA5NjA/checkout/OTk5MDk3",
                semestral: "https://app.tecnofit.com.br/ng/online-sale/MjA5NjA/checkout/OTk5MTA0"
            },
            premium: {
                mensal: "https://app.tecnofit.com.br/ng/online-sale/MjA5NjA/checkout/OTk5MDk1",
                trimestral: "https://app.tecnofit.com.br/ng/online-sale/MjA5NjA/checkout/OTk5MTAw",
                semestral: "https://app.tecnofit.com.br/ng/online-sale/MjA5NjA/checkout/OTk5MTEw"
            }
        }
    };

    function atualizarTreinadores() {
        treinadorSelect.innerHTML =  `<option value="">Selecione um treinador</option>`;
        const planoSelecionadoValor = planoSelect.value;
        let tipoPlano = "";
        if (planoSelecionadoValor.toLowerCase().includes("essencial")) tipoPlano = "essencial";
        else if (planoSelecionadoValor.toLowerCase().includes("premium")) tipoPlano = "essencial";
        
        const chaveTreinadores = modalidade;

        if (chaveTreinadores && tipoPlano && treinadores[chaveTreinadores] && treinadores[chaveTreinadores][tipoPlano]) {
            const treinadoresDisponiveis = treinadores[chaveTreinadores][tipoPlano];
            treinadoresDisponiveis.forEach(treinador => {
                const option = document.createElement("option");
                option.value = treinador.toLowerCase().replace(/\s+/g, "-");
                option.textContent = treinador;
                if (tipoPlano === "premium" && treinador === "Elinai Freitas") {
                    option.classList.add("premium-exclusive");
                }
                treinadorSelect.appendChild(option);
            });
        }
    }

    function atualizarPeriodicidade() {
        periodicidadeSelect.innerHTML = `<option value="">Selecione a periodicidade</option>`;
        const periodicidades = [
            { valor: "mensal", texto: "Mensal" },
            { valor: "trimestral", texto: "Trimestral" },
            { valor: "semestral", texto: "Semestral (Melhor custo-benefício)" }
        ];
        periodicidades.forEach(p => {
            const option = document.createElement("option");
            option.value = p.valor;
            option.textContent = p.texto;
            if (p.valor === "semestral") option.classList.add("melhor-opcao");
            periodicidadeSelect.appendChild(option);
        });
    }
    
    planoSelect.addEventListener("change", function() {
        if(planoSelecionadoHidden) planoSelecionadoHidden.value = this.value;
        atualizarTreinadores(); 
    });
    
    if (periodicidadeSelect) {
        periodicidadeSelect.addEventListener("change", function() {
            if(periodicidadeSelecionadaHidden) periodicidadeSelecionadaHidden.value = this.value;
        });
    }

    atualizarPeriodicidade();
    if (planoSelect.value) {
         atualizarTreinadores();
         if(planoSelecionadoHidden) planoSelecionadoHidden.value = planoSelect.value;
    }
    if (periodicidadeSelect && periodicidadeSelect.value && periodicidadeSelecionadaHidden) {
         periodicidadeSelecionadaHidden.value = periodicidadeSelect.value;
    }

    formCadastro.addEventListener("submit", function(event) {
        event.preventDefault(); // Impedir o envio padrão do formulário

        if (!nomeInput.value.trim()) { alert("Por favor, preencha o nome completo."); return; }
        if (!telefoneInput.value.trim()) { alert("Por favor, preencha o WhatsApp."); return; }
        if (!planoSelect.value) { alert("Por favor, selecione um plano."); return; }
        if (!treinadorSelect.value) { alert("Por favor, selecione um treinador."); return; }
        if (!periodicidadeSelect.value) { alert("Por favor, selecione uma periodicidade."); return; }
        if (!termosCheckbox.checked) { alert("Por favor, aceite os termos de contrato."); return; }

        const planoSelecionadoValorOriginal = planoSelect.value;
        const tipoPlano = planoSelecionadoValorOriginal.toLowerCase()"essencial";
        const periodicidadeSelecionadaValor = periodicidadeSelect.value;
        
        // Atualiza os campos hidden para o Formspree
        if(planoSelecionadoHidden) planoSelecionadoHidden.value = planoSelecionadoValorOriginal;
        if(periodicidadeSelecionadaHidden) periodicidadeSelecionadaHidden.value = periodicidadeSelecionadaValor;
        // O campo hidden do treinador já deve estar sendo atualizado pelo HTML ou não é necessário para o Formspree se o select é enviado.

        let checkoutUrl = "#"; 
        if (tecnoFitLinks[modalidade] && 
            tecnoFitLinks[modalidade][tipoPlano] && 
            tecnoFitLinks[modalidade][tipoPlano][periodicidadeSelecionadaValor]) {
            checkoutUrl = tecnoFitLinks[modalidade][tipoPlano][periodicidadeSelecionadaValor];
        }
        
        // Enviar dados para o Formspree via Fetch API
        const formData = new FormData(formCadastro);
        fetch(formCadastro.action, {
            method: formCadastro.method,
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        }).then(response => {
            // Não precisamos esperar a resposta do Formspree para redirecionar,
            // mas podemos logar se quisermos.
            if (response.ok) {
                console.log("Formulário enviado com sucesso para Formspree.");
            } else {
                response.json().then(data => {
                    if (Object.hasOwn(data, 'errors')) {
                        console.error("Erro ao enviar para Formspree:", data["errors"].map(error => error["message"]).join(", "));
                    } else {
                        console.error("Erro desconhecido ao enviar para Formspree.");
                    }
                })
            }
        }).catch(error => {
            console.error("Erro de rede ou script ao enviar para Formspree:", error);
        });

        // Redirecionar para o Tecnofit
        if (checkoutUrl !== "#") {
            // Adiciona um pequeno delay para dar tempo ao fetch do Formspree de iniciar o envio
            setTimeout(function() {
                window.location.href = checkoutUrl;
            }, 500); // 500 milissegundos de delay
        } else {
            console.error("URL DE CHECKOUT TECNOFIT NÃO ENCONTRADA para a combinação:", modalidade, tipoPlano, periodicidadeSelecionadaValor);
            alert("Link de checkout não encontrado para a combinação selecionada. Por favor, contate o suporte.");
        }
    });
});
