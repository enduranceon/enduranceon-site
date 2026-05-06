document.addEventListener("DOMContentLoaded", function() {
    console.log("[FORM UNIFICADO DIAGNÓSTICO] Script carregado e DOM pronto.");

    const form = document.getElementById("unified-form");
    if (!form) {
        console.error("[ERRO FORM UNIFICADO DIAGNÓSTICO] Formulário #unified-form não encontrado.");
        return;
    }

    const nomeInput = document.getElementById("nome-completo");
    const whatsappInput = document.getElementById("whatsapp");
    const modalidadeSelect = document.getElementById("modalidade");
    const planoSelect = document.getElementById("plano");
    const periodicidadeSelect = document.getElementById("periodicidade");
    const treinadorSelect = document.getElementById("treinador");
    const termosCheckbox = document.getElementById("termos");

    if (!nomeInput || !whatsappInput || !modalidadeSelect || !planoSelect || !periodicidadeSelect || !treinadorSelect || !termosCheckbox) {
        console.error("[ERRO FORM UNIFICADO DIAGNÓSTICO] Um ou mais elementos essenciais do formulário não foram encontrados. Verifique os IDs no HTML.");
        return;
    }
    console.log("[FORM UNIFICADO DIAGNÓSTICO] Todos os elementos do formulário foram encontrados.");

    function obterParametroUrl(nome) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(nome);
    }

    const modalidadeUrl = obterParametroUrl("modalidade");
    const planoUrl = obterParametroUrl("plano");
    const periodicidadeUrl = obterParametroUrl("periodicidade");

    if (modalidadeUrl) {
        modalidadeSelect.value = modalidadeUrl;
        console.log(`[FORM UNIFICADO DIAGNÓSTICO] Modalidade pré-selecionada pela URL: ${modalidadeUrl}`);
    }
    if (planoUrl) {
        planoSelect.value = planoUrl;
        console.log(`[FORM UNIFICADO DIAGNÓSTICO] Plano pré-selecionado pela URL: ${planoUrl}`);
    }
    if (periodicidadeUrl) {
        periodicidadeSelect.value = periodicidadeUrl;
        console.log(`[FORM UNIFICADO DIAGNÓSTICO] Periodicidade pré-selecionada pela URL: ${periodicidadeUrl}`);
    }

    const treinadores = {
        corrida: {
            essencial: ["Ian Ribeiro", "Bruno Jeremias", "William Dutra", "Jéssica Rodrigues", "Luis Fernando", "Gabriel Hermann", "Thais Prando"],
            premium: ["Ian Ribeiro", "Bruno Jeremias", "William Dutra", "Jéssica Rodrigues", "Luis Fernando", "Gabriel Hermann", "Thais Prando", "Elinai Freitas", "Guto Fernandes"]
        },
        triathlon: {
            essencial: ["Ian Ribeiro", "William Dutra", "Jéssica Rodrigues", "Luis Fernando", "Gabriel Hermann", "Thais Prando"],
            premium: ["Ian Ribeiro", "William Dutra", "Jéssica Rodrigues", "Luis Fernando", "Gabriel Hermann", "Thais Prando", "Elinai Freitas", "Guto Fernandes"]
        }
    };

    const tecnoFitLinks = {
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
        },
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
        }
    };
    console.log("[FORM UNIFICADO DIAGNÓSTICO] Links Tecnofit definidos.");

    function atualizarTreinadores() {
        treinadorSelect.innerHTML = `<option value="">Selecione o Treinador</option>`;
        const modalidade = modalidadeSelect.value;
        const plano = planoSelect.value;
        if (modalidade && plano && treinadores[modalidade] && treinadores[modalidade][plano]) {
            treinadores[modalidade][plano].forEach(treinador => {
                const option = document.createElement("option");
                option.value = treinador.toLowerCase().replace(/\s+/g, "-");
                option.textContent = treinador;
                treinadorSelect.appendChild(option);
            });
        }
    }

    if (modalidadeSelect.value && planoSelect.value) {
        atualizarTreinadores();
    }

    modalidadeSelect.addEventListener("change", atualizarTreinadores);
    planoSelect.addEventListener("change", atualizarTreinadores);

    form.addEventListener("submit", function(event) {
        event.preventDefault();
        event.stopPropagation();
        console.log("[FORM UNIFICADO DIAGNÓSTICO] Evento de submit disparado e prevenido.");

        if (!nomeInput.value.trim()) { alert("Por favor, preencha o nome completo."); return false; }
        if (!whatsappInput.value.trim()) { alert("Por favor, preencha o WhatsApp."); return false; }
        if (!modalidadeSelect.value) { alert("Por favor, selecione uma modalidade."); return false; }
        if (!planoSelect.value) { alert("Por favor, selecione um plano."); return false; }
        if (!periodicidadeSelect.value) { alert("Por favor, selecione uma periodicidade."); return false; }
        if (!treinadorSelect.value) { alert("Por favor, selecione um treinador."); return false; }
        if (!termosCheckbox.checked) { alert("Por favor, aceite os termos de contrato."); return false; }
        console.log("[FORM UNIFICADO DIAGNÓSTICO] Validações passaram.");

        const modalidade = modalidadeSelect.value;
        const plano = planoSelect.value;
        const periodicidade = periodicidadeSelect.value;
        let checkoutUrl = "#";

        if (tecnoFitLinks[modalidade] && tecnoFitLinks[modalidade][plano] && tecnoFitLinks[modalidade][plano][periodicidade]) {
            checkoutUrl = tecnoFitLinks[modalidade][plano][periodicidade];
            console.log(`[FORM UNIFICADO DIAGNÓSTICO] URL Tecnofit encontrada: ${checkoutUrl}`);
        } else {
            console.error(`[ERRO FORM UNIFICADO DIAGNÓSTICO] URL Tecnofit NÃO encontrada para: Modalidade=\'${modalidade}\', Plano=\'${plano}\', Periodicidade=\'${periodicidade}\'.`);
            alert("Erro: Link de checkout não encontrado. Verifique as seleções ou contate o suporte.");
            return false;
        }

        console.log("[FORM UNIFICADO DIAGNÓSTICO] Teste concluído. Nenhuma ação de envio ou abertura de aba será realizada.");
        
        return false; // Reforça a prevenção do comportamento padrão.
    });

    console.log("[FORM UNIFICADO DIAGNÓSTICO] Script totalmente inicializado.");
});

