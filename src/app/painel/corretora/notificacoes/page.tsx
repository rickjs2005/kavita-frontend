// src/app/painel/corretora/notificacoes/page.tsx
//
// Página pública do painel para consumir o backend de notificações
// (Sprint 1 — fechamento do loop). O sino no header é o ponto de
// descoberta; esta página é o destino de "Ver todas" e de deep-links
// vindos de e-mail transacional/push.

import NotificationsClient from "./NotificationsClient";

export const metadata = {
  title: "Notificações | Painel da Corretora",
};

export default function NotificacoesPage() {
  return <NotificationsClient />;
}
