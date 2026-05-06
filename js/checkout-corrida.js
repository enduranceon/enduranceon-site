document.addEventListener("DOMContentLoaded", function() {
    const modalidade = "corrida";
    console.log(`[DEBUG ${modalidade.toUpperCase()}] Script carregado e DOM pronto.`);

    const formCadastro = document.getElementById(`cadastro-form-${modalidade}`);
    const nomeInput = document.getElementById(`nome-${modalidade}`);
    const telefoneInput = document.getElementById(`whatsapp-${modalidade}`);
    const planoSelect = document.getElementById(`plano-${modalidade}`);
    const treinadorSelect = document.getElementById(`treinador-${modalidade}`);
    const periodicidadeSelect = document.getElementById(`periodicidade-${modalidade}`);
    const termosCheckbox = document.getElementById(`termos-${modalidade}`);

    if (!formCadastro || !nomeInput || !telefoneInput || !planoSelect || !treinadorSelect || !periodicidadeSelect || !termosCheckbox) {
        console.error(`[ERRO FORMULÁRIO ${modalidade.toUpperCase()}] Um ou mais elementos essenciais do formulário não foram encontrados. Verifique os IDs no HTML (ex: nome-${modalidade}, whatsapp-${modalidade}, etc.) e se o script checkout-${modalidade}.js está sendo carregado corretamente.`);
        return;
    }
    console.log(`[DEBUG ${modalidade.toUpperCase()}] Todos os elementos do formulário foram encontrados.`);

    const treinadoresCorrida = {
        // TREINADORES DESATIVADOS: "Ian Ribeiro", "William Dutra", "Luis Fernando", "Gabriel Hermann"
        // Guto Fernandes agora está disponível em Essencial e Premium
        essencial: ["Bruno Jeremias", "Jéssica Rodrigues", "Thais Prando", "Guto Fernandes"],
        premium: ["Bruno Jeremias", "Jéssica Rodrigues", "Thais Prando", "Elinai Freitas", "Guto Fernandes"]
    };

    const tecnoFitLinksCorrida = {
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
    };
    console.log(`[DEBUG ${modalidade.toUpperCase()}] Links Tecnofit definidos:`, JSON.stringify(tecnoFitLinksCorrida));

    function atualizarTreinadores() {
        treinadorSelect.innerHTML =  `<option value="">Selecione um treinador</option>`;
        const planoSelecionadoValor = planoSelect.value;
        let tipoPlano = "";
        if (planoSelecionadoValor.toLowerCase().includes("essencial")) tipoPlano = "essencial";
        else if (planoSelecionadoValor.toLowerCase().includes("premium")) tipoPlano = "premium";
        
        console.log(`[DEBUG ${modalidade.toUpperCase()}] Atualizando treinadores para plano: ${planoSelecionadoValor}, tipoPlano derivado: ${tipoPlano}`);

        if (tipoPlano && treinadoresCorrida[tipoPlano]) {
            const treinadoresDisponiveis = treinadoresCorrida[tipoPlano];
            treinadoresDisponiveis.forEach(treinador => {
                const option = document.createElement("option");
                option.value = treinador.toLowerCase().replace(/\s+/g, "-");
                option.textContent = treinador;
                if (tipoPlano === "premium" && (treinador === "Elinai Freitas" || treinador === "Guto Fernandes")) {
                    option.classList.add("premium-exclusive");
                }
                treinadorSelect.appendChild(option);
            });
        } else {
            console.warn(`[WARN ${modalidade.toUpperCase()}] Não foi possível encontrar treinadores para o tipo de plano: ${tipoPlano}`);
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
        console.log(`[DEBUG ${modalidade.toUpperCase()}] Periodicidades populadas.`);
    }
    
    planoSelect.addEventListener("change", function() {
        console.log(`[DEBUG ${modalidade.toUpperCase()}] Plano alterado para: ${this.value}`);
        if(planoSelecionadoHidden) planoSelecionadoHidden.value = this.value;
        atualizarTreinadores(); 
    });
    
    if (periodicidadeSelect) {
        periodicidadeSelect.addEventListener("change", function() {
            console.log(`[DEBUG ${modalidade.toUpperCase()}] Periodicidade alterada para: ${this.value}`);
            if(periodicidadeSelecionadaHidden) periodicidadeSelecionadaHidden.value = this.value;
        });
    }

    atualizarPeriodicidade();
    if (planoSelect.value) {
         atualizarTreinadores();
         if(planoSelecionadoHidden) planoSelecionadoHidden.value = planoSelect.value;
    }

    formCadastro.addEventListener("submit", function(event) {
        event.preventDefault(); 
        console.log(`[DEBUG ${modalidade.toUpperCase()}] Evento de submit disparado.`);

        if (!nomeInput.value.trim()) { alert("Por favor, preencha o nome completo."); return; }
        if (!telefoneInput.value.trim()) { alert("Por favor, preencha o WhatsApp."); return; }
        if (!planoSelect.value) { alert("Por favor, selecione um plano."); return; }
        if (!treinadorSelect.value) { alert("Por favor, selecione um treinador."); return; }
        if (!periodicidadeSelect.value) { alert("Por favor, selecione uma periodicidade."); return; }
        if (!termosCheckbox.checked) { alert("Por favor, aceite os termos de contrato."); return; }
        console.log(`[DEBUG ${modalidade.toUpperCase()}] Validações do formulário passaram.`);

        const planoSelecionadoValorOriginal = planoSelect.value;
        const tipoPlano = planoSelecionadoValorOriginal.toLowerCase().includes("premium") ? "premium" : "essencial";
        const periodicidadeSelecionadaValor = periodicidadeSelect.value;
        
        console.log(`[DEBUG ${modalidade.toUpperCase()}] Valores para buscar link: Plano Original=\'${planoSelecionadoValorOriginal}\', tipoPlano derivado=\'${tipoPlano}\', Periodicidade=\'${periodicidadeSelecionadaValor}\'`);

        let checkoutUrl = "#"; 
        if (tecnoFitLinks[modalidade] && 
            tecnoFitLinks[modalidade][tipoPlano] && 
            tecnoFitLinks[modalidade][tipoPlano][periodicidadeSelecionadaValor]) {
            checkoutUrl = tecnoFitLinks[modalidade][tipoPlano][periodicidadeSelecionadaValor];
            console.log(`[DEBUG ${modalidade.toUpperCase()}] URL Tecnofit encontrada: ${checkoutUrl}`);
        } else {
            console.error(`[ERRO ${modalidade.toUpperCase()}] URL Tecnofit NÃO encontrada para: modalidade=\'${modalidade}\', tipoPlano=\'${tipoPlano}\', periodicidade=\'${periodicidadeSelecionadaValor}\'`);
            alert("Erro: Não foi possível determinar o link de checkout para a combinação selecionada. Por favor, verifique suas seleções ou contate o suporte.");
            return;
        }
        
        const formData = new FormData(formCadastro);
        formData.append("modalidade_origem", modalidade);
        console.log(`[DEBUG ${modalidade.toUpperCase()}] Enviando dados para Formspree (${formCadastro.action}):`, Object.fromEntries(formData));

        fetch(formCadastro.action, {
            method: "POST",
            body: formData,
            headers: {
                Accept: "application/json"
            }
        }).then(response => {
            if (response.ok) {
                console.log(`[DEBUG ${modalidade.toUpperCase()}] Formulário enviado com sucesso para Formspree.`);
            } else {
                response.json().then(data => {
                    if (Object.hasOwn(data, "errors")) {
                        console.error(`[ERRO ${modalidade.toUpperCase()}] Erro ao enviar para Formspree:`, data["errors"].map(error => error["message"]).join(", "));
                    } else {
                        console.error(`[ERRO ${modalidade.toUpperCase()}] Erro desconhecido ao enviar para Formspree. Status: ${response.status}`);
                    }
                }).catch(e => {
                     console.error(`[ERRO ${modalidade.toUpperCase()}] Erro ao processar resposta de erro do Formspree:`, e);
                });
            }
        }).catch(error => {
            console.error(`[ERRO ${modalidade.toUpperCase()}] Erro de rede ou script ao enviar para Formspree:`, error);
        });

        if (checkoutUrl !== "#") {
            window.open(checkoutUrl, "_blank");
        }
    });
    console.log(`[DEBUG ${modalidade.toUpperCase()}] Script inicializado e listeners adicionados.`);
});

