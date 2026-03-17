// Canonical address types used across the entire application.
// Import from here rather than defining locally in hooks or pages.

// ---------------------------------------------------------------------------
// Locality / form
// ---------------------------------------------------------------------------

export type TipoLocalidade = "URBANA" | "RURAL";

/**
 * Canonical checkout/shipping address filled in via the address form.
 * Uses `logradouro` (street name) as the primary field.
 */
export type Endereco = {
  cep: string;
  estado: string;
  cidade: string;
  bairro: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  referencia?: string;
  tipo_localidade?: TipoLocalidade;
  comunidade?: string;
  observacoes_acesso?: string;
};

/**
 * Compact address snapshot embedded in admin order records.
 * Uses `rua` (legacy field name from the backend) and carries an open
 * index signature because the JSON blob may contain extra keys.
 */
export type OrderAddress = {
  nome?: string;
  cpf?: string;
  telefone?: string;
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  complemento?: string;
  [key: string]: unknown;
};

// ---------------------------------------------------------------------------
// ViaCEP API response
// ---------------------------------------------------------------------------

export type CepResult = {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string; // cidade
  uf: string; // estado (sigla)
  erro?: boolean;
};

// ---------------------------------------------------------------------------
// Stored user addresses
// ---------------------------------------------------------------------------

/** Address row as returned from GET /api/users/addresses */
export type UserAddress = {
  id: number;
  apelido: string | null;
  cep: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento: string | null;
  ponto_referencia: string | null;
  telefone: string | null;
  /** Backend stores as TINYINT(1); accept 0 | 1 | boolean */
  is_default: 0 | 1 | boolean;
};

/** Body sent to POST / PUT /api/users/addresses */
export type UserAddressPayload = {
  apelido?: string;
  cep: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento?: string;
  ponto_referencia?: string;
  telefone?: string;
  is_default?: boolean;
};

// ---------------------------------------------------------------------------
// Checkout — saved address selection
// ---------------------------------------------------------------------------

/** Address option shown in the checkout shipping step. */
export type SavedAddress = {
  id: number;
  apelido?: string | null;
  cep?: string | null;
  endereco?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  complemento?: string | null;
  ponto_referencia?: string | null;
  is_default?: number | 0 | 1;
  tipo_localidade?: "URBANA" | "RURAL" | string | null;
  comunidade?: string | null;
  observacoes_acesso?: string | null;
};
