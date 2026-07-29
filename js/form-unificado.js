document.addEventListener("DOMContentLoaded", function () {
  const ENDPOINT = "https://bsiljrrodgtmtdilnuxr.supabase.co/functions/v1/public-assessment-prospect";
  const form = document.getElementById("unified-form");
  if (!form) return;

  const el = (id) => document.getElementById(id);
  const fields = {
    name: el("nome-completo"),
    whatsapp: el("whatsapp"),
    email: el("email"),
    cpf: el("cpf"),
    zip: el("cep"),
    modality: el("modalidade"),
    plan: el("plano"),
    region: el("regiao"),
    coach: el("treinador"),
    street: el("address_street"),
    number: el("address_number"),
    complement: el("address_complement"),
    neighborhood: el("address_neighborhood"),
    city: el("address_city"),
    state: el("address_state"),
    terms: el("termos"),
    website: el("website"),
  };
  const query = new URLSearchParams(window.location.search);
  const status = el("form-status");
  const submit = form.querySelector('button[type="submit"]');
  const steps = Array.from(form.querySelectorAll(".form-step"));
  const progressItems = Array.from(document.querySelectorAll("[data-progress-step]"));
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  let currentStep = 1;
  let catalog = { plans: [], modalities: [], coaches: [] };

  const digits = (value) => String(value || "").replace(/\D/g, "");
  const slug = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const titleCase = (value) => String(value || "")
    .toLowerCase()
    .replace(/(^|\s|-)(\p{L})/gu, (match) => match.toUpperCase());
  const selectedPlan = () => catalog.plans.find((item) => item.id === fields.plan.value);
  const selectedCoach = () => catalog.coaches.find((item) => item.id === fields.coach.value);
  const selectedModality = () => catalog.modalities.find((item) => item.id === fields.modality.value);

  function setStatus(type, message) {
    status.className = `form-status ${type ? `is-${type}` : ""}`;
    status.textContent = message || "";
  }

  function maskCpf(value) {
    const valueDigits = digits(value).slice(0, 11);
    return valueDigits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function maskPhone(value) {
    const valueDigits = digits(value).slice(0, 11);
    if (valueDigits.length <= 2) return valueDigits;
    if (valueDigits.length <= 6) return `(${valueDigits.slice(0, 2)}) ${valueDigits.slice(2)}`;
    if (valueDigits.length <= 10) return `(${valueDigits.slice(0, 2)}) ${valueDigits.slice(2, 6)}-${valueDigits.slice(6)}`;
    return `(${valueDigits.slice(0, 2)}) ${valueDigits.slice(2, 7)}-${valueDigits.slice(7)}`;
  }

  function maskZip(value) {
    const valueDigits = digits(value).slice(0, 8);
    return valueDigits.length > 5 ? `${valueDigits.slice(0, 5)}-${valueDigits.slice(5)}` : valueDigits;
  }

  fields.cpf.addEventListener("input", () => {
    fields.cpf.value = maskCpf(fields.cpf.value);
    fields.cpf.classList.remove("is-invalid");
    updateSummary();
  });
  fields.whatsapp.addEventListener("input", () => {
    fields.whatsapp.value = maskPhone(fields.whatsapp.value);
    fields.whatsapp.classList.remove("is-invalid");
  });
  fields.zip.addEventListener("input", () => {
    fields.zip.value = maskZip(fields.zip.value);
    fields.zip.classList.remove("is-invalid");
    if (digits(fields.zip.value).length === 8) void lookupZip();
  });
  form.querySelectorAll("input").forEach((input) => input.addEventListener("input", () => input.classList.remove("is-invalid")));

  async function lookupZip() {
    const zip = digits(fields.zip.value);
    if (zip.length !== 8) return;
    const zipStatus = el("cep-status");
    zipStatus.className = "field-status";
    zipStatus.textContent = "Buscando endereço…";
    try {
      const response = await fetch(`https://viacep.com.br/ws/${zip}/json/`);
      const data = await response.json();
      if (!response.ok || data.erro) throw new Error("CEP não encontrado");
      fields.street.value = data.logradouro || "";
      fields.neighborhood.value = data.bairro || "";
      fields.city.value = data.localidade || "";
      fields.state.value = data.uf || "";
      zipStatus.className = "field-status is-success";
      zipStatus.textContent = "Endereço preenchido automaticamente.";
      fields.number.focus();
    } catch {
      zipStatus.className = "field-status is-error";
      zipStatus.textContent = "CEP não encontrado. Preencha o endereço manualmente.";
    }
  }

  function modalityLabel(modality) {
    return titleCase(modality?.name || "Modalidade");
  }

  function initials(name) {
    return String(name || "EO").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }

  function modalityIcon(name) {
    return slug(name) === "triathlon" ? "△" : "↗";
  }

  function renderModalities() {
    const container = el("modality-options");
    container.classList.remove("loading-box");
    container.innerHTML = "";
    catalog.modalities.forEach((modality) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `choice-tile${fields.modality.value === modality.id ? " is-selected" : ""}`;
      button.dataset.modalityId = modality.id;
      button.innerHTML = `
        <span class="choice-icon">${modalityIcon(modality.name)}</span>
        <span><strong>${modalityLabel(modality)}</strong><small>${slug(modality.name) === "triathlon" ? "Natação, ciclismo e corrida" : "Rua, pista ou trail"}</small></span>
      `;
      button.addEventListener("click", () => selectModality(modality.id));
      container.appendChild(button);
    });
  }

  function selectModality(modalityId, preservePlan) {
    if (fields.modality.value !== modalityId && !preservePlan) fields.plan.value = "";
    fields.modality.value = modalityId;
    renderModalities();
    renderPlans();
    updateSummary();
  }

  function publicPlansForModality() {
    const plans = catalog.plans.filter((plan) => plan.modality_id === fields.modality.value);
    const requestedFamily = slug(query.get("plano"));
    if (requestedFamily === "essencial") return plans.filter((plan) => slug(plan.name).includes("essencial"));
    if (requestedFamily === "premium") return plans.filter((plan) => !slug(plan.name).includes("essencial"));
    const regularPlans = plans.filter((plan) => !slug(plan.name).includes("essencial"));
    return regularPlans.length ? regularPlans : plans;
  }

  function planTitle(plan) {
    const name = String(plan.name || "").trim();
    if (slug(query.get("plano")) === "essencial" && name) return titleCase(name.replace(/\s*-?\s*2025\s*$/i, ""));
    return titleCase(plan.period || `${plan.period_months} meses`);
  }

  function renderPlans() {
    const container = el("plan-options");
    container.classList.remove("loading-box");
    container.innerHTML = "";
    const plans = publicPlansForModality();
    if (!plans.length) {
      container.classList.add("loading-box");
      container.textContent = "Não há planos disponíveis para esta modalidade no momento.";
      return;
    }
    plans.forEach((plan) => {
      const months = Number(plan.period_months) || 1;
      const button = document.createElement("button");
      button.type = "button";
      button.className = `plan-card${fields.plan.value === plan.id ? " is-selected" : ""}`;
      button.dataset.planId = plan.id;
      button.innerHTML = `
        <span class="plan-card__period">${planTitle(plan)}</span>
        <span class="plan-card__price">${money.format(Number(plan.price_monthly))}<small>/mês</small></span>
        <span class="plan-card__total">${months === 1 ? "Cobrança mensal recorrente" : `Total de ${money.format(Number(plan.price_total))} · em até ${Number(plan.max_installments) || months}x`}</span>
        <span class="plan-card__tag">${months === 6 ? "Melhor custo-benefício" : `${months} ${months === 1 ? "mês" : "meses"}`}</span>
      `;
      button.addEventListener("click", () => {
        fields.plan.value = plan.id;
        renderPlans();
        updateSummary();
      });
      container.appendChild(button);
    });
  }

  function selectInitialPlan() {
    const directId = query.get("plan_id");
    const candidates = publicPlansForModality();
    if (directId && candidates.some((plan) => plan.id === directId)) {
      fields.plan.value = directId;
      return;
    }
    const wantedPeriod = slug(query.get("periodicidade") || query.get("periodo"));
    const wantedPrice = Number(query.get("valor_mensal"));
    let match = candidates.find((plan) => wantedPrice && Number(plan.price_monthly) === wantedPrice);
    if (!match && wantedPeriod) match = candidates.find((plan) => slug(plan.period) === wantedPeriod);
    if (match) fields.plan.value = match.id;
  }

  function renderRegions() {
    document.querySelectorAll("[data-region]").forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.region === fields.region.value);
    });
  }

  document.querySelectorAll("[data-region]").forEach((button) => {
    button.addEventListener("click", () => {
      fields.region.value = button.dataset.region;
      renderRegions();
      updateSummary();
    });
  });

  function coachMatchesQuery(coach, wanted) {
    const coachSlug = slug(coach.name);
    const wantedSlug = slug(wanted);
    if (!wantedSlug) return false;
    if (coachSlug === wantedSlug) return true;
    return coachSlug.split("-")[0] === wantedSlug.split("-")[0];
  }

  function renderCoaches() {
    const container = el("coach-options");
    container.classList.remove("loading-box");
    container.innerHTML = "";
    catalog.coaches.forEach((coach) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `coach-card${fields.coach.value === coach.id ? " is-selected" : ""}`;
      button.dataset.coachId = coach.id;
      button.innerHTML = `<span class="coach-avatar">${initials(coach.name)}</span><strong>${coach.name}</strong><small>Treinador disponível</small>`;
      button.addEventListener("click", () => {
        fields.coach.value = coach.id;
        renderCoaches();
        updateSummary();
      });
      container.appendChild(button);
    });
  }

  function updateSummary() {
    const plan = selectedPlan();
    const modality = selectedModality();
    const coach = selectedCoach();
    const regionLabel = fields.region.value === "florianopolis" ? "Florianópolis" : fields.region.value === "online" ? "Outras cidades / online" : "A escolher";
    el("summary-modality").textContent = modality ? modalityLabel(modality) : "A escolher";
    el("summary-region").textContent = regionLabel;
    el("summary-plan").textContent = plan ? planTitle(plan) : "A escolher";
    el("summary-coach").textContent = coach?.name || "A escolher";
    const priceBox = el("summary-price");
    if (!plan) {
      priceBox.hidden = true;
      priceBox.innerHTML = "";
      return;
    }
    const months = Number(plan.period_months) || 1;
    priceBox.hidden = false;
    priceBox.innerHTML = `<strong>${money.format(Number(plan.price_monthly))}/mês</strong><small>${months === 1 ? "Cobrança mensal recorrente" : `Total de ${money.format(Number(plan.price_total))} em até ${Number(plan.max_installments) || months}x`}${Number(plan.enrollment_fee) > 0 ? ` · matrícula de ${money.format(Number(plan.enrollment_fee))}` : ""}</small>`;
  }

  function showStep(nextStep) {
    currentStep = Math.max(1, Math.min(4, nextStep));
    steps.forEach((step) => {
      const active = Number(step.dataset.step) === currentStep;
      step.hidden = !active;
      step.classList.toggle("is-active", active);
      const error = step.querySelector("[data-step-error]");
      if (error) error.textContent = "";
    });
    progressItems.forEach((item) => {
      const stepNumber = Number(item.dataset.progressStep);
      item.classList.toggle("is-active", stepNumber === currentStep);
      item.classList.toggle("is-complete", stepNumber < currentStep);
    });
    history.replaceState(null, "", `${window.location.pathname}${window.location.search}#etapa-${currentStep}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function markInvalid(input) {
    input.classList.add("is-invalid");
    input.focus({ preventScroll: true });
  }

  function validateStep(stepNumber) {
    const step = steps.find((item) => Number(item.dataset.step) === stepNumber);
    const error = step?.querySelector("[data-step-error]");
    if (error) error.textContent = "";
    if (stepNumber === 1) {
      if (!fields.modality.value || !fields.region.value || !fields.plan.value) {
        if (error) error.textContent = "Escolha a modalidade, o formato e o plano para continuar.";
        return false;
      }
    }
    if (stepNumber === 2 && !fields.coach.value) {
      if (error) error.textContent = "Escolha um treinador para continuar.";
      return false;
    }
    if (stepNumber === 3) {
      for (const input of [fields.name, fields.whatsapp, fields.email, fields.cpf]) {
        if (!input.checkValidity()) {
          markInvalid(input);
          if (error) error.textContent = "Revise os campos destacados para continuar.";
          return false;
        }
      }
      if (digits(fields.whatsapp.value).length < 10 || digits(fields.cpf.value).length !== 11) {
        const invalid = digits(fields.whatsapp.value).length < 10 ? fields.whatsapp : fields.cpf;
        markInvalid(invalid);
        if (error) error.textContent = "Informe um WhatsApp e CPF válidos para continuar.";
        return false;
      }
    }
    return true;
  }

  form.querySelectorAll("[data-next-step]").forEach((button) => {
    button.addEventListener("click", () => {
      if (validateStep(currentStep)) showStep(currentStep + 1);
    });
  });
  form.querySelectorAll("[data-prev-step]").forEach((button) => button.addEventListener("click", () => showStep(currentStep - 1)));

  async function loadCatalog() {
    try {
      const response = await fetch(ENDPOINT, { headers: { Accept: "application/json" } });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Falha ao carregar catálogo");
      catalog = {
        plans: Array.isArray(data.plans) ? data.plans : [],
        modalities: Array.isArray(data.modalities) ? data.modalities : [],
        coaches: Array.isArray(data.coaches) ? data.coaches : [],
      };
      const wantedModality = slug(query.get("modalidade"));
      const initialModality = catalog.modalities.find((item) => slug(item.name) === wantedModality) || catalog.modalities[0];
      fields.modality.value = initialModality?.id || "";
      fields.region.value = query.get("regiao") === "online" || query.get("regiao") === "outras" ? "online" : "florianopolis";
      selectInitialPlan();
      const wantedCoach = query.get("treinador");
      const coach = catalog.coaches.find((item) => coachMatchesQuery(item, wantedCoach));
      if (coach) fields.coach.value = coach.id;
      renderModalities();
      renderRegions();
      renderPlans();
      renderCoaches();
      updateSummary();
    } catch (error) {
      el("modality-options").textContent = "Não foi possível carregar as opções agora.";
      el("plan-options").textContent = "Atualize a página e tente novamente.";
      el("coach-options").textContent = "Atualize a página e tente novamente.";
      form.querySelectorAll("button").forEach((button) => { if (button.hasAttribute("data-next-step")) button.disabled = true; });
      console.error("prospect catalog", error);
    }
  }

  function utm() {
    return Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]
      .map((key) => [key, query.get(key)])
      .filter(([, value]) => value));
  }

  function validateFinalStep() {
    for (const input of [fields.zip, fields.street, fields.number, fields.neighborhood, fields.city, fields.state]) {
      if (!input.checkValidity()) {
        markInvalid(input);
        setStatus("error", "Revise os campos destacados antes de enviar.");
        return false;
      }
    }
    if (!fields.terms.checked) {
      fields.terms.focus();
      setStatus("error", "Leia e aceite os Termos de Contrato para continuar.");
      return false;
    }
    return true;
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    setStatus("", "");
    if (![1, 2, 3].every(validateStep) || !validateFinalStep()) return;
    const turnstileToken = window.turnstile?.getResponse();
    if (!turnstileToken) return setStatus("error", "Conclua a verificação de segurança antes de enviar.");

    submit.disabled = true;
    submit.innerHTML = "Enviando com segurança…";
    setStatus("loading", "Registrando sua pré-matrícula no sistema da Endurance On…");
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          request_id: crypto.randomUUID(),
          full_name: fields.name.value.trim(),
          whatsapp: fields.whatsapp.value,
          email: fields.email.value.trim(),
          cpf: fields.cpf.value,
          plan_id: fields.plan.value,
          coach_id: fields.coach.value,
          region: fields.region.value,
          address_zip: fields.zip.value,
          address_street: fields.street.value.trim(),
          address_number: fields.number.value.trim(),
          address_complement: fields.complement.value.trim(),
          address_neighborhood: fields.neighborhood.value.trim(),
          address_city: fields.city.value.trim(),
          address_state: fields.state.value.trim().toUpperCase(),
          terms_accepted: fields.terms.checked,
          turnstile_token: turnstileToken,
          website: fields.website.value,
          landing_page: window.location.href,
          utm: utm(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || "Não foi possível enviar a pré-matrícula");
      if (typeof window.gtag === "function") window.gtag("event", "submit_lead_form", { form_name: "onboarding_assessoria" });
      window.location.href = "cadastro-recebido.html";
    } catch (error) {
      setStatus("error", error.message || "Não foi possível enviar. Tente novamente.");
      window.turnstile?.reset();
      submit.disabled = false;
      submit.innerHTML = 'Enviar pré-matrícula <span aria-hidden="true">→</span>';
    }
  });

  el("current-year").textContent = new Date().getFullYear();
  showStep(1);
  void loadCatalog();
});
