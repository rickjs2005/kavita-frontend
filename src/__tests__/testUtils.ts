import { vi } from "vitest";

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  key: (index: number) => string | null;
  length: number;
};

export function createMockStorage(initial: Record<string, string> = {}) {
  let store: Record<string, string> = { ...initial };

  const storage: StorageLike = {
    getItem: vi.fn((key: string) => (key in store ? store[key] : null)),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = String(value);
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    get length() {
      return Object.keys(store).length;
    },
  };

  return {
    storage,
    getStore: () => ({ ...store }),
    setStore: (next: Record<string, string>) => {
      store = { ...next };
    },
  };
}

export function installMockStorage() {
  const ls = createMockStorage();
  const ss = createMockStorage();

  Object.defineProperty(window, "localStorage", {
    value: ls.storage,
    writable: true,
  });
  Object.defineProperty(window, "sessionStorage", {
    value: ss.storage,
    writable: true,
  });

  return { local: ls, session: ss };
}

export function mockGlobalFetch() {
  const mock = vi.fn();
  global.fetch = mock;
  return mock;
}

export async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}
