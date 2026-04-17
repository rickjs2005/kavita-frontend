// src/lib/leadDraft.ts
//
// Persistência local dos dados pessoais mais reusáveis do produtor
// entre envios de lead (Sprint 5 — product experience). Salva só o
// que faz sentido reusar de uma corretora para outra: identidade e
// preferência de canal. Nunca salva mensagem, objetivo, volume ou
// córrego — esses são específicos do contato atual.
//
// Chave única para todo o módulo Mercado do Café. Se no futuro cada
// segmento (ex.: busca por serviço) tiver seu próprio draft, é só
// namespacear a chave.

import type { CanalContato } from "@/lib/regioes";

const STORAGE_KEY = "kavita:lead_draft:v1";

export type LeadDraft = {
  nome?: string;
  telefone?: string;
  email?: string;
  cidade?: string;
  canal_preferido?: CanalContato;
};

// Nunca lança — localStorage pode não existir (SSR) ou estar desabilitado
// (modo privado em alguns browsers). Qualquer falha retorna null.
export function loadLeadDraft(): LeadDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    // Sanitiza: só aceita strings para cada campo. Evita injetar
    // objetos maliciosos no estado do form se o localStorage foi
    // manipulado manualmente.
    const out: LeadDraft = {};
    if (typeof parsed.nome === "string") out.nome = parsed.nome;
    if (typeof parsed.telefone === "string") out.telefone = parsed.telefone;
    if (typeof parsed.email === "string") out.email = parsed.email;
    if (typeof parsed.cidade === "string") out.cidade = parsed.cidade;
    if (
      parsed.canal_preferido === "whatsapp" ||
      parsed.canal_preferido === "ligacao" ||
      parsed.canal_preferido === "email"
    ) {
      out.canal_preferido = parsed.canal_preferido;
    }
    return out;
  } catch {
    return null;
  }
}

export function saveLeadDraft(draft: LeadDraft): void {
  if (typeof window === "undefined") return;
  try {
    // Descarta campos vazios — evita salvar string vazia que depois
    // sobrescreveria um defaultValue útil.
    const clean: LeadDraft = {};
    if (draft.nome?.trim()) clean.nome = draft.nome.trim();
    if (draft.telefone?.trim()) clean.telefone = draft.telefone.trim();
    if (draft.email?.trim()) clean.email = draft.email.trim();
    if (draft.cidade?.trim()) clean.cidade = draft.cidade.trim();
    if (draft.canal_preferido) clean.canal_preferido = draft.canal_preferido;
    if (Object.keys(clean).length === 0) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  } catch {
    // Quota exceeded ou localStorage fora do ar — silencioso.
  }
}

export function clearLeadDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
