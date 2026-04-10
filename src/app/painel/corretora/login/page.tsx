import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function CorretoraLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginClient />
    </Suspense>
  );
}
