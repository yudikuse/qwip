import Link from "next/link";

// Reaproveito o mesmo mock daqui (para MVP real a gente extrai para um módulo compartilhado)
type Ad = {
  id: string;
  title: string;
  city: string;
  state: string;
  price: number;
  description: string;
  phone: string;
  images: string[];
  updatedAt: string;
  category?: string;
  condition?: "novo" | "usado";
};

const ADS: Ad[] = [
  {
    id: "1",
    title: "Geladeira Brastemp 375L",
    city: "Florianópolis",
    state: "SC",
    price: 1900,
    description:
      "Geladeira Brastemp em ótimo estado, 375L, frost free. Único dono. Motivo da venda: mudança.",
    phone: "5547999999999",
    images: [
      "https://picsum.photos/id/1069/1200/800",
      "https://picsum.photos/id/1074/1200/800",
      "https://picsum.photos/id/1080/1200/800",
    ],
    updatedAt: "2025-08-27T12:00:00Z",
    category: "Eletrodomésticos",
    condition: "usado",
  },
  {
    id: "2",
    title: "Sofá 3 lugares",
    city: "São José",
    state: "SC",
    price: 750,
    description:
      "Sofá confortável, 3 lugares, tecido suede. Sem manchas. Inclui 2 almofadas.",
    phone: "5547999999999",
    images: [
      "https://picsum.photos/id/1060/1200/800",
      "https://picsum.photos/id/1059/1200/800",
    ],
    updatedAt: "2025-08-27T12:00:00Z",
    category: "Móveis",
    condition: "usado",
  },
  {
    id: "3",
    title: "Notebook i5 8GB/256GB",
    city: "Palhoça",
    state: "SC",
    price: 1650,
    description:
      "Notebook i5 10ª geração, 8GB RAM e SSD 256GB. Bateria boa, acompanha carregador original.",
    phone: "5547999999999",
    images: [
      "https://picsum.photos/id/180/1200/800",
      "https://picsum.photos/id/0/1200/800",
    ],
    updatedAt: "2025-08-27T12:00:00Z",
    category: "Informática",
    condition: "usado",
  },
  {
    id: "4",
    title: "Bicicleta aro 29",
    city: "Florianópolis",
    state: "SC",
    price: 890,
    description:
      "Bike aro 29 com suspensão e 21 marchas. Ótima para trilhas leves e cidade.",
    phone: "5547999999999",
    images: [
      "https://picsum.photos/id/102/1200/800",
      "https://picsum.photos/id/103/1200/800",
    ],
    updatedAt: "2025-08-27T12:00:00Z",
    category: "Esportes",
    condition: "usado",
  },
  {
    id: "5",
    title: "Cadeira gamer",
    city: "Biguaçu",
    state: "SC",
    price: 520,
    description:
      "Cadeira gamer reclinável com apoio para braços. Pequeno desgaste no assento.",
    phone: "5547999999999",
    images: [
      "https://picsum.photos/id/1011/1200/800",
      "https://picsum.photos/id/1010/1200/800",
    ],
    updatedAt: "2025-08-27T12:00:00Z",
    category: "Móveis",
    condition: "usado",
  },
  {
    id: "6",
    title: "Mesa de jantar 6 cadeiras",
    city: "Florianópolis",
    state: "SC",
    price: 1200,
    description:
      "Mesa de jantar com tampo de vidro + 6 cadeiras estofadas. Sem avarias.",
    phone: "5547999999999",
    images: [
      "https://picsum.photos/id/1018/1200/800",
      "https://picsum.photos/id/1015/1200/800",
    ],
    updatedAt: "2025-08-27T12:00:00Z",
    category: "Móveis",
    condition: "usado",
  },
];

// utils
function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export const dynamic = "force-static";

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: {
    q?: string;
    loc?: string;
    min?: string;
    max?: string;
    sort?: string;
    page?: string;
    per?: string;
  };
}) {
  const q = (searchParams?.q ?? "").trim();
  const title = q ? `Vitrine – buscando por "${q}"` : "Vitrine – Qwip";
  return {
    title,
    description: "Vitrine local com filtros e WhatsApp.",
    alternates: {
      canonical: `https://qwip.pro/vitrine`,
    },
  };
}

export default function VitrinePage({
  searchParams,
}: {
  searchParams?: {
    q?: string;
    loc?: string;
    min?: string;
    max?: string;
    sort?: "price_asc" | "price_desc" | "newest";
    page?: string;
    per?: string;
  };
}) {
  // parse params
  const q = (searchParams?.q ?? "").toLowerCase().trim();
  const loc = (searchParams?.loc ?? "").toLowerCase().trim();
  const min = Number.isFinite(Number(searchParams?.min))
    ? Number(searchParams?.min)
    : undefined;
  const max = Number.isFinite(Number(searchParams?.max))
    ? Number(searchParams?.max)
    : undefined;
  const sort = (searchParams?.sort as
    | "price_asc"
    | "price_desc"
    | "newest") ?? "newest";
  const page = Math.max(
    1,
    Number.isFinite(Number(searchParams?.page)) ? Number(searchParams?.page) : 1
  );
  const perPage = Math.min(
    24,
    Math.max(
      3,
      Number.isFinite(Number(searchParams?.per)) ? Number(searchParams?.per) : 6
    )
  );

  // filter
  let results = ADS.filter((ad) => {
    const matchesQ = q
      ? ad.title.toLowerCase().includes(q) ||
        ad.description.toLowerCase().includes(q)
      : true;
    const matchesLoc = loc ? ad.city.toLowerCase().includes(loc) : true;
    const matchesMin = typeof min === "number" ? ad.price >= min : true;
    const matchesMax = typeof max === "number" ? ad.price <= max : true;
    return matchesQ && matchesLoc && matchesMin && matchesMax;
  });

  // sort
  results = results.sort((a, b) => {
    if (sort === "price_asc") return a.price - b.price;
    if (sort === "price_desc") return b.price - a.price;
    // newest (pelo updatedAt desc)
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const total = results.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * perPage;
  const pageItems = results.slice(start, start + perPage);

  // helpers para montar links de paginação mantendo filtros
  const buildUrl = (nextPage: number) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (loc) p.set("loc", loc);
    if (typeof min === "number") p.set("min", String(min));
    if (typeof max === "number") p.set("max", String(max));
    if (sort && sort !== "newest") p.set("sort", sort);
    if (perPage !== 6) p.set("per", String(perPage));
    p.set("page", String(nextPage));
    return `/vitrine?${p.toString()}`;
  };

  // share URL sem usar `any`
  const shareParams = new URLSearchParams();
  if (q) shareParams.set("q", q);
  if (loc) shareParams.set("loc", loc);
  if (typeof min === "number") shareParams.set("min", String(min));
  if (typeof max === "number") shareParams.set("max", String(max));
  if (sort && sort !== "newest") shareParams.set("sort", sort);
  if (perPage !== 6) shareParams.set("per", String(perPage));
  if (safePage !== 1) shareParams.set("page", String(safePage));
  const shareUrl = `https://qwip.pro/vitrine${
    shareParams.toString() ? `?${shareParams.toString()}` : ""
  }`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Vitrine</h1>

      {/* Barra de filtros (form GET) */}
      <form method="GET" className="mb-6 grid gap-3 md:grid-cols-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por título..."
          className="rounded-lg border px-3 py-2 md:col-span-2"
        />
        <input
          name="loc"
          defaultValue={loc}
          placeholder="Cidade (ex: Florianópolis)"
          className="rounded-lg border px-3 py-2"
        />
        <input
          name="min"
          defaultValue={min ?? ""}
          placeholder="Preço mín. (R$)"
          inputMode="numeric"
          className="rounded-lg border px-3 py-2"
        />
        <input
          name="max"
          defaultValue={max ?? ""}
          placeholder="Preço máx. (R$)"
          inputMode="numeric"
          className="rounded-lg border px-3 py-2"
        />
        <select
          name="sort"
          defaultValue={sort}
          className="rounded-lg border px-3 py-2"
        >
          <option value="newest">Mais recentes</option>
          <option value="price_asc">Menor preço</option>
          <option value="price_desc">Maior preço</option>
        </select>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="rounded-lg border px-4 py-2 font-medium hover:bg-gray-50"
          >
            Filtrar
          </button>
          <Link
            href="/vitrine"
            className="rounded-lg border px-4 py-2 font-medium hover:bg-gray-50"
          >
            Limpar
          </Link>
        </div>
        <div className="md:col-span-6 flex items-center gap-2">
          <label className="text-sm text-gray-600">Itens por página:</label>
          <select
            name="per"
            defaultValue={String(perPage)}
            className="rounded-lg border px-2 py-1"
          >
            <option>6</option>
            <option>9</option>
            <option>12</option>
            <option>24</option>
          </select>
        </div>
      </form>

      {/* Contador */}
      <div className="mb-4 text-sm text-gray-600">
        {start + 1}–{Math.min(start + perPage, total)} de {total} resultados.
      </div>

      {/* Grid de cards (cada card inteiro clicável) */}
      <div className="grid gap-4 md:grid-cols-2">
        {pageItems.map((ad) => (
          <Link
            key={ad.id}
            href={`/anuncio/${ad.id}`}
            className="group flex items-start gap-4 rounded-xl border p-4 transition hover:bg-gray-50"
          >
            <div className="h-28 w-40 overflow-hidden rounded-lg border">
              <img
                src={ad.images[0] ?? "https://picsum.photos/320/224"}
                alt={ad.title}
                className="h-full w-full object-cover transition group-hover:scale-105"
                loading="lazy"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-medium">{ad.title}</div>
              <div className="text-sm text-gray-600">
                {ad.city} - {ad.state}
              </div>
              <div className="mt-2 font-semibold">{formatBRL(ad.price)}</div>

              {/* Ações secundárias */}
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={`https://wa.me/${ad.phone}?text=${encodeURIComponent(
                    `Olá! Tenho interesse no anúncio: ${ad.title}`
                  )}`}
                  onClick={(e) => e.stopPropagation()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Chamar no WhatsApp
                </a>
                <span className="rounded-lg border px-3 py-1.5 text-sm text-gray-600">
                  Atualizado em{" "}
                  {new Date(ad.updatedAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Paginação */}
      <div className="mt-6 flex items-center gap-2">
        <Link
          href={buildUrl(Math.max(1, safePage - 1))}
          className={`rounded-lg border px-3 py-1.5 ${
            safePage <= 1 ? "pointer-events-none opacity-40" : "hover:bg-gray-50"
          }`}
        >
          ← Anterior
        </Link>
        <span className="text-sm text-gray-700">
          Página {safePage} de {totalPages}
        </span>
        <Link
          href={buildUrl(Math.min(totalPages, safePage + 1))}
          className={`rounded-lg border px-3 py-1.5 ${
            safePage >= totalPages
              ? "pointer-events-none opacity-40"
              : "hover:bg-gray-50"
          }`}
        >
          Próxima →
        </Link>
      </div>

      {/* Link de compartilhar (sem `any`) */}
      <div className="mt-6 text-sm text-gray-600">
        Compartilhar esta busca:
        <div className="mt-2 flex gap-2">
          <input
            readOnly
            value={shareUrl}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>
      </div>
    </div>
  );
}
