// src/components/admin/hero/HeroMediaUpload.tsx
"use client";

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

type Props = {
  id: string;
  label: string;
  hint: string;
  accept: string;
  maxBytes: number;
  file: File | null;
  error?: string;
  onFileChange: (file: File | null) => void;
};

export default function HeroMediaUpload({
  id,
  label,
  hint,
  accept,
  maxBytes,
  file,
  error,
  onFileChange,
}: Props) {
  const maxLabel = formatSize(maxBytes);

  return (
    <div
      className={`rounded-2xl border p-3 sm:p-4 ${
        error
          ? "border-red-500/50 bg-red-500/5"
          : "border-white/10 bg-black/20"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <label htmlFor={id} className="block text-sm font-medium text-white/90">
            {label}
          </label>
          <p className="text-xs text-white/55 mt-1">
            {hint} Máx. {maxLabel}.
          </p>
        </div>
        {file && !error ? (
          <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/70">
            Selecionado
          </span>
        ) : null}
      </div>

      <div className="mt-3">
        <label
          htmlFor={id}
          className={`group relative flex cursor-pointer items-center justify-between rounded-xl border border-dashed px-4 py-4 transition ${
            error
              ? "border-red-500/30 bg-red-500/5 hover:bg-red-500/10"
              : "border-white/15 bg-white/[0.03] hover:bg-white/[0.05]"
          }`}
        >
          <div className="min-w-0">
            <p className="text-sm text-white/80">
              {file ? file.name : "Clique para enviar o arquivo"}
            </p>
            <p className="text-xs text-white/50 truncate">
              {file ? formatSize(file.size) : accept}
            </p>
          </div>

          <span className="ml-3 shrink-0 rounded-lg bg-primary/15 px-3 py-2 text-xs font-semibold text-white border border-primary/30 group-hover:bg-primary/25 transition">
            Escolher arquivo
          </span>

          <input
            id={id}
            name={id}
            type="file"
            accept={accept}
            onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
      </div>

      {error ? (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
