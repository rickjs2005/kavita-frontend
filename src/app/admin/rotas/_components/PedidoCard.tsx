"use client";

import {
  type PedidoDisponivel,
  parseEnderecoPedido,
  formatBRL,
  hoursAgo,
  timeAgoShort,
} from "@/lib/rotas/types";

interface Props {
  pedido: PedidoDisponivel;
  /** -1 quando nao selecionado; 0..N quando selecionado (ordem). */
  ordem: number;
  onToggle: () => void;
}

const FORMA_PAGAMENTO_LABEL: Record<string, string> = {
  pix: "PIX",
  cartao: "Cartão",
  cartao_credito: "Cartão crédito",
  cartao_debito: "Cartão débito",
  boleto: "Boleto",
  dinheiro: "Dinheiro",
  // Mantemos o raw como fallback se vier algo nao mapeado.
};

function pagamentoLabel(forma: string | null): string {
  if (!forma) return "—";
  return FORMA_PAGAMENTO_LABEL[forma.toLowerCase()] || forma;
}

const PEDIDO_ANTIGO_HORAS = 48;

/**
 * Card de pedido na criacao/edicao de rota.
 *
 * O conteudo prioriza o que o operador precisa pra decidir SE inclui o
 * pedido na rota: cliente identificavel, endereco completo, valor,
 * forma de pagamento (boleto/dinheiro mudam logistica), observacao do
 * cliente (acesso, ponto de referencia) e badges de risco.
 */
export default function PedidoCard({ pedido: p, ordem, onToggle }: Props) {
  const endereco = parseEnderecoPedido(p.endereco);
  const selected = ordem !== -1;
  const idadeHoras = hoursAgo(p.data_pedido);
  const isAntigo = idadeHoras !== null && idadeHoras > PEDIDO_ANTIGO_HORAS;
  const temOcorrencia = (p.ocorrencias_anteriores ?? 0) > 0;
  const wa = p.usuario_telefone
    ? p.usuario_telefone.replace(/\D/g, "")
    : null;
  const waLink =
    wa && wa.length >= 10
      ? `https://wa.me/${wa.startsWith("55") ? wa : `55${wa}`}`
      : null;

  return (
    <label
      className={`flex gap-3 items-start p-3 rounded-lg border cursor-pointer transition ${
        selected
          ? "bg-primary/10 border-primary/50"
          : "bg-dark-900 border-white/10 hover:border-white/20"
      }`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggle}
        className="mt-1"
      />
      <div className="flex-1 min-w-0">
        {/* Linha 1: ID + ordem + tipo + alertas */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-white font-semibold text-sm">
            Pedido #{p.id}
          </span>
          {selected && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-white font-bold">
              {ordem + 1}ª parada
            </span>
          )}
          {p.tipo_endereco === "rural" && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-700/30 text-amber-300">
              rural
            </span>
          )}
          {isAntigo && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-200 ring-1 ring-rose-500/30">
              ⏰ antigo · {timeAgoShort(p.data_pedido)}
            </span>
          )}
          {temOcorrencia && (
            <span
              className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/30"
              title={`${p.ocorrencias_anteriores} ocorrência(s) anterior(es)`}
            >
              ⚠ histórico
            </span>
          )}
          {p.forma_pagamento && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-gray-300">
              💳 {pagamentoLabel(p.forma_pagamento)}
            </span>
          )}
        </div>

        {/* Linha 2: cliente + telefone */}
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-300">
          <span className="font-medium">{p.usuario_nome || "Sem nome"}</span>
          {p.usuario_telefone && (
            <>
              <span className="text-gray-500">·</span>
              <span className="text-gray-400">{p.usuario_telefone}</span>
              {waLink && (
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-700/40 hover:bg-emerald-600/60 text-emerald-100 font-semibold"
                  title="Confirmar entrega via WhatsApp"
                >
                  WhatsApp
                </a>
              )}
            </>
          )}
        </div>

        {/* Linha 3: endereco completo */}
        <div className="mt-1 text-xs text-gray-400">
          📍{" "}
          {endereco?.rua ? (
            <>
              {endereco.rua}
              {endereco.numero ? `, ${endereco.numero}` : ""}
              {endereco.complemento ? ` · ${endereco.complemento}` : ""}
              {endereco.bairro ? ` — ${endereco.bairro}` : ""}
              {endereco.cidade ? `, ${endereco.cidade}` : ""}
              {endereco.estado ? `-${endereco.estado}` : ""}
              {endereco.cep ? ` · CEP ${endereco.cep}` : ""}
            </>
          ) : (
            <span className="italic">Endereço não informado</span>
          )}
        </div>

        {/* Linha 4: ponto de referencia (se houver — distinto da observacao da entrega) */}
        {endereco?.ponto_referencia && (
          <p className="mt-0.5 text-[11px] text-gray-500">
            🧭 ref: {endereco.ponto_referencia}
          </p>
        )}

        {/* Linha 5: observacao do cliente (alerta visual em ambar) */}
        {p.observacao_entrega && (
          <p className="mt-1 text-[11px] text-amber-400 italic bg-amber-500/5 ring-1 ring-amber-500/15 rounded px-2 py-1">
            “{p.observacao_entrega}”
          </p>
        )}

        {/* Linha 6: rodape — valor + idade do pedido */}
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
          <span className="font-mono text-gray-300">
            {formatBRL(p.total)}
          </span>
          {p.shipping_price && Number(p.shipping_price) > 0 && (
            <>
              <span>·</span>
              <span>frete {formatBRL(p.shipping_price)}</span>
            </>
          )}
          <span>·</span>
          <span>criado há {timeAgoShort(p.data_pedido)}</span>
        </div>
      </div>
    </label>
  );
}
