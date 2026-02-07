"use client";

import { useMemo, useState } from "react";
import type { DronePageSettings, DroneRepresentative } from "@/types/drones";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function digitsOnly(s: string) {
  return String(s || "").replace(/\D/g, "");
}

function buildWaLink(rep: DroneRepresentative, template?: string | null) {
  const phone = digitsOnly(rep.whatsapp);
  const msg = template || "Olá! Quero conhecer melhor os drones da Kavita.";
  const text = encodeURIComponent(`${msg}\n\nLoja: ${rep.name}`);
  const full = phone.startsWith("55") ? phone : `55${phone}`;
  return `https://wa.me/${full}?text=${text}`;
}

type PagedResp = {
  items: DroneRepresentative[];
  page: number;
  totalPages: number;
  total: number;
  limit: number;
};

export default function RepresentativesSection({
  page,
  representatives,
}: {
  page: DronePageSettings;
  representatives: DroneRepresentative[];
}) {
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [paged, setPaged] = useState<PagedResp | null>(null);
  const [curPage, setCurPage] = useState(1);

  const list = useMemo(() => {
    if (paged?.items?.length) return paged.items;
    return representatives || [];
  }, [paged, representatives]);

  async function fetchPage(p: number) {
    setMsg(null);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      params.set("limit", "12");
      if (busca.trim()) params.set("busca", busca.trim());
      params.set("orderBy", "sort_order");
      params.set("orderDir", "asc");

      const res = await fetch(
        `${API_BASE}/api/public/drones/representantes?${params.toString()}`,
        { cache: "no-store" }
      );

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMsg(data?.message || "Falha ao buscar representantes.");
        setPaged(null);
        return;
      }

      setPaged(data);
      setCurPage(Number(data?.page || p));
    } catch {
      setMsg("Erro de rede ao buscar representantes.");
      setPaged(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="representantes" className="mx-auto max-w-6xl px-5 py-10 sm:py-12">
      <h2 className="text-xl sm:text-2xl font-extrabold text-white">Representantes</h2>
      <p className="mt-2 text-sm text-slate-300">
        Escolha um representante e fale direto no WhatsApp.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, cidade ou UF..."
          className="w-full rounded-2xl bg-black/40 border border-white/10 px-4 py-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-emerald-400/40"
        />
        <button
          onClick={() => fetchPage(1)}
          disabled={loading}
          className="rounded-full bg-white/10 px-6 py-3 text-sm font-bold text-white border border-white/10 hover:bg-white/15 transition disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          {loading ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {msg ? (
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
          {msg}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((rep) => (
          <div
            key={rep.id}
            className="rounded-3xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-white truncate">{rep.name}</p>
                <p className="mt-1 text-xs text-slate-300 truncate">
                  {rep.address_city || "Cidade"} {rep.address_uf ? `- ${rep.address_uf}` : ""}
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-200">
                Loja autorizada
              </span>
            </div>

            <p className="mt-4 text-xs text-slate-300 leading-relaxed">
              {rep.address_street}, {rep.address_number}
              {rep.address_neighborhood ? ` - ${rep.address_neighborhood}` : ""}
              {rep.address_cep ? ` • CEP ${rep.address_cep}` : ""}
            </p>

            <div className="mt-4 grid gap-1 text-xs text-slate-300">
              <span>WhatsApp: {rep.whatsapp}</span>
              <span>CNPJ: {rep.cnpj}</span>

              {rep.instagram_url ? (
                <a
                  href={rep.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-300 hover:underline"
                >
                  Instagram
                </a>
              ) : null}

              {rep.notes ? <span className="text-slate-400">{rep.notes}</span> : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={buildWaLink(rep, page.cta_message_template)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex flex-1 items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-xs font-extrabold text-white hover:brightness-110 transition focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
              >
                Falar no WhatsApp
              </a>

              {rep.instagram_url ? (
                <a
                  href={rep.instagram_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-white/10 transition focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  Instagram
                </a>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {paged?.totalPages && paged.totalPages > 1 ? (
        <div className="mt-7 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              disabled={loading || curPage <= 1}
              onClick={() => fetchPage(curPage - 1)}
              className="rounded-full bg-white/10 px-4 py-2.5 text-xs font-bold text-white border border-white/10 disabled:opacity-50 hover:bg-white/15 transition"
            >
              Anterior
            </button>
            <button
              disabled={loading || curPage >= paged.totalPages}
              onClick={() => fetchPage(curPage + 1)}
              className="rounded-full bg-white/10 px-4 py-2.5 text-xs font-bold text-white border border-white/10 disabled:opacity-50 hover:bg-white/15 transition"
            >
              Próxima
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Página {curPage} de {paged.totalPages} • Total: {paged.total}
          </p>
        </div>
      ) : null}

      {!list.length && !loading ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
          Nenhum representante encontrado.
        </div>
      ) : null}
    </section>
  );
}
