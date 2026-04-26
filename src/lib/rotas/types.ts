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
  motorista_telefone: string | null;
  veiculo: string | null;
  regiao_label: string | null;
  status: RotaStatus;
  total_paradas: number;
  total_entregues: number;
  /** Paradas em status 'pendente' ou 'em_andamento'. */
  paradas_pendentes: number;
  /** Redundante com total_entregues, mantido pra consistencia visual. */
  paradas_entregues: number;
  /** Paradas em status 'problema' (motorista reportou ocorrencia). */
  paradas_problema: number;
  iniciada_em: string | null;
  finalizada_em: string | null;
  tempo_total_minutos: number | null;
  km_estimado: string | null;
  km_real: string | null;
  created_at: string;
  updated_at: string;
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
  comprovante_foto_url: string | null;
  assinatura_url: string | null;
  created_at: string;
  updated_at: string;
  pedido_endereco: string | null; // JSON serializado
  pedido_tipo_endereco: "urbano" | "rural" | null;
  pedido_lat: string | null;
  pedido_lng: string | null;
  pedido_observacao_entrega: string | null;
  pedido_total: string | null;
  pedido_forma_pagamento: string | null;
  pedido_criado_em: string | null;
  usuario_id: number | null;
  usuario_nome: string | null;
  usuario_email: string | null;
  usuario_telefone: string | null;
  /** Tipo da ocorrencia (quando parada.status='problema'). */
  ocorrencia_tipo: ProblemaTipo | null;
  ocorrencia_motivo: string | null;
  ocorrencia_observacao: string | null;
  ocorrencia_criado_em: string | null;
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
  forma_pagamento: string | null;
  status_entrega: string | null;
  usuario_nome: string | null;
  usuario_telefone: string | null;
  em_rota_ativa: number;
  /** Pedido ja teve ocorrencia(s) registrada(s) — alerta historico. */
  ocorrencias_anteriores: number;
}

export interface MagicLinkResult {
  link: string | null;
  telefone: string;
  whatsapp: { status: string; url: string | null; erro: string | null };
  sent: boolean;
}

/** Fase 4 — payload do GET /admin/rotas/stale. */
export interface StaleRotaItem {
  id: number;
  data_programada: string;
  motorista_id: number | null;
  motorista_nome: string | null;
  motorista_telefone: string | null;
  iniciada_em: string | null;
  total_paradas: number;
  total_entregues: number;
  ultima_atualizacao: string;
  horas_paradas: number;
}

export interface StaleRotaResult {
  items: StaleRotaItem[];
  threshold_hours: number;
  count: number;
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

/** Diferenca em horas entre `iso` e agora. Negativa = no passado. */
export function hoursAgo(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return (Date.now() - t) / 36e5;
}

/** "2h", "3 dias", "agora". Para timestamps no passado. */
export function timeAgoShort(iso: string | null | undefined): string {
  const h = hoursAgo(iso);
  if (h == null) return "—";
  if (h < 1) return "agora";
  if (h < 24) return `${Math.round(h)}h`;
  const days = Math.round(h / 24);
  return `${days} ${days === 1 ? "dia" : "dias"}`;
}

/** Lista de alertas operacionais derivados do estado atual da rota. */
export interface RotaAlerta {
  level: "warn" | "danger" | "info";
  label: string;
}

export function calcRotaAlertas(r: RotaResumo): RotaAlerta[] {
  const alertas: RotaAlerta[] = [];
  if (r.status === "rascunho" && !r.motorista_id) {
    alertas.push({ level: "warn", label: "Sem motorista" });
  }
  if (r.status === "pronta") {
    const horas = hoursAgo(r.updated_at) ?? 0;
    if (horas > 6) {
      alertas.push({
        level: "warn",
        label: `Pronta há ${Math.round(horas)}h sem iniciar`,
      });
    }
  }
  if (r.status === "em_rota") {
    const horas = hoursAgo(r.iniciada_em) ?? 0;
    if (horas > 6) {
      alertas.push({
        level: "danger",
        label: `Em rota há ${Math.round(horas)}h`,
      });
    }
  }
  if (r.paradas_problema > 0) {
    alertas.push({
      level: "danger",
      label: `${r.paradas_problema} ${r.paradas_problema === 1 ? "parada com problema" : "paradas com problema"}`,
    });
  }
  if (r.status === "finalizada" && r.paradas_problema > 0) {
    // Reforco visual quando finaliza com pendencias
    alertas.push({ level: "warn", label: "Finalizada com problemas" });
  }
  if (
    (r.status === "rascunho" || r.status === "pronta") &&
    r.total_paradas === 0
  ) {
    alertas.push({ level: "warn", label: "Sem paradas" });
  }
  return alertas;
}

/** Pinta `R$ 0,00` a partir de string/number. Tolera null/undefined. */
export function formatBRL(v: string | number | null | undefined): string {
  if (v == null || v === "") return "—";
  const n = typeof v === "string" ? Number(v) : v;
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** Constroi um link wa.me a partir de um telefone BR (com ou sem mask). */
export function buildWaMeLink(telefone: string | null | undefined): string | null {
  if (!telefone) return null;
  const digits = String(telefone).replace(/\D/g, "");
  if (digits.length < 10) return null;
  // Garante o 55 do BR
  const withCountry = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountry}`;
}
