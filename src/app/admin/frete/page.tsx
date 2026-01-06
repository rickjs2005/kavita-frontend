"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import CustomButton from "@/components/buttons/CustomButton";
import LoadingButton from "@/components/buttons/LoadingButton";
import DeleteButton from "@/components/buttons/DeleteButton";

type ShippingZone = {
  id: number;
  name: string;
  state: string;
  all_cities: boolean;
  cities: string[];
  is_free: boolean;
  price: number;
  prazo_dias: number | null;
  is_active: boolean;
};

type CepLookup = {
  cep: string;
  uf: string;
  localidade: string;
  bairro?: string;
  logradouro?: string;
  erro?: boolean;
};

type FormState = {
  id?: number;
  name: string;
  state: string;
  all_cities: boolean;

  citiesInput: string;
  cities: string[];

  cepInput: string;
  cepInfo: CepLookup | null;

  is_free: boolean;
  priceStr: string;
  prazoStr: string;
  is_active: boolean;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/* =========================
   Helpers
========================= */
function normalizeMoneyToNumber(v: string): number {
  let s = String(v || "").trim();
  if (!s) return 0;
  s = s.replace(/[R$\s]/g, "");
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > -1 && lastDot > -1) {
    const decSep = lastComma > lastDot ? "," : ".";
    const thouSep = decSep === "," ? "." : ",";
    s = s.replace(new RegExp("\\" + thouSep, "g"), "");
    if (decSep === ",") s = s.replace(",", ".");
  } else if (lastComma > -1) {
    s = s.replace(/\./g, "").replace(",", ".");
  }
  const n = Number(s);
  return Number.isNaN(n) ? 0 : Number(n.toFixed(2));
}

function uniqueList(list: string[]) {
  const cleaned = list
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => x.replace(/\s+/g, " "));
  return Array.from(new Set(cleaned));
}

function splitTextToItems(text: string) {
  return uniqueList(
    text
      .split(/[\n,;]+/g)
      .map((x) => x.trim())
      .filter(Boolean)
  );
}

function toCepDigits(v: string) {
  return String(v || "").replace(/\D/g, "").slice(0, 8);
}

async function safeText(res: Response) {
  try {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const j = await res.json();
      return j?.message || JSON.stringify(j);
    }
    return await res.text();
  } catch {
    return "";
  }
}

async function fetchViaCep(cepDigits: string): Promise<CepLookup | null> {
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data || data?.erro) {
      return { cep: cepDigits, uf: "", localidade: "", erro: true };
    }
    return {
      cep: data.cep || cepDigits,
      uf: (data.uf || "").toUpperCase(),
      localidade: data.localidade || "",
      bairro: data.bairro || "",
      logradouro: data.logradouro || "",
    };
  } catch {
    return null;
  }
}

/* =========================
   UI helpers (fix texto invisível + responsivo)
========================= */
const inputBase =
  // IMPORTANTÍSSIMO: força cor do texto, caret e placeholder (corrige “não aparece o que digito”)
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 " +
  "placeholder:text-gray-400 caret-[#359293] " +
  "outline-none focus:border-[#359293] focus:ring-2 focus:ring-[#359293]/20 " +
  "disabled:bg-gray-50 disabled:text-gray-400";

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-700">
        {label}
      </label>
      {children}
      {hint ? <div className="text-[11px] text-gray-500">{hint}</div> : null}
    </div>
  );
}

export default function FreteAdminPage() {
  const [zones, setZones] = useState<ShippingZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // feedback rápido
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<number | null>(null);

  function flash(msg: string) {
    setNotice(msg);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(null), 2200);
  }

  const [query, setQuery] = useState("");

  const [form, setForm] = useState<FormState>({
    name: "",
    state: "",
    all_cities: false,

    citiesInput: "",
    cities: [],

    cepInput: "",
    cepInfo: null,

    is_free: false,
    priceStr: "",
    prazoStr: "",
    is_active: true,
  });

  const isEditing = Boolean(form.id);

  async function loadZones() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/shipping/zones`, {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (res.status === 401) {
        setError("Sessão expirada. Faça login novamente.");
        setZones([]);
        return;
      }

      if (!res.ok) {
        const txt = await safeText(res);
        throw new Error(`Falha ao carregar (${res.status}). ${txt}`);
      }

      const data = await res.json();
      const arr: ShippingZone[] = Array.isArray(data) ? data : data?.items || [];

      setZones(
        arr.map((z) => ({
          ...z,
          price: Number((z as any).price || 0),
          all_cities: Boolean((z as any).all_cities),
          is_free: Boolean((z as any).is_free),
          is_active:
            (z as any).is_active === undefined ? true : Boolean((z as any).is_active),
          cities: Array.isArray((z as any).cities) ? (z as any).cities : [],
          prazo_dias:
            (z as any).prazo_dias === null || (z as any).prazo_dias === undefined
              ? null
              : Number((z as any).prazo_dias),
        }))
      );
    } catch (e: any) {
      setError(e?.message || "Erro ao carregar regras de frete.");
      setZones([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadZones();
    return () => {
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    };
  }, []);

  function resetForm() {
    setForm({
      name: "",
      state: "",
      all_cities: false,

      citiesInput: "",
      cities: [],

      cepInput: "",
      cepInfo: null,

      is_free: false,
      priceStr: "",
      prazoStr: "",
      is_active: true,
    });
    setError(null);
    flash("Formulário limpo.");
  }

  function pickEdit(z: ShippingZone) {
    setForm({
      id: z.id,
      name: z.name || "",
      state: z.state || "",
      all_cities: Boolean(z.all_cities),

      citiesInput: "",
      cities: Array.isArray(z.cities) ? z.cities : [],

      cepInput: "",
      cepInfo: null,

      is_free: Boolean(z.is_free),
      priceStr: z.price ? String(z.price) : "",
      prazoStr: z.prazo_dias ? String(z.prazo_dias) : "",
      is_active: z.is_active === undefined ? true : Boolean(z.is_active),
    });
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    flash("Editando regra selecionada.");
  }

  async function removeZone(id: number) {
    try {
      const res = await fetch(`${API_BASE}/api/admin/shipping/zones/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.status === 401) {
        flash("Sessão expirada. Faça login novamente.");
        return;
      }

      if (!res.ok && res.status !== 204) {
        const txt = await safeText(res);
        throw new Error(`Falha ao excluir (${res.status}). ${txt}`);
      }

      await loadZones();
      if (form.id === id) resetForm();
      flash("Regra excluída.");
    } catch (e: any) {
      flash(e?.message || "Erro ao excluir regra.");
    }
  }

  function addItemsFromInput(raw?: string) {
    const text = raw !== undefined ? raw : form.citiesInput;
    const fromText = splitTextToItems(text);
    if (!fromText.length) return false;

    setForm((prev) => ({
      ...prev,
      cities: uniqueList([...(prev.cities || []), ...fromText]),
      citiesInput: "",
    }));
    flash(fromText.length > 1 ? "Itens adicionados." : "Item adicionado.");
    return true;
  }

  function removeCity(city: string) {
    setForm((prev) => ({
      ...prev,
      cities: (prev.cities || []).filter((c) => c !== city),
    }));
  }

  function validate(): string | null {
    if (!form.name.trim())
      return "Informe um nome para a regra (ex.: Entrega Santana do Manhuaçu).";
    if (!form.state.trim()) return "Informe o estado (ex.: MG).";

    if (!form.all_cities && !form.cities.length)
      return "Adicione pelo menos uma cidade/localidade ou marque 'Estado inteiro'.";

    if (!form.is_free) {
      const price = normalizeMoneyToNumber(form.priceStr);
      if (price <= 0) return "Informe um preço de frete válido (ou marque 'Frete grátis').";
    }

    if (form.prazoStr.trim() !== "") {
      const prazo = Math.floor(Number(form.prazoStr));
      if (!Number.isFinite(prazo) || prazo <= 0)
        return "Prazo deve ser um número válido (>= 1) ou vazio.";
    }

    return null;
  }

  async function submit() {
    setError(null);

    // se tiver algo digitado e usuário salvou, converte em chips automaticamente
    if (!form.all_cities && form.citiesInput.trim()) {
      addItemsFromInput(form.citiesInput);
    }

    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    const payload = {
      name: form.name.trim(),
      state: form.state.trim().toUpperCase(),
      all_cities: Boolean(form.all_cities),
      cities: form.all_cities ? [] : uniqueList(form.cities),
      is_free: Boolean(form.is_free),
      price: form.is_free ? 0 : normalizeMoneyToNumber(form.priceStr),
      prazo_dias: form.prazoStr.trim() === "" ? null : Math.floor(Number(form.prazoStr)),
      is_active: Boolean(form.is_active),
    };

    const url = form.id
      ? `${API_BASE}/api/admin/shipping/zones/${form.id}`
      : `${API_BASE}/api/admin/shipping/zones`;

    setSaving(true);
    try {
      const res = await fetch(url, {
        method: form.id ? "PUT" : "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        setError("Sessão expirada. Faça login novamente.");
        return;
      }

      if (!res.ok) {
        const txt = await safeText(res);
        throw new Error(`Falha ao salvar (${res.status}). ${txt}`);
      }

      resetForm();
      await loadZones();
      flash(form.id ? "Regra atualizada." : "Regra criada.");
    } catch (e: any) {
      setError(e?.message || "Erro ao salvar regra.");
    } finally {
      setSaving(false);
    }
  }

  // sugestões: baseado no que já existe cadastrado (sem depender de IBGE)
  const allKnownPlaces = useMemo(() => {
    const bag: string[] = [];
    for (const z of zones) {
      for (const c of z.cities || []) bag.push(c);
    }
    return uniqueList(bag).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [zones]);

  const suggestions = useMemo(() => {
    if (form.all_cities) return [];
    const q = form.citiesInput.trim().toLowerCase();
    if (!q) return [];
    const already = new Set((form.cities || []).map((x) => x.toLowerCase()));
    return allKnownPlaces
      .filter((x) => x.toLowerCase().includes(q))
      .filter((x) => !already.has(x.toLowerCase()))
      .slice(0, 8);
  }, [form.citiesInput, form.all_cities, form.cities, allKnownPlaces]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return zones;
    return zones.filter((z) => {
      const hay = [
        z.name,
        z.state,
        z.all_cities ? "estado inteiro" : "",
        ...(z.cities || []),
        z.is_free ? "gratis" : "pago",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [zones, query]);

  // CEP -> preenche UF e adiciona localidade como chip
  const [cepLoading, setCepLoading] = useState(false);

  useEffect(() => {
    const cepDigits = toCepDigits(form.cepInput);
    if (cepDigits.length !== 8) {
      setForm((p) => ({ ...p, cepInfo: null }));
      return;
    }

    let alive = true;
    setCepLoading(true);

    fetchViaCep(cepDigits)
      .then((info) => {
        if (!alive) return;

        setForm((p) => ({ ...p, cepInfo: info }));

        if (info && !info.erro) {
          if (info.uf) setForm((p) => ({ ...p, state: info.uf }));

          if (!form.all_cities && info.localidade) {
            setForm((p) => ({
              ...p,
              cities: uniqueList([...(p.cities || []), info.localidade]),
            }));
            flash(`Localidade adicionada: ${info.localidade}/${info.uf}`);
          }
        }
      })
      .finally(() => {
        if (!alive) return;
        setCepLoading(false);
      });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.cepInput]);

  return (
    <div className="w-full px-3 py-4 sm:px-4 lg:px-6">
      <div className="mx-auto w-full max-w-6xl space-y-4 sm:space-y-6">
        {/* Header responsivo */}
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#359293] sm:text-3xl">
              Frete (Regiões)
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Configure preços, prazo e regiões com frete grátis.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <Link href="/admin/produtos" className="w-full sm:w-auto">
              <CustomButton
                label="Voltar para produtos"
                variant="secondary"
                size="small"
                isLoading={false}
              />
            </Link>

            <CustomButton
              label={isEditing ? "Cancelar edição" : "Limpar"}
              variant="secondary"
              size="small"
              isLoading={false}
              onClick={resetForm}
            />
          </div>
        </header>

        {/* FORM */}
        <section className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-base font-semibold text-[#359293]">
              {isEditing ? "Editar regra de frete" : "Criar regra de frete"}
            </h2>
            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              Ex.: “Santana do Manhuaçu + Simonésia grátis” ou “MG inteiro R$ 19,90”.
            </p>
          </div>

          {notice && (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {notice}
            </div>
          )}

          {/* Grid responsivo: 1 coluna no mobile, 2 no desktop */}
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Field label="Nome da regra">
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ex.: Manhuaçu e Simonésia grátis"
                className={inputBase}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Estado (UF)">
                <input
                  value={form.state}
                  onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                  placeholder="Ex.: MG"
                  maxLength={2}
                  className={`${inputBase} uppercase`}
                />
              </Field>

              <div className="flex items-center gap-2 sm:pt-6">
                <input
                  id="allCities"
                  type="checkbox"
                  checked={form.all_cities}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      all_cities: e.target.checked,
                      cities: e.target.checked ? [] : p.cities,
                      citiesInput: "",
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-[#359293] focus:ring-[#359293]"
                />
                <label htmlFor="allCities" className="text-sm font-medium text-gray-800">
                  Estado inteiro
                </label>
              </div>
            </div>

            {/* CEP */}
            <div className="lg:col-span-2 rounded-xl border border-gray-200 p-3 sm:p-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Atalho por CEP (autocomplete)
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Digite um CEP para preencher UF e sugerir a cidade automaticamente.
                </p>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="CEP" hint={cepLoading ? "Consultando CEP..." : form.cepInfo?.erro ? "CEP não encontrado." : ""}>
                  <input
                    value={form.cepInput}
                    onChange={(e) => setForm((p) => ({ ...p, cepInput: e.target.value }))}
                    placeholder="Ex.: 36900-000"
                    inputMode="numeric"
                    className={inputBase}
                  />
                </Field>

                <div className="sm:col-span-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-700">
                    Resultado
                  </div>
                  <div className="mt-1 min-h-[44px] w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900">
                    {form.cepInfo && !form.cepInfo.erro ? (
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {form.cepInfo.localidade}/{form.cepInfo.uf}
                        </span>
                        <span className="text-[12px] text-gray-500">
                          {form.cepInfo.logradouro ? `${form.cepInfo.logradouro} — ` : ""}
                          {form.cepInfo.bairro || ""}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Cidades/Localidades */}
            <div className="lg:col-span-2 rounded-xl border border-gray-200 p-3 sm:p-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Cidades / Localidades</h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  Pode ser cidade, comunidade, córrego, distrito, etc.
                </p>
              </div>

              {!form.all_cities && (
                <>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <div className="relative w-full">
                      <input
                        value={form.citiesInput}
                        onChange={(e) => setForm((p) => ({ ...p, citiesInput: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addItemsFromInput();
                          }
                          if (e.key === "," || e.key === ";") {
                            e.preventDefault();
                            addItemsFromInput(form.citiesInput);
                          }
                        }}
                        placeholder="Digite e aperte Enter. Ex.: Manhuaçu | Simonésia | Córrego São José"
                        className={inputBase}
                      />

                      {suggestions.length > 0 && (
                        <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                          {suggestions.map((sug) => (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => {
                                setForm((p) => ({
                                  ...p,
                                  cities: uniqueList([...(p.cities || []), sug]),
                                  citiesInput: "",
                                }));
                                flash(`Adicionado: ${sug}`);
                              }}
                              className="block w-full px-3 py-2 text-left text-sm text-gray-900 hover:bg-gray-50"
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => addItemsFromInput()}
                      className="rounded-lg bg-[#2F7E7F] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#266768]"
                    >
                      Adicionar
                    </button>
                  </div>

                  {form.cities.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {form.cities.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs text-gray-900"
                        >
                          {c}
                          <button
                            type="button"
                            onClick={() => removeCity(c)}
                            className="rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white"
                            title="Remover"
                          >
                            x
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-[11px] text-gray-500">
                      Nenhuma cidade/localidade adicionada.
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Preço */}
            <div className="rounded-xl border border-gray-200 p-3 sm:p-4">
              <h3 className="text-sm font-semibold text-gray-900">Preço</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                Marque “Frete grátis” ou defina um valor fixo.
              </p>

              <div className="mt-3 flex items-center gap-2">
                <input
                  id="isFree"
                  type="checkbox"
                  checked={form.is_free}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      is_free: e.target.checked,
                      priceStr: e.target.checked ? "" : p.priceStr,
                    }))
                  }
                  className="h-4 w-4 rounded border-gray-300 text-[#359293] focus:ring-[#359293]"
                />
                <label htmlFor="isFree" className="text-sm font-medium text-gray-800">
                  Frete grátis
                </label>
              </div>

              <Field
                label="Valor do frete"
                hint={`Interpretação: R$ ${normalizeMoneyToNumber(form.priceStr).toFixed(2)}`}
              >
                <input
                  value={form.priceStr}
                  onChange={(e) => setForm((p) => ({ ...p, priceStr: e.target.value }))}
                  placeholder="Ex.: 19,90"
                  inputMode="decimal"
                  disabled={form.is_free}
                  className={inputBase}
                />
              </Field>
            </div>

            {/* Prazo / status */}
            <div className="rounded-xl border border-gray-200 p-3 sm:p-4">
              <h3 className="text-sm font-semibold text-gray-900">Prazo e status</h3>
              <p className="mt-0.5 text-[11px] text-gray-500">
                Prazo é opcional. Você pode desativar sem excluir.
              </p>

              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Prazo (dias) — opcional">
                  <input
                    value={form.prazoStr}
                    onChange={(e) => setForm((p) => ({ ...p, prazoStr: e.target.value }))}
                    placeholder="Ex.: 2"
                    inputMode="numeric"
                    className={inputBase}
                  />
                </Field>

                <div className="flex items-center gap-2 sm:pt-6">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300 text-[#359293] focus:ring-[#359293]"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-800">
                    Regra ativa
                  </label>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Ações: empilha no mobile */}
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="w-full rounded-full border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 sm:w-auto"
            >
              Limpar
            </button>

            <LoadingButton isLoading={saving} onClick={submit} className="w-full sm:w-auto">
              {isEditing ? "Atualizar regra" : "Salvar regra"}
            </LoadingButton>
          </div>
        </section>

        {/* LISTAGEM */}
        <section className="rounded-2xl bg-white/95 p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Regras cadastradas</h2>
              <p className="mt-1 text-sm text-gray-600">
                Total: <strong>{zones.length}</strong>
              </p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nome/estado/cidade/localidade..."
                className={`${inputBase} sm:w-[360px]`}
              />
              <button
                type="button"
                onClick={loadZones}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Recarregar
              </button>
            </div>
          </div>

          {loading && <p className="mt-4 text-sm text-gray-600">Carregando regras…</p>}
          {!loading && filtered.length === 0 && (
            <p className="mt-4 text-sm text-gray-600">Nenhuma regra encontrada.</p>
          )}

          {!loading && filtered.length > 0 && (
            <div className="mt-4 space-y-3">
              {/* Mobile: cards */}
              <div className="grid grid-cols-1 gap-3 lg:hidden">
                {filtered.map((z) => (
                  <div key={z.id} className="rounded-xl border border-gray-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-gray-900">{z.name}</div>
                        <div className="mt-1 text-xs text-gray-600">
                          {z.state} •{" "}
                          {z.all_cities ? "Estado inteiro" : `${(z.cities || []).length} itens`}
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
                          z.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {z.is_active ? "Ativa" : "Inativa"}
                      </span>
                    </div>

                    {!z.all_cities && (z.cities || []).length > 0 && (
                      <div className="mt-2 text-xs text-gray-700">
                        {(z.cities || []).slice(0, 6).join(", ")}
                        {(z.cities || []).length > 6 ? "…" : ""}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          z.is_free ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {z.is_free ? "Grátis" : `R$ ${Number(z.price || 0).toFixed(2)}`}
                      </span>

                      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                        Prazo: {z.prazo_dias ? `${z.prazo_dias} dia(s)` : "—"}
                      </span>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => pickEdit(z)}
                        className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50"
                      >
                        Editar
                      </button>

                      <div className="flex-1">
                        <DeleteButton onConfirm={() => removeZone(z.id)} label="Excluir" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: tabela */}
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[900px] border-separate border-spacing-0">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                      <th className="border-b border-gray-200 px-3 py-2">Regra</th>
                      <th className="border-b border-gray-200 px-3 py-2">UF</th>
                      <th className="border-b border-gray-200 px-3 py-2">Cobertura</th>
                      <th className="border-b border-gray-200 px-3 py-2">Frete</th>
                      <th className="border-b border-gray-200 px-3 py-2">Prazo</th>
                      <th className="border-b border-gray-200 px-3 py-2">Status</th>
                      <th className="border-b border-gray-200 px-3 py-2">Ações</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filtered.map((z) => (
                      <tr key={z.id} className="text-sm text-gray-800">
                        <td className="border-b border-gray-100 px-3 py-3">
                          <div className="font-semibold text-gray-900">{z.name}</div>
                          <div className="mt-0.5 text-[11px] text-gray-500">ID: {z.id}</div>
                        </td>

                        <td className="border-b border-gray-100 px-3 py-3">{z.state}</td>

                        <td className="border-b border-gray-100 px-3 py-3">
                          {z.all_cities ? (
                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                              Estado inteiro
                            </span>
                          ) : (
                            <div className="max-w-[420px]">
                              <div className="line-clamp-2 text-xs text-gray-700">
                                {(z.cities || []).join(", ")}
                              </div>
                              <div className="mt-1 text-[11px] text-gray-500">
                                {(z.cities || []).length} itens
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="border-b border-gray-100 px-3 py-3">
                          {z.is_free ? (
                            <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                              Grátis
                            </span>
                          ) : (
                            <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                              R$ {Number(z.price || 0).toFixed(2)}
                            </span>
                          )}
                        </td>

                        <td className="border-b border-gray-100 px-3 py-3">
                          {z.prazo_dias ? `${z.prazo_dias} dia(s)` : "—"}
                        </td>

                        <td className="border-b border-gray-100 px-3 py-3">
                          {z.is_active ? (
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                              Ativa
                            </span>
                          ) : (
                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700">
                              Inativa
                            </span>
                          )}
                        </td>

                        <td className="border-b border-gray-100 px-3 py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => pickEdit(z)}
                              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50"
                            >
                              Editar
                            </button>
                            <DeleteButton onConfirm={() => removeZone(z.id)} label="Excluir" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
