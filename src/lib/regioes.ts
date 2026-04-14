// src/lib/regioes.ts
//
// Catálogo regional — cidades da Zona da Mata Mineira prioritárias no
// módulo Mercado do Café, com Manhuaçu como bandeira. Usado para:
//
//   - CityChips (filtro por cidade na listagem)
//   - Rotas regionais (/mercado-do-cafe/[cidade])
//   - Validação de formulário qualificado de lead
//   - SEO (meta tags regionais)
//
// Fonte única da verdade: mudanças aqui refletem em toda a UI pública.

export type Cidade = {
  slug: string;
  nome: string;
  estado: string;
  regiao: string;
  destaque: boolean;
  descricao?: string;
};

/**
 * Cidades core do núcleo Zona da Mata / Matas de Minas priorizadas
 * pelo produto. Manhuaçu é a cidade-bandeira (destaque=true) e deve
 * sempre aparecer primeiro em listas.
 */
export const CIDADES_ZONA_DA_MATA: Cidade[] = [
  {
    slug: "manhuacu",
    nome: "Manhuaçu",
    estado: "MG",
    regiao: "Zona da Mata",
    destaque: true,
    descricao:
      "Polo cafeeiro central da Zona da Mata, reconhecido pela produção de arábica de qualidade superior e forte cultura de negociação via corretoras locais.",
  },
  {
    slug: "manhumirim",
    nome: "Manhumirim",
    estado: "MG",
    regiao: "Zona da Mata",
    destaque: true,
    descricao:
      "Município vizinho a Manhuaçu com tradição na produção de café arábica e parte integrante da Denominação de Origem Matas de Minas.",
  },
  {
    slug: "lajinha",
    nome: "Lajinha",
    estado: "MG",
    regiao: "Zona da Mata",
    destaque: true,
    descricao:
      "Importante município produtor da Zona da Mata Mineira, com forte atuação de corretoras no escoamento da safra anual.",
  },
  {
    slug: "caparao",
    nome: "Caparaó",
    estado: "MG",
    regiao: "Zona da Mata",
    destaque: true,
    descricao:
      "Região serrana com altitudes elevadas favoráveis ao café especial, integrando o complexo cafeeiro da Zona da Mata.",
  },
  {
    slug: "matipo",
    nome: "Matipó",
    estado: "MG",
    regiao: "Zona da Mata",
    destaque: false,
    descricao:
      "Município cafeeiro da Zona da Mata com produção relevante de arábica e presença de corretoras regionais.",
  },
  {
    slug: "reduto",
    nome: "Reduto",
    estado: "MG",
    regiao: "Zona da Mata",
    destaque: false,
    descricao:
      "Pequeno município da Zona da Mata com tradição na produção de café arábica e participação na rede regional de corretagem.",
  },
  {
    slug: "santana-do-manhuacu",
    nome: "Santana do Manhuaçu",
    estado: "MG",
    regiao: "Zona da Mata",
    destaque: false,
  },
  {
    slug: "simonesia",
    nome: "Simonésia",
    estado: "MG",
    regiao: "Zona da Mata",
    destaque: false,
  },
  {
    slug: "alto-jequitiba",
    nome: "Alto Jequitibá",
    estado: "MG",
    regiao: "Zona da Mata",
    destaque: false,
  },
  {
    slug: "alto-caparao",
    nome: "Alto Caparaó",
    estado: "MG",
    regiao: "Zona da Mata",
    destaque: false,
  },
];

/**
 * Cidades destacadas — aparecem nos chips de filtro e nos links
 * regionais de destaque na landing.
 */
export const CIDADES_DESTAQUE = CIDADES_ZONA_DA_MATA.filter((c) => c.destaque);

/**
 * Busca cidade pelo slug (case-insensitive). Retorna null se não
 * encontrada no catálogo regional.
 */
export function getCidadeBySlug(slug: string): Cidade | null {
  const normalized = slug.toLowerCase().trim();
  return (
    CIDADES_ZONA_DA_MATA.find((c) => c.slug === normalized) ?? null
  );
}

/**
 * Busca cidade pelo nome (case-insensitive, aceita variações como
 * "Manhuaçu", "manhuacu", "MANHUAÇU").
 */
export function getCidadeByNome(nome: string): Cidade | null {
  const normalized = normalizeCityName(nome);
  return (
    CIDADES_ZONA_DA_MATA.find(
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
  { value: "vender", label: "Vender café" },
  { value: "comprar", label: "Comprar café" },
  { value: "cotacao", label: "Consultar cotação" },
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
