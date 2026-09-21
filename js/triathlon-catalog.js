document.addEventListener("DOMContentLoaded", async () => {
  const endpoint = "https://bsiljrrodgtmtdilnuxr.supabase.co/functions/v1/public-assessment-prospect";
  const slug = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const money = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
  const status = document.querySelector("[data-plans-status]");
  const coachList = document.querySelector("[data-public-coaches]");
  const priceBox = document.querySelector("[data-public-price]");
  const cards = document.querySelector("[data-public-plans]");
  const enrollmentFee = document.querySelector("[data-enrollment-fee]");
  const periods = ["mensal", "trimestral", "semestral"];

  try {
    const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
    const catalog = await response.json();
    if (!response.ok || !catalog.ok) throw new Error("Catálogo indisponível");

    const modality = catalog.modalities?.find((item) => slug(item.name) === "triathlon");
    if (!modality) throw new Error("Modalidade indisponível");

    const available = (catalog.plans || []).filter((plan) =>
      plan.modality_id === modality.id &&
      plan.active !== false &&
      plan.available_online !== false &&
      plan.id &&
      Number(plan.price_monthly) > 0 &&
      Number(plan.price_total) > 0
    );
    const regular = available.filter((plan) => !slug(plan.name).includes("essencial"));
    const plans = regular.length ? regular : available;
    const coaches = (catalog.coaches || []).filter((coach) =>
      coach.active !== false &&
      coach.public_visible !== false &&
      Array.isArray(coach.modality_ids) &&
      coach.modality_ids.includes(modality.id)
    );

    if (coachList) {
      if (!coaches.length) coachList.textContent = "Não há treinadores disponíveis no momento.";
      else coachList.replaceChildren(...coaches.map((coach) => {
        const tag = document.createElement("span");
        tag.className = "treinador-tag";
        tag.textContent = coach.name;
        return tag;
      }));
    }

    if (!plans.length || !coaches.length) {
      status.textContent = "Não há planos disponíveis para contratação online no momento.";
      return;
    }

    const region = new URLSearchParams(window.location.search).get("regiao");
    let shown = 0;
    for (const period of periods) {
      const plan = plans.find((item) => slug(item.period) === period);
      const card = document.querySelector(`[data-plan-card="${period}"]`);
      if (!plan || !card) continue;

      card.querySelector(`[data-plan-total="${period}"]`).textContent =
        money.format(Number(plan.price_total));
      const monthly = card.querySelector(`[data-plan-monthly="${period}"]`);
      if (monthly) monthly.textContent =
        `Equivale a R$ ${money.format(Number(plan.price_monthly))}/mês`;
      const installments = card.querySelector(`[data-plan-installments="${period}"]`);
      if (installments) installments.textContent =
        `Em até ${Number(plan.max_installments) || Number(plan.period_months)}x`;

      const url = new URL("cadastro-unificado.html", window.location.href);
      url.searchParams.set("modalidade", "triathlon");
      url.searchParams.set("periodicidade", period);
      url.searchParams.set("plan_id", plan.id);
      if (region === "florianopolis" || region === "online") {
        url.searchParams.set("regiao", region);
      }
      card.querySelector(".contratar-button").href = url.href;
      card.style.display = "";
      shown += 1;
    }

    if (!shown) {
      status.textContent = "Não há planos disponíveis para contratação online no momento.";
      return;
    }

    const minimum = Math.min(...plans.map((plan) => Number(plan.price_monthly)));
    if (Number.isFinite(minimum)) {
      document.querySelector("[data-min-monthly-price]").textContent = `R$ ${money.format(minimum)}`;
      priceBox.style.display = "";
    }

    const fees = [...new Set(plans.map((plan) => Number(plan.enrollment_fee)))];
    if (fees.length === 1 && fees[0] > 0) {
      enrollmentFee.textContent =
        `Taxa de Matrícula: R$ ${money.format(fees[0])} (valor único, adicionado à primeira cobrança).`;
      enrollmentFee.hidden = false;
    }
    cards.style.display = "";
    status.hidden = true;
  } catch (error) {
    status.textContent = "Não foi possível carregar os planos agora. Atualize a página e tente novamente.";
    if (coachList) coachList.textContent = "Treinadores indisponíveis no momento.";
    console.error("triathlon catalog", error);
  }
});
