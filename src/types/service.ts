export interface Service {
  id: number;
  nome: string;
  cargo: string;
  whatsapp: string;
  imagem: string;
  descricao: string;
  especialidade_id: number;
  especialidade_nome?: string;
}
