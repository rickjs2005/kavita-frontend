// src/types/service.ts

// Tipo raw do backend (pode conter inconsistências — use NormalizedService nos componentes)
export type Service = {
  id: number;
  nome: string;
  descricao?: string | null;
  cargo?: string | null;
  imagem?: string | null;
  images?: string[] | null;
  whatsapp?: string | null;
  especialidade_nome?: string | null;
  especialidade_id?: number | string | null;
  verificado?: number | boolean;
};

/**
 * Serviço normalizado: todas as inconsistências do backend já resolvidas.
 * Use este tipo nos componentes — não há union types ambíguos, não há casting necessário.
 *
 * Produzido por `normalizeService()` em `src/services/services.ts`.
 */
export type NormalizedService = {
  id: number;
  nome: string;
  descricao: string;
  cargo: string | null;
  imagem: string | null;
  images: string[];           // sempre array (nunca null)
  whatsapp: string | null;
  especialidade_nome: string | null;
  especialidade_id: number | null;   // sempre number (era number | string | null)
  verificado: boolean;               // sempre boolean (era number | boolean)
};
