"use client";

// src/components/mercado-do-cafe/WhatsAppDirectButton.tsx
//
// Botão que abre conversa direta no WhatsApp da corretora com mensagem
// pré-formatada e contextualizada. Essencial para a realidade regional
// onde o produtor prefere WhatsApp a qualquer formulário.
//
// Gera link wa.me/55{phone}?text={encoded message}. Funciona sem
// integração de API — o aparelho do produtor abre o app/web.

type Variant = "primary" | "secondary" | "inline";

type Props = {
  /** Telefone do WhatsApp (pode vir com ou sem formatação). */
  whatsapp: string;
  /** Nome da corretora (para a mensagem). */
  corretoraNome: string;
  /** Cidade do visitante/lead, se conhecida (para contextualizar). */
  cidadeVisitante?: string | null;
  /** Mensagem personalizada; se fornecida, substitui a default. */
  mensagemCustom?: string;
  /** Variante visual. */
  variant?: Variant;
  /** Classe extra opcional. */
  className?: string;
  /** Texto do botão (default: "Falar no WhatsApp"). */
  label?: string;
};

/**
 * Remove todos os caracteres não numéricos e adiciona 55 se ausente.
 * Aceita formatos: (33) 99999-9999, +55 33 99999-9999, 33999999999.
 */
function normalizeWhatsApp(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // Remove leading zeros (caso venha com 0 de DDD antigo)
  const clean = digits.replace(/^0+/, "");
  // Se já começa com 55 e tem 12-13 dígitos, está no formato BR
  if (clean.startsWith("55") && (clean.length === 12 || clean.length === 13)) {
    return clean;
  }
  // Se tem 10 ou 11 dígitos (DDD + número), prefixar 55
  if (clean.length === 10 || clean.length === 11) {
    return `55${clean}`;
  }
  return clean;
}

/**
 * Mensagem default contextualizada com cidade (se disponível) e
 * corretora.
 */
function defaultMessage(corretoraNome: string, cidade?: string | null): string {
  const cidadeStr = cidade ? `sou de ${cidade} e ` : "";
  return `Olá, ${cidadeStr}vi a ${corretoraNome} no Kavita · Mercado do Café. Gostaria de conversar sobre negociação de café.`;
}

export function WhatsAppDirectButton({
  whatsapp,
  corretoraNome,
  cidadeVisitante,
  mensagemCustom,
  variant = "primary",
  className = "",
  label = "Falar no WhatsApp",
}: Props) {
  const phone = normalizeWhatsApp(whatsapp);
  const msg = mensagemCustom ?? defaultMessage(corretoraNome, cidadeVisitante);
  const href = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

  const variantClass: Record<Variant, string> = {
    // Primary: altura mínima 44px (alvo de toque mobile), respeita
    // w-full quando o caller passar (ex: CTA full-width no mobile).
    primary:
      "group relative inline-flex min-h-[44px] items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all hover:from-emerald-400 hover:to-emerald-500",
    secondary:
      "inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-500/20",
    inline:
      "inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 underline-offset-4 hover:underline",
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${variantClass[variant]} ${className}`}
      aria-label={`Abrir WhatsApp da ${corretoraNome}`}
    >
      {variant === "primary" && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
        />
      )}
      <span className={variant === "primary" ? "relative flex items-center gap-2" : ""}>
        <WhatsAppIcon className="h-4 w-4 shrink-0" />
        <span>{label}</span>
      </span>
    </a>
  );
}

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.84 12.84 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}
