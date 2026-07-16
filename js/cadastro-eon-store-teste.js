document.addEventListener("DOMContentLoaded", function () {
  const form = document.getElementById("eon-store-test-form");
  if (!form) return;

  const endpoint = "https://bsiljrrodgtmtdilnuxr.supabase.co/functions/v1/public-assessment-prospect-test";
  const statusBox = document.getElementById("eon-store-test-status");
  const submitButton = form.querySelector('button[type="submit"]');
  const cepInput = document.getElementById("cep");
  const cepStatus = document.getElementById("cep-status");
  const cpfInput = document.getElementById("cpf");
  const whatsappInput = document.getElementById("whatsapp");
  let lastLookedUpCep = "";
  let cepLookupController = null;

  function onlyDigits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function setStatus(type, message, details) {
    if (!statusBox) return;
    statusBox.className = `test-status ${type ? `is-${type}` : ""}`;
    statusBox.innerHTML = `
      <strong>${message}</strong>
      ${details ? `<pre>${details}</pre>` : ""}
    `;
    statusBox.style.display = "block";
  }

  function maskCpf(value) {
    const d = onlyDigits(value).slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
  }

  function maskCep(value) {
    const d = onlyDigits(value).slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  }

  function maskPhone(value) {
    const d = onlyDigits(value).slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }

  function setCepStatus(type, message) {
    if (!cepStatus) return;
    cepStatus.className = `cep-status ${type ? `is-${type}` : ""}`;
    cepStatus.textContent = message || "";
  }

  function validateCpf(value) {
    const d = onlyDigits(value);
    if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i += 1) sum += Number(d[i]) * (10 - i);
    let r = sum % 11;
    if ((r < 2 ? 0 : 11 - r) !== Number(d[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i += 1) sum += Number(d[i]) * (11 - i);
    r = sum % 11;
    return (r < 2 ? 0 : 11 - r) === Number(d[10]);
  }

  async function fillAddressByCep() {
    const cep = onlyDigits(cepInput.value);
    if (cep.length !== 8 || cep === lastLookedUpCep) return;

    if (cepLookupController) cepLookupController.abort();
    const controller = new AbortController();
    cepLookupController = controller;
    cepInput.setAttribute("aria-busy", "true");
    cepInput.setCustomValidity("");
    setCepStatus("", "Buscando endereço...");

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("CEP lookup failed");
      const data = await res.json();
      if (data.erro) {
        cepInput.setCustomValidity("CEP não encontrado.");
        setCepStatus("error", "CEP não encontrado. Confira os números.");
        return;
      }

      document.getElementById("address_street").value = data.logradouro || "";
      document.getElementById("address_neighborhood").value = data.bairro || "";
      document.getElementById("address_city").value = data.localidade || "";
      document.getElementById("address_state").value = data.uf || "";
      lastLookedUpCep = cep;
      setCepStatus("success", "Endereço preenchido automaticamente.");
    } catch (error) {
      if (error.name === "AbortError") return;
      setCepStatus("error", "Não foi possível consultar o CEP. Preencha o endereço manualmente.");
      console.warn("[cadastro-eon-store-teste] CEP lookup failed", error);
    } finally {
      if (cepLookupController === controller) {
        cepInput.removeAttribute("aria-busy");
        cepLookupController = null;
      }
    }
  }

  if (cpfInput) {
    cpfInput.addEventListener("input", () => {
      cpfInput.value = maskCpf(cpfInput.value);
    });
  }

  if (whatsappInput) {
    whatsappInput.addEventListener("input", () => {
      whatsappInput.value = maskPhone(whatsappInput.value);
    });
  }

  if (cepInput) {
    cepInput.addEventListener("input", () => {
      cepInput.value = maskCep(cepInput.value);
      cepInput.setCustomValidity("");
      const cep = onlyDigits(cepInput.value);
      if (cep.length === 8) {
        void fillAddressByCep();
        return;
      }
      lastLookedUpCep = "";
      if (cepLookupController) cepLookupController.abort();
      setCepStatus("", "");
    });
    cepInput.addEventListener("blur", () => void fillAddressByCep());
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (!validateCpf(cpfInput.value)) {
      setStatus("error", "CPF invalido. Confira antes de enviar.");
      return;
    }

    await fillAddressByCep();
    if (!cepInput.checkValidity()) {
      cepInput.reportValidity();
      return;
    }

    const payload = {
      full_name: document.getElementById("nome-completo").value,
      whatsapp: whatsappInput.value,
      email: document.getElementById("email").value,
      cpf: cpfInput.value,
      modality: document.getElementById("modalidade").value,
      period: document.getElementById("periodicidade").value,
      region: document.getElementById("regiao").value,
      coach: document.getElementById("treinador").value,
      address_zip: cepInput.value,
      address_number: document.getElementById("address_number").value,
      address_complement: document.getElementById("address_complement").value,
      address_street: document.getElementById("address_street").value,
      address_neighborhood: document.getElementById("address_neighborhood").value,
      address_city: document.getElementById("address_city").value,
      address_state: document.getElementById("address_state").value,
      website: document.getElementById("website").value,
    };

    submitButton.disabled = true;
    submitButton.textContent = "Enviando teste...";
    setStatus("loading", "Enviando para o EON Store...");

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) {
        setStatus("error", data.error || "Erro ao registrar no EON Store.", JSON.stringify(data, null, 2));
        return;
      }
      setStatus(
        "success",
        "Pre-matricula enviada para o EON Store.",
        JSON.stringify(data, null, 2)
      );
      form.reset();
    } catch (error) {
      setStatus("error", "Nao foi possivel conectar com a API de teste.", String(error));
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Enviar teste para o EON Store";
    }
  });
});
