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
  // em jsdom, fetch pode estar em globalThis
  (globalThis as any).fetch = mock;
  return mock;
}

export async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

/* -------------------------------------------------------------------------- */
/* NOVOS HELPERS (adicionados sem quebrar exports existentes)                  */
/* -------------------------------------------------------------------------- */

type FormDataEntry = { name: string; value: any };

/**
 * FormData mockável para asserções de append/valores.
 * Compatível com o padrão: body instanceof MockFormData
 */
export class MockFormData {
  private _entries: FormDataEntry[] = [];

  append(name: string, value: any) {
    this._entries.push({ name, value });
  }

  // utilitários para assert
  entries() {
    return [...this._entries];
  }

  getAll(name: string) {
    return this._entries.filter((e) => e.name === name).map((e) => e.value);
  }

  get(name: string) {
    const found = this._entries.find((e) => e.name === name);
    return found ? found.value : null;
  }
}

/**
 * Substitui globalThis.FormData por MockFormData durante o teste
 * e devolve função para restore.
 */
export function mockGlobalFormData() {
  const Original = (globalThis as any).FormData;
  (globalThis as any).FormData = MockFormData;

  return () => {
    (globalThis as any).FormData = Original;
  };
}

/**
 * Mock de URL.createObjectURL / revokeObjectURL para testes com preview de imagem
 */
export function mockObjectUrl() {
  const createSpy = vi
    .spyOn(URL, "createObjectURL")
    .mockImplementation(() => "blob:mock");

  const revokeSpy = vi
    .spyOn(URL, "revokeObjectURL")
    .mockImplementation(() => {});

  return () => {
    createSpy.mockRestore();
    revokeSpy.mockRestore();
  };
}

type MockFetchOpts = {
  ok: boolean;
  status: number;

  // ✅ novo: statusText (pra simular res.statusText do fetch real)
  statusText?: string;

  // mantém compatibilidade com o seu helper atual
  contentType?: string;

  // ✅ novo: headers extras (ex: x-request-id)
  headers?: Record<string, string>;

  // payloads
  json?: any;
  text?: string;

  // ✅ novo: simular falha de JSON (payload não-JSON)
  jsonThrows?: boolean;
};

/**
 * Helper para montar Response-like, suficiente para .ok/.status/.statusText/.headers/.json()/.text()
 */
export function makeFetchResponse(opts: MockFetchOpts): Response {
  const headers = new Headers();

  // compat antigo
  if (opts.contentType) headers.set("content-type", opts.contentType);

  // novo: headers extras
  if (opts.headers) {
    for (const [k, v] of Object.entries(opts.headers)) {
      headers.set(k, v);
    }
  }

  const res = {
    ok: opts.ok,
    status: opts.status,
    statusText: opts.statusText ?? "",
    headers,
    async json() {
      if (opts.jsonThrows) throw new Error("Invalid JSON");
      return opts.json ?? {};
    },
    async text() {
      return opts.text ?? "";
    },
  };

  return res as unknown as Response;
}

/**
 * ✅ novo: util pra comparar headers em testes (Headers -> objeto)
 * Ex:
 *   const [, init] = fetchMock.mock.calls[0];
 *   expect(headersToObject(init.headers)).toMatchObject({ "content-type": "application/json" });
 */
export function headersToObject(h: any): Record<string, string> {
  if (!h) return {};
  if (h instanceof Headers) return Object.fromEntries(h.entries());
  if (typeof h === "object") return { ...h };
  return {};
}
