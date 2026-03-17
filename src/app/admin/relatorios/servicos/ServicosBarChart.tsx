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
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="label"
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#1f2937" }}
        />
        <YAxis
          tick={{ fill: "#9ca3af", fontSize: 11 }}
          tickLine={false}
          axisLine={{ stroke: "#1f2937" }}
        />
        <Tooltip
          formatter={(value: number | undefined) =>
            `${value ?? 0} serviço${value === 1 ? "" : "s"}`
          }
          labelFormatter={(label) => `Especialidade: ${label}`}
          contentStyle={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "0.75rem",
            color: "#020617",
            fontSize: 12,
            boxShadow: "0 15px 35px rgba(15,23,42,0.22)",
          }}
        />
        <Bar dataKey="total" radius={[10, 10, 0, 0]} fill="#35c2c4" />
      </BarChart>
    </ResponsiveContainer>
  );
}
