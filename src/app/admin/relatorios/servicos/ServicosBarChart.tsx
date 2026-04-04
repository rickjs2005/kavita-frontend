"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Props = {
  data: { label: string; total: number }[];
};

export default function ServicosBarChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid)" />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--color-chart-tick)", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "var(--color-chart-axis)" }}
        />
        <YAxis
          tick={{ fill: "var(--color-chart-tick)", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "var(--color-chart-axis)" }}
        />
        <Tooltip
          formatter={(value: number | undefined) =>
            `${value ?? 0} serviço${value === 1 ? "" : "s"}`
          }
          labelFormatter={(label) => `Especialidade: ${label}`}
          contentStyle={{
            backgroundColor: "var(--color-chart-bg)",
            border: "1px solid var(--color-chart-border)",
            borderRadius: "0.75rem",
            color: "var(--color-chart-text)",
            fontSize: 12,
            boxShadow: "0 15px 35px rgba(15,23,42,0.22)",
          }}
        />
        <Bar dataKey="total" radius={[10, 10, 0, 0]} fill="var(--color-chart-primary)" />
      </BarChart>
    </ResponsiveContainer>
  );
}
