// src/app/admin/auditoria/page.tsx
//
// Sub-rota operacional do módulo Mercado do Café — exibe o histórico
// de ações admin sobre corretoras, reviews e planos (tabela
// admin_audit_logs, endpoint /api/admin/audit).
//
// Rota mantida em /admin/auditoria por compatibilidade de deeplinks;
// no sidebar e no header o contexto "Mercado do Café" é explícito
// para não criar confusão com logs de sistema (/admin/logs) ou
// sugerir escopo global que o recurso não tem.
import AuditClient from "./AuditClient";

export const metadata = {
  title: "Auditoria — Mercado do Café · Admin | Kavita",
};

export default function AuditoriaPage() {
  return <AuditClient />;
}
