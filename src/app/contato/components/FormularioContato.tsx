"use client";

import { useState, useRef } from "react";
import { HiOutlinePaperAirplane, HiOutlineCheckCircle } from "react-icons/hi2";
import apiClient from "@/lib/apiClient";
import { isApiError } from "@/lib/errors";

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

export default function FormularioContato() {
  const formRef = useRef<HTMLFormElement>(null);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [assunto, setAssunto] = useState("");
  const [mensagem, setMensagem] = useState("");

  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

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
            "Voce atingiu o limite de mensagens. Tente novamente mais tarde."
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
          setErrorMsg("Verifique os campos destacados e tente novamente.");
          return;
        }

        setErrorMsg(err.message || "Erro ao enviar mensagem.");
      } else {
        setErrorMsg(
          "Nao foi possivel enviar sua mensagem. Verifique sua conexao e tente novamente."
        );
      }
    }
  }

  if (state === "success") {
    return (
      <section id="formulario" className="bg-gray-50 py-12 sm:py-16">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-2xl border border-success/20 bg-white p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <HiOutlineCheckCircle className="h-8 w-8 text-success" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Mensagem enviada!
            </h3>
            <p className="mt-3 text-gray-600">
              Recebemos seu contato e responderemos em ate 24 horas uteis.
              Fique atento ao e-mail informado.
            </p>
            <button
              type="button"
              onClick={() => setState("idle")}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Enviar nova mensagem
            </button>
          </div>
        </div>
      </section>
    );
  }

  const inputBase =
    "w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
  const inputOk = "border-gray-200 hover:border-gray-300";
  const inputErr = "border-red-300 ring-1 ring-red-200";

  return (
    <section id="formulario" className="bg-gray-50 py-12 sm:py-16">
      <div className="mx-auto max-w-2xl px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Fale com a equipe
          </h2>
          <p className="mt-2 text-gray-600">
            Preencha o formulario abaixo e retornaremos o mais breve possivel
          </p>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          noValidate
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8"
        >
          {state === "error" && errorMsg && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {/* Nome */}
            <div className="sm:col-span-2">
              <label
                htmlFor="contato-nome"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Nome completo <span className="text-red-400">*</span>
              </label>
              <input
                id="contato-nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome"
                required
                className={`${inputBase} ${fieldErrors.nome ? inputErr : inputOk}`}
              />
              {fieldErrors.nome && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.nome}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="contato-email"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                E-mail <span className="text-red-400">*</span>
              </label>
              <input
                id="contato-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                className={`${inputBase} ${fieldErrors.email ? inputErr : inputOk}`}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
              )}
            </div>

            {/* Telefone */}
            <div>
              <label
                htmlFor="contato-telefone"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Telefone / WhatsApp
              </label>
              <input
                id="contato-telefone"
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(phoneMask(e.target.value))}
                placeholder="(31) 99999-9999"
                className={`${inputBase} ${fieldErrors.telefone ? inputErr : inputOk}`}
              />
              {fieldErrors.telefone && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldErrors.telefone}
                </p>
              )}
            </div>

            {/* Assunto */}
            <div className="sm:col-span-2">
              <label
                htmlFor="contato-assunto"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Assunto <span className="text-red-400">*</span>
              </label>
              <input
                id="contato-assunto"
                type="text"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                placeholder="Sobre o que voce precisa falar?"
                required
                className={`${inputBase} ${fieldErrors.assunto ? inputErr : inputOk}`}
              />
              {fieldErrors.assunto && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldErrors.assunto}
                </p>
              )}
            </div>

            {/* Mensagem */}
            <div className="sm:col-span-2">
              <label
                htmlFor="contato-mensagem"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Mensagem <span className="text-red-400">*</span>
              </label>
              <textarea
                id="contato-mensagem"
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Descreva sua duvida, sugestao ou solicitacao..."
                rows={5}
                required
                className={`${inputBase} resize-y min-h-[120px] ${fieldErrors.mensagem ? inputErr : inputOk}`}
              />
              {fieldErrors.mensagem && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldErrors.mensagem}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={state === "sending"}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-hover disabled:opacity-60 disabled:cursor-not-allowed sm:w-auto"
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
    </section>
  );
}
