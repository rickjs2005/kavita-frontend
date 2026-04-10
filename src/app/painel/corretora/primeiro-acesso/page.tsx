import { Suspense } from "react";
import FirstAccessClient from "./FirstAccessClient";

export const metadata = {
  title: "Primeiro acesso | Painel da Corretora",
};

export default function FirstAccessPage() {
  return (
    <Suspense fallback={null}>
      <FirstAccessClient />
    </Suspense>
  );
}
