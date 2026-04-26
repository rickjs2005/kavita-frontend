"use client";

// LeadStatusClient — UI pública de consulta do status do lead pelo
// próprio produtor. Recebe id + token HMAC pelo path, chama o backend
// uma única vez no mount. Sem cookie, sem login.

import { useEffect, useState } from "react";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { formatDateTime } from "@/utils/formatters";
import { PanelBrandMark } from "@/components/painel-corretora/PanelBrand";

type StatusResponse = {
  id: number;
  status: "new" | "contacted" | "closed" | "lost";
  canal_preferido: "whatsapp" | "ligacao" | "email" | null;
  created_at: string;
  first_response_at: string | null;
  updated_at: string;
  corretora: {
    name: string;
    slug: string;
    whatsapp: string | null;
    phone: string | null;
    email: string | null;
  } | null;
};

// Cada estado tem tom, ícone e copy que o produtor entende. O label
// "Aguardando primeiro contato" evita parecer inerte no caso new —
// a promessa é de retorno, não de fila.
const STATUS_UI: Record<
  StatusResponse["status"],
  { label: string; tone: "amber" | "emerald" | "stone"; hint: string }
> = {
  new: {
    label: "Recebido",
    tone: "amber",
    hint: "A corretora já foi avisada e vai retornar em breve.",
  },
  contacted: {
    label: "Em atendimento",
    tone: "emerald",
    hint: "A corretora já iniciou o contato com você.",
  },
  closed: {
    label: "Negócio fechado",
    tone: "emerald",
    hint: "Esse contato foi concluído. Bons negócios!",
  },
  lost: {
    label: "Encerrado",
    tone: "stone",
    hint: "Este contato foi fechado sem prosseguimento.",
  },
};

const TONE_CLASSES = {
  amber: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
  emerald: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30",
  stone: "bg-stone-500/15 text-stone-300 ring-stone-400/20",
} as const;

function formatDate(iso: string): string {
  try {
    return formatDateTime(iso) || iso;
  } catch {
    return iso;
  }
}

function relativeTime(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMin = Math.floor((now - then) / 60_000);
  if (diffMin < 1) return "agora mesmo";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `há ${diffD}d`;
}

// Monta URL WhatsApp com prefixo DDI 55 quando necessário. Espelha a
// lógica de buildWhatsAppUrl da lib quickReplies, mas sem dep (aqui
// a mensagem é sempre a mesma — produtor reiniciando contato).
function buildWhatsApp(num: string | null, corretoraName: string): string | null {
  if (!num) return null;
  const digits = num.replace(/\D/g, "");
  if (digits.length < 8) return null;
  const withDdi = digits.startsWith("55") ? digits : `55${digits}`;
  const msg = `Olá ${corretoraName}, mandei meu contato pelo Mercado do Café do Kavita e queria acompanhar.`;
  return `https://wa.me/${withDdi}?text=${encodeURIComponent(msg)}`;
}

export default function LeadStatusClient({
  id,
  token,
}: {
  id: string;
  token: string;
}) {
  const [data, setData] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get<StatusResponse>(
          `/api/public/corretoras/leads/${encodeURIComponent(id)}/status/${encodeURIComponent(token)}`,
        );
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) {
          setError(
            formatApiError(err, "Não foi possível carregar o status.").message,
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, token]);

  const statusUi = data ? STATUS_UI[data.status] : null;
  const whatsappUrl =
    data?.corretora?.whatsapp && data.corretora?.name
      ? buildWhatsApp(data.corretora.whatsapp, data.corretora.name)
      : null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-stone-950 text-stone-100">
      {/* Atmospheric glows — coerência com o módulo */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[1000px] -translate-x-1/2 rounded-[100%] bg-amber-500/[0.08] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-20 h-[500px] w-[700px] rounded-full bg-amber-700/[0.07] blur-3xl"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center px-4 py-16">
        <div className="relative w-full overflow-hidden rounded-3xl bg-white/[0.04] p-8 ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm md:p-12">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
          />

          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center text-amber-200">
              <PanelBrandMark className="h-full w-full" />
            </div>
            <p className="mt-5 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300/90">
              Mercado do Café · Seu contato
            </p>

            {loading && (
              <p className="mt-6 text-sm text-stone-300">Carregando…</p>
            )}

            {error && !loading && (
              <>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-stone-50 md:text-3xl">
                  Link inválido ou expirado
                </h1>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-stone-300">
                  {error}
                </p>
                <Link
                  href="/mercado-do-cafe/corretoras"
                  className="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold text-stone-200 transition-colors hover:border-amber-400/30 hover:text-amber-200"
                >
                  Ver corretoras
                </Link>
              </>
            )}

            {data && statusUi && !error && (
              <>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-stone-50 md:text-3xl">
                  {data.corretora?.name ?? "Sua corretora"}
                </h1>
                <span
                  className={`mt-4 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ring-1 ${TONE_CLASSES[statusUi.tone]}`}
                >
                  {statusUi.label}
                </span>
                <p className="mt-4 max-w-md text-sm leading-relaxed text-stone-300">
                  {statusUi.hint}
                </p>

                {/* Timeline discreta */}
                <dl className="mt-6 grid w-full max-w-md grid-cols-1 gap-3 text-left sm:grid-cols-2">
                  <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.06]">
                    <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300/80">
                      Enviado
                    </dt>
                    <dd className="mt-0.5 text-[13px] text-stone-100">
                      {formatDate(data.created_at)}
                    </dd>
                    <dd className="text-[10px] text-stone-500">
                      {relativeTime(data.created_at)}
                    </dd>
                  </div>
                  {data.first_response_at ? (
                    <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.06]">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300/80">
                        Primeira resposta
                      </dt>
                      <dd className="mt-0.5 text-[13px] text-stone-100">
                        {formatDate(data.first_response_at)}
                      </dd>
                      <dd className="text-[10px] text-stone-500">
                        {relativeTime(data.first_response_at)}
                      </dd>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/[0.06]">
                      <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
                        Primeira resposta
                      </dt>
                      <dd className="mt-0.5 text-[13px] text-stone-300">
                        Ainda aguardando
                      </dd>
                    </div>
                  )}
                </dl>

                {/* Ações: chamar a corretora pelos canais que ela divulga */}
                {data.corretora && (
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-[12px] font-semibold text-white shadow-sm shadow-emerald-600/20 transition-colors hover:bg-emerald-500"
                      >
                        Chamar no WhatsApp
                      </a>
                    )}
                    {data.corretora.phone && (
                      <a
                        href={`tel:+55${data.corretora.phone.replace(/\D/g, "")}`}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-[12px] font-semibold text-stone-200 transition-colors hover:border-amber-400/30 hover:text-amber-200"
                      >
                        Ligar
                      </a>
                    )}
                    <Link
                      href={`/mercado-do-cafe/corretoras/${data.corretora.slug}`}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-[12px] font-semibold text-stone-200 transition-colors hover:border-amber-400/30 hover:text-amber-200"
                    >
                      Ver corretora
                    </Link>
                  </div>
                )}

                <p className="mt-8 max-w-md text-[11px] leading-relaxed text-stone-500">
                  Essa página é privada e específica para este contato. Você
                  pode voltar aqui a qualquer momento pelo link do e-mail.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
