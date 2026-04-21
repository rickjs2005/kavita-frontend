// src/lib/regioes.ts
//
// Catálogo nacional — cidades cafeeiras do Brasil no módulo Mercado
// do Café. Nasceu focado na Zona da Mata Mineira (praça piloto,
// Manhuaçu como cidade-bandeira) e está em expansão controlada para
// outras regiões produtoras (Sul de Minas, Cerrado, Mogiana, Caparaó,
// ES, Sul da Bahia). Usado para:
//
//   - CityChips (filtro por cidade na listagem)
//   - Rotas regionais (/mercado-do-cafe/[cidade])
//   - Validação de formulário qualificado de lead
//   - SEO (meta tags regionais)
//
// Fonte única da verdade: mudanças aqui refletem em toda a UI pública.
//
// Retrocompat: o export `CIDADES_ZONA_DA_MATA` foi mantido como alias
// @deprecated (aponta para `CIDADES`) para não quebrar imports
// existentes. Novos imports devem usar `CIDADES` + `getCidadesPorRegiao()`.

export type RegiaoCodigo =
  | "zona_mata_mg"
  | "matas_minas"
  | "sul_minas"
  | "cerrado_mg"
  | "mogiana_sp"
  | "caparao_mg_es"
  | "es_conilon"
  | "sul_bahia";

export type Regiao = {
  codigo: RegiaoCodigo;
  nome: string;
  estados: string[];
  descricao?: string;
};

export const REGIOES: Regiao[] = [
  {
    codigo: "zona_mata_mg",
    nome: "Zona da Mata",
    estados: ["MG"],
    descricao:
      "Praça piloto da Kavita. Arábica de bebida dura a mole, tradição de corretagem local.",
  },
  {
    codigo: "matas_minas",
    nome: "Matas de Minas",
    estados: ["MG"],
    descricao:
      "Denominação de Origem que engloba municípios da Zona da Mata com cafés de qualidade sensorial diferenciada.",
  },
  {
    codigo: "sul_minas",
    nome: "Sul de Minas",
    estados: ["MG"],
    descricao:
      "Maior bacia produtora de arábica do Brasil, com forte presença de cooperativas.",
  },
  {
    codigo: "cerrado_mg",
    nome: "Cerrado Mineiro",
    estados: ["MG"],
    descricao:
      "Denominação de Origem com arábica de altitude mecanizado, produção escalonada.",
  },
  {
    codigo: "mogiana_sp",
    nome: "Mogiana",
    estados: ["SP"],
    descricao:
      "Região tradicional no estado de São Paulo, café de altitude e terroir reconhecido.",
  },
  {
    codigo: "caparao_mg_es",
    nome: "Caparaó",
    estados: ["MG", "ES"],
    descricao:
      "Região serrana entre MG e ES, com arábica de altitude e cafés especiais premiados.",
  },
  {
    codigo: "es_conilon",
    nome: "Espírito Santo (Conilon)",
    estados: ["ES"],
    descricao:
      "Maior produtor nacional de conilon (robusta), cafeicultura familiar extensiva.",
  },
  {
    codigo: "sul_bahia",
    nome: "Sul da Bahia",
    estados: ["BA"],
    descricao:
      "Cerrado baiano e região costeira, produção de arábica e conilon em expansão.",
  },
];

export type Cidade = {
  slug: string;
  nome: string;
  estado: string;
  regiao: string;
  regiao_codigo?: RegiaoCodigo;
  destaque: boolean;
  descricao?: string;
};

/**
 * Catálogo nacional de cidades cafeeiras. Manhuaçu (Zona da Mata MG)
 * é a cidade-bandeira do MVP e aparece primeiro em listas por
 * `destaque: true`. Cidades de outras regiões foram acrescentadas
 * para sinalizar a abertura nacional — à medida que houver corretora
 * cadastrada em cada praça, mais cidades são adicionadas.
 */
export const CIDADES: Cidade[] = [
  // ─── Zona da Mata MG (praça piloto) ──────────────────────────────
  {
    slug: "manhuacu",
    nome: "Manhuaçu",
    estado: "MG",
    regiao: "Zona da Mata",
    regiao_codigo: "zona_mata_mg",
    destaque: true,
    descricao:
      "Polo cafeeiro central da Zona da Mata, reconhecido pela produção de arábica de qualidade superior e forte cultura de negociação via corretoras locais.",
  },
  {
    slug: "manhumirim",
    nome: "Manhumirim",
    estado: "MG",
    regiao: "Zona da Mata",
    regiao_codigo: "zona_mata_mg",
    destaque: true,
    descricao:
      "Município vizinho a Manhuaçu com tradição na produção de café arábica e parte integrante da Denominação de Origem Matas de Minas.",
  },
  {
    slug: "lajinha",
    nome: "Lajinha",
    estado: "MG",
    regiao: "Zona da Mata",
    regiao_codigo: "zona_mata_mg",
    destaque: true,
    descricao:
      "Importante município produtor da Zona da Mata Mineira, com forte atuação de corretoras no escoamento da safra anual.",
  },
  {
    slug: "caparao",
    nome: "Caparaó",
    estado: "MG",
    regiao: "Zona da Mata",
    regiao_codigo: "zona_mata_mg",
    destaque: true,
    descricao:
      "Região serrana com altitudes elevadas favoráveis ao café especial, integrando o complexo cafeeiro da Zona da Mata.",
  },
  {
    slug: "matipo",
    nome: "Matipó",
    estado: "MG",
    regiao: "Zona da Mata",
    regiao_codigo: "zona_mata_mg",
    destaque: false,
    descricao:
      "Município cafeeiro da Zona da Mata com produção relevante de arábica e presença de corretoras regionais.",
  },
  {
    slug: "reduto",
    nome: "Reduto",
    estado: "MG",
    regiao: "Zona da Mata",
    regiao_codigo: "zona_mata_mg",
    destaque: false,
    descricao:
      "Pequeno município da Zona da Mata com tradição na produção de café arábica e participação na rede regional de corretagem.",
  },
  {
    slug: "santana-do-manhuacu",
    nome: "Santana do Manhuaçu",
    estado: "MG",
    regiao: "Zona da Mata",
    regiao_codigo: "zona_mata_mg",
    destaque: false,
  },
  {
    slug: "simonesia",
    nome: "Simonésia",
    estado: "MG",
    regiao: "Zona da Mata",
    regiao_codigo: "zona_mata_mg",
    destaque: false,
  },
  {
    slug: "alto-jequitiba",
    nome: "Alto Jequitibá",
    estado: "MG",
    regiao: "Zona da Mata",
    regiao_codigo: "zona_mata_mg",
    destaque: false,
  },
  {
    slug: "alto-caparao",
    nome: "Alto Caparaó",
    estado: "MG",
    regiao: "Zona da Mata",
    regiao_codigo: "zona_mata_mg",
    destaque: false,
  },
  // ─── Sul de Minas ────────────────────────────────────────────────
  {
    slug: "varginha",
    nome: "Varginha",
    estado: "MG",
    regiao: "Sul de Minas",
    regiao_codigo: "sul_minas",
    destaque: false,
    descricao:
      "Um dos maiores centros de comércio de café do Brasil, com forte presença de cooperativas e exportadoras no Sul de Minas.",
  },
  {
    slug: "tres-pontas",
    nome: "Três Pontas",
    estado: "MG",
    regiao: "Sul de Minas",
    regiao_codigo: "sul_minas",
    destaque: false,
  },
  {
    slug: "guaxupe",
    nome: "Guaxupé",
    estado: "MG",
    regiao: "Sul de Minas",
    regiao_codigo: "sul_minas",
    destaque: false,
  },
  // ─── Cerrado Mineiro ─────────────────────────────────────────────
  {
    slug: "patrocinio",
    nome: "Patrocínio",
    estado: "MG",
    regiao: "Cerrado Mineiro",
    regiao_codigo: "cerrado_mg",
    destaque: false,
    descricao:
      "Polo do Cerrado Mineiro, Denominação de Origem reconhecida pela produção mecanizada de arábica de altitude.",
  },
  {
    slug: "monte-carmelo",
    nome: "Monte Carmelo",
    estado: "MG",
    regiao: "Cerrado Mineiro",
    regiao_codigo: "cerrado_mg",
    destaque: false,
  },
  // ─── Mogiana (SP) ────────────────────────────────────────────────
  {
    slug: "garca",
    nome: "Garça",
    estado: "SP",
    regiao: "Mogiana",
    regiao_codigo: "mogiana_sp",
    destaque: false,
  },
  {
    slug: "franca",
    nome: "Franca",
    estado: "SP",
    regiao: "Mogiana",
    regiao_codigo: "mogiana_sp",
    destaque: false,
  },
  // ─── Caparaó (ES/MG) ─────────────────────────────────────────────
  {
    slug: "venda-nova-do-imigrante",
    nome: "Venda Nova do Imigrante",
    estado: "ES",
    regiao: "Caparaó",
    regiao_codigo: "caparao_mg_es",
    destaque: false,
    descricao:
      "Município serrano do ES com tradição no cultivo de arábica de altitude e cafés especiais premiados.",
  },
  // ─── Espírito Santo (Conilon) ────────────────────────────────────
  {
    slug: "sao-gabriel-da-palha",
    nome: "São Gabriel da Palha",
    estado: "ES",
    regiao: "Espírito Santo",
    regiao_codigo: "es_conilon",
    destaque: false,
    descricao:
      "Importante município produtor de conilon no ES, cafeicultura familiar extensiva.",
  },
  // ─── Sul da Bahia ────────────────────────────────────────────────
  {
    slug: "vitoria-da-conquista",
    nome: "Vitória da Conquista",
    estado: "BA",
    regiao: "Sul da Bahia",
    regiao_codigo: "sul_bahia",
    destaque: false,
    descricao:
      "Polo cafeeiro do planalto da Bahia, arábica de altitude e produção em expansão.",
  },
];

/**
 * @deprecated — use `CIDADES` diretamente. Este alias existe apenas
 * para não quebrar imports legados. Será removido em uma fase futura.
 * Filtra apenas as cidades da Zona da Mata MG para manter o
 * comportamento original de quem importava `CIDADES_ZONA_DA_MATA`.
 */
export const CIDADES_ZONA_DA_MATA: Cidade[] = CIDADES.filter(
  (c) => c.regiao_codigo === "zona_mata_mg",
);

/**
 * Cidades destacadas — aparecem nos chips de filtro e nos links
 * regionais de destaque na landing. Hoje são cidades da Zona da Mata
 * (praça piloto); à medida que outras regiões se consolidarem, mais
 * cidades podem ganhar `destaque: true`.
 */
export const CIDADES_DESTAQUE = CIDADES.filter((c) => c.destaque);

/**
 * Lista de regiões cafeeiras suportadas pelo catálogo. Para consumo
 * em selects, autocompletes e metadados.
 */
export function getRegioes(): Regiao[] {
  return REGIOES;
}

/**
 * Cidades de uma região específica, na ordem em que aparecem no
 * catálogo.
 */
export function getCidadesPorRegiao(codigo: RegiaoCodigo): Cidade[] {
  return CIDADES.filter((c) => c.regiao_codigo === codigo);
}

/**
 * Busca cidade pelo slug (case-insensitive). Retorna null se não
 * encontrada no catálogo.
 */
export function getCidadeBySlug(slug: string): Cidade | null {
  const normalized = slug.toLowerCase().trim();
  return CIDADES.find((c) => c.slug === normalized) ?? null;
}

/**
 * Busca cidade pelo nome (case-insensitive, aceita variações como
 * "Manhuaçu", "manhuacu", "MANHUAÇU").
 */
export function getCidadeByNome(nome: string): Cidade | null {
  const normalized = normalizeCityName(nome);
  return (
    CIDADES.find(
      (c) => normalizeCityName(c.nome) === normalized,
    ) ?? null
  );
}

/**
 * Normaliza nome de cidade para comparação: minúsculas, sem acentos,
 * sem espaços extras. Útil para match de "Manhuaçu" vs "manhuacu".
 */
export function normalizeCityName(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Converte nome de cidade para slug URL-friendly.
 */
export function nomeToSlug(nome: string): string {
  return normalizeCityName(nome).replace(/\s+/g, "-");
}

/**
 * Tipos de café disponíveis para filtro e qualificação de lead.
 */
export const TIPOS_CAFE = [
  { value: "arabica_comum", label: "Arábica comum" },
  { value: "arabica_especial", label: "Arábica especial" },
  { value: "natural", label: "Natural" },
  { value: "cereja_descascado", label: "Cereja descascado" },
  { value: "ainda_nao_sei", label: "Ainda não sei" },
] as const;

export type TipoCafe = (typeof TIPOS_CAFE)[number]["value"];

/**
 * Ranges de volume para qualificação de lead (em sacas de 60kg).
 */
export const VOLUMES_LEAD = [
  { value: "ate_50", label: "Até 50 sacas" },
  { value: "50_200", label: "50 a 200 sacas" },
  { value: "200_500", label: "200 a 500 sacas" },
  { value: "500_mais", label: "Mais de 500 sacas" },
] as const;

export type VolumeRange = (typeof VOLUMES_LEAD)[number]["value"];

/**
 * Objetivos de contato — o que o produtor quer com a corretora.
 */
export const OBJETIVOS_CONTATO = [
  { value: "vender", label: "Vender meu café" },
  { value: "comprar", label: "Quero comprar" },
  { value: "cotacao", label: "Saber o preço da saca" },
  { value: "outro", label: "Outro assunto" },
] as const;

export type ObjetivoContato = (typeof OBJETIVOS_CONTATO)[number]["value"];

/**
 * Canais preferidos de contato pelo produtor.
 */
export const CANAIS_CONTATO = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "ligacao", label: "Ligação" },
  { value: "email", label: "E-mail" },
] as const;

export type CanalContato = (typeof CANAIS_CONTATO)[number]["value"];
