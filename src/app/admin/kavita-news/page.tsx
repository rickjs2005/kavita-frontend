"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import AdminSidebar from "@/components/admin/AdminSidebar";
import CloseButton from "@/components/buttons/CloseButton";
import { useAdminAuth } from "@/context/AdminAuthContext";
import NewsTabs, { NewsTabKey } from "@/components/admin/kavita-news/NewsTabs";
import ClimaSection from "@/components/admin/kavita-news/clima/ClimaSection";
import CotacoesSection from "@/components/admin/kavita-news/cotacoes/CotacoesSection";
import PostsTab from "@/components/admin/kavita-news/posts/PostsTab";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AdminKavitaNewsPage() {
  const router = useRouter();
  const { logout } = useAdminAuth();

  const [activeTab, setActiveTab] = useState<NewsTabKey>("clima");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const authOptions = useMemo<RequestInit>(
    () => ({
      credentials: "include",
    }),
    []
  );

  const handleUnauthorized = useCallback(() => {
    logout();
    router.replace("/admin/login");
  }, [logout, router]);

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-50">
      {/* HEADER */}
      <header className="sticky top-0 z-20 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-[2px] text-[10px] font-medium uppercase tracking-[0.16em] text-emerald-300">
                Kavita Admin
              </span>
              <span className="hidden text-[10px] text-slate-500 sm:inline">
                Módulo de conteúdo (clima, cotações e posts)
              </span>
            </div>

            <h1 className="truncate text-base font-semibold sm:text-lg">
              Kavita News
            </h1>
            <p className="mt-0.5 text-[11px] text-slate-400 sm:text-xs">
              Gerencie clima, cotações e posts sem mexer no banco manualmente.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* MENU MOBILE */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className={`md:hidden ${
                isMobileMenuOpen ? "hidden" : "flex"
              } h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-900/40`}
              aria-label="Abrir menu do painel"
            >
              <span className="sr-only">Abrir menu</span>
              <span className="flex flex-col gap-[3px]">
                <span className="block h-[2px] w-5 rounded-full bg-white" />
                <span className="block h-[2px] w-5 rounded-full bg-white" />
                <span className="block h-[2px] w-5 rounded-full bg-white" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                toast("Dica: use as abas para alternar entre os módulos.");
              }}
              className="hidden rounded-full border border-slate-800 bg-slate-900/70 px-4 py-1.5 text-xs font-semibold text-slate-100 hover:border-emerald-500/40 md:flex"
            >
              Ajuda rápida
            </button>
          </div>
        </div>
      </header>

      {/* MENU MOBILE FULLSCREEN */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          {/* ✅ FIX a11y: overlay não pode ser div clicável sem teclado.
              Trocar por <button> fullscreen (nativo, focável, acessível). */}
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          <div className="relative ml-0 flex h-full w-4/5 max-w-xs flex-col bg-slate-950/95 shadow-xl shadow-black/60">
            <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Menu
              </p>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="ml-auto"
                aria-label="Fechar menu lateral"
              >
                <CloseButton />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AdminSidebar onNavigate={() => setIsMobileMenuOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-3 pb-10 pt-4 sm:px-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-slate-950/60">
          <NewsTabs active={activeTab} onChange={setActiveTab} />

          <div className="mt-4">
            {activeTab === "clima" && (
              <ClimaSection
                apiBase={API_BASE}
                authOptions={authOptions}
                onUnauthorized={handleUnauthorized}
              />
            )}

            {activeTab === "cotacoes" && (
              <CotacoesSection
                apiBase={API_BASE}
                authOptions={authOptions}
                onUnauthorized={handleUnauthorized}
              />
            )}

            {activeTab === "posts" && <PostsTab />}
          </div>
        </div>
      </main>
    </div>
  );
}
