"use client";

type Props = {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
};

export function Pagination({ page, totalPages, onPageChange }: Props) {
  const canPrev = page > 1;
  const canNext = page < totalPages;

  // janela simples (estável e leve)
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  const pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={!canPrev}
        onClick={() => onPageChange(page - 1)}
        className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm disabled:opacity-50"
      >
        Anterior
      </button>

      {start > 1 ? (
        <>
          <button
            type="button"
            onClick={() => onPageChange(1)}
            className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm"
          >
            1
          </button>
          <span className="px-1 text-zinc-500">…</span>
        </>
      ) : null}

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          className={[
            "h-10 rounded-lg border px-3 text-sm",
            p === page
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-zinc-200 bg-white text-zinc-900",
          ].join(" ")}
        >
          {p}
        </button>
      ))}

      {end < totalPages ? (
        <>
          <span className="px-1 text-zinc-500">…</span>
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm"
          >
            {totalPages}
          </button>
        </>
      ) : null}

      <button
        type="button"
        disabled={!canNext}
        onClick={() => onPageChange(page + 1)}
        className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm disabled:opacity-50"
      >
        Próxima
      </button>
    </div>
  );
}
