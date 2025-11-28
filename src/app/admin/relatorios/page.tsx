"use client";

import CloseButton from "@/components/buttons/CloseButton";
import CustomButton from "@/components/buttons/CustomButton";
import {
  BarChart2,
  ShoppingBag,
  Users,
  AlertTriangle,
  Wrench,
  LucideIcon,
} from "lucide-react";

type ReportCard = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string; // cor de destaque do ícone
};

const CARDS: ReportCard[] = [
  {
    href: "/admin/relatorios/vendas",
    title: "Relatório de Vendas",
    description: "Acompanhe o faturamento diário e identifique picos de vendas.",
    icon: BarChart2,
    accent: "#22c55e", // verde
  },
  {
    href: "/admin/relatorios/produtos",
    title: "Produtos Mais Vendidos",
    description: "Veja quais produtos giram mais e otimize seu estoque.",
    icon: ShoppingBag,
    accent: "#eab308", // amarelo
  },
  {
    href: "/admin/relatorios/clientes",
    title: "Clientes Top",
    description: "Identifique seus melhores clientes por valor gasto.",
    icon: Users,
    accent: "#38bdf8", // azul
  },
  {
    href: "/admin/relatorios/estoque",
    title: "Estoque Baixo",
    description: "Produtos com poucos itens em estoque para reposição rápida.",
    icon: AlertTriangle,
    accent: "#f97316", // laranja
  },
  {
    href: "/admin/relatorios/servicos",
    title: "Serviços / Colaboradores",
    description: "Visão geral de serviços cadastrados por especialidade.",
    icon: Wrench,
    accent: "#a855f7", // roxo
  },
];

export default function RelatoriosHomePage() {
  return (
    <main className="w-full px-3 pb-6 pt-4 sm:px-6 lg:px-8">
      <section className="relative mx-auto flex w-full max-w-6xl flex-col gap-6">
        {/* Cabeçalho */}
        <header className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#35c2c4] sm:text-3xl">
              Relatórios e Métricas
            </h1>
            <p className="max-w-xl text-xs text-slate-300 sm:text-sm">
              Escolha um tipo de relatório para visualizar informações
              detalhadas sobre vendas, clientes, estoque e serviços.
            </p>
          </div>

          {/* Close só no mobile / tablet */}
          <div className="absolute right-0 top-0 translate-y-1 md:hidden">
            <CloseButton className="text-2xl text-slate-400 hover:text-slate-100" />
          </div>
        </header>

        {/* Bloco principal */}
        <div
          className="
            rounded-3xl border border-slate-800 bg-slate-950/70 
            p-4 shadow-[0_18px_45px_rgba(0,0,0,0.65)] backdrop-blur
            sm:p-6
          "
        >
          <div className="mb-4 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 sm:text-base">
                Visão geral dos relatórios
              </h2>
              <p className="text-xs text-slate-400 sm:text-sm">
                Acesse rapidamente os relatórios mais usados para acompanhar a
                saúde da sua operação.
              </p>
            </div>
          </div>

          {/* Grid de cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CARDS.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.href}
                  className="
                    flex h-full flex-col justify-between rounded-2xl border border-slate-800 
                    bg-slate-950/80 p-4 sm:p-5
                    shadow-[0_10px_30px_rgba(0,0,0,0.35)]
                    transition-transform transition-colors
                    hover:-translate-y-1 hover:border-[#35c2c4] hover:bg-slate-900/80
                  "
                >
                  <div className="flex items-start gap-3">
                    {/* Ícone */}
                    <div
                      className="
                        flex h-10 w-10 items-center justify-center rounded-2xl 
                        border border-slate-800 bg-slate-900/80
                        shadow-[0_0_25px_rgba(0,0,0,0.45)]
                      "
                      style={{
                        boxShadow: `0 0 22px ${item.accent}33`,
                      }}
                    >
                      <Icon
                        className="h-5 w-5"
                        style={{ color: item.accent }}
                      />
                    </div>

                    {/* Título e descrição */}
                    <div>
                      <h3 className="text-sm font-semibold text-slate-50 sm:text-base">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-xs text-slate-400 sm:text-sm">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <CustomButton
                      label="Ver detalhes"
                      href={item.href}
                      variant="primary"
                      size="small"
                      isLoading={false}
                      className="w-full justify-center sm:w-auto"
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
