// Lista de espera de um treinador sem vagas. Depende de cadastro.js (carregado antes), que expõe EonEnrollmentUtils.
if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", function () {
  const ENDPOINT = "https://bsiljrrodgtmtdilnuxr.supabase.co/functions/v1/public-coach-waitlist";
  const CATALOG_URL = "https://bsiljrrodgtmtdilnuxr.supabase.co/functions/v1/public-assessment-prospect";
  const REQUEST_ID_KEY = "eonWaitlistRequestId";
  const PREFILL_KEY = "eonWaitlistPrefill";
  const PREFILL_MAX_AGE_MS = 30 * 60 * 1000;
  const SUBMIT_TIMEOUT_MS = 20_000;
  const CATALOG_TIMEOUT_MS = 15_000;
  const form = document.getElementById("wl-form");
  if (!form) return;

  const { clean, coachPlansForModality, isUuid, isValidEmail, maskPhone, normalizeBrazilPhone, slug } = EonEnrollmentUtils;
  const el = (id) => document.getElementById(id);
  const query = new URLSearchParams(window.location.search);
  const fields = {
    name: el("wl-nome"),
    whatsapp: el("wl-whatsapp"),
    email: el("wl-email"),
    notes: el("wl-notes"),
    website: el("website"),
  };
  const fieldErrorIds = {
    name: "wl-nome-error",
    whatsapp: "wl-whatsapp-error",
    email: "wl-email-error",
    region: "wl-region-error",
    notes: "wl-notes-error",
  };
  const status = el("wl-status");
  const submit = form.querySelector('button[type="submit"]');
  const regionLabels = { florianopolis: "Florianópolis", online: "Outras cidades / online" };
  const states = ["loading", "unavailable", "open", "form", "done"];
  const panels = { loading: "wl-loading", unavailable: "wl-unavailable", open: "wl-open", form: "wl-form", done: "wl-done" };
  let catalog = { modalities: [], coaches: [] };
  let coach = null;
  let modality = null;
  let region = query.get("regiao") === "online" || query.get("regiao") === "outras" ? "online" : "florianopolis";
  let isSubmitting = false;

  function showState(name) {
    states.forEach((state) => { el(panels[state]).hidden = state !== name; });
    const heading = el(panels[name]).querySelector("h1");
    window.requestAnimationFrame(() => heading?.focus({ preventScroll: true }));
  }

  function setStatus(type, message) {
    status.className = `form-status ${type ? `is-${type}` : ""}`;
    status.textContent = message || "";
    status.setAttribute("role", type === "error" ? "alert" : "status");
  }

  function setFieldError(fieldName, message) {
    const error = el(fieldErrorIds[fieldName]);
    fields[fieldName]?.classList.add("is-invalid");
    fields[fieldName]?.setAttribute("aria-invalid", "true");
    if (error) error.textContent = message;
  }

  function clearFieldError(fieldName) {
    const error = el(fieldErrorIds[fieldName]);
    fields[fieldName]?.classList.remove("is-invalid");
    fields[fieldName]?.removeAttribute("aria-invalid");
    if (error) error.textContent = "";
  }

  function setTurnstileError(message) {
    const error = el("wl-turnstile-error");
    if (error) error.textContent = message || "";
  }

  function resetTurnstile(message) {
    setTurnstileError(message || "");
    try {
      window.turnstile?.reset();
    } catch (turnstileError) {
      console.warn("Não foi possível reiniciar a verificação de segurança.", turnstileError);
    }
  }

  function renderRegions() {
    form.querySelectorAll("[data-region]").forEach((button) => {
      button.classList.toggle("is-selected", button.dataset.region === region);
      button.setAttribute("aria-pressed", String(button.dataset.region === region));
    });
    el("wl-summary-region").textContent = regionLabels[region] || "A escolher";
  }

  form.querySelectorAll("[data-region]").forEach((button) => {
    button.addEventListener("click", () => {
      region = button.dataset.region;
      renderRegions();
      clearFieldError("region");
    });
  });

  fields.whatsapp.addEventListener("input", () => { fields.whatsapp.value = maskPhone(fields.whatsapp.value); });
  ["name", "whatsapp", "email", "notes"].forEach((name) => fields[name].addEventListener("input", () => clearFieldError(name)));

  function modalityFromQuery() {
    const requested = slug(query.get("modalidade"));
    const wanted = requested === "multisport" ? "2-modalidades" : requested;
    if (!wanted || !coach) return null;
    const match = catalog.modalities.find((item) => slug(item.name) === wanted);
    // Só vale a modalidade em que o treinador vende plano no site (mesma regra do cadastro).
    return match && coachPlansForModality(coach, match.id).length ? match : null;
  }

  // O cadastro guarda nome, WhatsApp e e-mail por alguns minutos quando o treinador lota no meio do preenchimento.
  function applyPrefill() {
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(PREFILL_KEY) || "null");
      window.sessionStorage.removeItem(PREFILL_KEY);
      if (!saved || Date.now() - Number(saved.savedAt) > PREFILL_MAX_AGE_MS) return;
      if (clean(saved.name)) fields.name.value = clean(saved.name).slice(0, 160);
      if (clean(saved.whatsapp)) fields.whatsapp.value = maskPhone(saved.whatsapp);
      if (clean(saved.email)) fields.email.value = clean(saved.email).slice(0, 180);
    } catch (storageError) {
      console.warn("Não foi possível recuperar os dados já digitados.", storageError);
    }
  }

  function renderCoach() {
    el("wl-summary-coach").textContent = coach.name;
    el("wl-summary-modality").textContent = modality ? modalityLabel(modality) : "A definir com a equipe";
    el("wl-coach-title").textContent = coach.name;
    renderRegions();
  }

  function modalityLabel(item) {
    const name = String(item?.name || "").trim();
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : "";
  }

  async function loadCatalog() {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), CATALOG_TIMEOUT_MS);
    try {
      const response = await fetch(CATALOG_URL, { headers: { Accept: "application/json" }, signal: controller.signal });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Falha ao carregar o catálogo");
      catalog = {
        modalities: Array.isArray(data.modalities) ? data.modalities : [],
        coaches: Array.isArray(data.coaches) ? data.coaches : [],
      };
      const wantedId = clean(query.get("coach"));
      coach = isUuid(wantedId) ? catalog.coaches.find((item) => item.id === wantedId) || null : null;
      if (!coach) {
        showState("unavailable");
        return;
      }
      modality = modalityFromQuery();
      if (coach.accepting_new_students !== false) {
        el("wl-open-name").textContent = coach.name;
        showState("open");
        return;
      }
      applyPrefill();
      renderCoach();
      showState("form");
    } catch (error) {
      el("wl-unavailable-title").innerHTML = "Não foi possível <em>carregar</em>";
      el("wl-unavailable-text").textContent = error?.name === "AbortError"
        ? "O carregamento demorou demais. Atualize a página para tentar novamente."
        : "Atualize a página e tente novamente. Se continuar, fale com a equipe pelo WhatsApp.";
      showState("unavailable");
      console.error("waitlist catalog", error);
    } finally {
      window.clearTimeout(timeoutId);
    }
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

  const shortReference = (requestId) => `EON-${String(requestId || "").slice(0, 8).toUpperCase()}`;

  function utm() {
    return Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]
      .map((key) => [key, query.get(key)])
      .filter(([, value]) => value));
  }

  const serverFieldNames = { full_name: "name", whatsapp: "whatsapp", email: "email", region: "region", notes: "notes", turnstile_token: "turnstile", coach_id: "coach" };
  const serverFieldMessages = {
    name: "Informe seu nome com pelo menos 3 caracteres.",
    whatsapp: "Informe um WhatsApp brasileiro válido, com DDD.",
    email: "Informe um e-mail válido ou deixe em branco.",
    region: "Escolha onde você vai treinar.",
    notes: "O recado ficou grande demais. Resuma em até 500 caracteres.",
  };

  function validate() {
    ["name", "whatsapp", "email", "region", "notes"].forEach(clearFieldError);
    const errors = [];
    if (clean(fields.name.value).length < 3) errors.push(["name", serverFieldMessages.name]);
    if (!normalizeBrazilPhone(fields.whatsapp.value)) errors.push(["whatsapp", serverFieldMessages.whatsapp]);
    if (clean(fields.email.value) && !isValidEmail(fields.email.value)) errors.push(["email", serverFieldMessages.email]);
    if (!regionLabels[region]) errors.push(["region", serverFieldMessages.region]);
    errors.forEach(([fieldName, message]) => setFieldError(fieldName, message));
    if (errors.length) {
      setStatus("error", "Revise os campos destacados antes de enviar.");
      const first = errors[0][0];
      (fields[first] || form.querySelector("[data-region]"))?.focus();
      return false;
    }
    return true;
  }

  function handleError(error, requestId) {
    const reference = shortReference(requestId);
    if (error?.name === "AbortError") {
      setStatus("error", `O envio demorou mais que o esperado. Seus dados foram mantidos; tente novamente. Referência: ${reference}.`);
      return;
    }
    if (error?.kind !== "server") {
      setStatus("error", `Não foi possível conectar ao sistema. Seus dados foram mantidos; tente novamente. Referência: ${reference}.`);
      return;
    }
    const data = error.data || {};
    const code = String(data.code || "").toUpperCase();
    const fieldErrors = Array.isArray(data.field_errors) ? data.field_errors : [];
    const fieldCodes = fieldErrors.map((item) => String(item?.code || "").toUpperCase());
    const mapped = fieldErrors.map((item) => serverFieldNames[String(item?.field || "").toLowerCase()]).filter(Boolean);
    mapped.filter((name) => fieldErrorIds[name]).forEach((name) => setFieldError(name, serverFieldMessages[name]));

    if (code === "IDEMPOTENCY_KEY_CONFLICT") {
      clearRequestId();
      setStatus("error", `Os dados foram alterados depois de uma tentativa anterior. Revise e envie novamente. Tentativa anterior: ${reference}.`);
    } else if (code === "SUBMISSION_REJECTED") {
      fields.website.value = "";
      setStatus("error", `A proteção anti-spam interrompeu o envio. Tente novamente. Referência: ${reference}.`);
    } else if (code.startsWith("TURNSTILE_") || mapped.includes("turnstile") || (error.status === 403 && !code)) {
      const message = code === "TURNSTILE_UNAVAILABLE"
        ? "A verificação de segurança está temporariamente indisponível. Aguarde e tente novamente."
        : "A verificação de segurança expirou. Marque novamente e reenvie.";
      resetTurnstile(message);
      setStatus("error", `${message} Referência: ${reference}.`);
    } else if (error.status === 429 || code === "RATE_LIMITED") {
      setStatus("error", `Foram feitas muitas tentativas. Aguarde um pouco ou fale com a equipe informando ${reference}.`);
    } else if (mapped.includes("coach") || fieldCodes.includes("INVALID_COACH")) {
      setStatus("error", "Este treinador não está mais disponível no site. Volte e escolha outra opção, ou fale com a equipe.");
    } else if (mapped.length) {
      setStatus("error", "Revise os campos destacados antes de enviar.");
    } else if (error.status >= 500) {
      setStatus("error", `O sistema está temporariamente indisponível. Seus dados foram mantidos; tente novamente. Referência: ${reference}.`);
    } else {
      setStatus("error", `O servidor não aceitou um dos dados. Revise o formulário ou fale com a equipe informando ${reference}.`);
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
    if (isSubmitting || !coach) return;
    setStatus("", "");
    setTurnstileError("");
    if (!validate()) return;
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
    setStatus("loading", "Registrando você na lista de espera…");
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          request_id: requestId,
          coach_id: coach.id,
          modality_id: modality?.id || "",
          full_name: clean(fields.name.value),
          whatsapp: normalizeBrazilPhone(fields.whatsapp.value),
          email: clean(fields.email.value).toLowerCase(),
          region,
          notes: String(fields.notes.value || "").trim().slice(0, 500),
          turnstile_token: turnstileToken,
          website: fields.website.value,
          landing_page: window.location.href,
          utm: utm(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const failure = new Error("Falha ao entrar na lista de espera");
        failure.kind = "server";
        failure.status = response.status;
        failure.data = data || {};
        throw failure;
      }
      if (data.ok !== true || !["created", "duplicate"].includes(data.status) || data.request_id !== requestId) {
        const failure = new Error("Resposta sem confirmação");
        failure.kind = "unconfirmed";
        throw failure;
      }
      confirmed = true;
      clearRequestId();
      try {
        if (typeof window.gtag === "function") window.gtag("event", "waitlist_submit", { form_name: "lista_de_espera" });
      } catch (analyticsError) {
        console.warn("Não foi possível registrar o evento no Analytics.", analyticsError);
      }
      el("wl-done-title").innerHTML = data.status === "duplicate" ? "Você já está na <em>lista de espera</em>" : "Você está na <em>lista de espera</em>";
      el("wl-done-text").textContent = `A equipe da Endurance On vai falar com você pelo WhatsApp sobre a vaga com ${coach.name}. Não precisa enviar de novo.`;
      el("wl-done-reference").textContent = `Referência: ${shortReference(requestId)}`;
      showState("done");
    } catch (error) {
      if (error?.kind === "unconfirmed") {
        setStatus("error", `O servidor respondeu, mas não confirmou a inscrição. Não reenvie agora; fale com a equipe e informe ${shortReference(requestId)}.`);
      } else {
        handleError(error, requestId);
      }
      resetTurnstile(el("wl-turnstile-error")?.textContent || "");
    } finally {
      window.clearTimeout(timeoutId);
      if (!confirmed) {
        isSubmitting = false;
        submit.disabled = false;
        submit.innerHTML = 'Entrar na lista de espera <span aria-hidden="true">→</span>';
      }
    }
  });

  el("current-year").textContent = new Date().getFullYear();
  renderRegions();
  showState("loading");
  void loadCatalog();
});
