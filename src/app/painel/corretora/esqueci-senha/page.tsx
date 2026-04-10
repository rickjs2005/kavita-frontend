import { Suspense } from "react";
import ForgotClient from "./ForgotClient";

export const metadata = {
  title: "Recuperar senha | Painel da Corretora",
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ForgotClient />
    </Suspense>
  );
}
