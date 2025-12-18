// src/components/news/EmptyState.tsx
export function EmptyState({
  title = "Nada por aqui ainda",
  subtitle = "Tente novamente mais tarde.",
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6">
      <p className="font-semibold text-zinc-900">{title}</p>
      <p className="text-sm text-zinc-600 mt-1">{subtitle}</p>
    </div>
  );
}
