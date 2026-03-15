// src/utils/useUpload.ts
// Hook genérico de upload de arquivo para o painel admin.
//
// COMO USAR:
//   const { upload, uploading, error } = useUpload();
//   const result = await upload(file, "/api/admin/produtos", "images");
//
// O `endpoint` deve ser a rota exata do backend que aceita multipart/form-data.
// O `fieldName` deve corresponder ao campo esperado pelo backend (ex: "images", "logo", "cover").
//
// A resposta é validada contra UploadResponseSchema — se inválida, lança SchemaError.

import { useCallback, useState } from "react";
import apiClient from "@/lib/apiClient";
import { UploadResponseSchema, strictParse } from "@/lib/schemas/api";
import type { UploadResponse } from "@/lib/schemas/api";

export interface UseUploadReturn {
  upload: (file: File, endpoint: string, fieldName?: string) => Promise<UploadResponse>;
  uploading: boolean;
  error: string | null;
  reset: () => void;
}

export function useUpload(): UseUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setError(null);
    setUploading(false);
  }, []);

  const upload = useCallback(
    async (file: File, endpoint: string, fieldName = "images"): Promise<UploadResponse> => {
      setUploading(true);
      setError(null);

      try {
        const fd = new FormData();
        fd.append(fieldName, file);

        // apiClient.post garante:
        // - credentials: "include" para /api (cookies HttpOnly)
        // - CSRF token injetado automaticamente (POST)
        // - parse seguro e erro padronizado (ApiError)
        // skipContentType: true — não seta Content-Type manualmente para FormData
        // (o browser precisa definir boundary automaticamente)
        const raw = await apiClient.post<unknown>(endpoint, fd, {
          skipContentType: true,
        });

        // Valida a resposta — não aceita shape inesperado silenciosamente.
        // UploadResponseSchema exige ao menos "url" ou "path".
        const result = strictParse(UploadResponseSchema, raw, "upload response");
        return result;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Falha ao enviar arquivo.";
        setError(msg);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [],
  );

  return { upload, uploading, error, reset };
}
