const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "onebyone.html"), "utf8");
const INSCRICAO = "https://eon-store.netlify.app/inscricao/onebyone2026";

// Texto visível (sem tags nem comentários) para procurar termos proibidos.
const text = html
  .replace(/<!--[\s\S]*?-->/g, " ")
  .replace(/<script[\s\S]*?<\/script>/g, " ")
  .replace(/<[^>]+>/g, " ")
  .replace(/\s+/g, " ");

test("os três botões 'Fazer minha inscrição' abrem a mesma URL de inscrição, sem JavaScript", () => {
  const buttons = [...html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>\s*Fazer minha inscrição/g)];
  assert.equal(buttons.length, 3);
  for (const [, href] of buttons) assert.equal(href, INSCRICAO);
});

test("a página não traz informações descartadas pelo briefing", () => {
  // "ambos" só pode aparecer na frase da FAQ que explica que NÃO existe essa opção;
  // o que é proibido é a opção "Ambos" / "Sem preferência" (rótulo com inicial maiúscula) e campos de escolha.
  assert.match(text, /não oferece a opção de participar em ambos/);
  assert.doesNotMatch(html, /<(input|select|option|textarea|form)\b/i, "a página não tem formulário nem campos de escolha");
  const proibidos = [
    /\bAmbos\b/, /Sem prefer[eê]ncia/i, /42,195/, /195\s*m/i, /\b40\s*km\b/i,
    /camiseta/i, /medalha/i, /trof[eé]u/i, /\bchip\b/i, /brinde/i, /p[oó]dio/i,
    /23h59/, /contagem regressiva/i, /1\s*km\s*loop/i,
    /montam? (os|seus) pr[oó]prios times/i,
  ];
  for (const re of proibidos) assert.doesNotMatch(text, re, `termo proibido: ${re}`);
});

test("números do evento: 40 voltas de 1.050 m = 42 km; quarteto 10 voltas, octeto 5 voltas", () => {
  const volta = 1050;
  assert.equal(40 * volta, 42000);
  assert.equal(4 * 10 * volta, 42000);
  assert.equal(8 * 5 * volta, 42000);
  assert.equal(10 * volta, 10500);
  assert.equal(5 * volta, 5250);
  for (const trecho of ["40 voltas", "1.050 m", "42 km", "10,5 km", "5,25 km", "10 obrigatórias", "5 obrigatórias"]) {
    assert.ok(text.includes(trecho), `falta: ${trecho}`);
  }
  assert.equal((html.match(/<div class="obo-laps"[^>]*>(.*?)<\/div>/)[1].match(/<i><\/i>/g) || []).length, 40);
});

test("datas, hora e valor do briefing", () => {
  for (const trecho of ["19/12/2026", "05/12", "08/12", "19h", "R$ 40,00", "Google Meet", "Local e horário serão informados pela organização"]) {
    assert.ok(text.includes(trecho) || text.includes(trecho.replace(" ", " ")), `falta: ${trecho}`);
  }
});

test("exemplo do Desafio da Precisão: diferença = |real - previsto| e posição pela menor diferença", () => {
  const hms = s => { const [, h, m, sec] = s.match(/(\d+)h(\d+)min(\d+)s/); return +h * 3600 + +m * 60 + +sec; };
  const dif = s => { const [, m, sec] = s.match(/(?:(\d+)min)?(\d+)s/); return (+m || 0) * 60 + +sec; };
  const corpo = html.match(/<tbody[\s\S]*?<\/tbody>/)[0];
  const linhas = [...corpo.matchAll(/<tr[\s\S]*?<\/tr>/g)].map(([tr]) => {
    const celulas = [...tr.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map(c => c[1].replace(/<[^>]+>/g, "").trim());
    return { equipe: celulas[0], previsto: hms(celulas[1]), real: hms(celulas[2]), diferenca: dif(celulas[3]), posicao: parseInt(celulas[4], 10) };
  });
  assert.equal(linhas.length, 3);
  for (const l of linhas) assert.equal(l.diferenca, Math.abs(l.real - l.previsto), l.equipe);
  assert.deepEqual(linhas.map(l => l.diferenca), [180, 40, 90]);
  const ordem = [...linhas].sort((a, b) => a.diferenca - b.diferenca).map(l => l.equipe);
  assert.deepEqual(ordem, ["Equipe B", "Equipe C", "Equipe A"]);
  for (const l of linhas) assert.equal(l.posicao, ordem.indexOf(l.equipe) + 1, l.equipe);
});

test("metadados: título, descrição, canonical, um único H1 e rota pelo arquivo da raiz", () => {
  assert.match(html, /<title>ONE BY ONE 2026 \| Maratona em revezamento \| Endurance On<\/title>/);
  assert.match(html, /<meta name="description" content="Conheça o ONE BY ONE: 42 km em revezamento, quartetos e octetos, equipes equilibradas e integração\. Em 19\/12\/2026\. Confirme até 05\/12\.">/);
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.enduranceon\.com\.br\/onebyone">/);
  assert.match(html, /<meta name="robots" content="index,follow">/);
  assert.equal((html.match(/<h1[\s>]/g) || []).length, 1);
  assert.doesNotMatch(html, /"@type"\s*:\s*"Event"/, "sem dados estruturados de evento: local e horário ainda não existem");
});

test("imagens e arquivos locais da página existem", () => {
  const refs = new Set();
  for (const m of html.matchAll(/(?:src|href)="(assets\/[^"#?]+)"/g)) refs.add(m[1]);
  assert.ok(refs.size > 0);
  for (const ref of refs) assert.ok(fs.existsSync(path.join(root, ref)), `não existe: ${ref}`);
  for (const ref of ["assets/onebyone/onebyone-og.jpg", "assets/onebyone/qr-inscricao-onebyone.svg"]) {
    assert.ok(fs.existsSync(path.join(root, ref)), `não existe: ${ref}`);
  }
  assert.ok(fs.statSync(path.join(root, "assets/onebyone/onebyone-og.jpg")).size < 300 * 1024, "imagem de compartilhamento acima de 300 KB");
});
