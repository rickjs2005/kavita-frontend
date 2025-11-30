// src/types/service.ts
export type Service = {
  id: number;
  nome: string;
  descricao?: string | null;
  cargo?: string | null;
  imagem?: string | null;            // capa vinda do backend (string ou null)
  images?: string[] | null;          // imagens extras (opcional)
  whatsapp?: string | null;
  especialidade_nome?: string | null;
  especialidade_id?: number | string | null;
  verificado?: number | boolean;
};
