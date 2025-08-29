// src/app/vitrine/page.tsx
import Link from "next/link";

type SP = Record<string, string | string[] | undefined>;

function getFirst(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v ?? "";
}

export default async function VitrinePage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const q = getFirst(sp.q);
  const city = getFirst(sp.city);
  const min = getFirst(sp.min);
  const max = getFirst(sp.max);
  const size = getFirst(sp.size) || "6";
  const page = getFirst(sp.page) || "1";

  // helpers para paginação com os mesmos filtros
  const buildHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (city) params.set("city", city);
    if (min) params.set("min", min);
    if (max) params.set("max", max);
    if (size) params.set("size", size);
    params.set("page", String(targetPage));
    return `/vitrine?${params.toString()}`;
  };

  return (
    <main className="container mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Vitrine</h1>

      {/* Filtros */}
      <form className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-6" method="get">
        <input
          name="q"
          placeholder="Buscar por título..."
          defaultValue={q}
          className="col-span-2 rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <select
          name="city"
          defaultValue={city}
          className="col-span-2 rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="">Todas as cidades</option>
          <option value="Florianópolis - SC">Florianópolis - SC</option>
          <option value="São Paulo - SP">São Paulo - SP</option>
          <option value="Rio de Janeiro - RJ">Rio de Janeiro - RJ</option>
        </select>
        <input
          name="min"
          type="number"
          min={0}
          placeholder="0"
          defaultValue={min}
          className="col-span-1 rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <input
          name="max"
          type="number"
          min={0}
          placeholder="0"
          defaultValue={max}
          className="col-span-1 rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
        />

        <select
          name="size"
          defaultValue={size}
          className="col-span-1 rounded-md border border-zinc-800 bg-zinc-900/40 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-emerald-500"
        >
          <option value="6">6/página</option>
          <option value="9">9/página</option>
          <option value="12">12/página</option>
        </select>

        <div className="col-span-5 flex items-center gap-2">
          <button
            type="submit"
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-500"
          >
            Filtrar
          </button>
          <Link
            href="/vitrine"
            className="rounded-md border border-zinc-700 px-4 py-2 text-sm hover:bg-zinc-800/50"
          >
            Limpar
          </Link>
        </div>
      </form>

      {/* Resultados (placeholder) */}
      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center text-sm text-zinc-400">
        Nenhum resultado.
      </div>

      {/* Paginação */}
      <div className="mt-6 flex items-center justify-center gap-4 text-sm">
        <Link
          href={buildHref(Math.max(1, Number(page) - 1))}
          className="rounded-md border border-zinc-700 px-3 py-1 hover:bg-zinc-800/50"
        >
          ← Anterior
        </Link>
        <span>Página {page}</span>
        <Link
          href={buildHref(Number(page) + 1)}
          className="rounded-md border border-zinc-700 px-3 py-1 hover:bg-zinc-800/50"
        >
          Próxima →
        </Link>
      </div>

      <div className="mt-6">
        <Link href="/" className="text-sm text-zinc-400 hover:text-white">
          ← Voltar para a Home
        </Link>
      </div>
    </main>
  );
}
