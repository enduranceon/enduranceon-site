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

  try {
    const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
    const catalog = await response.json();
    if (!response.ok || !catalog.ok) throw new Error("Catálogo indisponível");

    const modality = catalog.modalities?.find((item) => slug(item.name) === "2-modalidades");
    if (!modality) throw new Error("Modalidade indisponível");

    const plans = (catalog.plans || []).filter((plan) => plan.modality_id === modality.id);
    const coaches = (catalog.coaches || []).filter((coach) =>
      Array.isArray(coach.modality_ids) && coach.modality_ids.includes(modality.id)
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

    let shown = 0;
    plans.forEach((plan) => {
      const period = slug(plan.period);
      const card = document.querySelector(`[data-plan-card="${period}"]`);
      if (!card) return;
      const total = document.querySelector(`[data-plan-total="${period}"]`);
      const monthly = document.querySelector(`[data-plan-monthly="${period}"]`);
      if (total) total.textContent = money.format(Number(plan.price_total));
      if (monthly) monthly.textContent = `Equivale a R$ ${money.format(Number(plan.price_monthly))}/mês`;
      card.style.display = "";
      shown += 1;
    });

    if (!shown) {
      status.textContent = "Não há planos disponíveis para contratação online no momento.";
      return;
    }

    const minimum = Math.min(...plans.map((plan) => Number(plan.price_monthly)));
    const minimumLabel = document.querySelector("[data-min-monthly-price]");
    if (minimumLabel && Number.isFinite(minimum)) minimumLabel.textContent = `R$ ${money.format(minimum)}`;
    document.querySelector("[data-public-price]").style.display = "";
    document.querySelector("[data-public-plans]").style.display = "";
    status.hidden = true;
  } catch (error) {
    status.textContent = "Não foi possível carregar os planos agora. Atualize a página e tente novamente.";
    if (coachList) coachList.textContent = "Treinadores indisponíveis no momento.";
    console.error("multisport catalog", error);
  }
});
