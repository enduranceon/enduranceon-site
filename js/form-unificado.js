document.addEventListener("DOMContentLoaded", function () {
  const ENDPOINT = "https://bsiljrrodgtmtdilnuxr.supabase.co/functions/v1/public-assessment-prospect";
  const form = document.getElementById("unified-form");
  if (!form) return;

  const el = (id) => document.getElementById(id);
  const fields = {
    name: el("nome-completo"), whatsapp: el("whatsapp"), email: el("email"), cpf: el("cpf"),
    zip: el("cep"), modality: el("modalidade"), plan: el("plano"), region: el("regiao"),
    coach: el("treinador"), street: el("address_street"), number: el("address_number"),
    complement: el("address_complement"), neighborhood: el("address_neighborhood"),
    city: el("address_city"), state: el("address_state"), terms: el("termos"), website: el("website"),
  };
  const status = el("form-status");
  const submit = form.querySelector('button[type="submit"]');
  let catalog = { plans: [], modalities: [], coaches: [] };

  const digits = (value) => String(value || "").replace(/\D/g, "");
  const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const query = new URLSearchParams(window.location.search);
  const slug = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  function setStatus(type, message) {
    status.className = `form-status ${type ? `is-${type}` : ""}`;
    status.textContent = message || "";
  }

  function maskCpf(value) {
    const d = digits(value).slice(0, 11);
    return d.replace(/^(\d{3})(\d)/, "$1.$2").replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  function maskPhone(value) {
    const d = digits(value).slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  function maskZip(value) {
    const d = digits(value).slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  }

  fields.cpf.addEventListener("input", () => { fields.cpf.value = maskCpf(fields.cpf.value); });
  fields.whatsapp.addEventListener("input", () => { fields.whatsapp.value = maskPhone(fields.whatsapp.value); });
  fields.zip.addEventListener("input", () => {
    fields.zip.value = maskZip(fields.zip.value);
    if (digits(fields.zip.value).length === 8) void lookupZip();
  });

  async function lookupZip() {
    const zip = digits(fields.zip.value);
    if (zip.length !== 8) return;
    el("cep-status").textContent = "Buscando endereço...";
    try {
      const response = await fetch(`https://viacep.com.br/ws/${zip}/json/`);
      const data = await response.json();
      if (!response.ok || data.erro) throw new Error("CEP não encontrado");
      fields.street.value = data.logradouro || "";
      fields.neighborhood.value = data.bairro || "";
      fields.city.value = data.localidade || "";
      fields.state.value = data.uf || "";
      el("cep-status").textContent = "Endereço preenchido automaticamente.";
      fields.number.focus();
    } catch {
      el("cep-status").textContent = "CEP não encontrado. Preencha o endereço manualmente.";
    }
  }

  function modalityId() {
    const selected = catalog.modalities.find((item) => slug(item.name) === slug(fields.modality.value));
    return selected?.id || "";
  }

  function renderPlans() {
    const selectedModality = modalityId();
    const plans = catalog.plans.filter((plan) => plan.modality_id === selectedModality);
    fields.plan.innerHTML = '<option value="">Selecione o plano</option>';
    plans.forEach((plan) => {
      const option = document.createElement("option");
      option.value = plan.id;
      const months = Number(plan.period_months) || 1;
      const label = plan.name || `${fields.modality.options[fields.modality.selectedIndex].text} - ${plan.period}`;
      option.textContent = `${label} — ${money.format(Number(plan.price_monthly))}/mês (${months} ${months === 1 ? "mês" : "meses"})`;
      fields.plan.appendChild(option);
    });
    fields.plan.disabled = plans.length === 0;

    const wantedPeriod = query.get("periodicidade") || query.get("periodo");
    if (wantedPeriod) {
      const match = plans.find((plan) => slug(plan.period) === slug(wantedPeriod));
      if (match) fields.plan.value = match.id;
    }
    updateSummary();
  }

  function renderCoaches() {
    fields.coach.innerHTML = '<option value="">Selecione o treinador</option>';
    catalog.coaches.forEach((coach) => {
      const option = document.createElement("option");
      option.value = coach.id;
      option.textContent = coach.name;
      fields.coach.appendChild(option);
    });
    fields.coach.disabled = false;
    const wanted = query.get("treinador");
    const match = catalog.coaches.find((coach) => slug(coach.name) === slug(wanted));
    if (match) fields.coach.value = match.id;
  }

  function updateSummary() {
    const box = el("plano-resumo");
    const plan = catalog.plans.find((item) => item.id === fields.plan.value);
    if (!fields.modality.value && !plan && !fields.region.value) return;
    el("resumo-modalidade").textContent = fields.modality.options[fields.modality.selectedIndex]?.text || "—";
    el("resumo-periodicidade").textContent = plan ? (plan.name || plan.period) : "Escolha o plano";
    el("resumo-regiao").textContent = fields.region.options[fields.region.selectedIndex]?.text || "—";
    box.style.display = "block";
  }

  async function loadCatalog() {
    try {
      const response = await fetch(ENDPOINT);
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Falha ao carregar planos");
      catalog = data;
      const wantedModality = query.get("modalidade");
      if (wantedModality) fields.modality.value = wantedModality;
      const wantedRegion = query.get("regiao");
      if (wantedRegion) fields.region.value = wantedRegion;
      renderPlans();
      renderCoaches();
      updateSummary();
    } catch (error) {
      setStatus("error", "Não foi possível carregar os planos agora. Atualize a página e tente novamente.");
      submit.disabled = true;
      console.error("prospect catalog", error);
    }
  }

  fields.modality.addEventListener("change", renderPlans);
  fields.plan.addEventListener("change", updateSummary);
  fields.region.addEventListener("change", updateSummary);

  function utm() {
    return Object.fromEntries(["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]
      .map((key) => [key, query.get(key)]).filter(([, value]) => value));
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    if (!form.checkValidity()) return form.reportValidity();
    const turnstileToken = window.turnstile?.getResponse();
    if (!turnstileToken) return setStatus("error", "Confirme a verificação de segurança antes de enviar.");

    submit.disabled = true;
    submit.textContent = "Enviando...";
    setStatus("loading", "Registrando sua pré-matrícula...");
    const requestId = crypto.randomUUID();
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          full_name: fields.name.value,
          whatsapp: fields.whatsapp.value,
          email: fields.email.value,
          cpf: fields.cpf.value,
          plan_id: fields.plan.value,
          coach_id: fields.coach.value,
          region: fields.region.value,
          address_zip: fields.zip.value,
          address_street: fields.street.value,
          address_number: fields.number.value,
          address_complement: fields.complement.value,
          address_neighborhood: fields.neighborhood.value,
          address_city: fields.city.value,
          address_state: fields.state.value,
          terms_accepted: fields.terms.checked,
          turnstile_token: turnstileToken,
          website: fields.website.value,
          landing_page: window.location.href,
          utm: utm(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || "Não foi possível enviar o cadastro");
      if (typeof window.gtag === "function") window.gtag("event", "submit_lead_form");
      window.location.href = "cadastro-recebido.html";
    } catch (error) {
      setStatus("error", error.message || "Não foi possível enviar. Tente novamente.");
      window.turnstile?.reset();
      submit.disabled = false;
      submit.textContent = "Enviar Cadastro";
    }
  });

  void loadCatalog();
});
