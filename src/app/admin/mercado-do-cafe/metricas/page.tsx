// src/app/admin/mercado-do-cafe/metricas/page.tsx
//
// Dashboard de métricas do Mercado do Café. Padrão "Stripe-like":
// cards de KPI com delta vs período anterior, série temporal,
// top cidades, distribuição de planos, SLA percentis.

import MetricsClient from "./MetricsClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return <MetricsClient />;
}
