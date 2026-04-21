import React, { Suspense } from "react";
import DronesClient from "./DronesClient";

export const metadata = {
  title: "Kavita Drones — Drones agrícolas DJI Agras para pulverização e produtividade",
  description:
    "Conheça os drones agrícolas DJI Agras para pulverização e operação no campo — T25P, T70P e T100. Atendimento com representante autorizado Kavita para escolher o modelo certo para sua propriedade.",
  openGraph: {
    title: "Kavita Drones — DJI Agras para o campo brasileiro",
    description:
      "Drones agrícolas DJI Agras com atendimento direto de representante autorizado. Pulverização precisa, economia de insumos e mais agilidade na safra.",
    type: "website",
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark-900" />}>
      <DronesClient />
    </Suspense>
  );
}
