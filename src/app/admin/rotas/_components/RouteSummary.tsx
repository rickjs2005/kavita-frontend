"use client";

import {
  type Motorista,
  type PedidoDisponivel,
  parseEnderecoPedido,
  formatBRL,
} from "@/lib/rotas/types";

export interface RouteValidationIssue {
  level: "block" | "warn";
  label: string;
}

export interface RouteSummaryData {
  pedidosSelecionados: PedidoDisponivel[];
  motorista: Motorista | null;
  data: string;
  veiculo: string;
  regiaoLabel: string;
  kmEstimado: string;
  issues: RouteValidationIssue[];
}

interface Props {
  summary: RouteSummaryData;
}

/**
 * Resumo lateral fixo (na criacao de rota) com tudo que o operador
 * precisa pra validar antes de marcar como pronta.
 *
 * Mostra:
 *   - contagem de pedidos + valor total
 *   - bairros incluidos (lista compacta)
 *   - motorista + telefone (necessario pro magic-link)
 *   - data + veiculo + km
 *   - issues bloqueantes vs avisos
 */
export default function RouteSummary({ summary: s }: Props) {
  const total = s.pedidosSelecionados.reduce(
    (acc, p) => acc + Number(p.total || 0),
    0,
  );
  const bairros = new Set<string>();
  const cidades = new Set<string>();
  let semGeo = 0;
  for (const p of s.pedidosSelecionados) {
    const e = parseEnderecoPedido(p.endereco);
    if (e?.bairro) bairros.add(e.bairro);
    if (e?.cidade) cidades.add(e.cidade);
    if (!p.endereco_latitude || !p.endereco_longitude) semGeo++;
  }

  const blocks = s.issues.filter((i) => i.level === "block");
  const warns = s.issues.filter((i) => i.level === "warn");
  const ready = blocks.length === 0 && s.pedidosSelecionados.length > 0;

  return (
    <div className="rounded-xl bg-dark-800 ring-1 ring-white/10 p-4 space-y-3 sticky top-4">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Resumo da rota</h3>
          {ready ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30">
              ✓ Pronta para sair
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/30">
              {blocks.length > 0 ? "Incompleta" : "Rascunho"}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Metric label="Pedidos" value={String(s.pedidosSelecionados.length)} />
        <Metric label="Valor total" value={formatBRL(total)} mono />
        <Metric
          label="Bairros"
          value={bairros.size === 0 ? "—" : String(bairros.size)}
        />
        <Metric
          label="Cidades"
          value={cidades.size === 0 ? "—" : String(cidades.size)}
        />
      </div>

      {bairros.size > 0 && (
        <div className="text-[11px] text-gray-400">
          <span className="text-gray-500">Inclui:</span>{" "}
          {Array.from(bairros).sort().join(" · ")}
        </div>
      )}

      <div className="border-t border-white/10 pt-3 space-y-1.5 text-xs">
        <Row
          label="Data"
          value={s.data || <span className="text-amber-300">Não definida</span>}
        />
        <Row
          label="Motorista"
          value={
            s.motorista ? (
              <>
                <span className="text-gray-200">{s.motorista.nome}</span>
                {s.motorista.telefone && (
                  <span className="text-gray-500"> · {s.motorista.telefone}</span>
                )}
              </>
            ) : (
              <span className="text-amber-300">Não atribuido</span>
            )
          }
        />
        <Row
          label="Veículo"
          value={s.veiculo || <span className="text-gray-500">—</span>}
        />
        <Row
          label="Região"
          value={s.regiaoLabel || <span className="text-gray-500">—</span>}
        />
        <Row
          label="Km estimado"
          value={
            s.kmEstimado ? (
              `${s.kmEstimado} km`
            ) : (
              <span className="text-gray-500">—</span>
            )
          }
        />
        {semGeo > 0 && (
          <p className="text-[11px] text-gray-500 italic">
            {semGeo} {semGeo === 1 ? "pedido" : "pedidos"} sem GPS — agrupamento
            por proximidade indisponível.
          </p>
        )}
      </div>

      {blocks.length > 0 && (
        <div className="border-t border-white/10 pt-3 space-y-1">
          <div className="text-[10px] uppercase tracking-wide text-rose-300 font-semibold">
            Para marcar como pronta, resolva:
          </div>
          {blocks.map((b, i) => (
            <div
              key={i}
              className="text-[11px] text-rose-200 bg-rose-500/10 ring-1 ring-rose-500/30 rounded px-2 py-1"
            >
              🚨 {b.label}
            </div>
          ))}
        </div>
      )}

      {warns.length > 0 && (
        <div className="border-t border-white/10 pt-3 space-y-1">
          <div className="text-[10px] uppercase tracking-wide text-amber-300 font-semibold">
            Atenção
          </div>
          {warns.map((w, i) => (
            <div
              key={i}
              className="text-[11px] text-amber-200 bg-amber-500/10 ring-1 ring-amber-500/30 rounded px-2 py-1"
            >
              ⚠ {w.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg bg-dark-900 ring-1 ring-white/5 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-gray-500 font-semibold">
        {label}
      </div>
      <div
        className={`text-sm text-gray-100 font-semibold ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-gray-500 shrink-0">{label}</span>
      <span className="text-right text-gray-200 truncate">{value}</span>
    </div>
  );
}
