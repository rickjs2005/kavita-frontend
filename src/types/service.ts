// src/types/service.ts
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
