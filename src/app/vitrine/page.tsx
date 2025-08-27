import Link from "next/link";

// --- Dados mockados (você pode trocar por fetch no futuro)
type Ad = {
  id: number;
  title: string;
  city: string;
  uf: string;
  price: number;
  image: string;
  updatedAt: string; // ISO date
  phone: string; // número WhatsApp (somente dígitos)
};

const ADS: Ad[] = [
  {
    id: 1,
    title: "Geladeira Brastemp 375L",
    city: "Florianópolis",
    uf: "SC",
    price: 1900,
    image: "https://images.unsplash.com/photo-1544551763-7ef42055b5e6?q=80&w=1200&auto=format&fit=crop",
    updatedAt: "2025-08-27",
    phone: "5599999999999",
  },
  {
    id: 2,
    title: "Sofá 3 lugares",
    city: "São José",
    uf: "SC",
    price: 750,
    image: "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=1200&auto=format&fit=crop",
    updatedAt: "2025-08-27",
    phone: "5599999999999",
  },
  {
    id: 3,
    title: "Bicicleta aro 29",
    city: "Florianópolis",
    uf: "SC",
    price: 890,
    image: "https://images.unsplash.com/photo-1520975922326-2806b0d4f6ea?q=80&w=1200&auto=format&fit=crop",
    updatedAt: "2025-08-27",
    phone: "5599999999999",
  },
  {
    id: 4,
    title: "Notebook i5 8GB/256GB",
    city: "Palhoça",
    uf: "SC",
    price: 1650,
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1200&auto=format&fit=crop",
    updatedAt: "2025-08-27",
    phone: "5599999999999",
  },
  {
    id: 5,
    title: "Cadeira gamer",
    city: "Biguaçu",
    uf: "SC",
    price: 520,
    image: "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=1200&auto=format&fit=crop",
    updatedAt: "2025-08-27",
    phone: "5599999999999",
  },
  {
    id: 6,
    title: "Mesa de jantar 6 cadeiras",
    city: "Florianópolis",
    uf: "SC",
    price: 1200,
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
    updatedAt: "2025-08-27",
    phone: "5599999999999",
  },
];

// --- Utilidades
function formatPrice(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type SearchParams = {
  q?: string;
  city?: string;
  min?: string;
  max?: string;
  size?: string; // itens por página
  page?: string;
};

export default function VitrinePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // parâmetros
  const q = (searchParams.q ?? "").trim().toLowerCase();
  const city = (searchParams.city ?? "").trim();
  const min = Number.isFinite(Number(searchParams.min))
    ? Number(searchParams.min)
    : undefined;
  const max = Number.isFinite(Number(searchParams.max))
    ? Number(searchParams.max)
    : undefined;

  const size = Math.max(1, Math.min(24, Number(searchParams.size ?? 6))) || 6;
  const page = Math.max(1, Number(searchParams.page ?? 1));

  // filtro
  const filtered = ADS.filter((ad) => {
    const matchText = q
      ? ad.title.toLowerCase().includes(q) ||
        `${ad.city} - ${ad.uf}`.toLowerCase().includes(q)
      : true;

    const matchCity = city ? `${ad.city} - ${ad.uf}` === city : true;

    const matchMin = typeof min === "number" ? ad.price >= min : true;
    const matchMax = typeof max === "number" ? ad.price <= max : true;

    return matchText && matchCity && matchMin && matchMax;
  });

  // paginação
  const total = filtered.length;
  const start = (page - 1) * size;
  const end = start + size;
  const pageItems = filtered.slice(start, end);
  const hasPrev = page > 1;
  const hasNext = end < total;

  // helper para montar query strings preservando filtros
  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (city) qs.set("city", city);
  if (typeof min === "number") qs.set("min", String(min));
  if (typeof max === "number") qs.set("max", String(max));
  qs.set("size", String(size));

  // lista de locais a partir dos dados
  const allCities = Array.from(
    new Set(ADS.map((a) => `${a.city} - ${a.uf}`))
  ).sort();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Vitrine</h1>

      {/* Filtros (GET) */}
      <form method="get" className="grid gap-3 grid-cols-1 sm:grid-cols-5 mb-4">
        <input
          type="text"
          name="q"
          placeholder="Buscar por título..."
          defaultValue={q}
          className="border rounded px-3 py-2"
        />

        <select name="city" defaultValue={city} className="border rounded px-3 py-2">
          <option value="">Todos os locais</option>
          {allCities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          type="number"
          name="min"
          placeholder="Preço mín. (R$)"
          defaultValue={typeof min === "number" ? min : ""}
          className="border rounded px-3 py-2"
        />
        <input
          type="number"
          name="max"
          placeholder="Preço máx. (R$)"
          defaultValue={typeof max === "number" ? max : ""}
          className="border rounded px-3 py-2"
        />

        <div className="flex gap-2">
          <select
            name="size"
            defaultValue={String(size)}
            className="border rounded px-3 py-2"
          >
            {[6, 8, 10, 12].map((n) => (
              <option key={n} value={n}>
                {n}/página
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="border rounded px-3 py-2 hover:bg-gray-50"
          >
            Filtrar
          </button>
          <Link href="/vitrine" className="border rounded px-3 py-2 hover:bg-gray-50">
            Limpar
          </Link>
        </div>
      </form>

      <p className="text-sm text-gray-600 mb-3">
        {total > 0 ? (
          <>
            {start + 1}–{Math.min(end, total)} de {total} resultados.
          </>
        ) : (
          <>Nenhum resultado.</>
        )}
      </p>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pageItems.map((ad) => {
          const waText = encodeURIComponent(
            `Olá! Vi seu anúncio "${ad.title}" na Qwip. Ainda está disponível?`
          );
          const waUrl = `https://wa.me/${ad.phone}?text=${waText}`;

          return (
            <div
              key={ad.id}
              className="flex gap-3 border rounded p-3 shadow-sm hover:shadow transition"
            >
              <img
                src={ad.image}
                alt={ad.title}
                className="w-40 h-28 object-cover rounded"
              />
              <div className="flex-1">
                <h2 className="font-semibold">{ad.title}</h2>
                <p className="text-sm text-gray-500">
                  {ad.city} - {ad.uf}
                </p>
                <p className="font-semibold mt-1">{formatPrice(ad.price)}</p>

                <div className="flex flex-wrap gap-2 mt-3">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border rounded px-3 py-1 text-sm hover:bg-gray-50"
                  >
                    Chamar no WhatsApp
                  </a>
                  <Link
                    href={`/anuncio/${ad.id}`}
                    className="border rounded px-3 py-1 text-sm hover:bg-gray-50"
                  >
                    Ver detalhes
                  </Link>
                  <span className="ml-auto text-xs text-gray-500 self-center">
                    Atualizado em{" "}
                    {new Date(ad.updatedAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Paginação */}
      <div className="flex items-center gap-2 mt-6">
        {hasPrev ? (
          <Link
            href={`/vitrine?${new URLSearchParams({ ...Object.fromEntries(qs), page: String(page - 1) })}`}
            className="border rounded px-3 py-2 hover:bg-gray-50"
          >
            ← Anterior
          </Link>
        ) : (
          <span className="border rounded px-3 py-2 text-gray-400 cursor-not-allowed">
            ← Anterior
          </span>
        )}

        <span className="text-sm">Página {page}</span>

        {hasNext ? (
          <Link
            href={`/vitrine?${new URLSearchParams({ ...Object.fromEntries(qs), page: String(page + 1) })}`}
            className="border rounded px-3 py-2 hover:bg-gray-50"
          >
            Próxima →
          </Link>
        ) : (
          <span className="border rounded px-3 py-2 text-gray-400 cursor-not-allowed">
            Próxima →
          </span>
        )}
      </div>

      <div className="mt-6">
        <Link href="/" className="underline text-sm">
          ← Voltar para a Home
        </Link>
      </div>
    </div>
  );
}
