// src/__tests__/utils/kavita-news/posts.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import {
  uploadNewsCover,
  listNewsPosts,
  getNewsPost,
  createNewsPost,
  updateNewsPost,
  deleteNewsPost,
} from "@/utils/kavita-news/posts";

/**
 * Helpers de mock do fetch (Vitest)
 */
function mockFetchOnce(payload: any, init?: { ok?: boolean; status?: number }) {
  const ok = init?.ok ?? true;
  const status = init?.status ?? (ok ? 200 : 500);

  (globalThis.fetch as any) = vi.fn().mockResolvedValue({
    ok,
    status,
    json: vi.fn().mockResolvedValue(payload),
  });
}

function mockFetchRejectJson(ok: boolean, status: number) {
  (globalThis.fetch as any) = vi.fn().mockResolvedValue({
    ok,
    status,
    json: vi.fn().mockRejectedValue(new Error("invalid json")),
  });
}

describe("utils/kavita-news/posts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("listNewsPosts", () => {
    it("lista posts com paginação (limit/offset) e meta.total", async () => {
      mockFetchOnce({
        ok: true,
        data: [{ id: 1, title: "A" }],
        meta: { total: 11 },
      });

      const res = await listNewsPosts({ page: 2, pageSize: 10 });

      expect(res.items).toHaveLength(1);
      expect(res.page).toBe(2);
      expect(res.pageSize).toBe(10);
      expect(res.total).toBe(11);
      expect(res.totalPages).toBe(2);

      const calledUrl = (globalThis.fetch as any).mock.calls[0][0] as string;
      expect(calledUrl).toContain("/api/admin/news/posts?");
      expect(calledUrl).toContain("limit=10");
      expect(calledUrl).toContain("offset=10"); // page 2 => offset 10
    });

    it("normaliza status: 'all' não envia status", async () => {
      mockFetchOnce({ ok: true, data: [], meta: { total: 0 } });

      await listNewsPosts({ status: "all" as any });

      const calledUrl = (globalThis.fetch as any).mock.calls[0][0] as string;
      expect(calledUrl).not.toContain("status=");
    });

    it("mapeia q -> search", async () => {
      mockFetchOnce({ ok: true, data: [], meta: { total: 0 } });

      await listNewsPosts({ q: "soja" });

      const calledUrl = (globalThis.fetch as any).mock.calls[0][0] as string;
      expect(calledUrl).toContain("search=soja");
      expect(calledUrl).not.toContain("q=");
    });

    it("retorna items vazio quando body.data não é array", async () => {
      mockFetchOnce({ ok: true, data: null, meta: { total: 3 } });

      const res = await listNewsPosts({ page: 1, pageSize: 10 });
      expect(res.items).toEqual([]);
      expect(res.total).toBe(3);
      expect(res.totalPages).toBe(1);
    });

    it("lança erro com message/mensagem quando res.ok = false", async () => {
      mockFetchOnce({ message: "Credenciais inválidas" }, { ok: false, status: 401 });

      await expect(listNewsPosts()).rejects.toThrow("Credenciais inválidas");
    });

    it("quando json falha, usa fallback HTTP status", async () => {
      mockFetchRejectJson(false, 500);
      await expect(listNewsPosts()).rejects.toThrow("HTTP 500");
    });
  });

  describe("getNewsPost", () => {
    it("retorna post pelo id usando listNewsPosts", async () => {
      mockFetchOnce({
        ok: true,
        data: [{ id: 7, title: "Post 7" }, { id: 9, title: "Post 9" }],
        meta: { total: 2 },
      });

      const post = await getNewsPost(9);
      expect((post as any).id).toBe(9);

      const calledUrl = (globalThis.fetch as any).mock.calls[0][0] as string;
      expect(calledUrl).toContain("limit=200");
      expect(calledUrl).toContain("offset=0");
    });

    it("lança erro quando não encontra", async () => {
      mockFetchOnce({ ok: true, data: [{ id: 1 }], meta: { total: 1 } });
      await expect(getNewsPost(999)).rejects.toThrow("Post não encontrado.");
    });
  });

  describe("createNewsPost", () => {
    it("envia payload normalizado (cover_url -> cover_image_url) e retorna body.data", async () => {
      mockFetchOnce({
        ok: true,
        data: { id: 1, title: "Novo" },
      });

      const out = await createNewsPost({
        title: "Novo",
        content: "Conteúdo",
        cover_url: "http://img/test.jpg",
        status: "draft",
      } as any);

      expect((out as any).id).toBe(1);

      const [url, init] = (globalThis.fetch as any).mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/api/admin/news/posts");
      expect(init.method).toBe("POST");
      expect(init.credentials).toBe("include");

      const sent = JSON.parse(String(init.body));
      expect(sent.cover_image_url).toBe("http://img/test.jpg");
      expect(sent.cover_url).toBeUndefined();
      expect(sent.title).toBe("Novo");
      expect(sent.content).toBe("Conteúdo");
    });

    it("lança erro quando res.ok=false e body tem mensagem", async () => {
      mockFetchOnce({ mensagem: "Falha ao criar" }, { ok: false, status: 400 });
      await expect(createNewsPost({ title: "X" } as any)).rejects.toThrow("Falha ao criar");
    });

    it("quando body NÃO vem no formato { ok, data }, retorna o body direto", async () => {
      // cobre branch tipo: return body?.data ?? body
      mockFetchOnce({ id: 99, title: "Sem envelope ok/data" }, { ok: true, status: 200 });

      const out = await createNewsPost({ title: "X", content: "Y" } as any);
      expect((out as any).id).toBe(99);
    });
  });

  describe("updateNewsPost", () => {
    it("envia PUT e retorna body.data", async () => {
      mockFetchOnce({ ok: true, data: { id: 10, title: "Editado" } });

      const out = await updateNewsPost(
        10,
        { title: "Editado", cover_image_url: "http://img/a.png" } as any
      );

      expect((out as any).id).toBe(10);

      const [url, init] = (globalThis.fetch as any).mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/api/admin/news/posts/10");
      expect(init.method).toBe("PUT");

      const sent = JSON.parse(String(init.body));
      expect(sent.cover_image_url).toBe("http://img/a.png");
    });

    it("quando res.ok=false lança erro com message/mensagem", async () => {
      mockFetchOnce({ message: "Falha ao atualizar" }, { ok: false, status: 400 });
      await expect(updateNewsPost(10, { title: "Edit" } as any)).rejects.toThrow(
        "Falha ao atualizar"
      );
    });

    it("quando body NÃO vem no formato { ok, data }, retorna o body direto", async () => {
      mockFetchOnce({ id: 10, title: "Retorno direto" }, { ok: true, status: 200 });

      const out = await updateNewsPost(10, { title: "Edit" } as any);
      expect((out as any).title).toBe("Retorno direto");
    });
  });

  describe("deleteNewsPost", () => {
    it("faz DELETE sem erro quando ok", async () => {
      mockFetchOnce({ ok: true });

      await expect(deleteNewsPost(33)).resolves.toBeUndefined();

      const [url, init] = (globalThis.fetch as any).mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/api/admin/news/posts/33");
      expect(init.method).toBe("DELETE");
      expect(init.credentials).toBe("include");
    });

    it("lança erro quando res.ok=false", async () => {
      mockFetchOnce({ error: "Não permitido" }, { ok: false, status: 403 });
      await expect(deleteNewsPost(33)).rejects.toThrow("Não permitido");
    });

    it("quando json falha no delete, usa fallback HTTP status", async () => {
      mockFetchRejectJson(false, 500);
      await expect(deleteNewsPost(33)).rejects.toThrow("HTTP 500");
    });
  });

  describe("uploadNewsCover", () => {
    it("faz upload via FormData e retorna url/filename", async () => {
      mockFetchOnce({
        ok: true,
        data: { url: "http://localhost:5000/uploads/a.png", filename: "a.png" },
      });

      const file = new File(["x"], "a.png", { type: "image/png" });
      const out = await uploadNewsCover(file);

      expect(out.url).toBe("http://localhost:5000/uploads/a.png");
      expect(out.filename).toBe("a.png");

      const [url, init] = (globalThis.fetch as any).mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/api/admin/news/upload/cover");
      expect(init.method).toBe("POST");
      expect(init.credentials).toBe("include");
      expect(init.body).toBeInstanceOf(FormData);
    });

    it("lança erro se res.ok=false ou body.ok=false", async () => {
      // aqui o fetch ok=true mas o body ok=false
      mockFetchOnce({ ok: false, message: "Falha no upload" }, { ok: true, status: 200 });

      const file = new File(["x"], "a.png", { type: "image/png" });
      await expect(uploadNewsCover(file)).rejects.toThrow("Falha no upload");
    });

    it("quando json falha no upload, usa fallback HTTP status", async () => {
      mockFetchRejectJson(false, 500);

      const file = new File(["x"], "a.png", { type: "image/png" });
      await expect(uploadNewsCover(file)).rejects.toThrow("HTTP 500");
    });
  });
});
