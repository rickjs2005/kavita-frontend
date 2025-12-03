"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import CustomButton from "@/components/buttons/CustomButton";
import DeleteButton from "@/components/buttons/DeleteButton";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type AdminUser = {
  id: number;
  nome: string;
  email: string;
  telefone?: string | null;
  cpf?: string | null;
  cidade?: string | null;
  estado?: string | null;
  status_conta?: "ativo" | "bloqueado" | null;
};

function padId(id: number) {
  return `#${String(id).padStart(4, "0")}`;
}

function onlyDigits(v?: string | null) {
  if (!v) return "";
  return v.replace(/\D/g, "");
}

// Formata telefone em (33) 12345-6789
function formatTelefone(v?: string | null) {
  const digits = onlyDigits(v);
  if (!digits) return "-";

  const d = digits.slice(0, 11);

  if (d.length <= 2) return `(${d}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// Formata CPF em 111.111.111-11
function formatCpf(v?: string | null) {
  const digits = onlyDigits(v).slice(0, 11);
  if (!digits) return "-";

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) {
    return digits.replace(/(\d{3})(\d{0,3})/, "$1.$2");
  }
  if (digits.length <= 9) {
    return digits.replace(/(\d{3})(\d{3})(\d{0,3})/, "$1.$2.$3");
  }
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4");
}

export default function AdminClientesPage() {
  const router = useRouter();
  const [list, setList] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("adminToken");

        const res = await axios.get<AdminUser[]>(
          `${API_BASE}/api/admin/users`,
          {
            headers: { Authorization: token ? `Bearer ${token}` : "" },
            withCredentials: true,
          }
        );

        setList(res.data ?? []);
      } catch (err) {
        console.error(err);
        toast.error("Não foi possível carregar os clientes.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return list;

    const q = search.toLowerCase();
    return list.filter((u) => {
      return (
        u.nome.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [list, search]);

  const total = list.length;

  const handleDelete = async (id: number) => {
    try {
      const token = localStorage.getItem("adminToken");

      await axios.delete(`${API_BASE}/api/admin/users/${id}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
        withCredentials: true,
      });

      setList((prev) => prev.filter((u) => u.id !== id));
      toast.success("Cliente removido com sucesso.");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível excluir o cliente.");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Carregando clientes…</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Cabeçalho */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl  sm:text-2xl font-semibold text-[#359293]">
            Clientes
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">
            {total === 0
              ? "Nenhum cliente cadastrado ainda."
              : `${total} cliente(s) cadastrados no sistema.`}
          </p>
        </div>

        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-full border border-gray-300 bg-white text-black px-4 py-2 text-sm outline-none transition focus:border-[#359293] focus:ring-2 focus:ring-[#359293]/20"
          />
        </div>
      </div>

      {/* Lista de clientes */}
      {filtered.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
          Nenhum cliente encontrado para essa busca.
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {filtered.map((u) => {
            const telFormatted = formatTelefone(u.telefone);
            const cpfFormatted = formatCpf(u.cpf);
            const telDigits = onlyDigits(u.telefone);

            const waLink = telDigits
              ? `https://wa.me/55${telDigits}?text=${encodeURIComponent(
                  `Olá ${u.nome}, tudo bem?`
                )}`
              : null;

            const isBlocked = u.status_conta === "bloqueado";

            return (
              <div
                key={u.id}
                className="rounded-2xl bg-[#020617] text-white px-4 py-4 sm:px-6 sm:py-5 shadow-sm border border-[#0f172a]"
              >
                {/* Linha principal */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-gray-400">
                        {padId(u.id)}
                      </span>
                      <h2 className="text-sm sm:text-base font-semibold">
                        {u.nome}
                      </h2>

                      {isBlocked && (
                        <span className="ml-2 inline-flex items-center rounded-full border border-red-500/60 bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-300">
                          Cliente bloqueado
                        </span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-300">
                      <span>
                        Telefone:{" "}
                        <span className="font-medium">{telFormatted}</span>
                      </span>
                      <span>
                        CPF:{" "}
                        <span className="font-medium">{cpfFormatted}</span>
                      </span>
                      {(u.cidade || u.estado) && (
                        <span>
                          Local:{" "}
                          <span className="font-medium">
                            {u.cidade || "-"}{" "}
                            {u.estado ? `/ ${u.estado}` : ""}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-start sm:items-end gap-2">
                    {u.email && (
                      <a
                        href={`mailto:${u.email}`}
                        className="text-xs sm:text-sm text-[#22c55e] hover:underline break-all"
                      >
                        {u.email}
                      </a>
                    )}

                    {waLink && (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-full border border-[#22c55e] px-3 py-1 text-[11px] sm:text-xs font-medium text-[#22c55e] hover:bg-[#22c55e]/10 transition"
                      >
                        WhatsApp
                      </a>
                    )}
                  </div>
                </div>

                {/* Linha de ações */}
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                  <CustomButton
                    label="Ver pedidos desse cliente"
                    href={`/admin/pedidos?clienteId=${u.id}`}
                    variant="secondary"
                    size="small"
                    isLoading={false}
                    className="text-xs sm:text-sm"
                  />

                  <CustomButton
                    label="Editar cliente"
                    href={`/admin/clientes/${u.id}`}
                    variant="primary"
                    size="small"
                    isLoading={false}
                    className="text-xs sm:text-sm"
                  />

                  <DeleteButton
                    label="Excluir cliente"
                    onConfirm={() => handleDelete(u.id)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}