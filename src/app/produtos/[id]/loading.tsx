export default function ProductDetailLoading() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-8 md:py-12 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Image skeleton */}
        <div className="aspect-square rounded-xl bg-gray-200" />

        {/* Content skeleton */}
        <div className="flex flex-col gap-6">
          <div className="space-y-3">
            <div className="h-8 w-3/4 rounded bg-gray-200" />
            <div className="h-5 w-1/3 rounded bg-gray-200" />
          </div>
          <div className="h-10 w-1/3 rounded bg-gray-200" />
          <div className="space-y-2">
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-5/6 rounded bg-gray-200" />
            <div className="h-4 w-2/3 rounded bg-gray-200" />
          </div>
          <div className="h-12 w-full rounded-lg bg-gray-200" />
        </div>
      </div>
    </section>
  );
}
