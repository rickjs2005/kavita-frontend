// src/__tests__/utils/useUpload.test.tsx
//
// Risco: upload de arquivo é um dos poucos pontos onde o frontend monta um
// FormData e envia via apiClient (com CSRF automático). Falhas aqui impactam
// upload de imagens de produtos, logos e outros ativos críticos do admin.
//
// O que está sendo coberto:
//   - Estado inicial: uploading=false, error=null
//   - uploading=true durante o envio; false após completar (sucesso ou erro)
//   - Retorno correto do UploadResponse validado pelo schema
//   - Envio do FormData com fieldName padrão ("images") e customizado
//   - Opção skipContentType: true enviada ao apiClient (para o browser definir boundary)
//   - error setado quando apiClient lança (rede, 422, 500...)
//   - SchemaError quando resposta não tem "url" nem "path"
//   - Limpeza de error anterior antes de novo upload
//   - reset() limpa error e uploading

import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUpload } from "@/utils/useUpload";

// ---- Mock apiClient --------------------------------------------------------

const mockPost = vi.fn();

vi.mock("@/lib/apiClient", () => ({
  default: {
    post: (...args: unknown[]) => mockPost(...args),
  },
}));

// ---- Helpers ---------------------------------------------------------------

const VALID_RESPONSE = { url: "/uploads/produtos/img.jpg", path: "/uploads/produtos/img.jpg" };

function makeFile(name = "foto.jpg", type = "image/jpeg"): File {
  return new File(["content"], name, { type });
}

// ---- Tests -----------------------------------------------------------------

describe("useUpload", () => {
  describe("estado inicial", () => {
    it("uploading=false e error=null antes de qualquer operação", () => {
      const { result } = renderHook(() => useUpload());
      expect(result.current.uploading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("upload com sucesso", () => {
    it("retorna o UploadResponse validado pelo schema", async () => {
      mockPost.mockResolvedValueOnce(VALID_RESPONSE);
      const { result } = renderHook(() => useUpload());

      let response!: Awaited<ReturnType<typeof result.current.upload>>;
      await act(async () => {
        response = await result.current.upload(makeFile(), "/api/admin/produtos/upload");
      });

      expect(response).toEqual(VALID_RESPONSE);
      expect(result.current.error).toBeNull();
    });

    it("uploading=true durante o envio e false após sucesso", async () => {
      let resolvePost!: (v: unknown) => void;
      const pending = new Promise((res) => {
        resolvePost = res;
      });
      mockPost.mockReturnValueOnce(pending);

      const { result } = renderHook(() => useUpload());

      // Inicia o upload sem await — fica pendente
      let uploadPromise!: Promise<unknown>;
      act(() => {
        uploadPromise = result.current.upload(makeFile(), "/api/admin/upload");
      });

      expect(result.current.uploading).toBe(true);

      // Resolve e aguarda
      await act(async () => {
        resolvePost(VALID_RESPONSE);
        await uploadPromise;
      });

      expect(result.current.uploading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("usa fieldName padrão 'images' no FormData", async () => {
      mockPost.mockResolvedValueOnce(VALID_RESPONSE);
      const { result } = renderHook(() => useUpload());
      const file = makeFile();

      await act(async () => {
        await result.current.upload(file, "/api/admin/produtos/upload");
      });

      const [, formData, options] = mockPost.mock.calls[0];
      expect(formData).toBeInstanceOf(FormData);
      expect((formData as FormData).get("images")).toBe(file);
      expect(options).toMatchObject({ skipContentType: true });
    });

    it("aceita fieldName customizado", async () => {
      mockPost.mockResolvedValueOnce({ url: "/uploads/logos/logo.png" });
      const { result } = renderHook(() => useUpload());
      const file = makeFile("logo.png", "image/png");

      await act(async () => {
        await result.current.upload(file, "/api/admin/configuracoes/logo", "logo");
      });

      const [, formData] = mockPost.mock.calls[0];
      expect((formData as FormData).get("logo")).toBe(file);
      expect((formData as FormData).get("images")).toBeNull();
    });

    it("envia para o endpoint correto", async () => {
      mockPost.mockResolvedValueOnce(VALID_RESPONSE);
      const { result } = renderHook(() => useUpload());

      await act(async () => {
        await result.current.upload(makeFile(), "/api/admin/servicos/upload");
      });

      expect(mockPost.mock.calls[0][0]).toBe("/api/admin/servicos/upload");
    });
  });

  describe("erro de upload", () => {
    it("define error com a mensagem do erro e re-lança", async () => {
      mockPost.mockRejectedValueOnce(new Error("Network error"));
      const { result } = renderHook(() => useUpload());

      await act(async () => {
        await expect(
          result.current.upload(makeFile(), "/api/admin/upload"),
        ).rejects.toThrow("Network error");
      });

      expect(result.current.error).toBe("Network error");
      expect(result.current.uploading).toBe(false);
    });

    it("uploading=false mesmo quando o upload falha (finally garante)", async () => {
      mockPost.mockRejectedValueOnce(new Error("Timeout"));
      const { result } = renderHook(() => useUpload());

      await act(async () => {
        await expect(result.current.upload(makeFile(), "/api/x")).rejects.toThrow();
      });

      expect(result.current.uploading).toBe(false);
    });

    it("define error e re-lança SchemaError quando resposta não tem 'url' nem 'path'", async () => {
      // UploadResponseSchema exige ao menos url ou path — resposta inválida
      mockPost.mockResolvedValueOnce({ filename: "foo.jpg" });
      const { result } = renderHook(() => useUpload());

      await act(async () => {
        await expect(
          result.current.upload(makeFile(), "/api/admin/upload"),
        ).rejects.toThrow();
      });

      // O erro setado deve vir da mensagem do SchemaError
      expect(result.current.error).toMatch(/schema/i);
      expect(result.current.uploading).toBe(false);
    });

    it("usa mensagem fallback quando o erro não é uma instância de Error", async () => {
      // Simulação improvável mas defensiva: throw de string pura
      mockPost.mockRejectedValueOnce("string error");
      const { result } = renderHook(() => useUpload());

      await act(async () => {
        await expect(result.current.upload(makeFile(), "/api/x")).rejects.toThrow();
      });

      expect(result.current.error).toBe("Falha ao enviar arquivo.");
    });
  });

  describe("limpeza de estado entre uploads", () => {
    it("limpa o error anterior antes de novo upload bem-sucedido", async () => {
      // Primeiro upload falha
      mockPost.mockRejectedValueOnce(new Error("primeiro erro"));
      const { result } = renderHook(() => useUpload());

      await act(async () => {
        await expect(result.current.upload(makeFile(), "/api/x")).rejects.toThrow();
      });
      expect(result.current.error).toBe("primeiro erro");

      // Segundo upload tem sucesso
      mockPost.mockResolvedValueOnce(VALID_RESPONSE);
      await act(async () => {
        await result.current.upload(makeFile(), "/api/x");
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("reset()", () => {
    it("limpa error após falha", async () => {
      mockPost.mockRejectedValueOnce(new Error("erro qualquer"));
      const { result } = renderHook(() => useUpload());

      await act(async () => {
        await expect(result.current.upload(makeFile(), "/api/x")).rejects.toThrow();
      });
      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBeNull();
    });

    it("uploading permanece false após reset (nunca seta true em reset)", () => {
      const { result } = renderHook(() => useUpload());

      act(() => {
        result.current.reset();
      });

      expect(result.current.uploading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
