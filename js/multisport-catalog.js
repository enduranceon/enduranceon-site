document.addEventListener("DOMContentLoaded", async () => {
  const endpoint = "https://bsiljrrodgtmtdilnuxr.supabase.co/functions/v1/public-assessment-prospect";
  const slug = (value) => String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const money = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

  try {
    const response = await fetch(endpoint, { headers: { Accept: "application/json" } });
    const catalog = await response.json();
    if (!response.ok || !catalog.ok) return;

    const modality = catalog.modalities?.find((item) => slug(item.name) === "2-modalidades");
    if (!modality) return;

    const plans = (catalog.plans || []).filter((plan) => plan.modality_id === modality.id);
    plans.forEach((plan) => {
      const period = slug(plan.period);
      const total = document.querySelector(`[data-plan-total="${period}"]`);
      const monthly = document.querySelector(`[data-plan-monthly="${period}"]`);
      if (total) total.textContent = money.format(Number(plan.price_total));
      if (monthly) monthly.textContent = `Equivale a R$ ${money.format(Number(plan.price_monthly))}/mês`;
    });

    if (plans.length) {
      const minimum = Math.min(...plans.map((plan) => Number(plan.price_monthly)));
      const minimumLabel = document.querySelector("[data-min-monthly-price]");
      if (minimumLabel && Number.isFinite(minimum)) minimumLabel.textContent = `R$ ${money.format(minimum)}`;
    }

    const coachList = document.querySelector("[data-public-coaches]");
    if (!coachList) return;
    const coaches = (catalog.coaches || []).filter((coach) =>
      Array.isArray(coach.modality_ids) && coach.modality_ids.includes(modality.id)
    );
    if (!coaches.length) return;
    coachList.replaceChildren(...coaches.map((coach) => {
      const tag = document.createElement("span");
      tag.className = "treinador-tag";
      tag.textContent = coach.name;
      return tag;
    }));
  } catch (error) {
    console.error("multisport catalog", error);
  }
});
