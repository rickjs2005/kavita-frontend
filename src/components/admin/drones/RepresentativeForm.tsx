"use client";

import { useEffect, useMemo, useState } from "react";
import {
  onlyDigits,
  formatCnpjMask,
  formatCepMask,
  formatPhoneMask,
} from "@/utils/formatters";
import { ESTADOS_BR } from "@/utils/brasil";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Rep = {
  id: number;
  name: string;
  whatsapp: string;
  cnpj: string;
  instagram_url: string | null;

  address_street: string;
  address_number: string;
  address_complement: string | null;
  address_neighborhood: string | null;
  address_city: string | null;
  address_uf: string | null;
  address_cep: string | null;

  notes: string | null;
  sort_order: number;
  is_active: 0 | 1;

  created_at: string;
  updated_at: string;
};

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isAuthError(res: Response) {
  return res.status === 401 || res.status === 403;
}

function redirectToLogin() {
  if (typeof window !== "undefined") window.location.assign("/admin/login");
}

async function readSafe(res: Response) {
  const txt = await res.text();
  const data = safeJson(txt);
  return { txt, data };
}

function normalizeUF(value: string) {
  return (value || "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2);
}

function isValidUF(uf: string) {
  const v = normalizeUF(uf);
  if (!v) return true; // opcional
  return ESTADOS_BR.some((e) => e.sigla === v);
}

export default function RepresentativeForm() {
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<{ items: Rep[]; total: number; totalPages: number } | null>(null);

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [editing, setEditing] = useState<Rep | null>(null);

  // form state (create/edit)
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");

  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [cep, setCep] = useState("");

  const [notes, setNotes] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const items = useMemo(() => data?.items || [], [data]);

  function resetForm() {
    setName("");
    setWhatsapp("");
    setCnpj("");
    setInstagramUrl("");
    setStreet("");
    setNumber("");
    setComplement("");
    setNeighborhood("");
    setCity("");
    setUf("");
    setCep("");
    setNotes("");
    setSortOrder(0);
    setIsActive(true);
    setEditing(null);
  }

  function startEdit(rep: Rep) {
    setEditing(rep);
    setName(rep.name || "");
    setWhatsapp(formatPhoneMask(rep.whatsapp || ""));
    setCnpj(formatCnpjMask(rep.cnpj || ""));
    setInstagramUrl(rep.instagram_url || "");
    setStreet(rep.address_street || "");
    setNumber(rep.address_number || "");
    setComplement(rep.address_complement || "");
    setNeighborhood(rep.address_neighborhood || "");
    setCity(rep.address_city || "");
    setUf(normalizeUF(rep.address_uf || ""));
    setCep(formatCepMask(rep.address_cep || ""));
    setNotes(rep.notes || "");
    setSortOrder(rep.sort_order || 0);
    setIsActive(Boolean(rep.is_active));
    setMsg(null);
  }

  async function load(p = page) {
    setMsg(null);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("limit", "20");
      if (search.trim()) params.set("busca", search.trim());
      params.set("orderBy", "sort_order");
      params.set("orderDir", "asc");

      const res = await fetch(`${API_BASE}/api/admin/drones/representantes?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });

      if (isAuthError(res)) return redirectToLogin();

      const { data } = await readSafe(res);
      if (!res.ok) {
        setMsg(data?.message || "Falha ao carregar representantes.");
        setData(null);
        return;
      }

      setData({
        items: Array.isArray(data?.items) ? data.items : [],
        total: Number(data?.total || 0),
        totalPages: Number(data?.totalPages || 1),
      });
      setPage(Number(data?.page || p));
    } catch {
      setMsg("Erro de rede ao carregar representantes.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applySearch() {
    setPage(1);
    await load(1);
  }

  function validate() {
    if (!name.trim()) return "name é obrigatório.";

    const w = onlyDigits(whatsapp);
    if (!w) return "whatsapp é obrigatório.";
    if (!(w.length === 10 || w.length === 11)) return "whatsapp inválido (DDD + número).";

    const c = onlyDigits(cnpj);
    if (!c) return "cnpj é obrigatório.";
    if (c.length !== 14) return "cnpj inválido (14 dígitos).";

    if (!street.trim()) return "address_street é obrigatório.";
    if (!number.trim()) return "address_number é obrigatório.";

    const cepDigits = onlyDigits(cep);
    if (cepDigits && cepDigits.length !== 8) return "cep inválido (8 dígitos).";

    if (!isValidUF(uf)) return "UF inválida. Use uma sigla válida (ex: SP, MG).";

    return null;
  }

  async function save() {
    setMsg(null);
    const err = validate();
    if (err) {
      setMsg(err);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        whatsapp: onlyDigits(whatsapp),
        cnpj: onlyDigits(cnpj),
        instagram_url: instagramUrl.trim() || null,

        address_street: street.trim(),
        address_number: number.trim(),
        address_complement: complement.trim() || null,
        address_neighborhood: neighborhood.trim() || null,
        address_city: city.trim() || null,
        address_uf: normalizeUF(uf) || null,
        address_cep: onlyDigits(cep) || null,

        notes: notes.trim() || null,
        sort_order: Number(sortOrder) || 0,
        is_active: isActive ? 1 : 0,
      };

      const url = editing
        ? `${API_BASE}/api/admin/drones/representantes/${editing.id}`
        : `${API_BASE}/api/admin/drones/representantes`;

      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (isAuthError(res)) return redirectToLogin();

      const { data } = await readSafe(res);
      if (!res.ok) {
        setMsg(data?.message || "Falha ao salvar representante.");
        return;
      }

      setMsg(editing ? "Representante atualizado." : "Representante criado.");
      resetForm();
      await load(1);
    } catch {
      setMsg("Erro de rede ao salvar representante.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    setMsg(null);
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/admin/drones/representantes/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (isAuthError(res)) return redirectToLogin();

      const { data } = await readSafe(res);
      if (!res.ok) {
        setMsg(data?.message || "Falha ao remover representante.");
        return;
      }

      setMsg("Representante removido.");
      await load(1);
    } catch {
      setMsg("Erro de rede ao remover representante.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-extrabold">Representantes/Lojas (CRUD + busca + ordenação)</h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, cidade, UF, CNPJ..."
            className="rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm"
          />
          <button
            onClick={applySearch}
            className="rounded-full bg-white/10 px-6 py-2 text-sm font-bold text-white border border-white/10 hover:bg-white/15"
          >
            Buscar
          </button>
        </div>

        {msg ? <p className="mt-3 text-sm text-slate-200">{msg}</p> : null}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-sm font-extrabold">{editing ? "Editar representante" : "Adicionar representante"}</h3>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-xs text-slate-300">Nome (obrigatório)</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300">WhatsApp</label>
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(formatPhoneMask(e.target.value))}
              inputMode="tel"
              placeholder="(00) 00000-0000"
              className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300">CNPJ</label>
            <input
              value={cnpj}
              onChange={(e) => setCnpj(formatCnpjMask(e.target.value))}
              inputMode="numeric"
              placeholder="00.000.000/0000-00"
              className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300">Instagram (URL)</label>
            <input
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300">Rua (obrigatório)</label>
            <input
              value={street}
              onChange={(e) => setStreet(e.target.value)}
              className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300">Número (obrigatório)</label>
            <input
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300">Complemento</label>
            <input
              value={complement}
              onChange={(e) => setComplement(e.target.value)}
              className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300">Bairro</label>
            <input
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300">Cidade</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300">UF</label>
            <input
              value={uf}
              onChange={(e) => setUf(normalizeUF(e.target.value))}
              maxLength={2}
              placeholder="SP"
              className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm uppercase"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300">CEP</label>
            <input
              value={cep}
              onChange={(e) => setCep(formatCepMask(e.target.value))}
              inputMode="numeric"
              placeholder="00000-000"
              className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-300">Ordem (sort_order)</label>
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
              className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs text-slate-300">Observações</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full rounded-xl bg-black/50 border border-white/10 px-3 py-2 text-sm"
            />
          </div>

          <div className="sm:col-span-2 flex items-center gap-2">
            <input
              id="rep-active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <label htmlFor="rep-active" className="text-sm text-slate-200">
              Ativo (aparece na página pública)
            </label>
          </div>

          <div className="sm:col-span-2 flex flex-wrap gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="rounded-full bg-emerald-500 px-6 py-2 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving ? "Salvando..." : editing ? "Salvar alterações" : "Adicionar"}
            </button>

            <button
              onClick={resetForm}
              className="rounded-full bg-white/10 px-6 py-2 text-sm font-bold text-white border border-white/10"
            >
              Limpar
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-sm font-extrabold">Lista</h3>

        {loading ? <p className="mt-3 text-slate-300">Carregando...</p> : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((r) => (
            <div key={r.id} className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-white">{r.name}</p>
                <span className="text-xs text-slate-300">{r.is_active ? "ATIVO" : "INATIVO"}</span>
              </div>

              <p className="mt-1 text-xs text-slate-300">
                {r.address_city || "Cidade"} {r.address_uf ? `- ${normalizeUF(r.address_uf)}` : ""} • ordem{" "}
                {r.sort_order}
              </p>

              <p className="mt-2 text-xs text-slate-300">
                WhatsApp: {formatPhoneMask(r.whatsapp)} • CNPJ: {formatCnpjMask(r.cnpj)}
              </p>

              <p className="mt-2 text-xs text-slate-400">
                {r.address_street}, {r.address_number}
                {r.address_neighborhood ? ` - ${r.address_neighborhood}` : ""}
                {r.address_cep ? ` • CEP ${formatCepMask(r.address_cep)}` : ""}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => startEdit(r)}
                  className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white border border-white/10"
                >
                  Editar
                </button>
                <button
                  onClick={() => remove(r.id)}
                  disabled={deletingId === r.id}
                  className="rounded-full bg-red-500/80 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  {deletingId === r.id ? "Excluindo..." : "Excluir"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {data?.totalPages && data.totalPages > 1 ? (
          <div className="mt-5 flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => load(page - 1)}
              className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white border border-white/10 disabled:opacity-50"
            >
              Anterior
            </button>
            <p className="text-xs text-slate-300">
              Página {page} de {data.totalPages}
            </p>
            <button
              disabled={page >= data.totalPages}
              onClick={() => load(page + 1)}
              className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white border border-white/10 disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        ) : null}

        {!items.length && !loading ? (
          <p className="mt-3 text-sm text-slate-300">Nenhum representante encontrado.</p>
        ) : null}
      </div>
    </div>
  );
}
