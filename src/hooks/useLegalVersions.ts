"use client";

// src/hooks/useLegalVersions.ts
//
// Lê GET /api/public/legal/versions e devolve as versões correntes de
// Termos e Privacidade. Usado nos forms para popular hidden fields
// `terms_version` e `privacy_version` enviados ao backend, garantindo
// que o titular aceitou EXATAMENTE a versão que o servidor está
// cobrando (mesmo se a aba ficou aberta durante um deploy que mudou
// os termos).
//
// Comportamento defensivo:
//   - Se o fetch falha, retorna null. Forms NÃO bloqueiam o submit —
//     o backend tem default próprio em lib/legal/versions.js e usa o
//     default quando os hidden fields vêm vazios.
//   - Cache em memória (singleton): segunda chamada na mesma sessão
//     não re-fetcha — versões são estáveis enquanto o app não recarrega.

import { useEffect, useState } from "react";
import apiClient from "@/lib/apiClient";

export type LegalVersions = {
  terms: { version: string; url: string };
  privacy: { version: string; url: string };
};

let _cache: LegalVersions | null = null;
let _inflight: Promise<LegalVersions | null> | null = null;

async function fetchOnce(): Promise<LegalVersions | null> {
  if (_cache) return _cache;
  if (_inflight) return _inflight;

  _inflight = apiClient
    .get<LegalVersions>("/api/public/legal/versions")
    .then((data) => {
      _cache = data;
      return data;
    })
    .catch(() => null)
    .finally(() => {
      _inflight = null;
    });

  return _inflight;
}

export function useLegalVersions(): LegalVersions | null {
  const [versions, setVersions] = useState<LegalVersions | null>(_cache);

  useEffect(() => {
    let active = true;
    fetchOnce().then((v) => {
      if (active && v) setVersions(v);
    });
    return () => {
      active = false;
    };
  }, []);

  return versions;
}
