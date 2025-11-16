"use client";

import React, { useEffect, useRef, useState } from "react";
import CustomButton from "@/components/buttons/CustomButton";
import { Service } from "@/types/service";

interface Especialidade {
  id: number;
  nome: string;
}

interface Props {
  servicoEditado?: Service | null;
  onSaved: () => void;
  onCancel: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const API_SERVICOS = `${API_BASE}/api/admin/servicos`;
const API_ESPECIALIDADES = `${API_BASE}/api/admin/especialidades`;

// Normaliza URL absoluta → para preview
const toAbs = (p?: string | null) =>
  !p ? null : p.startsWith("http") ? p : `${API_BASE}${p.startsWith("/") ? p : `/${p}`}`;

// Converte URL absoluta → para relativa (salvar no banco)
const toRel = (u: string) => (u?.startsWith(API_BASE) ? u.slice(API_BASE.length) : u);

export default function ServiceFormUnificado({ servicoEditado, onSaved, onCancel }: Props) {
  /* --------------------------- estados principais --------------------------- */
  const [form, setForm] = useState({
    nome: "",
    cargo: "",
    whatsapp: "",
    descricao: "",
    especialidade_id: "",
  });

  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);

  // imagens
  const [existingImgs, setExistingImgs] = useState<string[]>([]);
  const [removeExisting, setRemoveExisting] = useState<Set<string>>(new Set());
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isEditing = !!servicoEditado?.id;

  /* ---------------------------- carregar dados ---------------------------- */
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) return;

    (async () => {
      try {
        const res = await fetch(API_ESPECIALIDADES, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Falha ao buscar especialidades");
        const data = await res.json();
        setEspecialidades(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erro ao buscar especialidades:", err);
      }
    })();
  }, []);

  /* ---------------------------- preencher form ---------------------------- */
  useEffect(() => {
    if (servicoEditado) {
      setForm({
        nome: servicoEditado.nome || "",
        cargo: servicoEditado.cargo || "",
        whatsapp: servicoEditado.whatsapp || "",
        descricao: servicoEditado.descricao || "",
        especialidade_id: String(servicoEditado.especialidade_id ?? ""),
      });

      // imagens existentes
      const extras = Array.isArray(servicoEditado.images) ? (servicoEditado.images as unknown as string[]) : [];
      const allRel = [servicoEditado.imagem, ...extras].filter(Boolean) as string[];
      const uniqueRel = Array.from(new Set(allRel));
      const abs = uniqueRel.map((p) => toAbs(p)!).filter(Boolean);
      setExistingImgs(abs);
      setRemoveExisting(new Set());
      setNewFiles([]);
      setNewPreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      resetForm();
    }
  }, [servicoEditado]);

  // gerar e liberar previews de novas imagens
  useEffect(() => {
    const urls = newFiles.map((f) => URL.createObjectURL(f));
    setNewPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [newFiles]);

  /* ------------------------------- helpers ------------------------------- */
  function resetForm() {
    setForm({
      nome: "",
      cargo: "",
      whatsapp: "",
      descricao: "",
      especialidade_id: "",
    });
    setExistingImgs([]);
    setRemoveExisting(new Set());
    setNewFiles([]);
    setNewPreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function validate(): string | null {
    if (!form.nome.trim()) return "Informe o nome do colaborador.";
    if (!form.whatsapp.trim()) return "Informe o WhatsApp.";
    if (!form.especialidade_id) return "Selecione uma especialidade.";
    return null;
  }

  /* ------------------------------- eventos ------------------------------- */
  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setNewFiles((prev) => [...prev, ...files].slice(0, 8)); // limite 8
  }

  function removeNewImage(index: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleRemoveExisting(urlAbs: string) {
    setRemoveExisting((prev) => {
      const next = new Set(prev);
      const rel = toRel(urlAbs);
      if (next.has(rel)) next.delete(rel);
      else next.add(rel);
      return next;
    });
  }

  /* ---------------------------- submit form ---------------------------- */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const err = validate();
    if (err) {
      setMsg({ type: "error", text: err });
      return;
    }

    const token = localStorage.getItem("adminToken");
    if (!token) {
      setMsg({ type: "error", text: "Faça login no admin para continuar." });
      return;
    }

    const fd = new FormData();
    fd.append("nome", form.nome.trim());
    fd.append("cargo", form.cargo.trim());
    fd.append("whatsapp", form.whatsapp.trim());
    fd.append("descricao", form.descricao.trim());
    fd.append("especialidade_id", form.especialidade_id);

    // imagens novas
    newFiles.forEach((f) => fd.append("images", f));

    if (isEditing) {
      const kept = existingImgs
        .map((abs) => toRel(abs))
        .filter((rel) => rel && !removeExisting.has(rel));
      fd.append("keepImages", JSON.stringify(kept));
    }

    const method = isEditing ? "PUT" : "POST";
    const url = isEditing ? `${API_SERVICOS}/${servicoEditado!.id}` : API_SERVICOS;

    setLoading(true);
    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Falha ao salvar serviço.");
      }

      setMsg({
        type: "success",
        text: isEditing ? "Serviço atualizado com sucesso!" : "Serviço cadastrado com sucesso!",
      });

      resetForm();
      onSaved();
      onCancel();
    } catch (err: any) {
      console.error("Erro ao salvar:", err);
      setMsg({ type: "error", text: err.message || "Erro ao salvar serviço." });
    } finally {
      setLoading(false);
    }
  }

  /* ----------------------------- interface ----------------------------- */
  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 p-6 bg-white rounded-xl shadow-md w-full max-w-4xl"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-[#2F7E7F]">
          {isEditing ? "Editar Serviço" : "Adicionar Serviço e Colaborador"}
        </h2>

        {isEditing && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              onCancel();
            }}
            className="text-sm px-3 py-1.5 rounded border hover:bg-gray-50"
          >
            Cancelar edição
          </button>
        )}
      </div>

      {/* Campos principais */}
      <input
        className="border rounded px-3 py-2"
        name="nome"
        value={form.nome}
        onChange={handleChange}
        placeholder="Nome do colaborador"
        required
      />
      <input
        className="border rounded px-3 py-2"
        name="cargo"
        value={form.cargo}
        onChange={handleChange}
        placeholder="Cargo ou função"
      />
      <input
        className="border rounded px-3 py-2"
        name="whatsapp"
        value={form.whatsapp}
        onChange={handleChange}
        placeholder="WhatsApp"
        required
      />

      <textarea
        name="descricao"
        className="border rounded px-3 py-2 min-h-[80px]"
        placeholder="Descrição do serviço"
        value={form.descricao}
        onChange={handleChange}
      />

      <select
        name="especialidade_id"
        className="border rounded px-3 py-2"
        value={form.especialidade_id}
        onChange={handleChange}
      >
        <option value="">Selecione a especialidade…</option>
        {especialidades.map((e) => (
          <option key={e.id} value={e.id}>
            {e.nome}
          </option>
        ))}
      </select>

      {/* imagens existentes */}
      {isEditing && existingImgs.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Imagens atuais</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {existingImgs.map((u) => {
              const rel = toRel(u);
              const marked = removeExisting.has(rel);
              return (
                <button
                  key={u}
                  type="button"
                  onClick={() => toggleRemoveExisting(u)}
                  className={`relative rounded overflow-hidden border ${
                    marked ? "ring-2 ring-red-500" : "ring-1 ring-black/10"
                  }`}
                  title={marked ? "Remover imagem" : "Manter imagem"}
                >
                  <img src={u} alt="img existente" className="w-full h-28 object-cover" />
                  <span
                    className={`absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded ${
                      marked ? "bg-red-600 text-white" : "bg-black/60 text-white"
                    }`}
                  >
                    {marked ? "remover" : "manter"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* upload novas imagens */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Adicionar novas imagens (opcional)</label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={onPickFiles}
          className="block"
        />

        {newPreviews.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {newPreviews.map((src, i) => (
              <div key={`${src}-${i}`} className="relative">
                <img
                  src={src}
                  alt={`preview-${i}`}
                  className="w-full h-28 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={() => removeNewImage(i)}
                  className="absolute top-1 right-1 text-xs bg-black/70 text-white px-2 py-1 rounded"
                >
                  remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {msg && (
        <div
          className={`text-sm rounded px-3 py-2 ${
            msg.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            resetForm();
            onCancel();
          }}
          disabled={loading}
          className="px-4 py-2 rounded border hover:bg-gray-50 disabled:opacity-50"
        >
          Limpar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-[#2F7E7F] text-white rounded hover:opacity-90 disabled:opacity-50"
        >
          {loading
            ? isEditing
              ? "Atualizando..."
              : "Salvando..."
            : isEditing
            ? "Atualizar Serviço"
            : "Adicionar Serviço"}
        </button>
      </div>
    </form>
  );
}
