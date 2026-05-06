document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("unified-form");
  if (!form) return;

  const nomeInput = document.getElementById("nome-completo");
  const whatsappInput = document.getElementById("whatsapp");
  const modalidadeSelect = document.getElementById("modalidade");
  const periodicidadeSelect = document.getElementById("periodicidade");
  const regiaoSelect = document.getElementById("regiao");
  const treinadorSelect = document.getElementById("treinador");
  const termosCheckbox = document.getElementById("termos");

  const getParam = (name) => new URLSearchParams(window.location.search).get(name);

  const treinadoresPorRegiao = {
    florianopolis: { corrida: ["Bruno Jeremias", "Thais Prando"], triathlon: ["Thais Prando"] },
    "sao-paulo": { corrida: ["Denis Santana", "Jéssica Rodrigues"], triathlon: ["Denis Santana", "Jéssica Rodrigues"] },
    online: { corrida: ["Bruno Jeremias", "Denis Santana", "Jéssica Rodrigues", "Thais Prando"], triathlon: ["Denis Santana", "Jéssica Rodrigues", "Thais Prando"] },
  };

  const tecnoFitLinks = {
    corrida: {
      mensal: "https://app.tecnofit.com.br/ng/online-sale/MjA5NjA/checkout/MTA1ODUyNg",
      trimestral: "https://app.tecnofit.com.br/ng/online-sale/MjA5NjA/checkout/MTE4MTg1MA",
      semestral: "https://app.tecnofit.com.br/ng/online-sale/MjA5NjA/checkout/MTE4MTg1Mg",
    },
    triathlon: {
      mensal: "https://app.tecnofit.com.br/ng/online-sale/MjA5NjA/checkout/MTE4MTg1OA",
      trimestral: "https://app.tecnofit.com.br/ng/online-sale/MjA5NjA/checkout/MTE4MTg2MA",
      semestral: "https://app.tecnofit.com.br/ng/online-sale/MjA5NjA/checkout/MTE4MTg2Mw",
    },
  };

  const slugify = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, "-");

  function popularTreinadores() {
    treinadorSelect.innerHTML = '<option value="">Selecione o Treinador</option>';
    const modalidade = modalidadeSelect.value;
    const regiao = regiaoSelect.value;
    if (!modalidade || !regiao) return;
    const base = treinadoresPorRegiao[regiao] || treinadoresPorRegiao.online;
    (base[modalidade] || []).forEach((nome) => {
      const opt = document.createElement("option");
      opt.value = slugify(nome);
      opt.textContent = nome;
      treinadorSelect.appendChild(opt);
    });
    const treinadorParam = getParam("treinador");
    if (treinadorParam) treinadorSelect.value = treinadorParam;
  }

  // Pré-preencher campos via URL params
  const paramModalidade = getParam("modalidade");
  const paramPeriodicidade = getParam("periodicidade") || getParam("periodo");
  const paramRegiao = getParam("regiao");

  const regiaoMap = { florianopolis: "florianopolis", "sao-paulo": "sao-paulo", online: "online" };
  if (paramModalidade) modalidadeSelect.value = paramModalidade;
  if (paramPeriodicidade) periodicidadeSelect.value = paramPeriodicidade;
  if (paramRegiao && regiaoMap[paramRegiao]) regiaoSelect.value = regiaoMap[paramRegiao];

  popularTreinadores();

  // Banner de resumo do plano
  const labelModalidade = { corrida: "Corrida", triathlon: "Triathlon" };
  const labelPeriodicidade = { mensal: "Mensal", trimestral: "Trimestral", semestral: "Semestral" };
  const labelRegiao = { florianopolis: "Florianópolis", "sao-paulo": "São Paulo", online: "Outra cidade" };

  function atualizarResumo() {
    const resumoEl = document.getElementById("plano-resumo");
    const resumoMod = document.getElementById("resumo-modalidade");
    const resumoPer = document.getElementById("resumo-periodicidade");
    const resumoReg = document.getElementById("resumo-regiao");
    if (!resumoEl) return;

    const mod = modalidadeSelect.value;
    const per = periodicidadeSelect.value;
    const reg = regiaoSelect.value;

    if (mod || per || reg) {
      if (resumoMod) resumoMod.textContent = labelModalidade[mod] || mod || "—";
      if (resumoPer) resumoPer.textContent = labelPeriodicidade[per] || per || "—";
      if (resumoReg) resumoReg.textContent = labelRegiao[reg] || reg || "—";
      resumoEl.style.display = "block";
    }
  }

  atualizarResumo();

  modalidadeSelect.addEventListener("change", () => { popularTreinadores(); atualizarResumo(); });
  periodicidadeSelect.addEventListener("change", atualizarResumo);
  regiaoSelect.addEventListener("change", () => { popularTreinadores(); atualizarResumo(); });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (!nomeInput.value.trim()) return alert("Por favor, preencha o nome completo.");
    if (!whatsappInput.value.trim()) return alert("Por favor, preencha o WhatsApp.");
    if (!modalidadeSelect.value) return alert("Por favor, selecione uma modalidade.");
    if (!periodicidadeSelect.value) return alert("Por favor, selecione uma periodicidade.");
    if (!regiaoSelect.value) return alert("Por favor, selecione sua cidade.");
    if (!treinadorSelect.value) return alert("Por favor, selecione um treinador.");
    if (!termosCheckbox.checked) return alert("Por favor, aceite os termos de contrato.");

    const checkoutUrl = tecnoFitLinks[modalidadeSelect.value]?.[periodicidadeSelect.value];
    if (!checkoutUrl) return alert("Link de checkout não encontrado para a combinação selecionada.");

    const formData = new FormData();
    formData.append("nome_completo", nomeInput.value);
    formData.append("whatsapp", whatsappInput.value);
    formData.append("modalidade", modalidadeSelect.options[modalidadeSelect.selectedIndex].text);
    formData.append("periodicidade", periodicidadeSelect.options[periodicidadeSelect.selectedIndex].text);
    formData.append("regiao", regiaoSelect.options[regiaoSelect.selectedIndex].text);
    formData.append("treinador", treinadorSelect.options[treinadorSelect.selectedIndex].text);
    formData.append("termos", "aceito");

    fetch("https://formspree.io/f/xlgzljke", { method: "POST", body: formData, headers: { Accept: "application/json" } })
      .finally(() => { window.location.href = checkoutUrl; });
  });
});
