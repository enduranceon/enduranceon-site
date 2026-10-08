const EonEnrollmentUtils = (() => {
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const BRAZIL_STATES = new Set([
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
    "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
  ]);

  const digits = (value) => String(value || "").replace(/\D/g, "");
  const clean = (value) => String(value || "").trim().replace(/\s+/g, " ");
  const slug = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  function cpfDigits(value) {
    return digits(value).slice(0, 11);
  }

  function isValidCpf(value) {
    const cpf = digits(value);
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    const check = (size) => {
      let sum = 0;
      for (let index = 0; index < size; index += 1) sum += Number(cpf[index]) * (size + 1 - index);
      const rest = (sum * 10) % 11;
      return (rest === 10 ? 0 : rest) === Number(cpf[size]);
    };
    return check(9) && check(10);
  }

  function brazilPhoneDigits(value) {
    const phone = digits(value);
    if ((phone.length === 12 || phone.length === 13) && phone.startsWith("55")) return phone.slice(2);
    return phone;
  }

  function normalizeBrazilPhone(value) {
    const phone = brazilPhoneDigits(value);
    return (phone.length === 10 || phone.length === 11) && /^[1-9]/.test(phone) ? `+55${phone}` : "";
  }

  function maskPhone(value) {
    const phone = brazilPhoneDigits(value).slice(0, 11);
    if (phone.length <= 2) return phone;
    if (phone.length <= 6) return `(${phone.slice(0, 2)}) ${phone.slice(2)}`;
    if (phone.length <= 10) return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`;
    return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`;
  }

  function isValidEmail(value) {
    const email = clean(value).toLowerCase();
    return email.length > 0 && email.length <= 180 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidState(value) {
    return BRAZIL_STATES.has(clean(value).toUpperCase());
  }

  function isUuid(value) {
    return UUID.test(String(value || ""));
  }

  function isRecentReceipt(receipt, now = Date.now(), maxAgeMs = 2 * 60 * 60 * 1000) {
    if (!receipt || receipt.version !== 1 || !["created", "duplicate"].includes(receipt.status) ||
        !isUuid(receipt.submissionId) || !isUuid(receipt.requestId) || !isUuid(receipt.contractId)) return false;
    const receivedAt = Date.parse(receipt.receivedAt || "");
    const submittedAt = Date.parse(receipt.submittedAt || "");
    if (!Number.isFinite(receivedAt) || !Number.isFinite(submittedAt)) return false;
    const clockSkewMs = 5 * 60 * 1000;
    return receivedAt <= now + clockSkewMs && submittedAt <= now + clockSkewMs && now - receivedAt <= maxAgeMs;
  }

  return Object.freeze({
    brazilPhoneDigits,
    clean,
    cpfDigits,
    digits,
    isRecentReceipt,
    isUuid,
    isValidCpf,
    isValidEmail,
    isValidState,
    maskPhone,
    normalizeBrazilPhone,
    slug,
  });
})();

if (typeof module !== "undefined" && module.exports) module.exports = EonEnrollmentUtils;

if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", function () {
  const ENDPOINT = "https://bsiljrrodgtmtdilnuxr.supabase.co/functions/v1/public-assessment-prospect";
  const REQUEST_ID_KEY = "eonEnrollmentRequestId";
  const RECEIPT_KEY = "eonEnrollmentReceipt";
  const SUBMIT_TIMEOUT_MS = 20_000;
  const CATALOG_TIMEOUT_MS = 15_000;
  const form = document.getElementById("unified-form");
  if (!form) return;
  try {
    window.sessionStorage.removeItem(RECEIPT_KEY);
    window.sessionStorage.removeItem("eonEnrollmentConfirmation");
  } catch (storageError) {
    console.warn("Não foi possível limpar uma confirmação anterior.", storageError);
  }

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
  let isSubmitting = false;
  let zipLookupController = null;

  const {
    clean,
    cpfDigits,
    digits,
    isUuid,
    isValidCpf,
    isValidEmail,
    isValidState,
    maskPhone,
    normalizeBrazilPhone,
    slug,
  } = EonEnrollmentUtils;
  const titleCase = (value) => String(value || "")
    .toLowerCase()
    .replace(/(^|\s|-)(\p{L})/gu, (match) => match.toUpperCase());
  const selectedPlan = () => catalog.plans.find((item) => item.id === fields.plan.value);
  const selectedCoach = () => catalog.coaches.find((item) => item.id === fields.coach.value);
  const selectedModality = () => catalog.modalities.find((item) => item.id === fields.modality.value);

  function setStatus(type, message) {
    status.className = `form-status ${type ? `is-${type}` : ""}`;
    status.textContent = message || "";
    status.setAttribute("role", type === "error" ? "alert" : "status");
  }

  function maskCpf(value) {
    const valueDigits = cpfDigits(value);
    return valueDigits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function maskZip(value) {
    const valueDigits = digits(value).slice(0, 8);
    return valueDigits.length > 5 ? `${valueDigits.slice(0, 5)}-${valueDigits.slice(5)}` : valueDigits;
  }

  const fieldErrorIds = {
    name: "nome-completo-error",
    whatsapp: "whatsapp-error",
    email: "email-error",
    cpf: "cpf-error",
    zip: "cep-error",
    street: "address_street-error",
    number: "address_number-error",
    neighborhood: "address_neighborhood-error",
    city: "address_city-error",
    state: "address_state-error",
    terms: "termos-error",
  };

  function clearFieldError(fieldName) {
    const input = fields[fieldName];
    const error = el(fieldErrorIds[fieldName]);
    input?.classList.remove("is-invalid");
    input?.removeAttribute("aria-invalid");
    if (error) error.textContent = "";
  }

  function setFieldError(fieldName, message) {
    const input = fields[fieldName];
    const error = el(fieldErrorIds[fieldName]);
    input?.classList.add("is-invalid");
    input?.setAttribute("aria-invalid", "true");
    if (error) error.textContent = message;
  }

  function focusField(fieldName) {
    const input = fields[fieldName];
    if (!input) return;
    window.requestAnimationFrame(() => {
      input.focus({ preventScroll: true });
      input.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function clearStepFieldErrors(fieldNames) {
    fieldNames.forEach(clearFieldError);
  }

  function focusChoice(selector) {
    window.requestAnimationFrame(() => document.querySelector(selector)?.focus({ preventScroll: true }));
  }

  fields.cpf.addEventListener("input", () => {
    fields.cpf.value = maskCpf(fields.cpf.value);
    clearFieldError("cpf");
    updateSummary();
  });
  fields.whatsapp.addEventListener("input", () => {
    fields.whatsapp.value = maskPhone(fields.whatsapp.value);
    clearFieldError("whatsapp");
  });
  fields.zip.addEventListener("input", () => {
    fields.zip.value = maskZip(fields.zip.value);
    clearFieldError("zip");
    const zipStatus = el("cep-status");
    if (digits(fields.zip.value).length === 8) {
      void lookupZip();
    } else {
      zipLookupController?.abort();
      zipLookupController = null;
      zipStatus.className = "field-status";
      zipStatus.textContent = "";
    }
  });
  fields.state.addEventListener("input", () => {
    fields.state.value = fields.state.value.replace(/[^a-z]/gi, "").slice(0, 2).toUpperCase();
    clearFieldError("state");
  });
  Object.entries(fields).forEach(([fieldName, input]) => {
    if (!fieldErrorIds[fieldName] || ["cpf", "whatsapp", "zip", "state"].includes(fieldName)) return;
    input.addEventListener(input.type === "checkbox" ? "change" : "input", () => clearFieldError(fieldName));
  });

  async function lookupZip() {
    const zip = digits(fields.zip.value);
    if (zip.length !== 8) return;
    const zipStatus = el("cep-status");
    zipLookupController?.abort();
    const controller = new AbortController();
    zipLookupController = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 10_000);
    zipStatus.className = "field-status";
    zipStatus.textContent = "Buscando endereço…";
    try {
      const response = await fetch(`https://viacep.com.br/ws/${zip}/json/`, { signal: controller.signal });
      const data = await response.json();
      if (zipLookupController !== controller || digits(fields.zip.value) !== zip) return;
      if (!response.ok || data.erro) throw new Error("CEP não encontrado");
      fields.street.value = data.logradouro || "";
      fields.neighborhood.value = data.bairro || "";
      fields.city.value = data.localidade || "";
      fields.state.value = data.uf || "";
      clearStepFieldErrors(["street", "neighborhood", "city", "state"]);
      zipStatus.className = "field-status is-success";
      zipStatus.textContent = "Endereço preenchido automaticamente.";
      fields.number.focus();
    } catch (error) {
      if (zipLookupController !== controller) return;
      zipStatus.className = "field-status is-error";
      zipStatus.textContent = error?.name === "AbortError"
        ? "A consulta do CEP demorou demais. Preencha o endereço manualmente."
        : "CEP não encontrado. Preencha o endereço manualmente.";
    } finally {
      window.clearTimeout(timeoutId);
      if (zipLookupController === controller) zipLookupController = null;
    }
  }

  function modalityLabel(modality) {
    return titleCase(modality?.name || "Modalidade");
  }

  function initials(name) {
    return String(name || "EO").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }

  function coachPhoto(name) {
    const coachSlug = slug(name);
    const photos = {
      "bruno-jeremias": "bruno-jeremias.jpg",
      "elinai-freitas": "elinai-freitas.jpg",
      "guto-fernandes": "guto-fernandes.jpg",
      "jessica-vieira": "jessica-rodrigues.jpg",
      "jessica-rodrigues": "jessica-rodrigues.jpg",
      "thais-prando": "thais-prando.jpg",
    };
    const exact = photos[coachSlug];
    if (exact) return `../images/treinadores/${exact}`;
    const firstName = coachSlug.split("-")[0];
    const fallbackKey = Object.keys(photos).find((key) => key.split("-")[0] === firstName);
    return fallbackKey ? `../images/treinadores/${photos[fallbackKey]}` : "";
  }

  function renderModalities() {
    const container = el("modality-options");
    container.classList.remove("loading-box");
    container.innerHTML = "";
    catalog.modalities.forEach((modality) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `choice-tile choice-tile--modality${fields.modality.value === modality.id ? " is-selected" : ""}`;
      button.dataset.modalityId = modality.id;
      button.setAttribute("aria-pressed", String(fields.modality.value === modality.id));
      const label = document.createElement("strong");
      label.textContent = modalityLabel(modality).toUpperCase();
      button.appendChild(label);
      button.addEventListener("click", () => selectModality(modality.id));
      container.appendChild(button);
    });
  }

  function selectModality(modalityId, preservePlan) {
    if (fields.modality.value !== modalityId && !preservePlan) fields.plan.value = "";
    fields.modality.value = modalityId;
    if (!coachesForSelectedModality().some((coach) => coach.id === fields.coach.value)) fields.coach.value = "";
    renderModalities();
    renderPlans();
    renderCoaches();
    updateSummary();
    clearStepError(1);
    focusChoice(`[data-modality-id="${modalityId}"]`);
  }

  function publicPlansForModality() {
    const plans = catalog.plans.filter((plan) => plan.modality_id === fields.modality.value);
    const requestedFamily = slug(query.get("plano"));
    const regularPlans = plans.filter((plan) => !slug(plan.name).includes("essencial"));
    if (requestedFamily === "essencial") {
      const essentialPlans = plans.filter((plan) => slug(plan.name).includes("essencial"));
      return essentialPlans.length ? essentialPlans : (regularPlans.length ? regularPlans : plans);
    }
    if (requestedFamily === "premium") return plans.filter((plan) => !slug(plan.name).includes("essencial"));
    return regularPlans.length ? regularPlans : plans;
  }

  function planTitle(plan) {
    const name = String(plan.name || "").trim();
    if (slug(query.get("plano")) === "essencial" && slug(name).includes("essencial")) {
      return titleCase(name.replace(/\s*-?\s*2025\s*$/i, ""));
    }
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
      button.setAttribute("aria-pressed", String(fields.plan.value === plan.id));
      button.innerHTML = `
        <span class="plan-card__period">${planTitle(plan)}</span>
        <span class="plan-card__price">${money.format(Number(plan.price_monthly))}<small>/mês</small></span>
        <span class="plan-card__total">${months === 1 ? "Cobrança mensal recorrente" : `Total de ${money.format(Number(plan.price_total))} · em até ${Number(plan.max_installments) || months}x`}</span>
        <span class="plan-card__tag">${months === 6 ? "Melhor custo-benefício" : `${months} ${months === 1 ? "mês" : "meses"}`}</span>
      `;
      button.addEventListener("click", () => {
        fields.plan.value = plan.id;
        if (!coachesForSelectedModality().some((coach) => coach.id === fields.coach.value)) fields.coach.value = "";
        renderPlans();
        renderCoaches();
        updateSummary();
        clearStepError(1);
        focusChoice(`[data-plan-id="${plan.id}"]`);
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
      button.setAttribute("aria-pressed", String(button.dataset.region === fields.region.value));
    });
  }

  document.querySelectorAll("[data-region]").forEach((button) => {
    button.addEventListener("click", () => {
      fields.region.value = button.dataset.region;
      renderRegions();
      updateSummary();
      clearStepError(1);
    });
  });

  function coachMatchesQuery(coach, wanted) {
    const coachSlug = slug(coach.name);
    const wantedSlug = slug(wanted);
    if (!wantedSlug) return false;
    if (coachSlug === wantedSlug) return true;
    return coachSlug.split("-")[0] === wantedSlug.split("-")[0];
  }

  function coachesForSelectedModality() {
    const modalityId = selectedPlan()?.modality_id || fields.modality.value;
    if (!modalityId) return [];
    return catalog.coaches.filter((coach) =>
      Array.isArray(coach.modality_ids) && coach.modality_ids.includes(modalityId)
    );
  }

  function renderCoaches() {
    const container = el("coach-options");
    container.classList.remove("loading-box");
    container.innerHTML = "";
    const coaches = coachesForSelectedModality();
    if (!coaches.some((coach) => coach.id === fields.coach.value)) fields.coach.value = "";
    if (!coaches.length) {
      container.classList.add("loading-box");
      container.textContent = "Não há treinadores disponíveis para esta modalidade no momento.";
      return;
    }
    coaches.forEach((coach) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `coach-card${fields.coach.value === coach.id ? " is-selected" : ""}`;
      button.dataset.coachId = coach.id;
      button.setAttribute("aria-pressed", String(fields.coach.value === coach.id));
      const photo = coachPhoto(coach.name);
      if (photo) {
        const imageWrap = document.createElement("span");
        imageWrap.className = "coach-photo";
        const image = document.createElement("img");
        image.src = photo;
        image.alt = `Foto de ${coach.name}`;
        image.loading = "lazy";
        imageWrap.appendChild(image);
        button.appendChild(imageWrap);
      } else {
        const avatar = document.createElement("span");
        avatar.className = "coach-avatar";
        avatar.textContent = initials(coach.name);
        button.appendChild(avatar);
      }
      const coachBody = document.createElement("span");
      coachBody.className = "coach-card__body";
      const coachName = document.createElement("strong");
      coachName.textContent = coach.name;
      coachBody.appendChild(coachName);
      button.appendChild(coachBody);
      button.addEventListener("click", () => {
        fields.coach.value = coach.id;
        renderCoaches();
        updateSummary();
        clearStepError(2);
        focusChoice(`[data-coach-id="${coach.id}"]`);
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
    const activeHeading = steps.find((step) => Number(step.dataset.step) === currentStep)?.querySelector("h1");
    window.requestAnimationFrame(() => activeHeading?.focus({ preventScroll: true }));
  }

  function clearStepError(stepNumber) {
    const step = steps.find((item) => Number(item.dataset.step) === stepNumber);
    const error = step?.querySelector("[data-step-error]");
    if (error) error.textContent = "";
  }

  function showStepError(stepNumber, message, focusTarget) {
    if (currentStep !== stepNumber) showStep(stepNumber);
    const step = steps.find((item) => Number(item.dataset.step) === stepNumber);
    const error = step?.querySelector("[data-step-error]");
    if (error) error.textContent = message;
    if (focusTarget) {
      window.requestAnimationFrame(() => {
        const target = typeof focusTarget === "string" ? document.querySelector(focusTarget) : focusTarget;
        target?.focus({ preventScroll: true });
        target?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  }

  function validateStep(stepNumber) {
    const step = steps.find((item) => Number(item.dataset.step) === stepNumber);
    const error = step?.querySelector("[data-step-error]");
    if (error) error.textContent = "";
    if (stepNumber === 1) {
      const validRegion = fields.region.value === "florianopolis" || fields.region.value === "online";
      if (!selectedModality() || !validRegion || !selectedPlan()) {
        showStepError(1, "Escolha a modalidade, o formato e o plano para continuar.", "#plan-options button");
        return false;
      }
    }
    if (stepNumber === 2) {
      if (!fields.coach.value || !coachesForSelectedModality().some((coach) => coach.id === fields.coach.value)) {
        fields.coach.value = "";
        renderCoaches();
        showStepError(2, "Escolha um treinador disponível para esta modalidade.", "#coach-options button");
        return false;
      }
    }
    if (stepNumber === 3) {
      clearStepFieldErrors(["name", "whatsapp", "email", "cpf"]);
      const validationErrors = [];
      if (clean(fields.name.value).length < 3) validationErrors.push(["name", "Informe seu nome com pelo menos 3 caracteres."]);
      if (!normalizeBrazilPhone(fields.whatsapp.value)) validationErrors.push(["whatsapp", "Informe um WhatsApp brasileiro válido, com DDD."]);
      if (!isValidEmail(fields.email.value)) validationErrors.push(["email", "Informe um e-mail válido."]);
      if (!isValidCpf(fields.cpf.value)) validationErrors.push(["cpf", "CPF inválido. Confira os números digitados."]);
      validationErrors.forEach(([fieldName, message]) => setFieldError(fieldName, message));
      if (validationErrors.length) {
        showStepError(3, "Revise os campos destacados para continuar.");
        focusField(validationErrors[0][0]);
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
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), CATALOG_TIMEOUT_MS);
    try {
      const response = await fetch(ENDPOINT, { headers: { Accept: "application/json" }, signal: controller.signal });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Falha ao carregar catálogo");
      catalog = {
        plans: Array.isArray(data.plans) ? data.plans : [],
        modalities: Array.isArray(data.modalities) ? data.modalities : [],
        coaches: Array.isArray(data.coaches) ? data.coaches : [],
      };
      const requestedModality = slug(query.get("modalidade"));
      const wantedModality = requestedModality === "multisport" ? "2-modalidades" : requestedModality;
      const initialModality = catalog.modalities.find((item) => slug(item.name) === wantedModality) || catalog.modalities[0];
      fields.modality.value = initialModality?.id || "";
      fields.region.value = query.get("regiao") === "online" || query.get("regiao") === "outras" ? "online" : "florianopolis";
      selectInitialPlan();
      const wantedCoach = query.get("treinador");
      const coach = coachesForSelectedModality().find((item) => coachMatchesQuery(item, wantedCoach));
      if (coach) fields.coach.value = coach.id;
      renderModalities();
      renderRegions();
      renderPlans();
      renderCoaches();
      updateSummary();
    } catch (error) {
      el("modality-options").textContent = error?.name === "AbortError"
        ? "O carregamento demorou demais. Atualize a página para tentar novamente."
        : "Não foi possível carregar as opções agora.";
      el("plan-options").textContent = "Atualize a página e tente novamente.";
      el("coach-options").textContent = "Atualize a página e tente novamente.";
      form.querySelectorAll("button").forEach((button) => { if (button.hasAttribute("data-next-step")) button.disabled = true; });
      console.error("prospect catalog", error);
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  function utm() {
    return Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]
      .map((key) => [key, query.get(key)])
      .filter(([, value]) => value));
  }

  function validateFinalStep() {
    clearStepFieldErrors(["zip", "street", "number", "neighborhood", "city", "state", "terms"]);
    const validationErrors = [];
    if (digits(fields.zip.value).length !== 8) validationErrors.push(["zip", "Informe um CEP com 8 dígitos."]);
    if (!clean(fields.street.value)) validationErrors.push(["street", "Informe a rua."]);
    if (!clean(fields.number.value)) validationErrors.push(["number", "Informe o número do endereço."]);
    if (!clean(fields.neighborhood.value)) validationErrors.push(["neighborhood", "Informe o bairro."]);
    if (!clean(fields.city.value)) validationErrors.push(["city", "Informe a cidade."]);
    if (!isValidState(fields.state.value)) validationErrors.push(["state", "Informe uma UF válida."]);
    if (!fields.terms.checked) validationErrors.push(["terms", "Leia e aceite os Termos de Contrato para continuar."]);
    validationErrors.forEach(([fieldName, message]) => setFieldError(fieldName, message));
    if (validationErrors.length) {
      showStepError(4, "Revise os campos destacados antes de enviar.");
      focusField(validationErrors[0][0]);
      setStatus("error", "Revise os campos destacados antes de enviar.");
      return false;
    }
    return true;
  }

  let inMemoryRequestId = "";

  function createRequestId() {
    if (typeof crypto?.randomUUID === "function") return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`;
  }

  function getOrCreateRequestId() {
    if (isUuid(inMemoryRequestId)) return inMemoryRequestId;
    try {
      const storedRequestId = window.sessionStorage.getItem(REQUEST_ID_KEY);
      if (isUuid(storedRequestId)) {
        inMemoryRequestId = storedRequestId;
        return inMemoryRequestId;
      }
    } catch (storageError) {
      console.warn("Não foi possível recuperar a referência do envio.", storageError);
    }
    inMemoryRequestId = createRequestId();
    try {
      window.sessionStorage.setItem(REQUEST_ID_KEY, inMemoryRequestId);
    } catch (storageError) {
      console.warn("Não foi possível guardar a referência do envio.", storageError);
    }
    return inMemoryRequestId;
  }

  function clearRequestId() {
    inMemoryRequestId = "";
    try {
      window.sessionStorage.removeItem(REQUEST_ID_KEY);
    } catch (storageError) {
      console.warn("Não foi possível limpar a referência anterior.", storageError);
    }
  }

  function shortReference(requestId) {
    return `EON-${String(requestId || "").slice(0, 8).toUpperCase()}`;
  }

  const serverFieldAliases = {
    full_name: "name",
    name: "name",
    nome: "name",
    whatsapp: "whatsapp",
    phone: "whatsapp",
    email: "email",
    cpf: "cpf",
    address_zip: "zip",
    zip: "zip",
    cep: "zip",
    address_street: "street",
    street: "street",
    address_number: "number",
    number: "number",
    address_neighborhood: "neighborhood",
    neighborhood: "neighborhood",
    address_city: "city",
    city: "city",
    address_state: "state",
    state: "state",
    uf: "state",
    terms_accepted: "terms",
    terms: "terms",
    plan_id: "plan",
    plan: "plan",
    coach_id: "coach",
    coach: "coach",
    turnstile_token: "turnstile",
    turnstile: "turnstile",
  };
  const serverCodeFields = {
    INVALID_NAME: "name",
    INVALID_PHONE: "whatsapp",
    INVALID_WHATSAPP: "whatsapp",
    INVALID_EMAIL: "email",
    INVALID_CPF: "cpf",
    INVALID_ZIP: "zip",
    INVALID_STREET: "street",
    INVALID_ADDRESS_NUMBER: "number",
    INVALID_NEIGHBORHOOD: "neighborhood",
    INVALID_CITY: "city",
    INVALID_STATE: "state",
    TERMS_REQUIRED: "terms",
    INVALID_TERMS: "terms",
    INVALID_PLAN: "plan",
    PLAN_UNAVAILABLE: "plan",
    INVALID_COACH: "coach",
    COACH_UNAVAILABLE: "coach",
    TURNSTILE_REQUIRED: "turnstile",
    TURNSTILE_INVALID: "turnstile",
    TURNSTILE_EXPIRED: "turnstile",
  };
  const serverFieldMessages = {
    name: "Informe seu nome com pelo menos 3 caracteres.",
    whatsapp: "Informe um WhatsApp brasileiro válido, com DDD.",
    email: "Informe um e-mail válido.",
    cpf: "CPF inválido. Confira os números digitados.",
    zip: "Informe um CEP com 8 dígitos.",
    street: "Informe a rua.",
    number: "Informe o número do endereço.",
    neighborhood: "Informe o bairro.",
    city: "Informe a cidade.",
    state: "Informe uma UF válida.",
    terms: "Leia e aceite os Termos de Contrato para continuar.",
    plan: "O plano escolhido não está mais disponível. Escolha outra opção.",
    coach: "O treinador escolhido não está mais disponível. Escolha outra opção.",
    turnstile: "A verificação de segurança expirou. Marque novamente.",
  };

  function normalizedServerErrors(value) {
    if (Array.isArray(value)) {
      return value.map((item) => typeof item === "string" ? { field: item } : item).filter(Boolean);
    }
    if (value && typeof value === "object") {
      return Object.entries(value).map(([field, detail]) => ({
        field,
        code: detail && typeof detail === "object" ? detail.code : "",
        message: typeof detail === "string" ? detail : detail?.message,
      }));
    }
    return [];
  }

  function applyServerFieldErrors(data) {
    const nestedError = data?.error && typeof data.error === "object" ? data.error : {};
    const code = String(data?.code || nestedError.code || "").toUpperCase();
    const errors = normalizedServerErrors(data?.field_errors || nestedError.field_errors);
    if (!errors.length && serverCodeFields[code]) errors.push({ field: serverCodeFields[code], code });
    const mapped = errors.map((item) => {
      const rawField = String(item?.field || "").toLowerCase();
      const fieldName = serverFieldAliases[rawField] || serverCodeFields[String(item?.code || "").toUpperCase()];
      return fieldName ? { fieldName, message: serverFieldMessages[fieldName] } : null;
    }).filter(Boolean);
    if (!mapped.length) return [];

    mapped.forEach(({ fieldName, message }) => {
      if (fieldErrorIds[fieldName]) setFieldError(fieldName, message);
    });
    const first = mapped[0].fieldName;
    if (first === "plan") {
      fields.plan.value = "";
      fields.coach.value = "";
      renderPlans();
      renderCoaches();
      updateSummary();
      showStepError(1, serverFieldMessages.plan, "#plan-options button");
      void loadCatalog();
    } else if (first === "coach") {
      fields.coach.value = "";
      renderCoaches();
      updateSummary();
      showStepError(2, serverFieldMessages.coach, "#coach-options button");
      void loadCatalog();
    } else if (["name", "whatsapp", "email", "cpf"].includes(first)) {
      showStepError(3, "Revise os campos destacados para continuar.");
      focusField(first);
    } else if (first !== "turnstile") {
      showStepError(4, "Revise os campos destacados antes de enviar.");
      focusField(first);
    }
    return mapped.map(({ fieldName }) => fieldName);
  }

  function setTurnstileError(message) {
    const turnstileError = el("turnstile-error");
    if (turnstileError) turnstileError.textContent = message || "";
  }

  function resetTurnstile(message) {
    setTurnstileError(message || "");
    try {
      window.turnstile?.reset();
    } catch (turnstileError) {
      console.warn("Não foi possível reiniciar a verificação de segurança.", turnstileError);
    }
  }

  function serverError(response, data) {
    const error = new Error("Falha ao enviar a pré-matrícula");
    error.kind = "server";
    error.status = response.status;
    error.data = data || {};
    return error;
  }

  function handleSubmissionError(error, requestId) {
    const reference = shortReference(requestId);
    if (error?.name === "AbortError") {
      setStatus("error", `O envio demorou mais que o esperado. Seus dados foram mantidos; tente novamente. Referência: ${reference}.`);
      return;
    }
    if (error?.code === "UNCONFIRMED_RESPONSE") {
      setStatus("error", `O servidor respondeu, mas não confirmou o protocolo. Não reenvie agora; fale com a equipe e informe ${reference}.`);
      return;
    }
    if (error?.kind !== "server") {
      setStatus("error", `Não foi possível conectar ao sistema. Seus dados foram mantidos; tente novamente. Referência: ${reference}.`);
      return;
    }

    const data = error.data || {};
    const nestedError = data.error && typeof data.error === "object" ? data.error : {};
    const code = String(data.code || nestedError.code || "").toUpperCase();
    const legacyMessage = typeof data.error === "string" ? data.error : "";

    if (!data.field_errors && !nestedError.field_errors) {
      if (/e-mail inválido/i.test(legacyMessage)) data.field_errors = [{ field: "email" }];
      if (/plano indisponível/i.test(legacyMessage)) data.field_errors = [{ field: "plan_id" }];
      if (/treinador indisponível/i.test(legacyMessage)) data.field_errors = [{ field: "coach_id" }];
    }
    const handledFields = applyServerFieldErrors(data);
    const hasFieldErrors = handledFields.length > 0;
    const isLegacyTurnstileError = error.status === 403 && !code && !/origem não permitida/i.test(legacyMessage);
    const isTurnstileError = isLegacyTurnstileError ||
      code.startsWith("TURNSTILE_") || handledFields.includes("turnstile");
    const isRateLimit = error.status === 429 || code === "RATE_LIMITED" ||
      /muitas tentativas|vários cadastros/i.test(legacyMessage);

    if (code === "IDEMPOTENCY_KEY_CONFLICT") {
      clearRequestId();
      setStatus("error", `Os dados foram alterados depois de uma tentativa anterior. Revise e envie novamente; será criada uma nova referência. Tentativa anterior: ${reference}.`);
    } else if (code === "SUBMISSION_REJECTED") {
      fields.website.value = "";
      setStatus("error", `A proteção anti-spam interrompeu o envio. O campo automático foi limpo; tente novamente. Referência: ${reference}.`);
    } else if (code === "MANUAL_REVIEW_REQUIRED") {
      setStatus("error", `Este cadastro precisa de conferência manual. Fale com a equipe e informe ${reference}.`);
    } else if (isTurnstileError) {
      const message = code === "TURNSTILE_UNAVAILABLE"
        ? "A verificação de segurança está temporariamente indisponível. Aguarde e tente novamente."
        : "A verificação de segurança expirou. Marque novamente e reenvie.";
      resetTurnstile(message);
      showStep(4);
      setStatus("error", `${message} Referência: ${reference}.`);
    } else if (isRateLimit) {
      setStatus("error", `Foram feitas muitas tentativas. Aguarde um pouco ou fale com a equipe informando ${reference}.`);
    } else if (hasFieldErrors) {
      if (currentStep === 4) setStatus("error", `Revise os campos destacados. Referência: ${reference}.`);
    } else if (error.status >= 500) {
      setStatus("error", `O sistema está temporariamente indisponível. Seus dados foram mantidos; tente novamente. Referência: ${reference}.`);
    } else {
      setStatus("error", `O servidor não aceitou um dos dados. Revise o formulário ou fale com a equipe informando ${reference}.`);
    }
  }

  function buildReceipt(data, requestId) {
    const responseRequestId = String(data.request_id || "");
    const submissionId = String(data.submission_id || "");
    if (data.ok !== true || !["created", "duplicate"].includes(data.status) ||
        !isUuid(submissionId) || !isUuid(data.contract_id) || responseRequestId !== requestId) return null;
    const receivedAt = new Date().toISOString();
    const parsedSubmittedAt = Date.parse(data.submitted_at || "");
    const modality = selectedModality();
    const plan = selectedPlan();
    const coach = selectedCoach();
    // A duplicate confirms an earlier attempt; its accepted choices may differ from fields edited after a lost response.
    const includeCurrentChoice = data.status === "created";
    return {
      version: 1,
      submissionId,
      requestId,
      contractId: data.contract_id,
      contractNumber: clean(data.contract_number),
      status: data.status,
      submittedAt: Number.isFinite(parsedSubmittedAt) ? new Date(parsedSubmittedAt).toISOString() : receivedAt,
      receivedAt,
      modality: includeCurrentChoice && modality ? modalityLabel(modality) : "",
      plan: includeCurrentChoice && plan ? planTitle(plan) : "",
      coach: includeCurrentChoice ? coach?.name || "" : "",
    };
  }

  function storeReceipt(receipt) {
    try {
      window.sessionStorage.setItem(RECEIPT_KEY, JSON.stringify(receipt));
      window.sessionStorage.removeItem("eonEnrollmentConfirmation");
      clearRequestId();
      return true;
    } catch (storageError) {
      console.warn("Não foi possível guardar o protocolo da pré-matrícula.", storageError);
      return false;
    }
  }

  window.eonTurnstileExpired = () => {
    const message = "A verificação de segurança expirou. Marque novamente antes de enviar.";
    setTurnstileError(message);
    setStatus("error", message);
  };
  window.eonTurnstileError = () => {
    const message = "Não foi possível carregar a verificação de segurança. Atualize a página e tente novamente.";
    setTurnstileError(message);
    setStatus("error", message);
  };

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (isSubmitting) return;
    setStatus("", "");
    setTurnstileError("");
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateFinalStep()) return;
    const turnstileToken = window.turnstile?.getResponse();
    if (!turnstileToken) {
      const message = "Conclua a verificação de segurança antes de enviar.";
      setTurnstileError(message);
      setStatus("error", message);
      return;
    }

    const requestId = getOrCreateRequestId();
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), SUBMIT_TIMEOUT_MS);
    let confirmed = false;
    isSubmitting = true;
    submit.disabled = true;
    submit.innerHTML = "Enviando com segurança…";
    setStatus("loading", "Registrando sua pré-matrícula no sistema da Endurance On…");
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          request_id: requestId,
          full_name: clean(fields.name.value),
          whatsapp: normalizeBrazilPhone(fields.whatsapp.value),
          email: clean(fields.email.value).toLowerCase(),
          cpf: digits(fields.cpf.value),
          plan_id: fields.plan.value,
          coach_id: fields.coach.value,
          region: fields.region.value,
          address_zip: digits(fields.zip.value),
          address_street: clean(fields.street.value),
          address_number: clean(fields.number.value),
          address_complement: clean(fields.complement.value),
          address_neighborhood: clean(fields.neighborhood.value),
          address_city: clean(fields.city.value),
          address_state: clean(fields.state.value).toUpperCase(),
          terms_accepted: fields.terms.checked,
          turnstile_token: turnstileToken,
          website: fields.website.value,
          landing_page: window.location.href,
          utm: utm(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw serverError(response, data);
      const receipt = buildReceipt(data, requestId);
      if (!receipt) {
        const error = new Error("Resposta sem protocolo confirmado");
        error.code = "UNCONFIRMED_RESPONSE";
        throw error;
      }
      confirmed = true;
      const receiptStored = storeReceipt(receipt);
      try {
        if (typeof window.gtag === "function") window.gtag("event", "submit_lead_form", { form_name: "onboarding_assessoria" });
      } catch (analyticsError) {
        console.warn("Não foi possível registrar a conversão no Analytics.", analyticsError);
      }
      if (!receiptStored) {
        const protocol = receipt.contractNumber || shortReference(receipt.requestId);
        submit.innerHTML = "Pré-matrícula recebida";
        setStatus("success", `Pré-matrícula recebida com segurança. Anote seu protocolo: ${protocol}.`);
        return;
      }
      window.location.assign("cadastro-recebido.html");
    } catch (error) {
      handleSubmissionError(error, requestId);
      resetTurnstile(el("turnstile-error")?.textContent || "");
    } finally {
      window.clearTimeout(timeoutId);
      if (!confirmed) {
        isSubmitting = false;
        submit.disabled = false;
        submit.innerHTML = 'Enviar pré-matrícula <span aria-hidden="true">→</span>';
      }
    }
  });

  el("current-year").textContent = new Date().getFullYear();
  showStep(1);
  void loadCatalog();
});
