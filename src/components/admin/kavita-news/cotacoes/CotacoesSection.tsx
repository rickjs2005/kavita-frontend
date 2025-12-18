"use client";

import { useMemo, useState } from "react";
import { useCotacoesAdmin } from "@/hooks/useCotacoesAdmin";
import CotacoesForm from "./CotacoesForm";
import CotacoesTable from "./CotacoesTable";

export default function CotacoesSection(props: {
  apiBase: string;
  authOptions: RequestInit;
  onUnauthorized: () => void;
}) {
  const { apiBase, authOptions, onUnauthorized } = props;

  const cot = useCotacoesAdmin({ apiBase, authOptions, onUnauthorized });
  const [syncingAll, setSyncingAll] = useState(false);

  const handleReload = useMemo(() => async () => Promise.resolve(cot.load()), [cot.load]);

  const handleSyncAll = useMemo(() => {
    return async () => {
      if (syncingAll) return;
      setSyncingAll(true);
      try {
        await Promise.resolve(cot.syncAll());
      } finally {
        setSyncingAll(false);
      }
    };
  }, [syncingAll, cot.syncAll]);

  return (
    <div className="space-y-5">
      <CotacoesForm
        allowedSlugs={cot.allowedSlugs}
        mode={cot.mode}
        editing={cot.editing}
        form={cot.form}
        setForm={cot.setForm}
        saving={cot.saving}
        onSubmit={cot.submit}
        onCancelEdit={cot.cancelEdit}
        onStartCreate={cot.startCreate}
      />

      <CotacoesTable
        rows={cot.sorted}
        loading={cot.loading}
        errorMsg={cot.errorMsg}
        onReload={handleReload}
        onSyncAll={handleSyncAll}
        syncingAll={syncingAll}
        onEdit={cot.startEdit}
        onDelete={cot.remove}
        deletingId={cot.deletingId}
        onSync={cot.sync}
        syncingId={cot.syncingId}
      />
    </div>
  );
}
