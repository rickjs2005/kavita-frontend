"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/apiClient";
import { ENDPOINTS } from "@/services/api/endpoints";

export type UserAddress = {
  id: number;
  apelido: string | null;
  cep: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento: string | null;
  ponto_referencia: string | null;
  telefone: string | null;
  // no banco provavelmente é TINYINT(1), então aceitamos 0/1 ou boolean
  is_default: 0 | 1 | boolean;
};

export type UserAddressPayload = {
  apelido?: string;
  cep: string;
  endereco: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento?: string;
  ponto_referencia?: string;
  telefone?: string;
  is_default?: boolean;
};

type UseUserAddressesResult = {
  addresses: UserAddress[];
  loading: boolean;
  createAddress: (payload: UserAddressPayload) => Promise<void>;
  updateAddress: (id: number, payload: UserAddressPayload) => Promise<void>;
  deleteAddress: (id: number) => Promise<void>;
  reload: () => Promise<void>;
};

export function useUserAddresses(): UseUserAddressesResult {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<UserAddress[]>(ENDPOINTS.USERS.ADDRESSES);
      setAddresses(data || []);
    } catch (err: any) {
      console.error("[useUserAddresses] erro ao carregar endereços:", err);
      const msg =
        err?.message ||
        "Não foi possível carregar seus endereços.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const createAddress = useCallback(
    async (payload: UserAddressPayload) => {
      try {
        const created = await apiClient.post<UserAddress>(
          ENDPOINTS.USERS.ADDRESSES,
          payload
        );
        setAddresses((prev) => [...prev, created]);
        toast.success("Endereço salvo com sucesso! ✅");
      } catch (err: any) {
        console.error("[useUserAddresses] erro ao criar endereço:", err);
        const msg =
          err?.message ||
          "Não foi possível salvar o endereço.";
        toast.error(msg);
        throw err;
      }
    },
    []
  );

  const updateAddress = useCallback(
    async (id: number, payload: UserAddressPayload) => {
      try {
        const updated = await apiClient.put<UserAddress>(
          ENDPOINTS.USERS.ADDRESS(id),
          payload
        );
        setAddresses((prev) =>
          prev.map((addr) => (addr.id === id ? updated : addr))
        );
        toast.success("Endereço atualizado com sucesso! ✅");
      } catch (err: any) {
        console.error("[useUserAddresses] erro ao atualizar endereço:", err);
        const msg =
          err?.message ||
          "Não foi possível atualizar o endereço.";
        toast.error(msg);
        throw err;
      }
    },
    []
  );

  const deleteAddress = useCallback(async (id: number) => {
    try {
      await apiClient.del(ENDPOINTS.USERS.ADDRESS(id));
      setAddresses((prev) => prev.filter((addr) => addr.id !== id));
      toast.success("Endereço excluído com sucesso.");
    } catch (err: any) {
      console.error("[useUserAddresses] erro ao excluir endereço:", err);
      const msg =
        err?.message ||
        "Não foi possível excluir o endereço.";
      toast.error(msg);
      throw err;
    }
  }, []);

  return {
    addresses,
    loading,
    createAddress,
    updateAddress,
    deleteAddress,
    reload: fetchAddresses,
  };
}
