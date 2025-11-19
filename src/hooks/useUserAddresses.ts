"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Ajuste esta constante se sua rota estiver montada em outro caminho.
 * Ex: "/api/user-addresses" ou "/api/usuarios/enderecos"
 */
const ADDR_API = `${API_BASE}/api/users/addresses`;

export interface UserAddress {
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
  is_default: 0 | 1;
}

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
  is_default?: boolean | 0 | 1;
};

export function useUserAddresses() {
  const { user } = useAuth();
  const token = user?.token;

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAddresses = useCallback(async () => {
    if (!token) {
      setAddresses([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get<UserAddress[]>(ADDR_API, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setAddresses(res.data ?? []);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar endereços.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const createAddress = async (data: UserAddressPayload) => {
    if (!token) return;
    try {
      await axios.post(
        ADDR_API,
        {
          ...data,
          is_default: data.is_default ? 1 : 0,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      toast.success("Endereço salvo com sucesso!");
      fetchAddresses();
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao salvar endereço.");
    }
  };

  const updateAddress = async (id: number, data: UserAddressPayload) => {
    if (!token) return;
    try {
      await axios.put(
        `${ADDR_API}/${id}`,
        {
          ...data,
          is_default: data.is_default ? 1 : 0,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      toast.success("Endereço atualizado!");
      fetchAddresses();
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao atualizar endereço.");
    }
  };

  const deleteAddress = async (id: number) => {
    if (!token) return;
    try {
      await axios.delete(`${ADDR_API}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      toast.success("Endereço removido.");
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error(e);
      toast.error("Erro ao remover endereço.");
    }
  };

  return {
    addresses,
    loading,
    createAddress,
    updateAddress,
    deleteAddress,
    refetch: fetchAddresses,
  };
}
