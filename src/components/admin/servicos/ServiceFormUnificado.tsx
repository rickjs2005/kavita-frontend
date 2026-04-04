"use client";

import React, { useEffect, useRef, useState } from "react";
import CustomButton from "@/components/buttons/CustomButton";
import { Service } from "@/types/service";
import FormattedInput from "@/components/layout/FormattedInput";

interface Especialidade {
  id: number;
  nome: string;
}

interface Props {
  servicoEditado?: Service | null;
  onSaved: () => void;
  onCancel: () => void;
}

import { absUrl } from "@/utils/absUrl";
import apiClient from "@/lib/apiClient";
import { formatApiError } from "@/lib/formatApiError";
import { isApiError } from "@/lib/errors";

const API_SERVICOS = "/api/admin/servicos";
const API_ESPECIALIDADES = "/api/admin/especialidades";

// Normaliza URL absoluta → para preview
const toAbs = (p?: string | null) => (!p ? null : absUrl(p));

// Converte URL absoluta → para relativa (salvar no banco)
const toRel = (u: string) => {
  try {
    return new URL(u).pathname;
  } catch {
    return u;
  }
};

export default function ServiceFormUnificado({
  servicoEditado,
  onSaved,
  onCancel,
}: Props) {
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
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isEditing = !!servicoEditado?.id;

  /* ---------------------------- carregar dados ---------------------------- */
  useEffect(() => {
    (async () => {
      try {
        const data = await apiClient.get(API_ESPECIALIDADES);
        setEspecialidades(Array.isArray(data) ? data : []);
      } catch {
        // silêncio: formulário ainda funciona sem especialidades
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
      const extras = Array.isArray(servicoEditado.images)
        ? (servicoEditado.images as unknown as string[])
        : [];
      const allRel = [servicoEditado.imagem, ...extras].filter(
        Boolean,
      ) as string[];
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
    setFieldErrors({});
    setExistingImgs([]);
    setRemoveExisting(new Set());
    setNewFiles([]);
    setNewPreviews([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {};
    if (!form.nome.trim()) errs.nome = "Informe o nome do colaborador.";
    if (!form.whatsapp.trim()) errs.whatsapp = "Informe o WhatsApp.";
    if (!form.especialidade_id) errs.especialidade_id = "Selecione uma especialidade.";
    return errs;
  }

  function validateField(name: string, value: string) {
    if (name === "nome" && !value.trim()) return "Informe o nome do colaborador.";
    if (name === "whatsapp" && !value.trim()) return "Informe o WhatsApp.";
    if (name === "especialidade_id" && !value) return "Selecione uma especialidade.";
    return null;
  }

  /* ------------------------------- eventos ------------------------------- */
  function handleChange(
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
      | React.ChangeEvent<HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // clear inline error on change if it was already shown
    if (fieldErrors[name]) {
      const err = validateField(name, value);
      setFieldErrors((prev) => {
        const next = { ...prev };
        if (err) next[name] = err;
        else delete next[name];
        return next;
      });
    }
  }

  function handleBlur(
    e:
      | React.FocusEvent<HTMLInputElement>
      | React.FocusEvent<HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    const err = validateField(name, value);
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (err) next[name] = err;
      else delete next[name];
      return next;
    });
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

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});

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

    setLoading(true);
    try {
      const path = isEditing
        ? `${API_SERVICOS}/${servicoEditado!.id}`
        : API_SERVICOS;

      if (isEditing) {
        await apiClient.put(path, fd, { skipContentType: true });
      } else {
        await apiClient.post(path, fd, { skipContentType: true });
      }

      setMsg({
        type: "success",
        text: isEditing
          ? "Serviço atualizado com sucesso!"
          : "Serviço cadastrado com sucesso!",
      });

      resetForm();
      onSaved();
      onCancel();
    } catch (err: unknown) {
      const ui = formatApiError(err, "Erro ao salvar serviço.");
      const isAuthErr = isApiError(err) && (err.status === 401 || err.status === 403);
      // Usa mensagem do backend quando é específica (ex: RBAC); caso contrário exibe genérica.
      const errMsg =
        isAuthErr && err.message && err.message !== `HTTP ${err.status}`
          ? err.message
          : isAuthErr
            ? "Você não tem permissão para salvar serviço. Faça login novamente."
            : ui.message;
      setMsg({ type: "error", text: errMsg });
    } finally {
      setLoading(false);
    }
  }

  /* ----------------------------- interface ----------------------------- */
  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-4xl flex-col gap-5 rounded-2xl bg-white p-4 shadow-sm sm:p-6 md:p-8"
    >
      {/* Cabeçalho */}
      <div className="flex flex-col gap-3 border-b border-gray-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-secondary sm:text-lg">
            {isEditing ? "Editar Serviço" : "Adicionar Serviço e Colaborador"}
          </h2>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            Cadastre colaboradores e serviços oferecidos na fazenda.
          </p>
        </div>

        {isEditing && (
          <button
            type="button"
            onClick={() => {
              resetForm();
              onCancel();
            }}
            className="self-start rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50 sm:self-auto"
          >
            Cancelar edição
          </button>
        )}
      </div>

      {/* Campos em grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Coluna esquerda */}
        <div className="flex flex-col gap-4">
          {/* Nome */}
          <FormattedInput
            label="Nome do colaborador"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Nome completo"
            error={fieldErrors.nome}
          />

          {/* Cargo */}
          <FormattedInput
            label="Cargo ou função"
            name="cargo"
            value={form.cargo}
            onChange={handleChange}
            placeholder="Ex.: Veterinário, Aplicador de defensivo…"
          />

          {/* WhatsApp com máscara */}
          <FormattedInput
            label="WhatsApp"
            name="whatsapp"
            value={form.whatsapp}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="(00) 90000-0000"
            mask="telefone"
            error={fieldErrors.whatsapp}
          />
        </div>

        {/* Coluna direita */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="service-especialidade"
              className="text-[11px] font-semibold uppercase tracking-wide text-gray-700 sm:text-xs"
            >
              Especialidade
            </label>
            <select
              id="service-especialidade"
              name="especialidade_id"
              className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none ring-0 transition focus:ring-2 ${fieldErrors.especialidade_id ? "border-red-400 focus:border-red-400 focus:ring-red-500" : "border-gray-300 focus:border-secondary focus:ring-secondary/20"}`}
              value={form.especialidade_id}
              onChange={handleChange}
              onBlur={handleBlur}
              aria-invalid={fieldErrors.especialidade_id ? true : undefined}
              aria-describedby={fieldErrors.especialidade_id ? "service-especialidade-error" : undefined}
            >
              <option value="">Selecione a especialidade…</option>
              {especialidades.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </select>
            {fieldErrors.especialidade_id && (
              <span id="service-especialidade-error" role="alert" className="text-xs text-red-500">
                {fieldErrors.especialidade_id}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-gray-700 sm:text-xs">
              Descrição do serviço
            </label>
            <textarea
              name="descricao"
              className="min-h-[96px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none placeholder:text-gray-400 ring-0 transition focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              placeholder="Como esse colaborador atua, quais serviços presta, região de atendimento…"
              value={form.descricao}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* Imagens existentes */}
      {isEditing && existingImgs.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium uppercase tracking-wide text-gray-600">
            Imagens atuais
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {existingImgs.map((u) => {
              const rel = toRel(u);
              const marked = removeExisting.has(rel);
              return (
                <button
                  key={u}
                  type="button"
                  onClick={() => toggleRemoveExisting(u)}
                  className={`relative overflow-hidden rounded-lg border text-left shadow-sm transition ${
                    marked
                      ? "ring-2 ring-red-500"
                      : "ring-1 ring-black/5 hover:ring-secondary"
                  }`}
                  title={marked ? "Remover imagem" : "Manter imagem"}
                >
                  <img
                    src={u}
                    alt="img existente"
                    className="h-28 w-full object-cover"
                  />
                  <span
                    className={`absolute right-1 top-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      marked
                        ? "bg-red-600 text-white"
                        : "bg-black/60 text-white"
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
        <label className="text-xs font-medium uppercase tracking-wide text-gray-600">
          Adicionar novas imagens (opcional)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={onPickFiles}
          className="block w-full text-xs text-gray-600 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-secondary-hover"
        />

        {newPreviews.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {newPreviews.map((src, i) => (
              <div
                key={`${src}-${i}`}
                className="relative overflow-hidden rounded-lg border border-gray-200 shadow-sm"
              >
                <img
                  src={src}
                  alt={`preview-${i}`}
                  className="h-28 w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeNewImage(i)}
                  className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white"
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
          role={msg.type === "error" ? "alert" : "status"}
          className={`rounded-lg px-3 py-2 text-sm ${
            msg.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Ações */}
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => {
            resetForm();
            onCancel();
          }}
          disabled={loading}
          className="w-full rounded-full border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
        >
          Limpar
        </button>
        <CustomButton
          type="submit"
          label={
            loading
              ? isEditing
                ? "Atualizando..."
                : "Salvando..."
              : isEditing
                ? "Atualizar Serviço"
                : "Adicionar Serviço"
          }
          variant="primary"
          size="medium"
          isLoading={loading}
          className="w-full sm:w-auto"
        />
      </div>
    </form>
  );
}
