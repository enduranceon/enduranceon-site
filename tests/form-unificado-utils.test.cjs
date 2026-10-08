const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const utils = require("../js/form-unificado.js");

test("valida CPF pelo dígito verificador e rejeita sequências", () => {
  assert.equal(utils.isValidCpf("529.982.247-25"), true);
  assert.equal(utils.isValidCpf("529.982.247-24"), false);
  assert.equal(utils.isValidCpf("111.111.111-11"), false);
});

test("normaliza telefone brasileiro local e com +55", () => {
  assert.equal(utils.normalizeBrazilPhone("(48) 99999-1234"), "+5548999991234");
  assert.equal(utils.normalizeBrazilPhone("+55 (48) 99999-1234"), "+5548999991234");
  assert.equal(utils.normalizeBrazilPhone("48 3333-1234"), "+554833331234");
  assert.equal(utils.normalizeBrazilPhone("123"), "");
  assert.equal(utils.normalizeBrazilPhone("00 00000-0000"), "");
  assert.equal(utils.maskPhone("+55 (48) 99999-1234"), "(48) 99999-1234");
});

test("valida e-mail e UF antes do envio", () => {
  assert.equal(utils.isValidEmail(" atleta@example.com "), true);
  assert.equal(utils.isValidEmail("atleta@invalido"), false);
  assert.equal(utils.isValidState("sc"), true);
  assert.equal(utils.isValidState("XX"), false);
});

test("aceita apenas recibo recente com submission_id e request_id válidos", () => {
  const now = Date.parse("2026-10-08T18:00:00.000Z");
  const receipt = {
    version: 1,
    status: "created",
    submissionId: "d9428888-122b-4a56-8f90-123456789abc",
    requestId: "123e4567-e89b-42d3-a456-426614174000",
    contractId: "55555555-5555-4555-8555-555555555555",
    submittedAt: "2026-10-08T17:59:00.000Z",
    receivedAt: "2026-10-08T18:00:00.000Z",
  };
  assert.equal(utils.isRecentReceipt(receipt, now), true);
  assert.equal(utils.isRecentReceipt({ ...receipt, submissionId: "" }, now), false);
  assert.equal(utils.isRecentReceipt({ ...receipt, contractId: "" }, now), false);
  assert.equal(utils.isRecentReceipt({ ...receipt, status: "received" }, now), false);
  assert.equal(utils.isRecentReceipt({ ...receipt, receivedAt: "2026-10-08T14:00:00.000Z" }, now), false);
});

test("preserva endpoint e aliases usados pela produção", () => {
  const source = fs.readFileSync(path.join(__dirname, "../js/form-unificado.js"), "utf8");
  assert.match(source, /bsiljrrodgtmtdilnuxr\.supabase\.co\/functions\/v1\/public-assessment-prospect/);
  assert.match(source, /requestedModality === "multisport" \? "2-modalidades"/);
  assert.match(source, /requestedFamily === "essencial"/);
});
