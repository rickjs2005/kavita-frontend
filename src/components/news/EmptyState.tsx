// src/components/news/EmptyState.tsx
export function EmptyState({
  title = "Nada por aqui ainda",
  subtitle = "Conteúdos serão atualizados em breve.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="
        rounded-2xl border border-zinc-200 bg-white
        p-6 md:p-8
        shadow-sm
      "
    >
      <div className="flex flex-col items-center text-center gap-2">
        <span
          aria-hidden
          className="text-2xl"
        >
          📰
        </span>

        <p className="text-base md:text-lg font-semibold text-zinc-900">
          {title}
        </p>

        <p className="max-w-md text-sm text-zinc-600 leading-relaxed">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
