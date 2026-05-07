"use client";

// Mapa centralizado de chaves de ícone → componente Lucide.
// Usado pelas seções editáveis da landing /drones (why/who/how/trust)
// para renderizar o ícone que o admin escolheu pelo painel sem precisar
// importar libs extras na payload do banco.
//
// Adicionar novo ícone aqui é zero deploy: basta o admin usar a chave
// no item, e cair em fallback se a chave for desconhecida.

import {
  Building2,
  CloudLightning,
  Compass,
  Gauge,
  GraduationCap,
  Leaf,
  MapPin,
  Plane,
  Search,
  ShieldCheck,
  Sparkles,
  Sprout,
  Target,
  Timer,
  Tractor,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Building2,
  CloudLightning,
  Compass,
  Gauge,
  GraduationCap,
  Leaf,
  MapPin,
  Plane,
  Search,
  ShieldCheck,
  Sparkles,
  Sprout,
  Target,
  Timer,
  Tractor,
  Users,
  Wrench,
  Zap,
};

export const ICON_KEYS = Object.keys(ICONS).sort();

export function getSectionIcon(key?: string | null): LucideIcon {
  if (!key) return Sparkles;
  return ICONS[key] ?? Sparkles;
}
