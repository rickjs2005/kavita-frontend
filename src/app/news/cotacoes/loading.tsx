// src/app/news/cotacoes/loading.tsx
//
// Skeleton loader dark — espelha a estrutura da listagem redesenhada.

function SkeletonCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/[0.08] backdrop-blur-sm">
      <div className="h-3 w-24 rounded bg-white/[0.06]" />
      <div className="mt-3 h-5 w-3/4 rounded bg-white/[0.08]" />
      <div className="mt-6 h-10 w-32 rounded bg-white/[0.08]" />
      <div className="mt-3 h-3 w-40 rounded bg-white/[0.06]" />
      <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-3">
        <div className="h-3 w-24 rounded bg-white/[0.05]" />
        <div className="h-3 w-16 rounded bg-white/[0.05]" />
      </div>
    </div>
  );
}

export default function CotacoesLoading() {
  return (
    <main className="relative min-h-[calc(100vh-120px)] overflow-hidden bg-stone-950 text-stone-100">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-40 -top-32 h-[560px] w-[560px] rounded-full bg-emerald-500/[0.08] blur-3xl" />
        <div className="absolute right-0 top-32 h-[480px] w-[480px] rounded-full bg-teal-400/[0.06] blur-3xl" />
      </div>

      <div className="relative animate-pulse">
        <div className="border-b border-white/[0.06]">
          <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 md:px-6">
            <div className="h-2 w-2 rounded-full bg-emerald-400/40" />
            <div className="h-3 w-48 rounded bg-white/[0.06]" />
          </div>
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 pb-12 pt-14 md:px-6 md:pt-20">
          <div className="h-3 w-32 rounded bg-white/[0.06]" />
          <div className="mt-6 h-12 w-3/4 rounded bg-white/[0.08] md:h-16" />
          <div className="mt-3 h-12 w-1/2 rounded bg-white/[0.08] md:h-16" />
          <div className="mt-6 h-4 w-2/3 rounded bg-white/[0.05]" />
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 md:px-6">
          <div className="rounded-2xl bg-white/[0.04] p-8 ring-1 ring-white/[0.08]">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div className="h-3 w-20 rounded bg-white/[0.06]" />
                  <div className="mt-3 h-8 w-16 rounded bg-white/[0.08]" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 py-14 md:px-6 md:py-20">
          <div className="h-6 w-64 rounded bg-white/[0.08]" />
          <div className="mt-2 h-3 w-96 rounded bg-white/[0.05]" />
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
