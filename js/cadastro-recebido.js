document.addEventListener("DOMContentLoaded", function () {
  const WHATSAPP_NUMBER = "5548991178688";
  const whatsappAction = document.getElementById("whatsapp-action");
  const summary = document.getElementById("success-summary");

  document.getElementById("current-year").textContent = new Date().getFullYear();

  let choice = {};
  try {
    choice = JSON.parse(window.sessionStorage.getItem("eonEnrollmentConfirmation") || "{}") || {};
  } catch (storageError) {
    console.warn("Não foi possível recuperar o resumo da pré-matrícula.", storageError);
  }

  const modality = String(choice.modality || "").trim();
  const plan = String(choice.plan || "").trim();
  const coach = String(choice.coach || "").trim();
  const hasCompleteChoice = Boolean(modality && plan && coach);

  if (hasCompleteChoice) {
    document.getElementById("success-modality").textContent = modality;
    document.getElementById("success-plan").textContent = plan;
    document.getElementById("success-coach").textContent = coach;
    summary.hidden = false;
  }

  const message = hasCompleteChoice
    ? `Olá! Preenchi o formulário para treinar com vocês na modalidade ${modality}, no plano ${plan}, com o coach ${coach}. Gostaria de seguir com a minha matrícula.`
    : "Olá! Preenchi o formulário para treinar com vocês e gostaria de seguir com a minha matrícula.";

  whatsappAction.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
});
