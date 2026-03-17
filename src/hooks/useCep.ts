/**
 * useCep — hook centralizado para consulta de CEP via ViaCEP.
 * Substitui as 4+ implementações duplicadas espalhadas no projeto.
 *
 * Uso:
 *   const { lookup, loading } = useCep();
 *   const result = await lookup("01310100");
 *   if (result) { setRua(result.logradouro); ... }
 */
import { useState } from "react";
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
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);

      if (!res.ok) {
        setError("Não foi possível consultar o CEP. Tente novamente.");
        return null;
      }

      const data: CepResult = await res.json();

      if (data.erro) {
        setError("CEP não encontrado.");
        return null;
      }

      return data;
    } catch {
      setError("Erro de conexão ao consultar CEP.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { lookup, loading, error };
}
