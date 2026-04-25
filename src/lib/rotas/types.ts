// Types do modulo Rotas de Entrega (Fase 1 backend marketplace).
// Espelham o shape devolvido pelos endpoints — ver kavita-backend
// repositories/rotas*.js + services/rotasService.js.

export type RotaStatus =
  | "rascunho"
  | "pronta"
  | "em_rota"
  | "finalizada"
  | "cancelada";

export type ParadaStatus =
  | "pendente"
  | "em_andamento"
  | "entregue"
  | "problema"
  | "reagendado";

export type ProblemaTipo =
  | "endereco_incorreto"
  | "cliente_ausente"
  | "estrada_intransitavel"
  | "pagamento_pendente_na_entrega"
  | "produto_avariado"
  | "outro_motivo";

export interface Motorista {
  id: number;
  nome: string;
  telefone: string;
  email: string | null;
  veiculo_padrao: string | null;
  ativo: 0 | 1;
  ultimo_login_em: string | null;
  token_version: number;
  created_at: string;
  updated_at: string;
}

export interface RotaResumo {
  id: number;
  data_programada: string;
  motorista_id: number | null;
  motorista_nome: string | null;
  veiculo: string | null;
  regiao_label: string | null;
  status: RotaStatus;
  total_paradas: number;
  total_entregues: number;
  iniciada_em: string | null;
  finalizada_em: string | null;
  tempo_total_minutos: number | null;
  km_estimado: string | null;
  km_real: string | null;
  created_at: string;
}

export interface PedidoEnderecoJson {
  cep?: string;
  rua?: string;
  numero?: string | number;
  bairro?: string;
  cidade?: string;
  estado?: string;
  complemento?: string | null;
  ponto_referencia?: string | null;
}

export interface ItemPedido {
  produto_id: number;
  quantidade: number;
  valor_unitario: string | number;
  subtotal: string | number;
  produto_nome: string;
}

export interface ParadaCompleta {
  id: number;
  rota_id: number;
  pedido_id: number;
  ordem: number;
  status: ParadaStatus;
  entregue_em: string | null;
  observacao_motorista: string | null;
  ocorrencia_id: number | null;
  created_at: string;
  updated_at: string;
  pedido_endereco: string | null; // JSON serializado
  pedido_tipo_endereco: "urbano" | "rural" | null;
  pedido_lat: string | null;
  pedido_lng: string | null;
  pedido_observacao_entrega: string | null;
  pedido_total: string | null;
  usuario_id: number | null;
  usuario_nome: string | null;
  usuario_email: string | null;
  usuario_telefone: string | null;
  itens?: ItemPedido[];
}

export interface RotaCompleta extends RotaResumo {
  motorista_telefone: string | null;
  observacoes: string | null;
  paradas: ParadaCompleta[];
}

export interface PedidoDisponivel {
  id: number;
  usuario_id: number | null;
  endereco: string | null;
  tipo_endereco: "urbano" | "rural" | null;
  endereco_latitude: string | null;
  endereco_longitude: string | null;
  observacao_entrega: string | null;
  total: string;
  shipping_price: string;
  data_pedido: string;
  usuario_nome: string | null;
  usuario_telefone: string | null;
  em_rota_ativa: number;
}

export interface MagicLinkResult {
  link: string | null;
  telefone: string;
  whatsapp: { status: string; url: string | null; erro: string | null };
  sent: boolean;
}

/** Helper: parseia o JSON do endereco do pedido com fallback seguro. */
export function parseEnderecoPedido(
  raw: string | null | undefined,
): PedidoEnderecoJson | null {
  if (!raw) return null;
  if (typeof raw === "object") return raw as PedidoEnderecoJson;
  try {
    return JSON.parse(raw) as PedidoEnderecoJson;
  } catch {
    return null;
  }
}

/** Formata endereco em uma linha humana. */
export function formatEnderecoOneLine(
  endereco: PedidoEnderecoJson | null,
): string {
  if (!endereco) return "Endereço não informado";
  const parts: string[] = [];
  if (endereco.rua) {
    parts.push(`${endereco.rua}${endereco.numero ? `, ${endereco.numero}` : ""}`);
  }
  if (endereco.bairro) parts.push(endereco.bairro);
  if (endereco.cidade) {
    parts.push(`${endereco.cidade}${endereco.estado ? `-${endereco.estado}` : ""}`);
  }
  return parts.length ? parts.join(", ") : "Endereço não informado";
}
