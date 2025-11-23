"use client";

import { useEffect, useState, ChangeEvent } from "react";
import axios from "axios";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import CustomButton from "@/components/buttons/CustomButton";
import DeleteButton from "@/components/buttons/DeleteButton";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type StatusConta = "ativo" | "bloqueado" | null;

type AdminUserDetail = {
  id: number;
  nome: string;
  email: string;
  telefone?: string | null;
  cpf?: string | null;
  endereco?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
  pais?: string | null;
  ponto_referencia?: string | null;
  status_conta?: StatusConta;
};

export default function AdminClienteEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const userId = Number(params.id);

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blocking, setBlocking] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("adminToken");

        const res = await axios.get<AdminUserDetail>(
          `${API_BASE}/api/users/admin/${userId}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            withCredentials: true,
          }
        );

        setUser(res.data);
      } catch (err) {
        console.error(err);
        toast.error("Não foi possível carregar os dados do cliente.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  const handleChange =
    (field: keyof AdminUserDetail) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!user) return;
      setUser({ ...user, [field]: e.target.value });
    };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const token = localStorage.getItem("adminToken");

      const { id, email, status_conta, ...body } = user;

      await axios.put(`${API_BASE}/api/users/admin/${userId}`, body, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: true,
      });

      toast.success("Dados do cliente atualizados com sucesso.");
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.mensagem ||
        "Erro ao salvar dados do cliente.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleBlock = async () => {
    if (!user) return;
    setBlocking(true);

    try {
      const token = localStorage.getItem("adminToken");
      const novoStatus: StatusConta =
        user.status_conta === "bloqueado" ? "ativo" : "bloqueado";

      await axios.put(
        `${API_BASE}/api/admin/users/${userId}/block`,
        { status_conta: novoStatus },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          withCredentials: true,
        }
      );

      setUser((prev) =>
        prev ? { ...prev, status_conta: novoStatus } : prev
      );

      toast.success(
        novoStatus === "bloqueado"
          ? "Cliente bloqueado para compras."
          : "Conta ativada com sucesso."
      );
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        "Erro ao atualizar status da conta.";
      toast.error(msg);
    } finally {
      setBlocking(false);
    }
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("adminToken");

      await axios.delete(`${API_BASE}/api/admin/users/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: true,
      });

      toast.success("Cliente removido com sucesso.");
      router.push("/admin/clientes");
    } catch (err) {
      console.error(err);
      toast.error("Não foi possível excluir o cliente.");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">
          Carregando dados do cliente…
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-500">
          Cliente não encontrado.
        </p>
      </div>
    );
  }

  const isBlocked = user.status_conta === "bloqueado";

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
              Editar Cliente
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              Ajuste os dados cadastrais e o status da conta.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center justify-center rounded-full border border-gray-300 px-4 py-1.5 text-xs sm:text-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            ← Voltar
          </button>
        </div>

        {/* Card principal */}
        <div className="rounded-2xl bg-[#020617] text-white px-4 py-5 sm:px-6 sm:py-6 shadow-sm border border-[#0f172a] space-y-5">
          {/* Cabeçalho do card + status */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-semibold">
                {user.nome}
              </h2>
              <p className="text-[11px] text-gray-400">
                ID #{String(user.id).padStart(4, "0")}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold ${
                  isBlocked
                    ? "border-red-500/60 bg-red-500/10 text-red-300"
                    : "border-emerald-500/60 bg-emerald-500/10 text-emerald-200"
                }`}
              >
                {isBlocked ? "Conta bloqueada" : "Conta ativa"}
              </span>

              <button
                type="button"
                onClick={handleToggleBlock}
                disabled={blocking}
                className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold ${
                  isBlocked
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                } text-white disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {blocking
                  ? "Atualizando..."
                  : isBlocked
                  ? "Ativar conta"
                  : "Bloquear cliente"}
              </button>
            </div>
          </div>

          {/* Aviso quando bloqueado */}
          {isBlocked && (
            <div className="rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-xs text-red-100 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Este cliente está <span className="font-semibold">bloqueado</span>{" "}
                e não poderá finalizar compras até a conta ser ativada.
              </p>
              <button
                type="button"
                onClick={handleToggleBlock}
                disabled={blocking}
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {blocking ? "Atualizando..." : "Ativar conta agora"}
              </button>
            </div>
          )}

          {/* Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-300">Nome</label>
              <input
                value={user.nome}
                onChange={handleChange("nome")}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-300">Email</label>
              <input
                value={user.email}
                disabled
                className="w-full rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-sm text-gray-400"
              />
              <p className="text-[10px] text-gray-400">
                Email não é editável por aqui (evita conflitos de login).
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-300">Telefone</label>
              <input
                value={user.telefone ?? ""}
                onChange={handleChange("telefone")}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-300">CPF</label>
              <input
                value={user.cpf ?? ""}
                onChange={handleChange("cpf")}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs text-gray-300">Endereço</label>
              <input
                value={user.endereco ?? ""}
                onChange={handleChange("endereco")}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-300">Cidade</label>
              <input
                value={user.cidade ?? ""}
                onChange={handleChange("cidade")}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-300">Estado</label>
              <input
                value={user.estado ?? ""}
                onChange={handleChange("estado")}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-300">CEP</label>
              <input
                value={user.cep ?? ""}
                onChange={handleChange("cep")}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-300">País</label>
              <input
                value={user.pais ?? ""}
                onChange={handleChange("pais")}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs text-gray-300">
                Ponto de referência
              </label>
              <textarea
                value={user.ponto_referencia ?? ""}
                onChange={handleChange("ponto_referencia")}
                rows={2}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <CustomButton
                label="Ver pedidos desse cliente"
                href={`/admin/pedidos?clienteId=${userId}`}
                variant="secondary"
                size="small"
                isLoading={false}
              />
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              <DeleteButton label="Excluir cliente" onConfirm={handleDelete} />
              <CustomButton
                label="Salvar alterações"
                onClick={handleSave}
                variant="primary"
                size="small"
                isLoading={saving}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
