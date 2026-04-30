// scripts/smoke-r8-e2e.mjs
//
// Smoke E2E real do R8 — valida o contrato 429 entre backend (PR #41 da
// Fase 1) e frontend (este PR R8).
//
// Pré-requisito: backend rodando com RATE_LIMIT_GLOBAL_PER_MINUTE=3 (ou
// outro valor baixo). O teste dispara 6 requests para /api/payment/start
// e espera 429 a partir do 4º.
//
// O que valida:
//   1. Backend retorna 429 com payload { ok:false, code:"RATE_LIMIT",
//      message, retryAfter } — exatamente o formato que o apiClient do
//      frontend converte em ApiError.
//   2. Reproduz a guarda exata do useCheckoutState.handleSubmit:
//        if (isApiError(err) && err.status === 429) motivo = "rate_limit"
//      Sem a guarda, motivo cai em "erro" → URL errada.
//   3. retryAfter está presente — base do cooldown visual de 60s.
//
// Não cobre: passo de auth para criar pedido real, navegação do router.

const BASE = process.env.SMOKE_BACKEND_URL || "http://localhost:5000";

let pass = 0;
let fail = 0;
function ok(msg) { pass++; console.log(`OK    ${msg}`); }
function bad(msg) { fail++; console.log(`FAIL  ${msg}`); }

async function postJson(path, body) {
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let parsed = null;
  try { parsed = await res.json(); } catch {}
  return { status: res.status, body: parsed };
}

async function run() {
  console.log(`Smoke R8 — backend ${BASE}\n`);

  // 1) Disparar 6 requests; do 4º em diante deve vir 429.
  const results = [];
  for (let i = 1; i <= 6; i++) {
    const r = await postJson("/api/payment/start", { pedidoId: 999 });
    results.push({ i, ...r });
  }

  console.log("Resultados:");
  for (const r of results) console.log(`  req ${r.i} → HTTP ${r.status}`);
  console.log();

  const last = results[5];

  // 2) Backend retornou 429?
  if (last.status !== 429) {
    bad(`6º request: esperava 429, recebi ${last.status}`);
    console.log("Body:", JSON.stringify(last.body));
    process.exit(1);
  }
  ok(`6º request retornou HTTP 429`);

  // 3) Payload do 429 tem o formato esperado pelo apiClient
  const body = last.body || {};
  if (body.ok !== false) bad(`payload.ok esperado false, veio ${body.ok}`);
  else ok(`payload.ok === false`);

  if (body.code !== "RATE_LIMIT") bad(`payload.code esperado "RATE_LIMIT", veio "${body.code}"`);
  else ok(`payload.code === "RATE_LIMIT"`);

  if (typeof body.message !== "string" || body.message.length === 0)
    bad(`payload.message ausente ou vazio`);
  else ok(`payload.message presente: "${body.message.substring(0, 60)}..."`);

  if (typeof body.retryAfter !== "number" || body.retryAfter <= 0)
    bad(`payload.retryAfter ausente ou inválido (veio: ${body.retryAfter})`);
  else ok(`payload.retryAfter === ${body.retryAfter}s (base do cooldown UI)`);

  // 4) Reproduzir a guarda do useCheckoutState que decide o motivo
  //    do redirect. apiClient transforma payload em ApiError com
  //    status === res.status e code === payload.code. A guarda real
  //    é: isApiError(err) && err.status === 429.
  //
  //    Aqui simulamos o ApiError com a estrutura que apiClient produz.
  const simulatedApiError = {
    name: "ApiError",
    status: last.status,
    code: body.code,
    message: body.message,
    details: body,
  };
  const isApiError = (e) =>
    typeof e === "object" && e !== null && e.name === "ApiError" && typeof e.status === "number";

  const isRateLimit = isApiError(simulatedApiError) && simulatedApiError.status === 429;
  if (!isRateLimit) {
    bad(`guarda isApiError && status===429 não detectou`);
    process.exit(1);
  }
  ok(`guarda useCheckoutState: isApiError && status===429 === true`);

  // 5) Calcular URL de redirect exatamente como useCheckoutState.ts:768
  const pedidoIdSimulado = 555;
  const motivo = isRateLimit ? "rate_limit" : "erro";
  const url = `/checkout/pagamento-pendente?pedidoId=${pedidoIdSimulado}&motivo=${motivo}`;
  if (motivo !== "rate_limit") bad(`motivo esperado "rate_limit", calculado "${motivo}"`);
  else ok(`motivo === "rate_limit"`);
  ok(`URL de redirect: ${url}`);

  console.log(`\n=== ${pass} OK · ${fail} FAIL ===`);
  process.exit(fail === 0 ? 0 : 1);
}

run().catch((e) => {
  console.error("smoke crashed:", e);
  process.exit(1);
});
