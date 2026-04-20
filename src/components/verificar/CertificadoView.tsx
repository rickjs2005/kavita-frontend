// src/components/verificar/CertificadoView.tsx
//
// Layout estilo "certificado" para a página pública /verificar/:token.
// Tipografia serifada, fundo creme/marfim, selo central e hash em
// monoespaçada grande — fácil de comparar visualmente com o hash
// impresso no rodapé do PDF pelo QR Code.

import type { ContratoPublico } from "@/types/contrato";
import { CONTRATO_STATUS_LABEL, CONTRATO_TIPO_LABEL } from "@/types/contrato";

function fmtDateTimeBR(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

function fmtDateBR(iso: string | null | undefined) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return String(iso);
  }
}

type SealVariant = "authentic" | "pending" | "cancelled" | "expired";

function sealFor(status: ContratoPublico["status"]): {
  variant: SealVariant;
  title: string;
  subtitle: string;
} {
  if (status === "signed") {
    return {
      variant: "authentic",
      title: "AUTÊNTICO",
      subtitle: "Documento assinado e íntegro",
    };
  }
  if (status === "sent" || status === "draft") {
    return {
      variant: "pending",
      title: "EM ANDAMENTO",
      subtitle: "Aguardando assinatura das partes",
    };
  }
  if (status === "cancelled") {
    return {
      variant: "cancelled",
      title: "CANCELADO",
      subtitle: "Este contrato foi cancelado antes da conclusão",
    };
  }
  return {
    variant: "expired",
    title: "EXPIRADO",
    subtitle: "O prazo de assinatura foi ultrapassado",
  };
}

const SEAL_COLORS: Record<SealVariant, { ring: string; text: string; bg: string }> = {
  authentic: {
    ring: "ring-emerald-600",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
  },
  pending: {
    ring: "ring-amber-600",
    text: "text-amber-700",
    bg: "bg-amber-50",
  },
  cancelled: {
    ring: "ring-stone-500",
    text: "text-stone-600",
    bg: "bg-stone-100",
  },
  expired: {
    ring: "ring-red-600",
    text: "text-red-700",
    bg: "bg-red-50",
  },
};

export function CertificadoView({ contrato }: { contrato: ContratoPublico }) {
  const seal = sealFor(contrato.status);
  const colors = SEAL_COLORS[seal.variant];

  return (
    <main className="min-h-screen bg-[#f7f3e9] py-10 px-4 print:bg-white">
      <div className="max-w-3xl mx-auto">
        {/* Moldura do certificado */}
        <article
          className="relative bg-white shadow-xl shadow-stone-900/10 ring-1 ring-stone-200 rounded-sm overflow-hidden"
          style={{ fontFamily: "Georgia, 'Times New Roman', Times, serif" }}
        >
          {/* Faixa superior — identidade Kavita */}
          <div className="border-b-2 border-[#2e5734] px-10 pt-10 pb-6 text-center">
            <div className="text-xs tracking-[0.4em] text-[#2e5734] font-semibold">
              KAVITA · MERCADO DO CAFÉ
            </div>
            <div className="mt-1 text-[11px] tracking-[0.2em] uppercase text-stone-500">
              Certificado de Autenticidade do Instrumento Particular
            </div>
          </div>

          <div className="px-10 py-10">
            {/* Selo visual */}
            <div className="flex justify-center">
              <div
                className={`inline-flex flex-col items-center justify-center w-44 h-44 rounded-full ${colors.bg} ${colors.ring} ring-4 ring-offset-4 ring-offset-white text-center px-4`}
              >
                <div className={`text-xs tracking-[0.3em] ${colors.text}`}>
                  STATUS
                </div>
                <div className={`mt-1 text-2xl font-bold tracking-wider ${colors.text}`}>
                  {seal.title}
                </div>
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-stone-600 italic">
              {seal.subtitle}
            </p>

            {/* Partes */}
            <section className="mt-10 border-t border-stone-200 pt-8">
              <h2 className="text-[10px] font-semibold tracking-[0.3em] text-stone-500 uppercase">
                Partes do Instrumento
              </h2>
              <div className="mt-4 grid gap-6 md:grid-cols-2">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-stone-500">
                    Compradora (Corretora)
                  </div>
                  <div className="mt-1 text-lg font-semibold text-stone-900">
                    {contrato.corretora.name}
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5">
                    Verificada na plataforma Kavita
                  </div>
                </div>
                <div className="md:text-right">
                  <div className="text-[11px] uppercase tracking-wider text-stone-500">
                    Vendedor (Produtor)
                  </div>
                  <div className="mt-1 text-lg font-semibold text-stone-900">
                    {contrato.resumo.produtor_iniciais ?? "—"}
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5">
                    Identificação preservada (LGPD)
                  </div>
                </div>
              </div>
            </section>

            {/* Objeto */}
            <section className="mt-8 border-t border-stone-200 pt-8">
              <h2 className="text-[10px] font-semibold tracking-[0.3em] text-stone-500 uppercase">
                Objeto do Instrumento
              </h2>
              <dl className="mt-4 grid gap-y-3 gap-x-6 md:grid-cols-3 text-sm">
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-stone-500">
                    Natureza
                  </dt>
                  <dd className="mt-0.5 text-stone-900">
                    {CONTRATO_TIPO_LABEL[contrato.tipo]}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-stone-500">
                    Safra
                  </dt>
                  <dd className="mt-0.5 text-stone-900">
                    {contrato.resumo.safra ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-stone-500">
                    Quantidade
                  </dt>
                  <dd className="mt-0.5 text-stone-900">
                    {contrato.resumo.quantidade_sacas != null
                      ? `${contrato.resumo.quantidade_sacas} sacas de 60 kg`
                      : "—"}
                  </dd>
                </div>
              </dl>
            </section>

            {/* Datas */}
            <section className="mt-8 border-t border-stone-200 pt-8">
              <h2 className="text-[10px] font-semibold tracking-[0.3em] text-stone-500 uppercase">
                Registro Temporal
              </h2>
              <dl className="mt-4 grid gap-y-3 gap-x-6 md:grid-cols-2 text-sm">
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-stone-500">
                    Emitido em
                  </dt>
                  <dd className="mt-0.5 text-stone-900">
                    {fmtDateBR(contrato.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-stone-500">
                    Assinado em
                  </dt>
                  <dd className="mt-0.5 text-stone-900">
                    {contrato.signed_at
                      ? fmtDateTimeBR(contrato.signed_at)
                      : "—"}
                  </dd>
                </div>
              </dl>
            </section>

            {/* Hash */}
            <section className="mt-8 border-t border-stone-200 pt-8">
              <h2 className="text-[10px] font-semibold tracking-[0.3em] text-stone-500 uppercase">
                Impressão Digital do Documento (SHA-256)
              </h2>
              <div className="mt-3 rounded border border-stone-200 bg-stone-50 p-4">
                <code
                  className="block break-all text-[13px] md:text-sm leading-relaxed text-stone-800 tracking-wide"
                  style={{ fontFamily: "'SFMono-Regular', Menlo, Monaco, Consolas, 'Courier New', monospace" }}
                >
                  {contrato.hash_sha256.toUpperCase().match(/.{1,8}/g)?.join(" ")}
                </code>
              </div>
              <p className="mt-2 text-[11px] text-stone-500 italic">
                Compare este valor com o hash impresso no rodapé do PDF original.
                Qualquer divergência indica adulteração.
              </p>
            </section>

            {/* Status detalhado */}
            <section className="mt-8 border-t border-stone-200 pt-6 text-center">
              <span className="inline-flex items-center gap-2 text-xs text-stone-600">
                <span className="h-1.5 w-1.5 rounded-full bg-stone-400" />
                Situação atual:{" "}
                <strong className="text-stone-900 font-semibold">
                  {CONTRATO_STATUS_LABEL[contrato.status]}
                </strong>
              </span>
            </section>
          </div>

          {/* Rodapé do certificado */}
          <footer className="border-t-2 border-[#2e5734] px-10 py-5 text-center text-[10px] tracking-[0.2em] text-stone-500 uppercase">
            Verificação realizada em {fmtDateTimeBR(new Date().toISOString())}
          </footer>
        </article>

        <p className="mt-6 text-center text-xs text-stone-500">
          Esta página consulta a plataforma Kavita em tempo real. Para mais
          informações sobre a negociação, procure diretamente a corretora
          responsável.
        </p>
      </div>
    </main>
  );
}
