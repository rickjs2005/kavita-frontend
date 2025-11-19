"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserAddresses, UserAddressPayload } from "@/hooks/useUserAddresses";

export default function NovoEnderecoPage() {
  const router = useRouter();
  const { createAddress } = useUserAddresses();

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UserAddressPayload>({
    apelido: "",
    cep: "",
    endereco: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    complemento: "",
    ponto_referencia: "",
    telefone: "",
    is_default: true,
  });

  const set =
    (field: keyof UserAddressPayload) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.endereco || !form.cep || !form.cidade || !form.estado) {
      // validação simples
      return;
    }

    try {
      setSaving(true);
      await createAddress(form);
      router.push("/meus-dados/enderecos");
    } finally {
      setSaving(false);
    }
  };

  // classes de estilo (apenas layout)
  const ui = {
    wrap: "pt-20 sm:pt-24 md:pt-28 px-4 sm:px-6 lg:px-10",
    container: "mx-auto w-full max-w-3xl sm:max-w-4xl lg:max-w-5xl",
    card:
      "rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden",
    header: "mb-4 sm:mb-6",
    title: "text-lg sm:text-xl font-semibold tracking-tight",
    subtitle: "mt-1 text-xs sm:text-sm text-gray-500",
    form: "p-5 sm:p-6 lg:p-8 space-y-4 sm:space-y-5",
    grid: "grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5",
    input:
      "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 sm:py-3 text-sm " +
      "outline-none transition min-h-[44px] " +
      "focus:border-[#359293] focus:ring-2 focus:ring-[#359293]/20 placeholder:text-gray-400",
    footerButtons:
      "mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3",
    cancelBtn:
      "inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 " +
      "text-sm font-medium text-gray-700 hover:bg-gray-50",
    saveBtn:
      "inline-flex items-center justify-center rounded-lg bg-[#359293] px-5 py-2.5 text-sm font-semibold " +
      "text-white shadow-sm hover:bg-[#2b7778] disabled:opacity-60",
  };

  return (
    <div className={ui.wrap}>
      <div className={ui.container}>
        {/* título da página */}
        <div className={ui.header}>
          <h1 className={ui.title}>Novo endereço</h1>
          <p className={ui.subtitle}>
            Cadastre um endereço para facilitar seus próximos pedidos.
          </p>
        </div>

        {/* card do formulário */}
        <div className={ui.card}>
          <form onSubmit={handleSubmit} className={ui.form}>
            <div className={ui.grid}>
              <Field label="Apelido (Casa, Trabalho...)" full>
                <input
                  className={`${ui.input} input-kavita`}
                  value={form.apelido || ""}
                  onChange={set("apelido")}
                  placeholder="Casa, Fazenda, Escritório..."
                />
              </Field>

              <Field label="CEP">
                <input
                  className={`${ui.input} input-kavita`}
                  value={form.cep || ""}
                  onChange={set("cep")}
                  inputMode="numeric"
                  placeholder="00000-000"
                />
              </Field>

              <Field label="Endereço" full>
                <input
                  className={`${ui.input} input-kavita`}
                  value={form.endereco || ""}
                  onChange={set("endereco")}
                  autoComplete="street-address"
                  placeholder="Rua / Avenida"
                />
              </Field>

              <Field label="Número">
                <input
                  className={`${ui.input} input-kavita`}
                  value={form.numero || ""}
                  onChange={set("numero")}
                  placeholder="Número"
                />
              </Field>

              <Field label="Bairro">
                <input
                  className={`${ui.input} input-kavita`}
                  value={form.bairro || ""}
                  onChange={set("bairro")}
                />
              </Field>

              <Field label="Cidade">
                <input
                  className={`${ui.input} input-kavita`}
                  value={form.cidade || ""}
                  onChange={set("cidade")}
                />
              </Field>

              <Field label="Estado">
                <input
                  className={`${ui.input} input-kavita`}
                  value={form.estado || ""}
                  onChange={set("estado")}
                />
              </Field>

              <Field label="Complemento" full>
                <input
                  className={`${ui.input} input-kavita`}
                  value={form.complemento || ""}
                  onChange={set("complemento")}
                  placeholder="Apartamento, bloco, etc."
                />
              </Field>

              <Field label="Ponto de referência" full>
                <input
                  className={`${ui.input} input-kavita`}
                  value={form.ponto_referencia || ""}
                  onChange={set("ponto_referencia")}
                  placeholder="Perto de..."
                />
              </Field>

              <Field label="Telefone para entrega">
                <input
                  className={`${ui.input} input-kavita`}
                  value={form.telefone || ""}
                  onChange={set("telefone")}
                  inputMode="tel"
                  placeholder="(DD) 99999-9999"
                />
              </Field>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <input
                id="addr-default"
                type="checkbox"
                checked={!!form.is_default}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    is_default: e.target.checked,
                  }))
                }
              />
              <label htmlFor="addr-default" className="text-sm text-gray-700">
                Definir como endereço padrão
              </label>
            </div>

            <div className={ui.footerButtons}>
              <button
                type="button"
                onClick={() => router.back()}
                className={ui.cancelBtn}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className={ui.saveBtn}
              >
                {saving ? "Salvando..." : "Salvar endereço"}
              </button>
            </div>
          </form>
        </div>

        {/* respiro final da página */}
        <div className="h-8 sm:h-10" />
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div
      className={
        full
          ? "md:col-span-2 flex flex-col gap-1.5"
          : "flex flex-col gap-1.5"
      }
    >
      <span className="text-sm text-gray-700">{label}</span>
      {children}
    </div>
  );
}
