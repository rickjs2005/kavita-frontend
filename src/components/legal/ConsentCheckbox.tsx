"use client";

// src/components/legal/ConsentCheckbox.tsx
//
// Checkbox padronizado de aceite de Termos + Política de Privacidade.
// Usado em todos os formulários de cadastro/lead que precisam coletar
// consentimento LGPD.
//
// Por que centralizar em 1 componente:
//   - Texto legal é IDÊNTICO em todos os fluxos (consistência jurídica).
//   - Links para /termos e /privacidade abrem em nova aba (não perde
//     o que o usuário já preencheu).
//   - Acessibilidade: id estável, aria-describedby para erro, focus
//     ring uniforme, target=_blank com rel correto.
//   - Quando subir Termos v2, basta atualizar a label aqui — todos os
//     forms herdam.
//
// Uso típico (react-hook-form):
//
//   <ConsentCheckbox
//     register={register("aceite_termos", {
//       required: "Você precisa aceitar os termos para continuar.",
//     })}
//     error={errors.aceite_termos?.message}
//   />

import Link from "next/link";
import type { UseFormRegisterReturn } from "react-hook-form";

type Props = {
  /**
   * Resultado do `register("aceite_termos", { required: ... })` do
   * react-hook-form. O componente é controlled-via-RHF — não tem
   * state interno, não armazena o valor; só renderiza e expõe os
   * handlers que o RHF precisa.
   */
  register: UseFormRegisterReturn;
  /**
   * Mensagem de erro a exibir abaixo do checkbox quando a validação
   * falhar (ex.: usuário tentou submit sem marcar).
   */
  error?: string;
  /**
   * Id customizado do checkbox. Default `consent-checkbox`. Quando há
   * múltiplos forms na mesma página, passar id distinto.
   */
  id?: string;
  /**
   * Variante visual:
   *   - "default" — fundo claro (tela de login/register/loja)
   *   - "dark" — fundo escuro com glass (mercado-do-cafe, drones)
   * Default: "default".
   */
  variant?: "default" | "dark";
};

export default function ConsentCheckbox({
  register,
  error,
  id = "consent-checkbox",
  variant = "default",
}: Props) {
  const isDark = variant === "dark";

  // Classes do <label> wrapper. Mantém o alvo de toque grande (todo o
  // bloco é clicável) e cores semânticas via tokens. Sem hex hardcoded.
  const wrapperCls = isDark
    ? "flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]"
    : "flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4 transition-colors hover:bg-stone-100";

  const inputCls = isDark
    ? "mt-0.5 h-4 w-4 shrink-0 rounded border-white/20 bg-stone-900 text-amber-400 focus:ring-amber-400/60 focus:ring-offset-0"
    : "mt-0.5 h-4 w-4 shrink-0 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500";

  const textCls = isDark
    ? "text-[12px] leading-relaxed text-stone-300"
    : "text-[13px] leading-relaxed text-stone-700";

  const linkCls = isDark
    ? "font-semibold text-amber-200 underline underline-offset-2 hover:text-amber-100"
    : "font-semibold text-emerald-700 underline underline-offset-2 hover:text-emerald-800";

  const errorCls = isDark
    ? "mt-1.5 text-[11px] font-medium text-rose-300"
    : "mt-1.5 text-[12px] font-medium text-rose-600";

  return (
    <div>
      <label htmlFor={id} className={wrapperCls}>
        <input
          id={id}
          type="checkbox"
          className={inputCls}
          aria-describedby={error ? `${id}-error` : undefined}
          aria-invalid={Boolean(error) || undefined}
          {...register}
        />
        <span className={textCls}>
          Li e aceito os{" "}
          <Link
            href="/termos"
            target="_blank"
            rel="noopener noreferrer"
            className={linkCls}
          >
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link
            href="/privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className={linkCls}
          >
            Política de Privacidade
          </Link>{" "}
          da Kavita.
        </span>
      </label>
      {error ? (
        <p id={`${id}-error`} role="alert" className={errorCls}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
