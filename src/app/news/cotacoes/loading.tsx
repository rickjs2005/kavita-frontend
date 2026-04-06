// src/app/news/cotacoes/loading.tsx
// Skeleton loader for the cotações listing page (shown during RSC fetch).

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 md:p-5 animate-pulse">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-5 w-3/4 rounded bg-zinc-200" />
          <div className="h-3 w-1/2 rounded bg-zinc-100" />
          <div className="mt-3 flex gap-2">
            <div className="h-6 w-24 rounded-full bg-zinc-100" />
            <div className="h-6 w-20 rounded-full bg-zinc-100" />
          </div>
        </div>
        <div className="space-y-1 text-right">
          <div className="h-3 w-10 rounded bg-zinc-100" />
          <div className="h-8 w-20 rounded bg-zinc-200" />
          <div className="h-3 w-14 rounded bg-zinc-100" />
        </div>
      </div>
      <div className="mt-4 flex justify-between">
        <div className="h-3 w-32 rounded bg-zinc-100" />
        <div className="h-3 w-20 rounded bg-zinc-100" />
      </div>
    </div>
  );
}

export default function CotacoesLoading() {
  return (
    <main className="min-h-[calc(100vh-120px)] bg-gradient-to-b from-zinc-50 to-white">
      <header className="border-b border-zinc-100/80 bg-white/70 backdrop-blur">
        <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-7 md:py-9">
          <div className="h-3 w-40 rounded bg-zinc-200 animate-pulse" />
          <div className="mt-3 h-9 w-64 rounded bg-zinc-200 animate-pulse" />
          <div className="mt-3 h-4 w-96 rounded bg-zinc-100 animate-pulse" />
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 md:px-6 py-8 md:py-10 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </main>
  );
}
