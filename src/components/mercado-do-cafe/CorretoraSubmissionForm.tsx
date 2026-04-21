"use client";

// src/components/mercado-do-cafe/CorretoraSubmissionForm.tsx
//
// Form público de cadastro de corretora — DARK COMMITTED.
//
// Redesign senior UX/UI: o form passa a viver no mesmo idioma visual do
// resto do módulo Mercado do Café (stone-950 + glass + amber). Não é só
// uma mudança de cor — a estrutura inteira foi repensada para ficar mais
// premium e funcional:
//
//   • Progress strip live no topo — feedback de quantos campos
//     obrigatórios já estão preenchidos (sem submit, sem refetch).
//   • 3 seções numeradas (01 Empresa · 02 Contatos · 03 Acesso) com a
//     mesma DNA dos SectionLabel da página da corretora.
//   • Inputs em dark glass com focus ring amber + label mono kicker.
//   • Marcador de obrigatório como pulse dot amber em vez de asterisco.
//   • Logo upload virou drop zone editorial com preview ao vivo.
//   • Senha com medidor de força (4 bars) live + check de "match".
//   • Trust line de contato satisfatório (precisa ao menos 1 contato
//     além do email) com check ao vivo.
//   • Submit com gradient amber assinatura do módulo, loading bar.
//
// Lógica intocada: mesmos fields, mesma validação RHF, mesmo submit
// FormData → /api/public/corretoras/submit, mesmo redirect.

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import type { CorretoraSubmissionFormData } from "@/types/corretora";
import {
  TurnstileWidget,
  TURNSTILE_ENABLED,
  type TurnstileHandle,
} from "@/components/painel-corretora/TurnstileWidget";

// ─── Configuração ────────────────────────────────────────────────

const REQUIRED_FIELDS = [
  "name",
  "contact_name",
  "city",
  "state",
  "email",
  "senha",
  "senha_confirmacao",
] as const;

// Contatos extras que satisfazem o requisito "ao menos 1 meio de contato
// adicional além do email" (que é login).
const EXTRA_CONTACT_FIELDS = [
  "phone",
  "whatsapp",
  "website",
  "instagram",
  "facebook",
] as const;

// ─── Estilos compartilhados ──────────────────────────────────────

const inputClass =
  "peer w-full rounded-xl bg-white/[0.04] px-3.5 py-3 text-sm text-stone-100 placeholder:text-stone-500 ring-1 ring-white/10 backdrop-blur-sm transition-all hover:bg-white/[0.06] focus:bg-white/[0.07] focus:outline-none focus:ring-2 focus:ring-amber-400/50";
const inputClassError =
  "peer w-full rounded-xl bg-rose-500/[0.06] px-3.5 py-3 text-sm text-stone-100 placeholder:text-stone-500 ring-1 ring-rose-400/40 backdrop-blur-sm transition-all focus:bg-rose-500/[0.08] focus:outline-none focus:ring-2 focus:ring-rose-400/50";
const errorClass =
  "mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-rose-300";

// ─── Helpers ─────────────────────────────────────────────────────

function passwordStrength(pwd: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  tone: "stone" | "rose" | "amber" | "emerald";
} {
  if (!pwd) return { score: 0, label: "Aguardando", tone: "stone" };
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (pwd.length >= 12) score += 1;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
  if (/\d/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score += 1;
  const s = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
  if (s <= 1) return { score: s, label: "Fraca", tone: "rose" };
  if (s === 2) return { score: s, label: "Razoável", tone: "amber" };
  if (s === 3) return { score: s, label: "Boa", tone: "amber" };
  return { score: s, label: "Forte", tone: "emerald" };
}

// ─── Component ───────────────────────────────────────────────────

export function CorretoraSubmissionForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Turnstile — fail-closed. Submit só libera com token válido quando
  // a feature está configurada (NEXT_PUBLIC_TURNSTILE_SITE_KEY). Em dev
  // sem key, o submit procede normalmente.
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileHandle>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setError,
  } = useForm<CorretoraSubmissionFormData>({
    defaultValues: {
      name: "",
      contact_name: "",
      description: "",
      city: "",
      state: "",
      region: "",
      phone: "",
      whatsapp: "",
      email: "",
      website: "",
      instagram: "",
      facebook: "",
      senha: "",
      senha_confirmacao: "",
    },
  });

  // Watch live para feedback de UX — não controla o RHF, só visual.
  const watched = watch();
  const senhaValue = watched.senha || "";
  const senhaConfirm = watched.senha_confirmacao || "";

  // Progresso: % de campos obrigatórios preenchidos
  const progress = useMemo(() => {
    const filled = REQUIRED_FIELDS.filter((f) => {
      const v = watched[f];
      return typeof v === "string" && v.trim().length > 0;
    }).length;
    return Math.round((filled / REQUIRED_FIELDS.length) * 100);
  }, [watched]);

  // Tem ao menos 1 contato extra (além do email)?
  const hasExtraContact = useMemo(() => {
    return EXTRA_CONTACT_FIELDS.some((f) => {
      const v = watched[f];
      return typeof v === "string" && v.trim().length > 0;
    });
  }, [watched]);

  const senhaStrength = passwordStrength(senhaValue);
  const senhaMatch =
    senhaValue.length > 0 && senhaConfirm.length > 0 && senhaValue === senhaConfirm;

  // ─── Logo handlers ────────────────────────────────────
  const handleFileSelected = (file: File | null) => {
    if (!file) {
      setLogoFile(null);
      setLogoPreview(null);
      return;
    }
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
      toast.error("Use JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo precisa ter no máximo 2MB.");
      return;
    }
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0] ?? null;
    handleFileSelected(file);
  };

  // ─── Submit ───────────────────────────────────────────
  const onSubmit = async (data: CorretoraSubmissionFormData) => {
    if (data.senha !== data.senha_confirmacao) {
      setError("senha_confirmacao", { message: "As senhas não coincidem." });
      return;
    }

    const allContacts = [...EXTRA_CONTACT_FIELDS, "email"] as const;
    const hasContact = allContacts.some((f) => data[f]?.trim());
    if (!hasContact) {
      setError("email", { message: "Informe ao menos um meio de contato." });
      return;
    }

    if (TURNSTILE_ENABLED && !turnstileToken) {
      toast.error(
        turnstileError ?? "Aguarde a verificação anti-bot ser concluída.",
      );
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (typeof value === "string" && value.trim()) {
          formData.append(key, value.trim());
        }
      });
      if (logoFile) formData.append("logo", logoFile);

      // Token vai no header (não no body) para que o middleware
      // verifyTurnstile possa validar antes do multer — assim, em
      // caso de fail-closed, o logo nem chega a ser persistido.
      const headers: Record<string, string> =
        TURNSTILE_ENABLED && turnstileToken
          ? { "X-Turnstile-Token": turnstileToken }
          : {};

      await apiClient.post("/api/public/corretoras/submit", formData, {
        headers,
      });
      toast.success("Cadastro enviado com sucesso!");
      router.push("/mercado-do-cafe/corretoras/cadastro/sucesso");
    } catch (err) {
      toast.error(
        formatApiError(err, "Erro ao enviar cadastro. Tente novamente.")
          .message,
      );
      // Token é single-use; reset para permitir retry sem reload.
      setTurnstileToken(null);
      turnstileRef.current?.reset();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* ═══ Progress strip ════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/[0.08] shadow-xl shadow-black/30 backdrop-blur-sm md:p-6"
        aria-label="Progresso do cadastro"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-amber-500/10 blur-3xl"
        />

        <div className="relative flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/90">
              Progresso do cadastro
            </p>
            <p className="mt-1 text-sm font-semibold text-stone-100">
              {progress === 100
                ? "Tudo pronto. É só enviar."
                : "Continue preenchendo os campos obrigatórios."}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-2xl font-bold tabular-nums text-stone-50">
              {progress}
              <span className="ml-0.5 text-base text-stone-500">%</span>
            </p>
          </div>
        </div>

        <div className="relative mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-orange-300 shadow-[0_0_12px_rgba(251,191,36,0.5)] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
            aria-hidden
          />
        </div>
      </div>

      {/* ═══ 01 / Dados da empresa ═══════════════════════════════════ */}
      <SectionPanel
        number="01"
        kicker="Identidade"
        title="Dados da empresa"
        subtitle="É assim que sua corretora aparece no diretório do Mercado do Café."
      >
        <div className="space-y-6">
          <Field
            label="Nome da empresa"
            required
            error={errors.name?.message}
            hint="Como o produtor verá no diretório."
          >
            <input
              {...register("name", {
                required: "Nome da empresa é obrigatório.",
                minLength: { value: 3, message: "Mínimo 3 caracteres." },
              })}
              className={errors.name ? inputClassError : inputClass}
              placeholder="Ex: Nome da sua corretora"
            />
          </Field>

          <Field
            label="Nome do responsável"
            required
            error={errors.contact_name?.message}
          >
            <input
              {...register("contact_name", {
                required: "Nome do responsável é obrigatório.",
                minLength: { value: 3, message: "Mínimo 3 caracteres." },
              })}
              className={
                errors.contact_name ? inputClassError : inputClass
              }
              placeholder="Ex: João Silva"
            />
          </Field>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_120px]">
            <Field
              label="Cidade"
              required
              error={errors.city?.message}
            >
              <input
                {...register("city", {
                  required: "Cidade é obrigatória.",
                  minLength: { value: 2, message: "Mínimo 2 caracteres." },
                })}
                className={errors.city ? inputClassError : inputClass}
                placeholder="Cidade onde sua corretora atua"
              />
            </Field>

            <Field
              label="UF"
              required
              error={errors.state?.message}
            >
              <input
                {...register("state", {
                  required: "Estado é obrigatório.",
                  minLength: { value: 2, message: "Sigla de 2 letras." },
                  maxLength: { value: 2, message: "Sigla de 2 letras." },
                })}
                className={`${
                  errors.state ? inputClassError : inputClass
                } text-center uppercase tracking-[0.2em]`}
                placeholder="MG"
                maxLength={2}
              />
            </Field>
          </div>

          <Field label="Região">
            <input
              {...register("region")}
              className={inputClass}
              placeholder="Ex: Zona da Mata, Sul de Minas, Cerrado, Mogiana, Caparaó, Sul da Bahia…"
            />
          </Field>

          <Field
            label="Sobre a empresa"
            error={errors.description?.message}
            hint="Conte brevemente sua atuação, tipos de café e diferenciais. Texto editorial — vai aparecer na página da corretora."
          >
            <textarea
              {...register("description", {
                maxLength: {
                  value: 2000,
                  message: "Máximo 2000 caracteres.",
                },
              })}
              rows={5}
              className={`${
                errors.description ? inputClassError : inputClass
              } resize-y leading-relaxed`}
              placeholder="Conte em 2-3 linhas a história da sua corretora, há quanto tempo atua e o perfil do café que negocia."
            />
          </Field>

          {/* ─── Logo dropzone ─── */}
          <div>
            <p className="mb-2 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
              <span>Logo da empresa</span>
              <span className="text-stone-600">·</span>
              <span className="font-sans normal-case tracking-normal text-stone-500">
                opcional
              </span>
            </p>

            <div
              role="button"
              tabIndex={0}
              aria-label="Selecionar ou arrastar logo"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`group relative flex cursor-pointer items-center gap-5 overflow-hidden rounded-2xl border border-dashed p-5 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 ${
                dragOver
                  ? "border-amber-400/60 bg-amber-500/[0.06]"
                  : "border-white/15 bg-white/[0.03] hover:border-amber-400/40 hover:bg-white/[0.05]"
              }`}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/30 to-transparent"
              />

              {/* Preview / placeholder */}
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stone-900/60 ring-1 ring-white/10">
                {logoPreview ? (
                  <Image
                    src={logoPreview}
                    alt="Pré-visualização do logo"
                    width={80}
                    height={80}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-amber-300/70"
                    aria-hidden
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="M21 15l-5-5L5 21" />
                  </svg>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-stone-100">
                  {logoFile
                    ? logoFile.name
                    : "Arraste sua logo aqui ou clique para selecionar"}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-stone-500">
                  JPEG · PNG · WebP &nbsp;·&nbsp; até 2MB
                </p>
              </div>

              {logoFile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFileSelected(null);
                  }}
                  className="relative shrink-0 rounded-lg bg-white/[0.05] px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-300 ring-1 ring-white/10 transition-colors hover:bg-rose-500/10 hover:text-rose-200 hover:ring-rose-400/30"
                >
                  Remover
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) =>
                  handleFileSelected(e.target.files?.[0] ?? null)
                }
                className="hidden"
              />
            </div>
          </div>
        </div>
      </SectionPanel>

      {/* ═══ 02 / Canais de contato ═══════════════════════════════════ */}
      <SectionPanel
        number="02"
        kicker="Contato"
        title="Como produtores chegam até você"
        subtitle="O e-mail vira seu login no painel. Informe ao menos um canal extra (WhatsApp, telefone, redes) para receber leads pelos canais nativos da corretora."
        rightSlot={
          <ContactReadyBadge ready={hasExtraContact} />
        }
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field
            label="E-mail · login"
            required
            error={errors.email?.message}
            hint="Será também o seu acesso ao painel."
          >
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              {...register("email", {
                required: "E-mail é obrigatório.",
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: "E-mail inválido.",
                },
              })}
              className={errors.email ? inputClassError : inputClass}
              placeholder="contato@corretora.com.br"
            />
          </Field>

          <Field label="WhatsApp">
            <input
              {...register("whatsapp")}
              className={inputClass}
              placeholder="(33) 9 9999-9999"
            />
          </Field>

          <Field label="Telefone">
            <input
              {...register("phone")}
              className={inputClass}
              placeholder="(33) 3333-3333"
            />
          </Field>

          <Field label="Site">
            <input
              {...register("website")}
              className={inputClass}
              placeholder="https://..."
            />
          </Field>

          <Field label="Instagram">
            <input
              {...register("instagram")}
              className={inputClass}
              placeholder="@suacorretora"
            />
          </Field>

          <Field label="Facebook">
            <input
              {...register("facebook")}
              className={inputClass}
              placeholder="facebook.com/..."
            />
          </Field>
        </div>
      </SectionPanel>

      {/* ═══ 03 / Credenciais ═══════════════════════════════════════ */}
      <SectionPanel
        number="03"
        kicker="Acesso"
        title="Crie sua senha agora"
        subtitle="Após a aprovação, você entra no painel direto com o e-mail acima e a senha que definir aqui — sem link externo, sem fricção."
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field
            label="Senha"
            required
            error={errors.senha?.message}
          >
            <input
              type="password"
              autoComplete="new-password"
              {...register("senha", {
                required: "Senha é obrigatória.",
                minLength: { value: 8, message: "Mínimo 8 caracteres." },
                maxLength: { value: 200, message: "Máximo 200 caracteres." },
              })}
              className={errors.senha ? inputClassError : inputClass}
              placeholder="Pelo menos 8 caracteres"
            />
          </Field>

          <Field
            label="Confirmar senha"
            required
            error={errors.senha_confirmacao?.message}
          >
            <input
              type="password"
              autoComplete="new-password"
              {...register("senha_confirmacao", {
                required: "Confirmação é obrigatória.",
                validate: (value) =>
                  value === senhaValue || "As senhas não coincidem.",
              })}
              className={
                errors.senha_confirmacao ? inputClassError : inputClass
              }
              placeholder="Repita a senha"
            />
          </Field>
        </div>

        {/* Strength meter + match check */}
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <StrengthMeter strength={senhaStrength} />
          <MatchIndicator
            visible={senhaConfirm.length > 0}
            match={senhaMatch}
          />
        </div>
      </SectionPanel>

      {/* ═══ Turnstile anti-bot ═══════════════════════════════════════
          Fail-closed: sem token, o submit não habilita. Em dev sem
          TURNSTILE_SITE_KEY o bloco inteiro some. Theme dark combina
          com o restante do form. */}
      {TURNSTILE_ENABLED && (
        <div
          className="flex flex-col items-center gap-2 rounded-2xl bg-white/[0.02] p-4 ring-1 ring-white/[0.06]"
          aria-live="polite"
        >
          <TurnstileWidget
            ref={turnstileRef}
            theme="dark"
            onToken={setTurnstileToken}
            onError={setTurnstileError}
          />
          {!turnstileToken && !turnstileError && (
            <p className="text-[10px] uppercase tracking-[0.14em] text-stone-400">
              Verificação de segurança em andamento…
            </p>
          )}
          {turnstileError && (
            <p className="max-w-md text-center text-[12px] leading-relaxed text-rose-300">
              {turnstileError}
            </p>
          )}
        </div>
      )}

      {/* ═══ Submit row ═══════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/[0.08] shadow-2xl shadow-black/40 backdrop-blur-sm md:p-8">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-500/15 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-16 h-52 w-52 rounded-full bg-orange-700/15 blur-3xl"
        />

        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-md">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/90">
              Pronto para enviar
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-stone-300">
              Os dados passam pela análise da equipe Kavita antes da
              publicação. Você recebe um e-mail assim que aprovado.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting || (TURNSTILE_ENABLED && !turnstileToken)}
            aria-label={
              submitting ? "Enviando cadastro" : "Enviar cadastro"
            }
            className="group relative shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-amber-300 to-amber-500 px-6 py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-stone-950 shadow-lg shadow-amber-500/30 transition-all hover:from-amber-200 hover:to-amber-400 hover:shadow-amber-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent"
            />
            <span className="relative flex items-center gap-2">
              {submitting ? (
                <>
                  <svg
                    className="h-3.5 w-3.5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="9"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeOpacity="0.3"
                    />
                    <path
                      d="M21 12a9 9 0 0 0-9-9"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                  Enviando…
                </>
              ) : (
                <>
                  Enviar cadastro
                  <span
                    aria-hidden
                    className="transition-transform duration-300 group-hover:translate-x-0.5"
                  >
                    →
                  </span>
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </form>
  );
}

// ══════════════════════════════════════════════════════════════════
// Building blocks
// ══════════════════════════════════════════════════════════════════

function SectionPanel({
  number,
  kicker,
  title,
  subtitle,
  rightSlot,
  children,
}: {
  number: string;
  kicker: string;
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-white/[0.04] p-6 ring-1 ring-white/[0.08] shadow-xl shadow-black/40 backdrop-blur-sm md:p-9">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/40 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-amber-500/[0.08] blur-3xl"
      />

      <header className="relative mb-7 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-md bg-amber-400/10 px-2 py-1 font-mono text-[10px] font-bold uppercase tabular-nums tracking-[0.1em] text-amber-300 ring-1 ring-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.1)]">
              {number}
            </span>
            <span aria-hidden className="h-px w-6 bg-white/15" />
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300/80">
              {kicker}
            </p>
          </div>
          <h2 className="mt-3 text-lg font-semibold tracking-tight text-stone-50 md:text-xl">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-stone-400">
              {subtitle}
            </p>
          )}
        </div>
        {rightSlot && <div className="shrink-0">{rightSlot}</div>}
      </header>

      <div className="relative">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
        {required && (
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.7)]"
          />
        )}
        <span>{label}</span>
        {required && (
          <span className="font-sans normal-case tracking-normal text-stone-600">
            obrigatório
          </span>
        )}
      </span>
      {children}
      {hint && !error && (
        <p className="mt-2 text-[11px] leading-relaxed text-stone-500">
          {hint}
        </p>
      )}
      {error && (
        <p className={errorClass}>
          <span aria-hidden>✗</span>
          {error}
        </p>
      )}
    </label>
  );
}

function ContactReadyBadge({ ready }: { ready: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] backdrop-blur-sm transition-all ${
        ready
          ? "bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/30"
          : "bg-white/[0.04] text-stone-500 ring-1 ring-white/10"
      }`}
      aria-live="polite"
    >
      <span
        aria-hidden
        className={`h-1.5 w-1.5 rounded-full ${
          ready
            ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]"
            : "bg-stone-600"
        }`}
      />
      {ready ? "Canal extra OK" : "Falta 1 canal extra"}
    </span>
  );
}

function StrengthMeter({
  strength,
}: {
  strength: ReturnType<typeof passwordStrength>;
}) {
  const segments = [0, 1, 2, 3];

  const segColor = (i: number) => {
    if (strength.score === 0) return "bg-white/[0.06]";
    if (i >= strength.score) return "bg-white/[0.06]";
    if (strength.tone === "rose") return "bg-rose-400";
    if (strength.tone === "amber") return "bg-amber-400";
    if (strength.tone === "emerald") return "bg-emerald-400";
    return "bg-white/[0.06]";
  };

  const labelColor =
    strength.tone === "emerald"
      ? "text-emerald-300"
      : strength.tone === "amber"
        ? "text-amber-300"
        : strength.tone === "rose"
          ? "text-rose-300"
          : "text-stone-500";

  return (
    <div className="rounded-xl bg-white/[0.03] p-3.5 ring-1 ring-white/[0.06]">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
          Força da senha
        </p>
        <p
          className={`font-mono text-[10px] font-bold uppercase tracking-[0.14em] ${labelColor}`}
        >
          {strength.label}
        </p>
      </div>
      <div className="mt-2 flex gap-1.5" aria-hidden>
        {segments.map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${segColor(i)}`}
          />
        ))}
      </div>
    </div>
  );
}

function MatchIndicator({
  visible,
  match,
}: {
  visible: boolean;
  match: boolean;
}) {
  if (!visible) {
    return (
      <div className="rounded-xl bg-white/[0.03] p-3.5 ring-1 ring-white/[0.06]">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            Conferência
          </p>
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-stone-600">
            Aguardando
          </p>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-stone-500">
          Repita a senha para conferir.
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl p-3.5 ring-1 transition-all ${
        match
          ? "bg-emerald-400/[0.06] ring-emerald-400/30"
          : "bg-rose-400/[0.06] ring-rose-400/30"
      }`}
      aria-live="polite"
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
          Conferência
        </p>
        <p
          className={`font-mono text-[10px] font-bold uppercase tracking-[0.14em] ${
            match ? "text-emerald-300" : "text-rose-300"
          }`}
        >
          {match ? "Coincide" : "Diferente"}
        </p>
      </div>
      <div
        className={`mt-2 flex items-center gap-2 text-[11px] ${
          match ? "text-emerald-200" : "text-rose-200"
        }`}
      >
        <span aria-hidden>{match ? "✓" : "✗"}</span>
        {match
          ? "As duas senhas coincidem."
          : "As senhas ainda não coincidem."}
      </div>
    </div>
  );
}
