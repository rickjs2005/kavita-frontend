"use client";

// src/components/CookieBanner.tsx
//
// Banner honesto: o Kavita usa apenas cookies necessários (sessão,
// CSRF, preferência). Nada de analytics de terceiros ou remarketing
// no MVP. Quando entrarem cookies opcionais, adicionamos toggle
// aqui — não criamos banner fake com opções que não fazem nada.

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "kavita_cookie_consent";
const CONSENT_VERSION = "2026-04-20.1";

type StoredConsent = {
  version: string;
  acceptedAt: string;
};

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setVisible(true);
        return;
      }
      const parsed = JSON.parse(raw) as StoredConsent;
      if (parsed?.version !== CONSENT_VERSION) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  function accept() {
    try {
      const payload: StoredConsent = {
        version: CONSENT_VERSION,
        acceptedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Silencioso — se localStorage está bloqueado (modo privado,
      // storage cheio), o banner reaparece na próxima navegação.
      // Preferível a travar a UX.
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200 bg-white shadow-[0_-8px_20px_rgba(0,0,0,0.06)]"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:gap-6 md:px-6">
        <p className="text-xs text-stone-700 md:text-sm">
          O Kavita usa apenas <strong>cookies necessários</strong> — sessão,
          segurança (CSRF) e esta preferência. Nada de analytics de
          terceiros ou remarketing.{" "}
          <Link
            href="/privacidade"
            className="text-amber-700 underline hover:text-amber-800"
          >
            Política de Privacidade
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={accept}
          className="shrink-0 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 px-4 py-2 text-xs font-semibold text-white hover:from-amber-400 hover:to-amber-500 md:text-sm"
        >
          Entendi
        </button>
      </div>
    </div>
  );
}
