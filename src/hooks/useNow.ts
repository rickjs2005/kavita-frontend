"use client";

import { useEffect, useState } from "react";

/**
 * Returns a tick of the current time that updates on a fixed interval.
 *
 * Initial value is 0 to avoid hydration mismatches and to satisfy
 * `react-hooks/purity` (no `Date.now()` during render). The first real
 * value is written from a `useEffect` after mount.
 *
 * @param intervalMs polling interval in milliseconds (default 60s)
 */
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState<number>(0);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
}

export default useNow;
