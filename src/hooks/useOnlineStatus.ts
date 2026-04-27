"use client";

import { useEffect, useState } from "react";

/**
 * Reactive online/offline indicator.
 *
 * SSR-safe: returns `true` on the server (we cannot detect connectivity
 * during render) so RSC/SSR markup never flashes an offline UI before
 * hydration. After mount we read `navigator.onLine` and subscribe to
 * `online`/`offline` window events.
 *
 * Use sparingly — for the motorista app this is the source of truth for
 * deciding between "show data with offline banner" and "show empty state
 * because we have nothing cached".
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof navigator !== "undefined") {
      setOnline(navigator.onLine);
    }
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return online;
}

export default useOnlineStatus;
