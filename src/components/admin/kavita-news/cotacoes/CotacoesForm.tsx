"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { CotacaoFormState, CotacaoItem } from "@/types/kavita-news";
import LoadingButton from "@/components/buttons/LoadingButton";

type MetaResponse = {
  ok: boolean;
  data?: {
    allowed_slugs?: string[];
    presets?: Record<string, Partial<Pick<CotacaoFormState, "name" | "type" | "unit" | "market" | "source">>>;
    suggestions?: {
      markets?: string[];
      sources?: string[];
      units?: string[];
      types?: string[];
    };
  };
};

type Props = {
  allowedSlugs: string[];

  mode: "create" | "edit";
  editing: CotacaoItem | null;

  form: CotacaoFormState;
  setForm: Dispatch<SetStateAction<CotacaoFormState>>;

  saving: boolean;

  onSubmit: () => void;
  onCancelEdit: () => void;

  onStartCreate: () => void;
};

function apiBase() {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
}

export default function CotacoesForm({
  allowedSlugs,
  mode,
  editing,
  form,
  setForm,
  saving,
  onSubmit,
  onCancelEdit,
  onStartCreate,
}: Props) {
  const isEdit = mode === "edit" && !!editing;

  const inputBase =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 " +
    "placeholder:text-slate-400 shadow-sm " +
    "focus:outline-none focus:ring-2 focus:ring-[#EC5B20] focus:border-transparent";
  const labelBase = "text-xs font-semibold uppercase tracking-wide text-slate-600";

  function set<K extends keyof CotacaoFormState>(key: K, value: CotacaoFormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  // ===== META (presets + suggestions) =====
  const [metaPresets, setMetaPresets] =
    useState<Record<string, Partial<Pick<CotacaoFormState, "name" | "type" | "unit" | "market" | "source">>>>({});
  const [suggestions, setSuggestions] = useState({
    markets: [] as string[],
    sources: [] as string[],
    units: [] as string[],
    types: [] as string[],
  });

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const res = await fetch(`${apiBase()}/api/admin/news/cotacoes/meta`, {
          method: "GET",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        const json = (await res.json()) as MetaResponse;

        if (!mounted) return;

        if (json?.ok && json?.data) {
          setMetaPresets(json.data.presets || {});
          setSuggestions({
            markets: json.data.suggestions?.markets || [],
            sources: json.data.suggestions?.sources || [],
            units: json.data.suggestions?.units || [],
            types: json.data.suggestions?.types || [],
          });
        }
      } catch {
        // meta é "nice to have": não quebra form se falhar
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const mergedAllowedSlugs = useMemo(() => {
    // Prioridade: prop allowedSlugs (vem do listCotacoes meta),
    // mas se meta retornar algo mais, junta sem duplicar.
    const a = Array.isArray(allowedSlugs) ? allowedSlugs : [];
    const b = Object.keys(metaPresets || {});
    const set = new Set<string>([...a, ...b]);
    return Array.from(set);
  }, [allowedSlugs, metaPresets]);

  const selectedPreset = useMemo(() => {
    const slug = String(form.slug || "").trim();
    if (!slug) return null;
    return metaPresets?.[slug] || null;
  }, [form.slug, metaPresets]);

  function clearForm() {
    setForm({
      name: "",
      slug: "" as any,
      type: "",
      price: "",
      unit: "",
      variation_day: "",
      market: "",
      source: "",
      last_update_at: "",
      ativo: true,
    });
    try {
      onStartCreate?.();
    } catch {}
  }

  function applySlugPreset(nextSlug: string) {
    const preset = metaPresets?.[nextSlug];

    // sempre set o slug (mesmo sem preset)
    setForm((p) => {
      const pick = <K extends keyof CotacaoFormState>(key: K, val?: any): CotacaoFormState[K] => {
        if (val === undefined || val === null || String(val).trim() === "") return p[key];
        const cur = String(p[key] ?? "").trim();
        // não sobrescreve o que já foi digitado
        return (cur ? p[key] : (val as any)) as CotacaoFormState[K];
      };

      return {
        ...p,
        slug: nextSlug as any,
        name: pick("name", preset?.name),
        type: pick("type", preset?.type),
        unit: pick("unit", preset?.unit),
        market: pick("market", preset?.market),
        source: pick("source", preset?.source),
      };
    });
  }

  function forceApplySelectedPreset() {
    const slug = String(form.slug || "").trim();
    if (!slug) return;
    const preset = metaPresets?.[slug];
    if (!preset) return;

    // aplica "forçando" (sobrescreve)
    setForm((p) => ({
      ...p,
      name: preset.name ?? p.name,
      type: preset.type ?? p.type,
      unit: preset.unit ?? p.unit,
      market: preset.market ?? p.market,
      source: preset.source ?? p.source,
    }));
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.08)] overflow-hidden">
      <header className="px-5 py-4 border-b bg-gradient-to-r from-slate-50 to-white">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white text-sm">
              📈
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Cotações</h3>
              <p className="text-sm text-slate-500">
                {isEdit ? `Editando: ${editing?.name ?? ""}` : "Cadastrar / editar cotações monitoradas"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={clearForm}
            className="w-full md:w-auto rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Limpar dados
          </button>
        </div>
      </header>

      <div className="p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className={labelBase}>Nome</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={inputBase}
              placeholder="Ex: Dólar comercial, Soja CEPEA, Boi Gordo..."
            />
          </div>

          <div className="space-y-2">
            <label className={labelBase}>Slug (padrão)</label>
            <select value={form.slug} onChange={(e) => applySlugPreset(e.target.value)} className={inputBase}>
              <option value="">Selecione…</option>
              {(mergedAllowedSlugs || []).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <div className="flex flex-col gap-2">
              <p className="text-xs text-slate-500">
                Ao escolher um slug, o sistema pode auto-preencher alguns campos (se estiverem vazios).
              </p>

              {selectedPreset ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs text-slate-600">
                      <span className="font-semibold text-slate-800">Preset:</span>{" "}
                      {[
                        selectedPreset.name ? `nome: ${selectedPreset.name}` : null,
                        selectedPreset.type ? `tipo: ${selectedPreset.type}` : null,
                        selectedPreset.unit ? `unidade: ${selectedPreset.unit}` : null,
                        selectedPreset.market ? `market: ${selectedPreset.market}` : null,
                        selectedPreset.source ? `source: ${selectedPreset.source}` : null,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </div>

                    <button
                      type="button"
                      onClick={forceApplySelectedPreset}
                      className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                      title="Aplica o preset sobrescrevendo os campos do formulário"
                    >
                      Aplicar preset do slug
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2 md:col-span-2">
            <label className={labelBase}>Tipo</label>
            <input
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              className={inputBase}
              placeholder="Ex: cambio, graos, pecuaria, cafe..."
              list="knews-types"
            />
            <datalist id="knews-types">
              {suggestions.types.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <label className={labelBase}>Unidade</label>
            <input
              value={form.unit}
              onChange={(e) => set("unit", e.target.value)}
              className={inputBase}
              placeholder="Ex: R$/saca, R$/@, R$"
              list="knews-units"
            />
            <datalist id="knews-units">
              {suggestions.units.map((u) => (
                <option key={u} value={u} />
              ))}
            </datalist>
          </div>

          <div className="space-y-2">
            <label className={labelBase}>Market (opcional)</label>
            <input
              value={form.market}
              onChange={(e) => set("market", e.target.value)}
              className={inputBase}
              placeholder="Ex: CEPEA, B3..."
              list="knews-markets"
            />
            <datalist id="knews-markets">
              {suggestions.markets.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className={labelBase}>Preço</label>
            <input
              value={form.price}
              onChange={(e) => set("price", e.target.value)}
              className={inputBase}
              placeholder="Ex: 5.12"
              inputMode="decimal"
            />
          </div>

          <div className="space-y-2">
            <label className={labelBase}>Variação dia</label>
            <input
              value={form.variation_day}
              onChange={(e) => set("variation_day", e.target.value)}
              className={inputBase}
              placeholder="Ex: 0.32"
              inputMode="decimal"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className={labelBase}>Source (opcional)</label>
            <input
              value={form.source}
              onChange={(e) => set("source", e.target.value)}
              className={inputBase}
              placeholder="Ex: BCB PTAX, CEPEA, B3..."
              list="knews-sources"
            />
            <datalist id="knews-sources">
              {suggestions.sources.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2 md:col-span-2">
            <label className={labelBase}>Last update (opcional)</label>
            <input
              value={form.last_update_at}
              onChange={(e) => set("last_update_at", e.target.value)}
              className={inputBase}
              placeholder="YYYY-MM-DD HH:mm:ss"
            />
          </div>

          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => set("ativo", e.target.checked)}
              className="h-4 w-4 accent-[#EC5B20]"
            />
            Ativo
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
          {isEdit ? (
            <button
              type="button"
              onClick={onCancelEdit}
              className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancelar edição
            </button>
          ) : null}

          <LoadingButton
            isLoading={saving}
            onClick={onSubmit}
            className="w-full sm:w-auto rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:brightness-95 transition"
          >
            {isEdit ? "Salvar alterações" : "Salvar"}
          </LoadingButton>
        </div>
      </div>
    </section>
  );
}
