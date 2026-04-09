"use client";

import { useRef, useState } from "react";
import {
  HiOutlinePaperAirplane,
  HiOutlineCheckCircle,
  HiOutlineEnvelope,
  HiOutlineShieldCheck,
} from "react-icons/hi2";
import apiClient from "@/lib/apiClient";
import { isApiError } from "@/lib/errors";
import { trackContatoEvent } from "../trackContatoEvent";
import type { SupportConfig } from "@/server/data/supportConfig";

type FormState = "idle" | "sending" | "success" | "error";
type FieldErrors = Record<string, string>;

function phoneMask(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

const ASSUNTOS = [
  "Duvida sobre pedido",
  "Entrega e frete",
  "Troca ou devolucao",
  "Pagamento",
  "Problema no site",
  "Parceria comercial",
  "Outro assunto",
];

type FormProps = { config?: SupportConfig | null };

export default function FormularioContato({ config }: FormProps) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const formStartTracked = useRef(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setErrorMsg("");
    setFieldErrors({});

    try {
      await apiClient.post("/api/public/contato", {
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.replace(/\D/g, ""),
        assunto: assunto.trim(),
        mensagem: mensagem.trim(),
      });

      setState("success");
      setNome("");
      setEmail("");
      setTelefone("");
      setAssunto("");
      setMensagem("");
    } catch (err) {
      setState("error");

      if (isApiError(err)) {
        if (err.status === 429) {
          setErrorMsg(
            "Limite de envios atingido. Aguarde alguns minutos e tente novamente."
          );
          return;
        }

        const details = err.details as
          | { fields?: { field: string; message: string }[] }
          | undefined;

        if (details?.fields?.length) {
          const fe: FieldErrors = {};
          for (const f of details.fields) {
            fe[f.field] = f.message;
          }
          setFieldErrors(fe);
          setErrorMsg("Corrija os campos destacados abaixo.");
          return;
        }

        setErrorMsg(err.message || "Erro ao enviar. Tente novamente.");
      } else {
        setErrorMsg(
          "Falha na conexao. Verifique sua internet e tente novamente."
        );
      }
    }
  }

  /* ── Success state ─────────────────────────────────────────────── */

  if (state === "success") {
    return (
      <section id="formulario" className="bg-gradient-to-b from-gray-50 to-white py-14 sm:py-20">
        <div className="mx-auto max-w-lg px-4">
          <div className="rounded-3xl border border-success/20 bg-white p-8 text-center shadow-lg shadow-success/5 sm:p-12">
            {/* Animated check */}
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
              <HiOutlineCheckCircle className="h-10 w-10 text-success" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900">
              {config?.form_success_title ?? "Mensagem recebida!"}
            </h3>

            <p className="mx-auto mt-3 max-w-sm text-gray-500 leading-relaxed">
              {config?.form_success_message ??
                "Nossa equipe ja foi notificada e voce recebera uma resposta no e-mail informado em ate 24 horas uteis."}
            </p>

            <div className="mx-auto mt-6 flex items-center justify-center gap-2 rounded-xl bg-gray-50 px-4 py-2.5 text-sm text-gray-500">
              <HiOutlineEnvelope className="h-4 w-4 shrink-0" />
              <span className="truncate">{email || "seu e-mail"}</span>
            </div>

            <button
              type="button"
              onClick={() => setState("idle")}
              className="mt-8 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50"
            >
              Enviar outra mensagem
            </button>
          </div>
        </div>
      </section>
    );
  }

  /* ── Form state ────────────────────────────────────────────────── */

  const inputBase =
    "w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary";
  const inputOk = "border-gray-200 hover:border-gray-300";
  const inputErr = "border-red-300 bg-red-50/30 ring-1 ring-red-200";
  const labelCls = "mb-1.5 block text-sm font-medium text-gray-700";

  return (
    <section id="formulario" className="bg-gradient-to-b from-gray-50 to-white py-14 sm:py-20">
      <div className="mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5 lg:gap-14">
          {/* Left column — context */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {config?.form_title ?? "Fale com a equipe Kavita"}
            </h2>
            <p className="mt-3 text-gray-500 leading-relaxed">
              {config?.form_subtitle ?? "Descreva sua duvida ou solicitacao e retornaremos o mais rapido possivel."}
              Quanto mais detalhes, mais agil sera a resposta.
            </p>

            {/* Trust indicators */}
            <div className="mt-8 space-y-4 hidden lg:block">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <HiOutlineEnvelope className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Resposta por e-mail
                  </p>
                  <p className="text-xs text-gray-500">
                    Voce recebera a resposta no e-mail informado
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <HiOutlineShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    Dados protegidos
                  </p>
                  <p className="text-xs text-gray-500">
                    Suas informacoes sao sigilosas e seguras
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right column — form */}
          <div className="lg:col-span-3">
            <form
              onSubmit={handleSubmit}
              noValidate
              onFocusCapture={() => {
                if (!formStartTracked.current) {
                  formStartTracked.current = true;
                  trackContatoEvent("form_start");
                }
              }}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7"
            >
              {/* Error banner */}
              {state === "error" && errorMsg && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  <span className="mt-0.5 shrink-0 text-red-400">!</span>
                  {errorMsg}
                </div>
              )}

              <div className="space-y-5">
                {/* Nome */}
                <div>
                  <label htmlFor="c-nome" className={labelCls}>
                    Nome completo <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="c-nome"
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Como voce se chama?"
                    required
                    autoComplete="name"
                    className={`${inputBase} ${fieldErrors.nome ? inputErr : inputOk}`}
                  />
                  {fieldErrors.nome && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.nome}</p>
                  )}
                </div>

                {/* Email + Telefone */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="c-email" className={labelCls}>
                      E-mail <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="c-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      autoComplete="email"
                      className={`${inputBase} ${fieldErrors.email ? inputErr : inputOk}`}
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="c-tel" className={labelCls}>
                      WhatsApp
                    </label>
                    <input
                      id="c-tel"
                      type="tel"
                      value={telefone}
                      onChange={(e) => setTelefone(phoneMask(e.target.value))}
                      placeholder="(31) 99999-9999"
                      autoComplete="tel"
                      className={`${inputBase} ${fieldErrors.telefone ? inputErr : inputOk}`}
                    />
                    {fieldErrors.telefone && (
                      <p className="mt-1 text-xs text-red-500">{fieldErrors.telefone}</p>
                    )}
                  </div>
                </div>

                {/* Assunto — select */}
                <div>
                  <label htmlFor="c-assunto" className={labelCls}>
                    Assunto <span className="text-red-400">*</span>
                  </label>
                  <select
                    id="c-assunto"
                    value={assunto}
                    onChange={(e) => setAssunto(e.target.value)}
                    required
                    className={`${inputBase} ${
                      fieldErrors.assunto ? inputErr : inputOk
                    } ${!assunto ? "text-gray-400" : "text-gray-900"}`}
                  >
                    <option value="" disabled>
                      Selecione o assunto
                    </option>
                    {ASSUNTOS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.assunto && (
                    <p className="mt-1 text-xs text-red-500">{fieldErrors.assunto}</p>
                  )}
                </div>

                {/* Mensagem */}
                <div>
                  <label htmlFor="c-msg" className={labelCls}>
                    Mensagem <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id="c-msg"
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    placeholder="Descreva o que precisa. Inclua numero do pedido, se houver."
                    rows={5}
                    required
                    className={`${inputBase} resize-y min-h-[130px] ${
                      fieldErrors.mensagem ? inputErr : inputOk
                    }`}
                  />
                  <div className="mt-1 flex items-center justify-between">
                    {fieldErrors.mensagem ? (
                      <p className="text-xs text-red-500">{fieldErrors.mensagem}</p>
                    ) : (
                      <span />
                    )}
                    <span className="text-xs text-gray-400">
                      {mensagem.length}/5000
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={state === "sending"}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-7 py-3.5 text-sm font-bold text-white shadow-sm shadow-accent/20 transition-all duration-150 hover:bg-accent-hover hover:shadow-md hover:shadow-accent/25 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none sm:w-auto"
              >
                {state === "sending" ? (
                  <>
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Enviando...
                  </>
                ) : (
                  <>
                    <HiOutlinePaperAirplane className="h-4 w-4" />
                    Enviar mensagem
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
