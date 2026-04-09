import React, { Suspense } from "react";
import DronesClient from "./DronesClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark-900" />}>
      <DronesClient />
    </Suspense>
  );
}
