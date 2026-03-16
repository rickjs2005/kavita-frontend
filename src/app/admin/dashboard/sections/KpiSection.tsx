"use client";

import { KpiCard } from "@/components/admin/KpiCard";
import type { AdminResumo } from "../dashboardTypes";
import { formatMoney, formatNumber } from "../dashboardUtils";

type Props = {
  resumo: AdminResumo;
};

export function KpiSection({ resumo }: Props) {
  return (
    <>
      {/* Primary KPIs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Faturamento (30 dias)"
          value={formatMoney(resumo.totalVendas30Dias)}
          helper="Receita bruta dos últimos 30 dias"
          icon={<span>💰</span>}
          variant="success"
        />
        <KpiCard
          label="Pedidos (30 dias)"
          value={formatNumber(resumo.totalPedidosUltimos30)}
          helper="Pedidos criados no período"
          icon={<span>🧾</span>}
          variant="default"
        />
        <KpiCard
          label="Ticket médio"
          value={formatMoney(resumo.ticketMedio)}
          helper="Valor médio por pedido"
          icon={<span>🎯</span>}
          variant="success"
        />
        <KpiCard
          label="Clientes ativos"
          value={formatNumber(resumo.totalClientes)}
          helper="Clientes que já fizeram pedidos"
          icon={<span>👥</span>}
          variant="default"
        />
      </section>

      {/* Secondary KPIs */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Produtos no catálogo"
          value={formatNumber(resumo.totalProdutos)}
          helper="Itens disponíveis para venda"
          icon={<span>📦</span>}
          variant="default"
        />
        <KpiCard
          label="Serviços ativos"
          value={formatNumber(resumo.totalServicos)}
          helper="Serviços ofertados na plataforma"
          icon={<span>🛠️</span>}
          variant="default"
        />
        <KpiCard
          label="Produtos em destaque"
          value={formatNumber(resumo.totalDestaques)}
          helper="Cards especiais na home"
          icon={<span>⭐</span>}
          variant="default"
        />
      </section>
    </>
  );
}
