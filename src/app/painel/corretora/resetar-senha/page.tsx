import { Suspense } from "react";
import ResetClient from "./ResetClient";

export const metadata = {
  title: "Nova senha | Painel da Corretora",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetClient />
    </Suspense>
  );
}
