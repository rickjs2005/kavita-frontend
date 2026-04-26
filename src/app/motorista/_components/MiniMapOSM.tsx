"use client";

/**
 * Fase 4 — mini-mapa OSM via iframe embed.
 * Sem dependencia de chave/API. Renderiza nada quando lat/lng ausentes.
 *
 * Tile da OpenStreetMap e' livre pra uso embarcado moderado. Em
 * produçao com volume alto, considerar self-hosted ou cache.
 */

type Props = {
  lat: number | string | null;
  lng: number | string | null;
  /** Tamanho do delta do bbox. 0.005 ≈ ~500m de raio. */
  zoom?: number;
  className?: string;
};

function _toNum(v: number | string | null | undefined): number | null {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export default function MiniMapOSM({
  lat,
  lng,
  zoom = 0.005,
  className = "",
}: Props) {
  const numLat = _toNum(lat);
  const numLng = _toNum(lng);
  if (numLat == null || numLng == null) return null;

  const bbox = [
    numLng - zoom,
    numLat - zoom,
    numLng + zoom,
    numLat + zoom,
  ].join(",");

  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(
    bbox,
  )}&layer=mapnik&marker=${numLat},${numLng}`;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-xl border border-white/10 bg-stone-900 ${className}`}
    >
      <iframe
        src={src}
        title={`Mapa OSM em ${numLat.toFixed(5)}, ${numLng.toFixed(5)}`}
        className="w-full h-44 sm:h-52"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="absolute bottom-1 right-1 text-[9px] text-white/80 bg-black/40 px-1 rounded">
        © OpenStreetMap
      </div>
    </div>
  );
}
