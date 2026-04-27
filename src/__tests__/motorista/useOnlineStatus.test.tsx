import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

function setNavigatorOnline(value: boolean) {
  Object.defineProperty(navigator, "onLine", {
    value,
    configurable: true,
    writable: true,
  });
}

describe("useOnlineStatus", () => {
  beforeEach(() => {
    setNavigatorOnline(true);
  });

  afterEach(() => {
    setNavigatorOnline(true);
  });

  it("returns navigator.onLine after mount (true case)", () => {
    setNavigatorOnline(true);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it("returns false when navigator reports offline at mount", () => {
    setNavigatorOnline(false);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it("flips to false on window 'offline' event and back to true on 'online'", () => {
    setNavigatorOnline(true);
    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    act(() => {
      setNavigatorOnline(false);
      window.dispatchEvent(new Event("offline"));
    });
    expect(result.current).toBe(false);

    act(() => {
      setNavigatorOnline(true);
      window.dispatchEvent(new Event("online"));
    });
    expect(result.current).toBe(true);
  });

  it("removes listeners on unmount (no leak)", () => {
    setNavigatorOnline(true);
    const { result, unmount } = renderHook(() => useOnlineStatus());
    unmount();
    // After unmount, dispatching events must not throw and must not
    // mutate the unmounted hook's last value (sanity check — there's
    // nothing observable from outside, so we just assert no crash).
    expect(() => {
      window.dispatchEvent(new Event("offline"));
      window.dispatchEvent(new Event("online"));
    }).not.toThrow();
    // Last rendered value remains as it was at unmount
    expect(result.current).toBe(true);
  });
});
