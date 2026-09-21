document.addEventListener("DOMContentLoaded", () => {
  const endpoint = "https://bsiljrrodgtmtdilnuxr.supabase.co/functions/v1/public-assessment-prospect";
  const byId = (id) => document.getElementById(id);
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const slug = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const status = byId("catalog-status");
  const modalityOptions = Array.from(document.querySelectorAll("#filtro-modalidade .filtro-opcao"));
  const nextModality = byId("avancar-para-plano");
  const nextAssessment = byId("avancar-para-comparativo");
  const sections = {
    1: [byId("filtro-modalidade")],
    2: [byId("filtro-plano"), byId("comparativo-planos")],
    3: [byId("filtro-treinador")],
    4: [byId("filtro-periodicidade")],
  };
  const state = { modalityKey: "", coachId: "" };
  let catalog = null;

  function showStatus(message) {
    status.textContent = message;
    status.hidden = !message;
  }

  function showStep(step) {
    Object.values(sections).flat().forEach((section) => {
      section.style.display = "none";
    });
    sections[step].forEach((section) => {
      section.style.display = "block";
    });
    document.querySelectorAll(".progresso-passo").forEach((item) => {
      const number = Number(item.dataset.passo);
      item.classList.toggle("ativo", number === step);
      item.classList.toggle("concluido", number < step);
    });
  }

  function modality() {
    return catalog?.modalities.find((item) => slug(item.name) === state.modalityKey);
  }

  function plansForModality() {
    const selected = modality();
    if (!selected) return [];
    const plans = catalog.plans.filter((plan) =>
      plan.modality_id === selected.id &&
      plan.active !== false &&
      plan.available_online !== false &&
      plan.id &&
      plan.period &&
      Number(plan.price_monthly) > 0 &&
      Number(plan.price_total) > 0
    );
    const regular = plans.filter((plan) => !slug(plan.name).includes("essencial"));
    return regular.length ? regular : plans;
  }

  function coachesForModality() {
    const selected = modality();
    if (!selected) return [];
    return catalog.coaches.filter((coach) =>
      coach.id &&
      coach.name &&
      coach.active !== false &&
      coach.public_visible !== false &&
      Array.isArray(coach.modality_ids) &&
      coach.modality_ids.includes(selected.id)
    );
  }

  function updateModalityStatus() {
    if (!catalog) {
      nextModality.disabled = true;
      return;
    }
    const plans = plansForModality();
    const coaches = coachesForModality();
    nextModality.disabled = !plans.length || !coaches.length;
    if (!state.modalityKey) showStatus("");
    else if (!modality()) showStatus("Esta modalidade não está disponível para contratação online no momento.");
    else if (!plans.length) showStatus("Não há planos online disponíveis para esta modalidade no momento.");
    else if (!coaches.length) showStatus("Não há treinadores online disponíveis para esta modalidade no momento.");
    else showStatus("");
  }

  function selectModality(key) {
    state.modalityKey = key;
    state.coachId = "";
    modalityOptions.forEach((option) => {
      option.classList.toggle("selecionado", option.dataset.modalidade === key);
    });
    updateModalityStatus();
  }

  function addText(parent, tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = value;
    parent.appendChild(node);
    return node;
  }

  function renderAssessment() {
    const plans = plansForModality();
    const coaches = coachesForModality();
    const root = byId("opcoes-plano");
    root.replaceChildren();
    const comparison = document.createElement("div");
    comparison.className = "planos-comparativo";
    const card = document.createElement("div");
    card.className = "plano-card plano-essencial selecionado";
    const header = addText(card, "div", "plano-header", "");
    addText(header, "h3", "", "Assessoria " + modality().name);
    addText(header, "p", "", "Planos e treinadores disponíveis online");
    const price = addText(card, "div", "plano-preco-container", "");
    addText(price, "div", "plano-preco-label", "A partir de");
    addText(price, "div", "plano-preco-valor", money.format(Math.min(...plans.map((plan) => Number(plan.price_monthly)))));
    addText(price, "div", "plano-preco-periodo", "por mês");
    const benefits = addText(card, "div", "plano-beneficios", "");
    addText(benefits, "h4", "plano-beneficios-titulo", "O que está incluído:");
    const list = addText(benefits, "ul", "plano-beneficios-lista", "");
    [
      "Treinos individuais e personalizados",
      "Acesso ao app TrainingPeaks",
      "Contato direto com o treinador",
    ].forEach((benefit) => addText(list, "li", "plano-beneficios-item", benefit));
    comparison.appendChild(card);
    root.appendChild(comparison);

    const tableRoot = byId("tabela-comparativa");
    tableRoot.replaceChildren();
    const table = document.createElement("table");
    table.className = "comparativo-tabela";
    const head = document.createElement("thead");
    const headRow = document.createElement("tr");
    addText(headRow, "th", "", "Assessoria");
    addText(headRow, "th", "", "Disponível online");
    head.appendChild(headRow);
    table.appendChild(head);
    const body = document.createElement("tbody");
    [
      ["Períodos disponíveis", String(plans.length)],
      ["Treinadores disponíveis", String(coaches.length)],
    ].forEach(([label, value]) => {
      const row = document.createElement("tr");
      addText(row, "td", "", label);
      addText(row, "td", "", value);
      body.appendChild(row);
    });
    table.appendChild(body);
    tableRoot.appendChild(table);
    nextAssessment.disabled = !plans.length || !coaches.length;
  }

  function coachPhoto(name) {
    const photos = {
      "bruno-jeremias": "bruno-jeremias.jpg",
      "elinai-freitas": "elinai-freitas.jpg",
      "guto-fernandes": "guto-fernandes.jpg",
      "jessica-vieira": "jessica-rodrigues.jpg",
      "jessica-rodrigues": "jessica-rodrigues.jpg",
      "thais-prando": "thais-prando.jpg",
    };
    const nameSlug = slug(name);
    const match = photos[nameSlug];
    return match ? "../images/treinadores/" + match : "";
  }

  function renderCoaches() {
    const root = byId("opcoes-treinador");
    root.replaceChildren();
    const coaches = coachesForModality();
    if (!coaches.length) {
      addText(root, "p", "", "Não há treinadores online disponíveis para esta modalidade no momento.");
      return;
    }
    coaches.forEach((coach) => {
      const card = document.createElement("div");
      card.className = "treinador-card";
      card.setAttribute("role", "button");
      card.tabIndex = 0;
      const photo = addText(card, "div", "treinador-foto", "");
      const photoUrl = coachPhoto(coach.name);
      if (photoUrl) {
        const image = document.createElement("img");
        image.src = photoUrl;
        image.alt = "Foto de " + coach.name;
        image.loading = "lazy";
        photo.appendChild(image);
      } else {
        photo.style.display = "flex";
        photo.style.alignItems = "center";
        photo.style.justifyContent = "center";
        photo.style.backgroundColor = "#eceff2";
        photo.style.color = "#333";
        photo.style.fontSize = "2rem";
        photo.style.fontWeight = "700";
        addText(photo, "span", "", coach.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase());
      }
      const info = addText(card, "div", "treinador-info", "");
      addText(info, "h3", "", coach.name);
      addText(info, "p", "", "Treinador disponível");
      const choose = () => {
        state.coachId = coach.id;
        renderPeriods();
        showStep(4);
      };
      card.addEventListener("click", choose);
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          choose();
        }
      });
      root.appendChild(card);
    });
  }

  function renderPeriods() {
    const root = byId("opcoes-periodicidade");
    root.replaceChildren();
    const selectedCoach = coachesForModality().find((coach) => coach.id === state.coachId);
    if (!selectedCoach) {
      addText(root, "p", "", "Escolha um treinador disponível para continuar.");
      return;
    }
    const order = { mensal: 1, trimestral: 2, semestral: 3 };
    const plans = plansForModality().sort((a, b) =>
      (order[slug(a.period)] || 99) - (order[slug(b.period)] || 99)
    );
    const periodCounts = new Map();
    plans.forEach((plan) => {
      const key = slug(plan.period);
      periodCounts.set(key, (periodCounts.get(key) || 0) + 1);
    });
    plans.forEach((plan) => {
      const period = slug(plan.period);
      const months = Number(plan.period_months) || 1;
      const card = document.createElement("div");
      card.className = "periodicidade-card" + (months === 6 ? " destaque" : "");
      const title = periodCounts.get(period) > 1 ? plan.name : (plan.period || plan.name);
      addText(card, "h3", "", title);
      addText(card, "div", "preco", money.format(Number(plan.price_total)));
      addText(card, "p", "descricao", months === 1
        ? "Cobrança mensal recorrente"
        : "Equivale a " + money.format(Number(plan.price_monthly)) + "/mês");
      const params = new URLSearchParams({
        modalidade: slug(modality().name),
        periodicidade: period,
        plan_id: String(plan.id),
        treinador: slug(selectedCoach.name),
      });
      const url = "cadastro-unificado.html?" + params.toString();
      const link = addText(card, "a", "btn-contratar", "Contratar agora");
      link.href = url;
      card.addEventListener("click", (event) => {
        if (!event.target.closest("a")) window.location.href = url;
      });
      root.appendChild(card);
    });
  }

  modalityOptions.forEach((option) => {
    option.setAttribute("role", "button");
    option.tabIndex = 0;
    const choose = () => selectModality(option.dataset.modalidade);
    option.addEventListener("click", choose);
    option.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        choose();
      }
    });
  });
  nextModality.addEventListener("click", () => {
    if (nextModality.disabled) return;
    renderAssessment();
    showStep(2);
  });
  nextAssessment.addEventListener("click", () => {
    if (nextAssessment.disabled) return;
    renderCoaches();
    showStep(3);
  });
  byId("voltar-para-modalidade").addEventListener("click", () => showStep(1));
  byId("voltar-para-plano").addEventListener("click", () => showStep(2));
  byId("voltar-para-treinador").addEventListener("click", () => showStep(3));

  async function loadCatalog() {
    try {
      const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
      const data = await response.json();
      if (!response.ok || !data.ok ||
          !Array.isArray(data.modalities) ||
          !Array.isArray(data.plans) ||
          !Array.isArray(data.coaches)) {
        throw new Error("Catálogo indisponível");
      }
      catalog = data;
      const requested = slug(new URLSearchParams(window.location.search).get("modalidade"));
      if (requested) selectModality(requested === "multisport" ? "2-modalidades" : requested);
      else updateModalityStatus();
    } catch (error) {
      showStatus("Não foi possível carregar os planos agora. Atualize a página e tente novamente.");
      nextModality.disabled = true;
      console.error("assessment catalog", error);
    }
  }

  showStep(1);
  void loadCatalog();
});
