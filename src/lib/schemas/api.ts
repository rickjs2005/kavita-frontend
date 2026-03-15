// src/lib/schemas/api.ts
// Schemas Zod para validação runtime das responses críticas da API.
// Todos os contextos e hooks que populam state devem validar via estes schemas.
//
// REGRA: nunca poluir state com dados que não passaram .safeParse().
// Se safeParse falhar → lançar SchemaError (ou retornar null para sessão ausente).

import { z } from "zod";

// ---------------------------------------------------------------------------
// Helpers reutilizáveis
// ---------------------------------------------------------------------------

/** ID numérico inteiro positivo. Nunca aceita 0, null sem tratamento explícito, ou string. */
export const positiveInt = z.number().int().positive();

/** Preço: número finito, >= 0. Nunca aceita string diretamente (coerção deve ser feita antes). */
export const nonNegativeNumber = z.number().finite().min(0);

/** Preço positivo: número finito > 0. Rejeita 0 (produto gratuito deve ser explícito). */
export const positiveNumber = z.number().finite().positive();

// ---------------------------------------------------------------------------
// Erro padrão da API
// ---------------------------------------------------------------------------

export const ApiErrorBodySchema = z.object({
  message: z.string().optional(),
  mensagem: z.string().optional(), // compat backend PT
  code: z.string().optional(),
  details: z.unknown().optional(),
  requestId: z.string().optional(),
  request_id: z.string().optional(), // compat
});
export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>;

// ---------------------------------------------------------------------------
// Auth — usuário da loja
// ---------------------------------------------------------------------------

/**
 * Shape mínimo garantido do /api/login e /api/users/me.
 * Campos obrigatórios: id (inteiro positivo), nome (não vazio), email (email válido).
 * Token NUNCA deve estar no payload de resposta do front; se vier, é ignorado.
 */
export const AuthUserSchema = z.object({
  id: positiveInt,
  nome: z.string().min(1),
  email: z.string().email(),
});
export type AuthUserData = z.infer<typeof AuthUserSchema>;

/**
 * Envelope do /api/login: pode vir como { user: {...} } ou direto como { id, nome, email }.
 * O contexto extrai o objeto correto antes de validar.
 */
export const LoginResponseSchema = z
  .object({
    user: AuthUserSchema.optional(),
    id: positiveInt.optional(),
    nome: z.string().min(1).optional(),
    email: z.string().email().optional(),
  })
  .refine(
    (d) => {
      // precisa ter ou { user.id } ou { id } no topo
      const hasUser = d.user?.id !== undefined;
      const hasTopLevel = d.id !== undefined;
      return hasUser || hasTopLevel;
    },
    { message: "Login response não contém dados de usuário válidos" },
  );

/** Extrai AuthUserData do envelope de login. Lança se shape inválido. */
export function extractAuthUser(raw: unknown): AuthUserData {
  const envelope = LoginResponseSchema.parse(raw);
  const candidate = envelope.user ?? {
    id: envelope.id!,
    nome: envelope.nome!,
    email: envelope.email!,
  };
  return AuthUserSchema.parse(candidate);
}

// ---------------------------------------------------------------------------
// Auth — administrador
// ---------------------------------------------------------------------------

export const AdminRoleSchema = z.enum(["master", "gerente", "suporte", "leitura"]).or(z.string().min(1));

export const AdminUserSchema = z.object({
  id: positiveInt,
  nome: z.string().min(1),
  email: z.string().email(),
  role: AdminRoleSchema,
  role_id: z.number().int().nullable(),
  permissions: z.array(z.string()).default([]),
});
export type AdminUserData = z.infer<typeof AdminUserSchema>;

// ---------------------------------------------------------------------------
// Carrinho
// ---------------------------------------------------------------------------

/**
 * Item vindo do GET /api/cart.
 * valor_unitario deve ser número positivo (preço real do produto).
 * Rejeitamos silenciosamente item com preço inválido (ver normalizeApiItems).
 *
 * Usamos z.coerce para campos numéricos pois backends frequentemente serializam
 * números como strings ("12.5"). A coerção converte, e as validações downstream
 * (.positive(), .min(0)) ainda rejeitam valores inválidos como "abc" (vira NaN → falha).
 */
export const CartApiItemSchema = z.object({
  item_id: z.coerce.number().int().positive().optional(),
  produto_id: z.coerce.number().int().positive(),
  nome: z.string().optional(),
  valor_unitario: z.coerce.number().finite().positive(), // CRÍTICO: rejeitamos 0 e inválidos
  quantidade: z.coerce.number().int().positive().default(1),
  image: z.string().nullable().optional(),
  stock: z.coerce.number().int().min(0).optional(),
});
export type CartApiItem = z.infer<typeof CartApiItemSchema>;

export const CartGetResponseSchema = z.object({
  success: z.boolean().optional(),
  items: z.array(z.unknown()).optional().default([]),
  carrinho_id: z.number().int().nullable().optional(),
});
export type CartGetResponse = z.infer<typeof CartGetResponseSchema>;

// ---------------------------------------------------------------------------
// Checkout
// ---------------------------------------------------------------------------

export const CheckoutResponseSchema = z.object({
  pedido_id: positiveInt,
  nota_fiscal_aviso: z.string().optional(),
});
export type CheckoutResponse = z.infer<typeof CheckoutResponseSchema>;

export const PaymentResponseSchema = z.object({
  init_point: z.string().url().optional(),
  sandbox_init_point: z.string().url().optional(),
});
export type PaymentResponse = z.infer<typeof PaymentResponseSchema>;

export const CouponPreviewSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  desconto: z.number().min(0).optional(),
  total_original: z.number().positive().optional(),
  total_com_desconto: z.number().min(0).optional(),
  cupom: z
    .object({
      id: positiveInt,
      codigo: z.string().min(1),
      tipo: z.string().min(1),
      valor: z.number().positive(),
    })
    .optional(),
});
export type CouponPreview = z.infer<typeof CouponPreviewSchema>;

// ---------------------------------------------------------------------------
// Produto público
// ---------------------------------------------------------------------------

export const PublicProductSchema = z.object({
  id: positiveInt,
  nome: z.string().min(1),
  preco: z.number().finite().positive().optional(),
  price: z.number().finite().positive().optional(),
  image: z.string().nullable().optional(),
  images: z.array(z.string()).optional().default([]),
  estoque: z.number().int().min(0).optional(),
  stock: z.number().int().min(0).optional(),
});
export type PublicProduct = z.infer<typeof PublicProductSchema>;

// ---------------------------------------------------------------------------
// Pedido
// ---------------------------------------------------------------------------

export const OrderSchema = z.object({
  id: positiveInt,
  status: z.string().min(1),
  total: z.number().finite().min(0),
  created_at: z.string().optional(),
  itens: z
    .array(
      z.object({
        produto_id: positiveInt,
        nome: z.string().optional(),
        quantidade: z.number().int().positive(),
        preco_unitario: z.number().finite().positive(),
      }),
    )
    .optional()
    .default([]),
});
export type Order = z.infer<typeof OrderSchema>;

// ---------------------------------------------------------------------------
// Upload
// ---------------------------------------------------------------------------

export const UploadResponseSchema = z.object({
  url: z.string().min(1).optional(),
  path: z.string().min(1).optional(),
  filename: z.string().min(1).optional(),
}).refine(
  (d) => d.url != null || d.path != null,
  { message: "Upload response deve conter ao menos 'url' ou 'path'" },
);
export type UploadResponse = z.infer<typeof UploadResponseSchema>;

// ---------------------------------------------------------------------------
// Frete (shipping quote)
// ---------------------------------------------------------------------------

/**
 * Resposta do GET /api/shipping/quote.
 * price deve ser um número finito >= 0 (frete grátis = 0 é válido).
 * Usamos z.coerce para tolerar serialização de número como string pelo backend.
 */
export const ShippingQuoteSchema = z.object({
  price: z.coerce.number().finite().min(0),
  prazo_dias: z.coerce.number().int().min(0).nullable().optional(),
  is_free: z.boolean().optional().default(false),
  ruleApplied: z
    .enum(["PRODUCT_FREE", "ZONE", "CEP_RANGE", "PICKUP"])
    .optional(),
  cep: z.string().optional(),
  // zone e freeItems são opcionais e estruturalmente variáveis — aceitamos como unknown
  zone: z.unknown().optional(),
  freeItems: z.array(z.object({ id: positiveInt, quantidade: z.number().int().positive() })).optional(),
});
export type ShippingQuote = z.infer<typeof ShippingQuoteSchema>;

// ---------------------------------------------------------------------------
// SchemaError — erro de contrato
// ---------------------------------------------------------------------------

/**
 * Lançado quando uma response da API não corresponde ao schema esperado.
 * Distinto de ApiError (HTTP error) e Error (rede/runtime).
 *
 * Tipo de erro: "contract" — indica que o backend retornou shape inesperado.
 * Não mostra detalhes internos do Zod para o usuário final.
 */
export class SchemaError extends Error {
  readonly type = "contract" as const;
  readonly issues: z.ZodIssue[];
  readonly raw: unknown;

  constructor(issues: z.ZodIssue[], raw: unknown, context = "response") {
    super(`Schema inválido em ${context}`);
    this.name = "SchemaError";
    this.issues = issues;
    this.raw = raw;
  }
}

export function isSchemaError(err: unknown): err is SchemaError {
  return (
    typeof err === "object" &&
    err !== null &&
    (err as any).name === "SchemaError"
  );
}

/**
 * Parse seguro: retorna dados validados ou lança SchemaError.
 * Use em contextos onde dado inválido deve bloquear a operação.
 */
export function strictParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context?: string,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new SchemaError(result.error.issues, data, context);
  }
  return result.data;
}

/**
 * Parse tolerante: retorna dados validados ou null (sem lançar).
 * Use quando dado inválido deve ser ignorado (ex: item de lista mal-formado).
 */
export function safeParseSilent<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): T | null {
  const result = schema.safeParse(data);
  return result.success ? result.data : null;
}
