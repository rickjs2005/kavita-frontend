"use client";

import { useMemo, useState } from "react";
import type { ClimaEditMode } from "@/types/kavita-news";
import { useClimaAdmin } from "@/hooks/useClimaAdmin";
import CloseButton from "@/components/buttons/CloseButton";
import ClimaForm from "../../kavita-news/clima/ClimaForm";
import ClimaTable from "../../kavita-news/clima/ClimaTable";

export default function ClimaSection(props: {
  apiBase: string;
  authOptions: RequestInit;
  onUnauthorized: () => void;
}) {
  const { apiBase, authOptions, onUnauthorized } = props;

  const [editMode, setEditMode] = useState<ClimaEditMode>("manual");
  const clima = useClimaAdmin({ apiBase, authOptions, onUnauthorized });

  // estado local para “Atualizar tudo”
  const [syncingAll, setSyncingAll] = useState(false);

  // reload simples (mantém)
  const handleReload = useMemo(() => {
    return async () => {
      await Promise.resolve(clima.load());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clima.load]);

  // “Atualizar” = Sync de todas as cidades
  const handleSyncAll = useMemo(() => {
    return async () => {
      if (syncingAll) return;

      const list = Array.isArray(clima.sorted) ? clima.sorted : [];
      if (list.length === 0) {
        // nada para sincronizar; só recarrega
        await handleReload();
        return;
      }

      setSyncingAll(true);
      try {
        // sequencial (mais seguro)
        for (const item of list) {
          // se algum item não tiver id, pula
          const id = (item as any)?.id;
          if (!id) continue;

          await Promise.resolve(clima.sync(id));
        }

        // no final, recarrega a tabela com os valores novos
        await handleReload();
      } finally {
        setSyncingAll(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncingAll, clima.sorted, clima.sync, handleReload]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-slate-100">Kavita News</h2>
          <p className="text-sm text-slate-300">
            Gerencie clima sem mexer no banco manualmente.
          </p>
        </div>
      </div>

      <ClimaForm
        editMode={editMode}
        setEditMode={setEditMode}
        mode={clima.mode}
        editing={clima.editing}
        form={clima.form}
        setForm={clima.setForm}
        saving={clima.saving}
        onSubmit={clima.submit}
        onCancelEdit={clima.cancelEdit}
        onStartCreate={clima.startCreate}
        onSuggestStations={clima.suggestStations}
      />

      <ClimaTable
        rows={clima.sorted}
        loading={clima.loading}
        errorMsg={clima.errorMsg}
        onReload={handleReload}         // mantém (não é o botão principal)
        onSyncAll={handleSyncAll}       // NOVO: botão Atualizar = Sync All
        syncingAll={syncingAll}         // NOVO: estado do botão
        onEdit={clima.startEdit}
        onDelete={clima.remove}
        onSync={clima.sync}
        deletingId={clima.deletingId}
        syncingId={clima.syncingId}
      />
    </div>
  );
}
