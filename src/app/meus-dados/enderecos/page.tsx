"use client";

import Link from "next/link";
import { useUserAddresses } from "@/hooks/useUserAddresses";

export default function EnderecosPage() {
  const { addresses, loading, deleteAddress } = useUserAddresses();

  return (
    <div className="pt-20 sm:pt-24 md:pt-28 px-4 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-3xl sm:max-w-4xl lg:max-w-5xl">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
            Meus endereços
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-gray-500">
            Gerencie seus endereços de entrega salvos.
          </p>
        </div>

        <div className="mb-4 sm:mb-6 flex justify-end">
          <Link
            href="/meus-dados/enderecos/novo"
            className="inline-flex items-center justify-center rounded-lg bg-[#359293] px-4 sm:px-5 py-2.5 text-white text-sm sm:text-base shadow-sm hover:bg-[#2b7778] transition"
          >
            + Novo endereço
          </Link>
        </div>

        {loading ? (
          <div className="animate-pulse space-y-3">
            <div className="h-24 rounded-2xl bg-gray-200" />
            <div className="h-24 rounded-2xl bg-gray-200" />
          </div>
        ) : addresses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
            Você ainda não cadastrou nenhum endereço.
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {addr.apelido || "Endereço"}
                    {addr.is_default ? (
                      <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-100">
                        Padrão
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs sm:text-sm text-gray-700">
                    {addr.endereco}, {addr.numero} – {addr.bairro}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {addr.cidade} / {addr.estado} · CEP {addr.cep}
                  </p>
                  {addr.ponto_referencia && (
                    <p className="mt-1 text-xs text-gray-500">
                      Referência: {addr.ponto_referencia}
                    </p>
                  )}
                  {addr.telefone && (
                    <p className="mt-1 text-xs text-gray-500">
                      Telefone: {addr.telefone}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 sm:gap-3 justify-end">
                  <Link
                    href={`/meus-dados/enderecos/${addr.id}`}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => deleteAddress(addr.id)}
                    className="inline-flex items-center justify-center rounded-lg bg-red-500 px-3 py-2 text-xs sm:text-sm font-medium text-white hover:bg-red-600"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="h-8 sm:h-10" />
      </div>
    </div>
  );
}
