"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUserAddresses, UserAddress, UserAddressPayload } from "@/hooks/useUserAddresses";
import { ESTADOS_BR } from "@/utils/brasil";

type ViaCepResponse = {
  erro?: boolean;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

type IbgeMunicipio = { nome: string };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isIbgeMunicipio(v: unknown): v is IbgeMunicipio {
  return isRecord(v) && typeof v.nome === "string";
}

export default function EditarEnderecoPage() {
  const params = useParams();
  const router = useRouter();
  const { addresses, loading, updateAddress } = useUserAddresses();

  const id = useMemo(() => {
    const raw = params?.id;
    if (!raw) return null;
    if (Array.isArray(raw)) return Number(raw[0]);
    return Number(raw);
  }, [params]);

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<UserAddressPayload | null>(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    if (loading || id == null) return;

    const found = addresses.find((a) => a.id === id);
    if (!found) {
      const timer = setTimeout(() => {
        router.push("/meus-dados/enderecos");
      }, 1500);
      return () => clearTimeout(timer);
    }

    setForm(addressToPayload(found));
  }, [loading, addresses, id, router]);

  const setField =
    (field: keyof UserAddressPayload) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

  const handleCepChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 8);
    const masked = digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    setForm((prev) => (prev ? { ...prev, cep: masked } : prev));
  };

  useEffect(() => {
    const cepValue = form?.cep ?? "";
    const digits = cepValue.replace(/\D/g, "");
    if (digits.length !== 8) return;

    let aborted = false;

    (async () => {
      try {
        setCepLoading(true);
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
        if (!res.ok) return;

        const raw = (await res.json()) as unknown;
        if (!isRecord(raw)) return;

        const data = raw as ViaCepResponse;
        if (aborted || data.erro) return;

        setForm((prev) =>
          prev
            ? {
                ...prev,
                endereco: data.logradouro || prev.endereco,
                bairro: data.bairro || prev.bairro,
                cidade: data.localidade || prev.cidade,
                estado: data.uf || prev.estado,
              }
            : prev
        );
      } catch {
        // silêncio: não quebra UX em falhas momentâneas
      } finally {
        if (!aborted) setCepLoading(false);
      }
    })();

    return () => {
      aborted = true;
    };
  }, [form?.cep]);

  useEffect(() => {
    const uf = (form?.estado ?? "").toUpperCase();
    if (!uf) {
      setCities([]);
      return;
    }

    let aborted = false;

    (async () => {
      try {
        const res = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`
        );
        if (!res.ok) return;

        const raw = (await res.json()) as unknown;
        if (aborted || !Array.isArray(raw)) return;

        const names = raw.filter(isIbgeMunicipio).map((m) => m.nome).sort();
        setCities(names);
      } catch {
        // silêncio
      }
    })();

    return () => {
      aborted = true;
    };
  }, [form?.estado]);

  const handleEstadoChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    const uf = e.target.value;
    setForm((prev) => (prev ? { ...prev, estado: uf, cidade: "" } : prev));
  };

  const handleCidadeChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.target.value;
    setForm((prev) => (prev ? { ...prev, cidade: value } : prev));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || id == null) return;

    try {
      setSaving(true);
      await updateAddress(id, form);
      router.push("/meus-dados/enderecos");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return (
      <div className="pt-20 sm:pt-24 md:pt-28 px-4 sm:px-6 lg:px-10">
        <div className="mx-auto w-full max-w-3xl sm:max-w-4xl lg:max-w-5xl">
          <div className="animate-pulse space-y-3">
            <div className="h-7 w-44 rounded bg-gray-200" />
            <div className="h-64 rounded-2xl bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 sm:pt-24 md:pt-28 px-4 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-3xl sm:max-w-4xl lg:max-w-5xl">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight">Editar endereço</h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            Altere as informações de entrega deste endereço.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 lg:p-8 space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
              <Field label="Apelido (Casa, Trabalho...)" full>
                <input className="input-kavita" value={form.apelido || ""} onChange={setField("apelido")} />
              </Field>

              <Field label="CEP">
                <div className="flex items-center gap-2">
                  <input
                    className="input-kavita"
                    value={form.cep || ""}
                    onChange={handleCepChange}
                    inputMode="numeric"
                  />
                  {cepLoading && <span className="text-[11px] text-gray-500">Buscando...</span>}
                </div>
              </Field>

              <Field label="Endereço" full>
                <input
                  className="input-kavita"
                  value={form.endereco || ""}
                  onChange={setField("endereco")}
                  autoComplete="street-address"
                />
              </Field>

              <Field label="Número">
                <input className="input-kavita" value={form.numero || ""} onChange={setField("numero")} />
              </Field>

              <Field label="Bairro">
                <input className="input-kavita" value={form.bairro || ""} onChange={setField("bairro")} />
              </Field>

              <Field label="Cidade">
                <input
                  className="input-kavita"
                  list="editar-endereco-cidades"
                  value={form.cidade || ""}
                  onChange={handleCidadeChange}
                />
                <datalist id="editar-endereco-cidades">
                  {cities.map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              </Field>

              <Field label="Estado">
                <select
                  className="input-kavita"
                  value={(form.estado || "").toUpperCase()}
                  onChange={handleEstadoChange}
                >
                  <option value="">Selecione o estado</option>
                  {ESTADOS_BR.map((uf) => (
                    <option key={uf.sigla} value={uf.sigla}>
                      {uf.sigla} - {uf.nome}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Complemento" full>
                <input
                  className="input-kavita"
                  value={form.complemento || ""}
                  onChange={setField("complemento")}
                />
              </Field>

              <Field label="Ponto de referência" full>
                <input
                  className="input-kavita"
                  value={form.ponto_referencia || ""}
                  onChange={setField("ponto_referencia")}
                />
              </Field>

              <Field label="Telefone para entrega">
                <input
                  className="input-kavita"
                  value={form.telefone || ""}
                  onChange={setField("telefone")}
                  inputMode="tel"
                />
              </Field>
            </div>

            <div className="mt-2 flex items-center gap-2">
              <input
                id="addr-default-edit"
                type="checkbox"
                checked={!!form.is_default}
                onChange={(e) => setForm((prev) => (prev ? { ...prev, is_default: e.target.checked } : prev))}
              />
              <label htmlFor="addr-default-edit" className="text-sm text-gray-700">
                Definir como endereço padrão
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-lg bg-[#359293] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#2b7778] disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </form>
        </div>

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
    <div className={full ? "md:col-span-2 flex flex-col gap-1.5" : "flex flex-col gap-1.5"}>
      <span className="text-sm text-gray-700">{label}</span>
      {children}
    </div>
  );
}

function addressToPayload(a: UserAddress): UserAddressPayload {
  return {
    apelido: a.apelido ?? "",
    cep: a.cep,
    endereco: a.endereco,
    numero: a.numero,
    bairro: a.bairro,
    cidade: a.cidade,
    estado: a.estado,
    complemento: a.complemento ?? "",
    ponto_referencia: a.ponto_referencia ?? "",
    telefone: a.telefone ?? "",
    is_default: a.is_default === 1,
  };
}