// types/kavita-news.ts
// Tipos do módulo Kavita News (Admin / Clima / etc.)
// Refatorado para suportar Open-Meteo (coordenadas lat/lon) sem quebrar compatibilidade.

export type NewsOk<T> = {
  // compat: em alguns lugares você usava ok/data opcionais
  ok?: true | boolean;
  data?: T;
  meta?: any;

  // compat: alguns endpoints/handlers ainda podem retornar message/mensagem
  message?: string;
  mensagem?: string;
};

export type NewsFail = {
  ok: false;
  code: string;
  message: string;
  details?: any;

  // compat
  mensagem?: string;
};

export type ApiEnvelope<T> = NewsOk<T> | NewsFail;

/**
 * Registro vindo do DB (news_clima)
 * Observação: decimals podem vir como string dependendo do driver/config.
 * Por isso mantemos number | string | null em coordenadas e distance.
 */
export type ClimaItem = {
  id: number;
  city_name: string;
  slug: string;
  uf: string;

  ibge_id?: number | null;

  // legado (não é necessário para chuva no Open-Meteo, mas pode existir no DB)
  station_code?: string | null;
  station_name?: string | null;
  station_uf?: string | null;

  // Open-Meteo (preferência) — coordenadas
  station_lat?: number | string | null;
  station_lon?: number | string | null;
  station_distance?: number | string | null;

  // fontes auxiliares (opcionais)
  ibge_source?: string | null;
  station_source?: string | null;

  // métricas calculadas/sincronizadas
  mm_24h?: number | null;
  mm_7d?: number | null;

  source?: string | null;

  // timestamps
  last_update_at?: string | null;
  last_sync_observed_at?: string | null;
  last_sync_forecast_at?: string | null;

  // status
  ativo?: number | 0 | 1 | boolean | null;

  // campos de auditoria (se existirem no seu select)
  criado_em?: string;
  atualizado_em?: string;
};

/**
 * Estado do formulário (strings em inputs)
 * Mantém station_code por compatibilidade, mas coord é o principal agora.
 */
export type ClimaFormState = {
  city_name: string;
  slug: string;
  uf: string;

  // form input
  ibge_id: string; // string no form

  // legado (opcional)
  station_code: string; // string no form

  // Open-Meteo: inputs de coordenadas
  station_lat: string;
  station_lon: string;
  station_distance: string;

  mm_24h: string;
  mm_7d: string;

  source: string;
  last_update_at: string;

  ativo: boolean;
};

export type ClimaEditMode = "manual" | "ibge";

/**
 * Compatibilidade: seu front ainda chama isso de "stations",
 * mas agora significa sugestões do Geocoding (Open-Meteo).
 */
export type InmetStation = {
  // compat com UI antiga (se existir)
  code?: string;

  name: string;
  uf: string;

  // Open-Meteo geocoding
  lat?: number | string | null;
  lon?: number | string | null;

  country?: string;
  country_code?: string;
  admin1?: string;
  admin2?: string;
  timezone?: string;
};
