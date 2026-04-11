/**
 * useCep — hook centralizado para consulta de CEP.
 *
 * Desde a revisão pós-CSP: a consulta ao ViaCEP passou a ser feita via
 * proxy do backend (GET /api/public/cep/:cep) em vez de fetch direto do
 * browser. Motivo: o CSP do painel /admin/* bloqueia connect-src externo,
 * então chamar viacep.com.br diretamente quebrava em produção no admin.
 * O backend fica como o único ponto autorizado a falar com o ViaCEP.
 *
 * A assinatura pública do hook (`lookup`, `loading`, `error`, retorno
 * `CepResult | null`) continua IDÊNTICA — nenhum consumidor precisa
 * ser atualizado (checkout, meus-dados/enderecos, admin/frete).
 *
 * Uso:
 *   const { lookup, loading } = useCep();
 *   const result = await lookup("01310100");
 *   if (result) { setRua(result.logradouro); ... }
 */
import { useState } from "react";
import apiClient from "@/lib/apiClient";
import { ApiError } from "@/lib/errors";
import type { CepResult } from "@/types/address";

export type { CepResult };

export function useCep() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup(cep: string): Promise<CepResult | null> {
    const digits = cep.replace(/\D/g, "");

    if (digits.length !== 8) {
      setError("CEP inválido. Informe 8 dígitos.");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Backend retorna o payload já no formato CepResult (sem o campo
      // `erro` — quando o ViaCEP retorna erro, o backend responde 404).
      const data = await apiClient.get<CepResult>(
        `/api/public/cep/${digits}`,
      );
      return data;
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setError("CEP não encontrado.");
          return null;
        }
        if (err.status === 400) {
          setError("CEP inválido. Informe 8 dígitos.");
          return null;
        }
        if (err.status === 503) {
          setError("Serviço de CEP indisponível. Tente novamente.");
          return null;
        }
      }
      setError("Erro de conexão ao consultar CEP.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { lookup, loading, error };
}
