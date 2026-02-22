import React, { Suspense } from "react";
import DronesClient from "./DronesClient";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-svh bg-[#070A0E]" />}>
      <DronesClient />
    </Suspense>
  );
}