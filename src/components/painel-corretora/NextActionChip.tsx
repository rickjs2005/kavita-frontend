// src/components/painel-corretora/NextActionChip.tsx
//
// Chip "Próxima ação" que aparece em cada lead do inbox.
// Converte o par (status, idade, qualificação) em uma sugestão humana
// e acionável para a equipe da corretora — reduz a fricção de olhar
// a lista e pensar "o que faço agora?".
//
// Regras (em ordem de prioridade):
//   1. Lead novo (status=new) com idade >= 2h          → "Responder AGORA"  (vermelho)
//   2. Lead novo (status=new)                          → "Primeiro contato"  (âmbar)
//   3. Contacted sem movimento há >48h                 → "Reaquecer"         (âmbar)
//   4. Negotiating (ou amostra prometida)              → "Confirmar amostra" (âmbar)
//   5. Amostra recebida                                → "Levar para cata"   (âmbar)
//   6. Default                                         → null (nada sugerido)
//
// O chip é compacto (inline-flex h-6) e só renderiza quando há uma
// sugestão — estado vazio não ocupa linha. Acessível via aria-label.

type Props = {
  status?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  amostraStatus?: string | null;
};

type Suggestion = {
  label: string;
  tone: "urgent" | "active" | "hint";
};

const HOUR_MS = 60 * 60 * 1000;

function hoursAgo(iso?: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return (Date.now() - t) / HOUR_MS;
}

function pickSuggestion(p: Props): Suggestion | null {
  const ageH = hoursAgo(p.createdAt) ?? 0;
  const stalenessH = hoursAgo(p.updatedAt ?? p.createdAt) ?? 0;

  // 1. Lead novo "envelhecendo" — alerta de SLA
  if (p.status === "new" && ageH >= 2) {
    return { label: "Responder agora", tone: "urgent" };
  }
  if (p.status === "new") {
    return { label: "Primeiro contato", tone: "active" };
  }

  // 4. Amostras — estágios físicos
  if (p.amostraStatus === "prometida") {
    return { label: "Cobrar amostra", tone: "active" };
  }
  if (p.amostraStatus === "recebida") {
    return { label: "Levar para cata", tone: "active" };
  }

  // 3. Contacted sem movimento há tempo
  if (p.status === "contacted" && stalenessH >= 48) {
    return { label: "Reaquecer contato", tone: "hint" };
  }

  return null;
}

const TONE_CLASSES: Record<Suggestion["tone"], string> = {
  urgent:
    "border-rose-400/40 bg-rose-500/15 text-rose-200",
  active:
    "border-amber-400/40 bg-amber-400/10 text-amber-200",
  hint:
    "border-white/10 bg-white/[0.04] text-stone-300",
};

export function NextActionChip(props: Props) {
  const suggestion = pickSuggestion(props);
  if (!suggestion) return null;
  return (
    <span
      aria-label={`Próxima ação sugerida: ${suggestion.label}`}
      className={`inline-flex h-6 items-center gap-1 rounded-full border px-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${TONE_CLASSES[suggestion.tone]}`}
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${
          suggestion.tone === "urgent"
            ? "bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.8)]"
            : suggestion.tone === "active"
              ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]"
              : "bg-stone-400"
        }`}
      />
      {suggestion.label}
    </span>
  );
}
