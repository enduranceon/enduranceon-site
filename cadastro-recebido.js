document.addEventListener("DOMContentLoaded", function () {
  const WHATSAPP_NUMBER = "5548991178688";
  const RECEIPT_KEY = "eonEnrollmentReceipt";
  const MAX_RECEIPT_AGE_MS = 2 * 60 * 60 * 1000;
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const el = (id) => document.getElementById(id);
  const primaryAction = el("success-primary-action");
  const summary = el("success-summary");
  const next = el("success-next");
  const protocolWrap = el("success-protocol-wrap");
  const progressItems = Array.from(document.querySelectorAll("#success-progress li"));

  el("current-year").textContent = new Date().getFullYear();

  function validUuid(value) {
    return UUID.test(String(value || ""));
  }

  function recentReceipt(receipt) {
    if (!receipt || receipt.version !== 1 || !["created", "duplicate"].includes(receipt.status) ||
        !validUuid(receipt.submissionId) || !validUuid(receipt.requestId) || !validUuid(receipt.contractId)) return false;
    const receivedAt = Date.parse(receipt.receivedAt || "");
    const submittedAt = Date.parse(receipt.submittedAt || "");
    const now = Date.now();
    const clockSkewMs = 5 * 60 * 1000;
    return Number.isFinite(receivedAt) && Number.isFinite(submittedAt) &&
      receivedAt <= now + clockSkewMs && submittedAt <= now + clockSkewMs &&
      now - receivedAt <= MAX_RECEIPT_AGE_MS;
  }

  function readReceipt() {
    try {
      return JSON.parse(window.sessionStorage.getItem(RECEIPT_KEY) || "null");
    } catch (storageError) {
      console.warn("Não foi possível recuperar o protocolo da pré-matrícula.", storageError);
      return null;
    }
  }

  function showUnconfirmed() {
    document.body.classList.remove("success-page--pending");
    document.body.classList.add("success-page--unconfirmed");
    el("success-security-label").setAttribute("aria-label", "Envio não confirmado");
    el("success-security-text").textContent = "Envio não confirmado";
    el("success-icon").textContent = "!";
    el("success-kicker").textContent = "ENVIO NÃO CONFIRMADO";
    el("success-title").textContent = "Não conseguimos confirmar neste navegador.";
    el("success-message").textContent = "Antes de enviar novamente, fale com a equipe da Endurance On para verificarmos se o cadastro já chegou.";
    summary.hidden = true;
    next.hidden = true;
    protocolWrap.hidden = true;
    progressItems.forEach((item, index) => item.className = index === 3 ? "is-active" : "");
    primaryAction.classList.add("whatsapp-action");
    primaryAction.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Olá! Não consegui confirmar minha pré-matrícula neste navegador. Podem verificar se o cadastro chegou antes de eu enviar novamente?")}`;
    primaryAction.target = "_blank";
    primaryAction.rel = "noopener noreferrer";
    primaryAction.innerHTML = 'Falar com a equipe <span aria-hidden="true">→</span>';
  }

  function showConfirmed(receipt) {
    document.body.classList.remove("success-page--pending", "success-page--unconfirmed");
    el("success-security-label").setAttribute("aria-label", "Envio concluído com segurança");
    el("success-security-text").textContent = "Envio concluído com segurança";
    el("success-icon").textContent = "✓";
    el("success-kicker").textContent = "PRÉ-MATRÍCULA RECEBIDA";
    el("success-title").textContent = "Pronto! Agora é com a gente.";
    el("success-message").textContent = "Seu cadastro foi confirmado no sistema da Endurance On. Para agilizar o atendimento, envie agora a mensagem pronta pelo WhatsApp.";
    progressItems.forEach((item) => item.className = "is-complete");
    progressItems[3].querySelector("strong").textContent = "Concluído";

    const protocol = String(receipt.contractNumber || `EON-${receipt.requestId.slice(0, 8).toUpperCase()}`).slice(0, 48);
    el("success-protocol").textContent = protocol;
    protocolWrap.hidden = false;

    const modality = String(receipt.modality || "").trim();
    const plan = String(receipt.plan || "").trim();
    const coach = String(receipt.coach || "").trim();
    const hasCompleteChoice = Boolean(modality && plan && coach);
    if (hasCompleteChoice) {
      el("success-modality").textContent = modality;
      el("success-plan").textContent = plan;
      el("success-coach").textContent = coach;
      summary.hidden = false;
    }

    next.hidden = false;
    const message = hasCompleteChoice
      ? `Olá! Minha pré-matrícula foi confirmada com o protocolo ${protocol}. Escolhi ${modality}, plano ${plan}, com o coach ${coach}. Gostaria de seguir com a matrícula.`
      : `Olá! Minha pré-matrícula foi confirmada com o protocolo ${protocol}. Gostaria de seguir com a matrícula.`;
    primaryAction.classList.add("whatsapp-action");
    primaryAction.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    primaryAction.target = "_blank";
    primaryAction.rel = "noopener noreferrer";
    primaryAction.innerHTML = 'Enviar mensagem no WhatsApp <span aria-hidden="true">→</span>';
  }

  const receipt = readReceipt();
  if (recentReceipt(receipt)) showConfirmed(receipt);
  else showUnconfirmed();
});
