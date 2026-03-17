"use client";

import { AddressForm } from "@/components/checkout/AddressForm";
import type { EntregaTipo, SavedAddress } from "../checkoutTypes";
import type { CheckoutFormChangeHandler } from "@/hooks/useCheckoutForm";
import { normalizeTipoLocalidade, formatCepLabel, CheckoutIcon } from "../checkoutUtils";

type Props = {
  entregaTipo: EntregaTipo;
  setEntregaTipo: (v: EntregaTipo) => void;
  isPickup: boolean;
  savedAddresses: SavedAddress[];
  addressesLoading: boolean;
  addressesError: string | null;
  selectedAddressId: number | null;
  showNewAddressForm: boolean;
  setShowNewAddressForm: (v: boolean) => void;
  handleSelectAddress: (addr: SavedAddress) => void;
  handleBackToSavedAddresses: () => void;
  formData: any;
  updateForm: CheckoutFormChangeHandler;
};

export function ShippingSection({
  entregaTipo,
  setEntregaTipo,
  isPickup,
  savedAddresses,
  addressesLoading,
  addressesError,
  selectedAddressId,
  showNewAddressForm,
  setShowNewAddressForm,
  handleSelectAddress,
  handleBackToSavedAddresses,
  formData,
  updateForm,
}: Props) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white/95 p-4 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#22C55E]/10 text-[#16A34A] text-xs font-bold">
          2
        </div>
        <div>
          <h2 className="flex items-center gap-2 text-sm sm:text-base font-semibold text-gray-800">
            {isPickup ? <CheckoutIcon.store /> : <CheckoutIcon.pin />}
            {isPickup ? "Retirada no estabelecimento" : "Endereço de entrega"}
          </h2>
          <p className="text-xs text-gray-500">
            {isPickup
              ? "Escolha retirar no local. Sem frete e sem prazo de entrega."
              : "Selecione um endereço salvo ou adicione um novo."}
          </p>
        </div>
      </div>

      {/* ENTREGA vs RETIRADA toggle */}
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setEntregaTipo("ENTREGA")}
          className={[
            "rounded-2xl border p-3 text-left transition shadow-sm",
            entregaTipo === "ENTREGA"
              ? "border-[#EC5B20] ring-2 ring-[#EC5B20]/20 bg-[#FFF7F2]"
              : "border-black/10 bg-white hover:bg-black/[0.03]",
          ].join(" ")}
        >
          <div className="flex items-center gap-2">
            <CheckoutIcon.truck />
            <span className="text-sm font-semibold text-gray-800">Entrega</span>
          </div>
          <p className="mt-1 text-[12px] text-gray-600">
            Calcular frete e prazo pelo CEP.
          </p>
        </button>

        <button
          type="button"
          onClick={() => setEntregaTipo("RETIRADA")}
          className={[
            "rounded-2xl border p-3 text-left transition shadow-sm",
            entregaTipo === "RETIRADA"
              ? "border-[#EC5B20] ring-2 ring-[#EC5B20]/20 bg-[#FFF7F2]"
              : "border-black/10 bg-white hover:bg-black/[0.03]",
          ].join(" ")}
        >
          <div className="flex items-center gap-2">
            <CheckoutIcon.store />
            <span className="text-sm font-semibold text-gray-800">
              Retirar no local
            </span>
          </div>
          <p className="mt-1 text-[12px] text-gray-600">
            Sem frete e sem prazo de entrega.
          </p>
        </button>
      </div>

      {/* Address content — only when ENTREGA */}
      {!isPickup ? (
        <AddressContent
          savedAddresses={savedAddresses}
          addressesLoading={addressesLoading}
          addressesError={addressesError}
          selectedAddressId={selectedAddressId}
          showNewAddressForm={showNewAddressForm}
          setShowNewAddressForm={setShowNewAddressForm}
          handleSelectAddress={handleSelectAddress}
          handleBackToSavedAddresses={handleBackToSavedAddresses}
          formData={formData}
          updateForm={updateForm}
        />
      ) : (
        <div className="rounded-xl border border-gray-100 bg-white p-4 text-sm text-gray-700">
          <p className="font-semibold text-gray-800">Retirada no estabelecimento</p>
          <p className="mt-1 text-[12px] text-gray-600">
            Ao selecionar retirada, não há cobrança de frete e não há prazo de
            entrega.
          </p>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Internal sub-component: address picker + form
// ---------------------------------------------------------------------------

type AddressContentProps = {
  savedAddresses: SavedAddress[];
  addressesLoading: boolean;
  addressesError: string | null;
  selectedAddressId: number | null;
  showNewAddressForm: boolean;
  setShowNewAddressForm: (v: boolean) => void;
  handleSelectAddress: (addr: SavedAddress) => void;
  handleBackToSavedAddresses: () => void;
  formData: any;
  updateForm: CheckoutFormChangeHandler;
};

function AddressContent({
  savedAddresses,
  addressesLoading,
  addressesError,
  selectedAddressId,
  showNewAddressForm,
  setShowNewAddressForm,
  handleSelectAddress,
  handleBackToSavedAddresses,
  formData,
  updateForm,
}: AddressContentProps) {
  if (addressesLoading) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white p-4 text-sm text-gray-600">
        Carregando endereços...
      </div>
    );
  }

  if (addressesError) {
    return (
      <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
        {addressesError}
      </div>
    );
  }

  if (savedAddresses.length > 0 && !showNewAddressForm) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 mb-4">
          <button
            type="button"
            onClick={() => {
              setShowNewAddressForm(true);
            }}
            className="inline-flex items-center gap-1 rounded-full border border-black/10 px-3 py-1 text-[11px] font-medium text-gray-700 hover:bg-black/5 transition"
          >
            + Adicionar novo endereço
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {savedAddresses.map((addr) => (
            <AddressCard
              key={addr.id}
              addr={addr}
              isSelected={Number(addr.id) === Number(selectedAddressId)}
              onSelect={() => handleSelectAddress(addr)}
            />
          ))}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-3">
          <div className="text-xs text-gray-600">
            Selecione um endereço acima. Quer entregar em outro local?
          </div>
          <button
            type="button"
            onClick={() => setShowNewAddressForm(true)}
            className="text-xs font-semibold text-[#EC5B20] hover:underline underline-offset-2"
          >
            Adicionar novo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {savedAddresses.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-3">
          <div className="text-xs text-gray-600">
            Preencha um novo endereço para esta entrega.
          </div>
          <button
            type="button"
            onClick={handleBackToSavedAddresses}
            className="text-xs font-semibold text-gray-700 hover:underline underline-offset-2"
          >
            Voltar para endereços salvos
          </button>
        </div>
      )}
      <AddressForm endereco={formData.endereco} onChange={updateForm} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal sub-component: single address card
// ---------------------------------------------------------------------------

type AddressCardProps = {
  addr: SavedAddress;
  isSelected: boolean;
  onSelect: () => void;
};

function AddressCard({ addr, isSelected, onSelect }: AddressCardProps) {
  const isDefault = Number(addr.is_default) === 1;
  const tipo = normalizeTipoLocalidade(addr.tipo_localidade);

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "text-left rounded-2xl border p-4 transition shadow-sm",
        isSelected
          ? "border-[#EC5B20] ring-2 ring-[#EC5B20]/20 bg-[#FFF7F2]"
          : "border-black/10 hover:bg-black/[0.03] bg-white",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold text-gray-800">
              {addr.apelido?.trim() ? addr.apelido : "Endereço"}
            </span>

            {isDefault && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                Padrão
              </span>
            )}

            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-100">
              {tipo === "RURAL" ? "Zona rural" : "Zona urbana"}
            </span>
          </div>

          <p className="mt-1 text-[12px] text-gray-600">
            {tipo === "RURAL" ? (
              <>
                <span className="font-medium">Comunidade:</span>{" "}
                {addr.comunidade?.trim() ? addr.comunidade : "—"}
              </>
            ) : (
              <>
                {String(addr.endereco || "").trim() || "—"},{" "}
                {String(addr.numero || "").trim() || "S/N"}
                {String(addr.bairro || "").trim() ? ` • ${addr.bairro}` : ""}
              </>
            )}
          </p>

          <p className="mt-1 text-[12px] text-gray-500">
            {String(addr.cidade || "").trim() || "—"} /{" "}
            {String(addr.estado || "").trim() || "—"} •{" "}
            {formatCepLabel(addr.cep)}
          </p>

          {tipo === "RURAL" && String(addr.observacoes_acesso || "").trim() && (
            <p className="mt-2 text-[11px] text-gray-600 line-clamp-2">
              <span className="font-medium">Acesso:</span>{" "}
              {addr.observacoes_acesso}
            </p>
          )}
        </div>

        <span
          className={[
            "mt-1 h-4 w-4 flex-none rounded-full border",
            isSelected
              ? "bg-[#EC5B20] border-[#EC5B20]"
              : "bg-white border-gray-300",
          ].join(" ")}
          aria-hidden="true"
        />
      </div>
    </button>
  );
}
