"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ClimaEditMode, ClimaFormState, ClimaItem } from "@/types/kavita-news";
import LoadingButton from "@/components/buttons/LoadingButton";
import { normalizeSlug } from "@/utils/kavita-news/clima";

type IbgeMunicipioNivelado = {
  "municipio-id": string | number;
  "municipio-nome": string;
  "UF-sigla": string;
};

type IbgeMunicipioCompleto = {
  id: number;
  nome: string;
  microrregiao?: any;
  "regiao-imediata"?: any;
};

type GeoSuggestion = {
  code?: string;
  name: string;
  uf: string;
  status?: string;
  lat?: string | number | null;
  lon?: string | number | null;
  country?: string;
  admin1?: string;
  admin2?: string;
  timezone?: string;
};

function isAbortError(e: any) {
  const msg = String(e?.message || e || "").toLowerCase();
  return e?.name === "AbortError" || msg.includes("aborted") || msg.includes("abort");
}

function stripAccents(s: string) {
  return (s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function getIbgeNome(m: any): string {
  return String(m?.nome ?? m?.["municipio-nome"] ?? "").trim();
}
function getIbgeId(m: any): string {
  const v = m?.id ?? m?.["municipio-id"];
  return v == null ? "" : String(v).trim();
}
function getIbgeUf(m: any): string {
  const uf =
    m?.["UF-sigla"] ||
    m?.microrregiao?.mesorregiao?.UF?.sigla ||
    m?.["regiao-imediata"]?.["regiao-intermediaria"]?.UF?.sigla ||
    "";
  return String(uf || "").toUpperCase();
}

function safeNum(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function fmtCoord(n: number | null) {
  if (n === null) return "";
  return String(Number(n.toFixed(6)));
}

type Props = {
  editMode: ClimaEditMode;
  setEditMode: Dispatch<SetStateAction<ClimaEditMode>>;

  mode: "create" | "edit";
  editing: ClimaItem | null;

  form: ClimaFormState;
  setForm: Dispatch<SetStateAction<ClimaFormState>>;

  saving: boolean;

  onSubmit: () => void;
  onCancelEdit: () => void;

  // mantido por compatibilidade (mesmo sem botão)
  onStartCreate: () => void;

  onBuscarIbge?: (q: { uf: string; city: string }) => void;

  onSuggestStations?: (uf: string, q: string, limit?: number) => Promise<GeoSuggestion[]>;
};

export default function ClimaForm({
  editMode,
  setEditMode,
  mode,
  editing,
  form,
  setForm,
  saving,
  onSubmit,
  onCancelEdit,
  onStartCreate, // mantido
  onBuscarIbge,
  onSuggestStations,
}: Props) {
  const isEdit = mode === "edit" && !!editing;
  const showIbgeUi = editMode === "ibge";

  const [ibgeLoading, setIbgeLoading] = useState(false);
  const [ibgeError, setIbgeError] = useState<string | null>(null);
  const [ibgeSuggestions, setIbgeSuggestions] = useState<IbgeMunicipioNivelado[]>([]);
  const ibgeAllRef = useRef<IbgeMunicipioNivelado[] | null>(null);
  const ibgeAbortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<any>(null);

  const [geoLoading, setGeoLoading] = useState(false);
  const [geoHint, setGeoHint] = useState<string | null>(null);
  const [geoSuggestions, setGeoSuggestions] = useState<GeoSuggestion[]>([]);
  const [geoPickerOpen, setGeoPickerOpen] = useState(false);

  const isResettingRef = useRef(false);

  const ibgeHint = useMemo(() => {
    if (!showIbgeUi) return null;
    if (ibgeError) return ibgeError;
    if (ibgeLoading) return "Buscando no IBGE...";
    if (ibgeSuggestions.length > 0) return `Sugestões: ${ibgeSuggestions.length}`;
    return "Digite o nome da cidade (ou o IBGE ID) para preencher automaticamente.";
  }, [showIbgeUi, ibgeError, ibgeLoading, ibgeSuggestions.length]);

  function set<K extends keyof ClimaFormState>(key: K, value: ClimaFormState[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  function clearAssist() {
    setIbgeError(null);
    setIbgeSuggestions([]);
    setGeoHint(null);
    setGeoSuggestions([]);
    setGeoPickerOpen(false);
  }

  function clearFormData() {
    isResettingRef.current = true;

    try {
      ibgeAbortRef.current?.abort();
    } catch {}
    ibgeAbortRef.current = null;

    clearAssist();

    setForm((p: any) => ({
      ...p,
      city_name: "",
      uf: "",
      slug: "",
      ibge_id: "",
      station_code: "",
      station_lat: "",
      station_lon: "",
      station_distance: "",
      mm_24h: "",
      mm_7d: "",
      source: "",
      last_update_at: "",
      // ativo mantém
    }));

    setTimeout(() => {
      isResettingRef.current = false;
    }, 0);

    // mantém compatibilidade com o fluxo existente
    // (se seu hook usa startCreate para garantir modo create)
    try {
      onStartCreate?.();
    } catch {}
  }

  async function ensureIbgeAllLoaded() {
    if (ibgeAllRef.current) return ibgeAllRef.current;

    setIbgeLoading(true);
    setIbgeError(null);

    try {
      const url = "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?view=nivelado&orderBy=nome";
      const res = await fetch(url);
      if (!res.ok) throw new Error(`IBGE: HTTP ${res.status}`);
      const data = (await res.json()) as IbgeMunicipioNivelado[];
      ibgeAllRef.current = Array.isArray(data) ? data : [];
      return ibgeAllRef.current;
    } catch (e: any) {
      setIbgeError(e?.message || "Erro ao carregar base do IBGE.");
      ibgeAllRef.current = [];
      return [];
    } finally {
      setIbgeLoading(false);
    }
  }

  async function suggestIbgeByCityName(nome: string) {
    const q = stripAccents(nome.trim());
    if (q.length < 2) {
      setIbgeSuggestions([]);
      setIbgeError(null);
      return;
    }
    const all = await ensureIbgeAllLoaded();

    const starts: IbgeMunicipioNivelado[] = [];
    const contains: IbgeMunicipioNivelado[] = [];

    for (const m of all) {
      const n = stripAccents(getIbgeNome(m));
      if (!n) continue;
      if (n.startsWith(q)) starts.push(m);
      else if (n.includes(q)) contains.push(m);
    }

    setIbgeSuggestions([...starts, ...contains].slice(0, 10));
  }

  async function fetchIbgeMunicipioById(idRaw: string) {
    const id = idRaw.trim();
    if (!/^[0-9]{6,8}$/.test(id)) return;

    try {
      setIbgeLoading(true);
      setIbgeError(null);

      ibgeAbortRef.current?.abort();
      const controller = new AbortController();
      ibgeAbortRef.current = controller;

      const url = `https://servicodados.ibge.gov.br/api/v1/localidades/municipios/${encodeURIComponent(id)}`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`IBGE: HTTP ${res.status}`);

      const data = (await res.json()) as IbgeMunicipioCompleto | any;
      if (data && typeof data === "object") {
        await applyMunicipio(data);
      }
    } catch (e: any) {
      if (isAbortError(e)) return;
      setIbgeError(e?.message || "Erro ao buscar IBGE por ID.");
    } finally {
      setIbgeLoading(false);
    }
  }

  async function geocodeFlow(uf: string, city: string) {
    if (!onSuggestStations) return;

    const UF = String(uf || "").trim().toUpperCase();
    const CITY = String(city || "").trim();

    if (UF.length !== 2 || CITY.length < 2) {
      setGeoHint("Preencha UF (2 letras) e cidade para buscar coordenadas.");
      return;
    }

    try {
      setGeoLoading(true);
      setGeoHint(null);

      const list = await onSuggestStations(UF, CITY, 10);
      const items = Array.isArray(list) ? list : [];
      setGeoSuggestions(items);

      if (items.length === 0) {
        setGeoPickerOpen(false);
        setGeoHint("Não encontrei coordenadas. Verifique cidade/UF (ex.: “Caratinga / MG”).");
        return;
      }

      const hasCoords =
        String((form as any).station_lat || "").trim() &&
        String((form as any).station_lon || "").trim();

      if (hasCoords) {
        setGeoPickerOpen(true);
        setGeoHint("Sugestões encontradas. Você pode trocar as coordenadas se quiser.");
        return;
      }

      const best = items[0];
      const lat = safeNum(best?.lat);
      const lon = safeNum(best?.lon);

      if (lat !== null && lon !== null) {
        setForm((p: any) => ({
          ...p,
          station_lat: fmtCoord(lat),
          station_lon: fmtCoord(lon),
          station_source: "OPEN_METEO_GEOCODING",
        }));
        setGeoPickerOpen(false);
        setGeoHint(`Coordenadas sugeridas automaticamente: ${fmtCoord(lat)}, ${fmtCoord(lon)}`);
      } else {
        setGeoPickerOpen(true);
        setGeoHint("Encontrei sugestões, mas selecione manualmente para aplicar as coordenadas.");
      }
    } catch {
      setGeoSuggestions([]);
      setGeoPickerOpen(false);
      setGeoHint("Falha ao buscar coordenadas. Você pode preencher latitude/longitude manualmente.");
    } finally {
      setGeoLoading(false);
    }
  }

  function selectGeo(s: GeoSuggestion) {
    const lat = safeNum(s?.lat);
    const lon = safeNum(s?.lon);

    if (lat === null || lon === null) {
      setGeoHint("Sugestão inválida (sem lat/lon).");
      return;
    }

    setForm((p: any) => ({
      ...p,
      station_lat: fmtCoord(lat),
      station_lon: fmtCoord(lon),
      station_source: "OPEN_METEO_GEOCODING",
    }));

    setGeoPickerOpen(false);
    setGeoHint(`Coordenadas selecionadas: ${fmtCoord(lat)}, ${fmtCoord(lon)} (${s.name})`);
  }

  async function applyMunicipio(m: any) {
    if (isResettingRef.current) return;

    const nome = getIbgeNome(m);
    const uf = getIbgeUf(m);
    const id = getIbgeId(m);

    setForm((p: any) => ({
      ...p,
      city_name: nome || p.city_name,
      uf: (uf || p.uf || "").toUpperCase(),
      ibge_id: id || p.ibge_id,
      slug: normalizeSlug(p.slug || nome || p.city_name || ""),
    }));

    setIbgeSuggestions([]);

    if (showIbgeUi && uf && nome) {
      await geocodeFlow(uf, nome);
    }
  }

  useEffect(() => {
    if (!showIbgeUi) return;
    if (isResettingRef.current) return;

    const city = form.city_name || "";
    const id = (form as any).ibge_id || "";

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const idTrim = String(id).trim();

      if (/^[0-9]{6,8}$/.test(idTrim)) {
        fetchIbgeMunicipioById(idTrim);
        return;
      }

      suggestIbgeByCityName(city);
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showIbgeUi, form.city_name, (form as any).ibge_id]);

  useEffect(() => {
    if (!showIbgeUi) return;
    ensureIbgeAllLoaded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showIbgeUi]);

  useEffect(() => {
    return () => {
      try {
        ibgeAbortRef.current?.abort();
      } catch {}
      ibgeAbortRef.current = null;
    };
  }, []);

  const inputBase =
    "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 " +
    "placeholder:text-slate-400 shadow-sm " +
    "focus:outline-none focus:ring-2 focus:ring-[#EC5B20] focus:border-transparent";
  const labelBase = "text-xs font-semibold uppercase tracking-wide text-slate-600";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.08)] overflow-hidden">
      <header className="px-5 py-4 border-b bg-gradient-to-r from-slate-50 to-white">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white text-sm">
              ⛅
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Clima</h3>
              <p className="text-sm text-slate-500">
                {isEdit ? `Editando: ${editing?.city_name ?? ""}` : "Cadastrar / atualizar cidades monitoradas"}
              </p>
            </div>
          </div>

          {/* ações: removido “Adicionar cidade” */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="inline-flex w-full sm:w-auto rounded-xl border border-slate-200 bg-white p-1">
              <button
                type="button"
                onClick={() => setEditMode("manual")}
                className={`px-3 py-1.5 text-sm rounded-lg transition ${
                  editMode === "manual" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                Manual
              </button>
              <button
                type="button"
                onClick={() => setEditMode("ibge")}
                className={`px-3 py-1.5 text-sm rounded-lg transition ${
                  editMode === "ibge" ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                IBGE
              </button>
            </div>

            <button
              type="button"
              onClick={clearFormData}
              className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Limpar dados
            </button>
          </div>
        </div>
      </header>

      <div className="p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className={labelBase}>Cidade</label>
            <input
              value={form.city_name}
              onChange={(e) => {
                setGeoHint(null);
                setGeoPickerOpen(false);
                set("city_name", e.target.value);
              }}
              className={inputBase}
              placeholder="Ex: Uberlândia"
            />

            {showIbgeUi ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-500">{ibgeHint}</p>

                {ibgeSuggestions.length > 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    {ibgeSuggestions.map((m) => {
                      const uf = getIbgeUf(m);
                      const id = getIbgeId(m);
                      const nome = getIbgeNome(m);
                      return (
                        <button
                          key={`${id}-${uf}-${nome}`}
                          type="button"
                          onClick={() => applyMunicipio(m)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition flex items-center justify-between"
                        >
                          <span className="font-medium text-slate-900">{nome}</span>
                          <span className="text-xs text-slate-500">
                            {uf ? `${uf} · ` : ""}
                            {id}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <label className={labelBase}>UF</label>
            <input
              value={form.uf}
              onChange={(e) => {
                setGeoHint(null);
                setGeoPickerOpen(false);
                set("uf", e.target.value.toUpperCase());
              }}
              className={inputBase}
              placeholder="Ex: MG"
              maxLength={2}
            />
          </div>

          <div className="space-y-2">
            <label className={labelBase}>Slug</label>
            <input
              value={form.slug}
              onChange={(e) => set("slug", e.target.value)}
              className={inputBase}
              placeholder="Ex: uberlandia"
              disabled={showIbgeUi}
            />
            <p className="text-xs text-slate-500">
              {showIbgeUi ? "No modo IBGE, o slug é gerado automaticamente pela cidade." : "Use letras minúsculas e hífen."}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">Coordenadas (Open-Meteo)</p>
              <p className="text-xs text-slate-500">Chuva (mm) será sincronizada via latitude/longitude.</p>
              {geoHint ? <p className="text-xs text-slate-600 mt-1 break-words">{geoHint}</p> : null}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {editMode === "ibge" && onBuscarIbge ? (
                <button
                  type="button"
                  onClick={() => onBuscarIbge({ uf: form.uf.trim().toUpperCase(), city: form.city_name.trim() })}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  Buscar no IBGE
                </button>
              ) : null}

              {onSuggestStations ? (
                <button
                  type="button"
                  disabled={geoLoading}
                  onClick={() => geocodeFlow(form.uf, form.city_name)}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
                  title="Busca coordenadas com Open-Meteo (geocoding)"
                >
                  {geoLoading ? "Buscando..." : "Buscar coordenadas"}
                </button>
              ) : null}
            </div>
          </div>

          {geoPickerOpen && geoSuggestions.length > 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-50 border-b">
                Selecione o local (aplicará station_lat/station_lon)
              </div>
              {geoSuggestions.slice(0, 10).map((s) => {
                const lat = safeNum(s?.lat);
                const lon = safeNum(s?.lon);
                return (
                  <button
                    key={`${s.name}-${s.uf}-${lat ?? "x"}-${lon ?? "y"}`}
                    type="button"
                    onClick={() => selectGeo(s)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition flex items-center justify-between gap-3"
                  >
                    <span className="font-medium text-slate-900 truncate">
                      {s.name} <span className="font-normal text-slate-600">— {s.uf}</span>
                    </span>
                    <span className="text-xs text-slate-500 whitespace-nowrap">
                      {lat !== null && lon !== null ? `${fmtCoord(lat)}, ${fmtCoord(lon)}` : "—"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className={labelBase}>Latitude</label>
              <input
                value={(form as any).station_lat ?? ""}
                onChange={(e) => setForm((p: any) => ({ ...p, station_lat: e.target.value }))}
                className={inputBase}
                placeholder="Ex: -18.920000"
                inputMode="decimal"
              />
            </div>

            <div className="space-y-2">
              <label className={labelBase}>Longitude</label>
              <input
                value={(form as any).station_lon ?? ""}
                onChange={(e) => setForm((p: any) => ({ ...p, station_lon: e.target.value }))}
                className={inputBase}
                placeholder="Ex: -48.260000"
                inputMode="decimal"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className={labelBase}>IBGE ID (opcional)</label>
              <input
                value={(form as any).ibge_id ?? ""}
                onChange={(e) => {
                  setGeoHint(null);
                  setGeoPickerOpen(false);
                  setForm((p: any) => ({ ...p, ibge_id: e.target.value }));
                }}
                className={inputBase}
                placeholder="Ex: 3170206"
                inputMode="numeric"
              />
              {showIbgeUi ? <p className="text-xs text-slate-500">Se digitar o ID (6–8 dígitos), ele preenche automático.</p> : null}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={labelBase}>Station Code (legado / opcional)</label>
              <input
                value={(form as any).station_code ?? ""}
                onChange={(e) => setForm((p: any) => ({ ...p, station_code: e.target.value.toUpperCase() }))}
                className={inputBase}
                placeholder="Ex: A827 (não é mais necessário)"
                maxLength={10}
              />
              <p className="text-xs text-slate-500">Open-Meteo não precisa deste campo para chuva.</p>
            </div>

            <div className="space-y-2">
              <label className={labelBase}>Source (opcional)</label>
              <input value={form.source} onChange={(e) => set("source", e.target.value)} className={inputBase} placeholder="Ex: OPEN_METEO" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className={labelBase}>mm 24h</label>
            <input value={form.mm_24h} onChange={(e) => set("mm_24h", e.target.value)} className={inputBase} placeholder="Ex: 12.3" inputMode="decimal" />
          </div>
          <div className="space-y-2">
            <label className={labelBase}>mm 7d</label>
            <input value={form.mm_7d} onChange={(e) => set("mm_7d", e.target.value)} className={inputBase} placeholder="Ex: 55.7" inputMode="decimal" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className={labelBase}>Last update (opcional)</label>
            <input value={form.last_update_at} onChange={(e) => set("last_update_at", e.target.value)} className={inputBase} placeholder="YYYY-MM-DD HH:mm:ss" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm md:col-span-1">
            <input type="checkbox" checked={form.ativo} onChange={(e) => set("ativo", e.target.checked)} className="h-4 w-4 accent-[#EC5B20]" />
            Ativo
          </label>

          <div className="md:col-span-2 flex flex-col sm:flex-row gap-2 sm:justify-end">
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
      </div>
    </section>
  );
}
