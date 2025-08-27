export default function LoadingAd() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 animate-pulse">
      <div className="mb-6 h-5 w-40 rounded bg-gray-200" />
      <div className="mb-2 h-8 w-2/3 rounded bg-gray-200" />
      <div className="mb-8 h-4 w-40 rounded bg-gray-200" />

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="h-72 w-full rounded-xl bg-gray-200" />
          <div className="mt-3 grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 w-full rounded-lg bg-gray-200" />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border p-5">
            <div className="h-7 w-32 rounded bg-gray-200" />
            <div className="mt-2 h-4 w-48 rounded bg-gray-200" />
            <div className="mt-5 flex gap-3">
              <div className="h-10 w-40 rounded bg-gray-200" />
              <div className="h-10 w-40 rounded bg-gray-200" />
            </div>
          </div>

          <div className="rounded-xl border p-5">
            <div className="mb-2 h-5 w-28 rounded bg-gray-200" />
            <div className="h-24 w-full rounded bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
