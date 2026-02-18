"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

function pageview(url: string) {
  if (!GA_ID) return;

  // Se ainda não carregou, empurra para dataLayer mesmo assim
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(["config", GA_ID, { page_path: url }]);

  if (typeof window.gtag === "function") {
    window.gtag("config", GA_ID, { page_path: url });
  }
}

export default function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_ID) return;

    const qs = searchParams?.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;

    pageview(url);
  }, [pathname, searchParams]);

  if (!GA_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: false, debug_mode: true });
        `}
      </Script>
    </>
  );
}
