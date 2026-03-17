"use client";

import { useCallback } from "react";
import useSWR from "swr";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/apiClient";
import { ENDPOINTS } from "@/services/api/endpoints";

import type { UserAddress, UserAddressPayload } from "@/types/address";

export type { UserAddress, UserAddressPayload };

type UseUserAddressesResult = {
  addresses: UserAddress[];
  loading: boolean;
  createAddress: (payload: UserAddressPayload) => Promise<void>;
  updateAddress: (id: number, payload: UserAddressPayload) => Promise<void>;
  deleteAddress: (id: number) => Promise<void>;
  reload: () => Promise<void>;
};

const fetcher = (url: string) => apiClient.get<UserAddress[]>(url);

export function useUserAddresses(): UseUserAddressesResult {
  const { data, isLoading, mutate } = useSWR(ENDPOINTS.USERS.ADDRESSES, fetcher, {
    revalidateOnFocus: false,
    onError(err: any) {
      const msg = err?.message || "Não foi possível carregar seus endereços.";
      toast.error(msg);
    },
  });

  const addresses = data || [];

  const createAddress = useCallback(
    async (payload: UserAddressPayload) => {
      try {
        const created = await apiClient.post<UserAddress>(ENDPOINTS.USERS.ADDRESSES, payload);
        await mutate([...addresses, created], false);
        toast.success("Endereço salvo com sucesso! ✅");
      } catch (err: any) {
        const msg = err?.message || "Não foi possível salvar o endereço.";
        toast.error(msg);
        throw err;
      }
    },
    [addresses, mutate],
  );

  const updateAddress = useCallback(
    async (id: number, payload: UserAddressPayload) => {
      try {
        const updated = await apiClient.put<UserAddress>(ENDPOINTS.USERS.ADDRESS(id), payload);
        await mutate(
          addresses.map((addr) => (addr.id === id ? updated : addr)),
          false,
        );
        toast.success("Endereço atualizado com sucesso! ✅");
      } catch (err: any) {
        const msg = err?.message || "Não foi possível atualizar o endereço.";
        toast.error(msg);
        throw err;
      }
    },
    [addresses, mutate],
  );

  const deleteAddress = useCallback(
    async (id: number) => {
      try {
        await apiClient.del(ENDPOINTS.USERS.ADDRESS(id));
        await mutate(
          addresses.filter((addr) => addr.id !== id),
          false,
        );
        toast.success("Endereço excluído com sucesso.");
      } catch (err: any) {
        const msg = err?.message || "Não foi possível excluir o endereço.";
        toast.error(msg);
        throw err;
      }
    },
    [addresses, mutate],
  );

  return {
    addresses,
    loading: isLoading,
    createAddress,
    updateAddress,
    deleteAddress,
    reload: async () => { await mutate(); },
  };
}
