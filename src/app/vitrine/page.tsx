import Image from "next/image";
import Link from "next/link";

// ----- Tipos -----
type Listing = {
  id: number;
  title: string;
  city: string;
  state: string;
  price: number; // em reais
  category: string;
  condition: "novo" | "usado";
  description: string;
  updatedAt: string; // ISO date
  images: string[]; // urls
};

type SearchParams = {
  q?: string;
  min?: string;
  max?: string;
  per?: string;   // itens por página
  page?: string;  // página atual
};

// ----- Mock de dados (pode vir de DB/api depois) -----
const LISTINGS: Listing[] = [
  {
    id: 1,
    title: "Geladeira Brastemp 375L",
    city: "Florianópolis",
    state: "SC",
    price: 1900,
    category: "eletrodomesticos",
    condition: "usado",
    description:
      "Geladeira Brastemp em ótimo estado, 375L, frost free. Único dono. Motivo: mudança.",
    updatedAt: "2025-08-27T12:30:00.000Z",
    images: [
      "https://images.unsplash.com/photo-1527814050087-3793815479db?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1518834107812-67b50a2b2c04?q=80&w=1200&auto=format&fit=crop",
    ],
  },
  {
    id: 2,
    title: "Sofá 3 lugares",
    city: "São José",
    state: "SC",
    price: 750,
    category: "moveis",
    condition: "usado",
    description:
      "Sofá confortável, 3 lugares, tecido suede. Sem manchas. Inclui 2 almofadas.",
    updatedAt: "2025-08-27T12:31:00.000Z",
    images: [
      "https://images.unsplash.com/photo-1484101403633-562f891dc89a?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1200&auto=format&fit=crop",
    ],
  },
  {
    id: 3,
    title: "Bicicleta aro 29",
    city: "Florianópolis",
    state: "SC",
    price: 890,
    category: "esporte",
    condition: "usado",
    description: "Bike aro 29 revisada, freio a disco, 24v.",
    updatedAt: "2025-08-27T12:32:00.000Z",
    images: [
      "https://images.unsplash.com/photo-1516542076529-1ea3854896e1?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1518655048521-f130df041f66?q=80&w=1200&auto=format&fit=crop",
    ],
  },
  {
    id: 4,
    title: "Notebook i5 8GB/256GB",
    city: "Palhoça",
    state: "SC",
    price: 1650,
    category: "informatica",
    condition: "usado",
    description:
      "Notebook Core i5, 8GB RAM, 256GB SSD. Bateria ok e sem detalhes.",
    updatedAt: "2025-08-27T12:33:00.000Z",
    images: [
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1200&auto=format&fit=crop",
    ],
  },
  {
    id: 5,
    title: "Cadeira gamer",
    city: "Biguaçu",
    state: "SC",
    price: 520,
    category: "moveis",
    condition: "usado",
    description: "Cadeira gamer reclinável, apoio de braço 2D.",
    updatedAt: "2025-08-27T12:34:00.000Z",
    images: [
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1200&auto=format&fit=crop",
    ],
  },
  {
    id: 6,
    title: "Mesa de jantar 6 cadeiras",
    city: "Florianópolis",
    state: "SC",
    price: 1200,
    category: "moveis",
    condition: "usado",
    description: "Mesa de madeira com 6 cadeiras estofadas.",
    updatedAt: "2025-08-27T12:35:00.000Z",
    images: [
      "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop",
    ],
  },
];

// ----- Helpers -----
function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function buildWhatsAppLink(title: string, price: number): string {
  // número fictício; substitua depois
  const numero = "5547999999999";
  const msg = encodeURIComponent(
    `Olá! Tenho interesse no anúncio "${title}" por ${formatBRL(price)}.`
  );
  return `https://wa.me/${numero}?text=${msg}`;
}

// ----- Página -----
export default async function VitrinePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const q = (searchParams.q ?? "").toLowerCase().trim();
  const min = Number(searchParams.min ?? "");
  const max = Number(searchParams.max ?? "");
  const per = Math.max(1, Math.min(50, Number(searchParams.per ?? "6"))); // 1..50
  const page = Math.max(1, Number(searchParams.page ?? "1"));

  // Filtro server-side
  let filtered = LISTINGS.filter((item) => {
    const matchQ = q
      ? item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      : true;
    const matchMin = Number.isFinite(min) ? item.price >= min : true;
    const matchMax = Number.isFinite(max) ? item.price <= max : true;
    return matchQ && matchMin && matchMax;
  });

  const total = filtered.length;
  const start = (page - 1) * per;
  const end = start + per;
  const pageItems = filtered.slice(start, end);

  return (
    <main className="container mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold mb-6">Vitrine</h1>

      {/* Form com method GET (sem JS) */}
      <form className="flex flex-wrap gap-3 items-center mb-4" method="GET">
        <input
          name="q"
          defaultValue={searchParams.q ?? ""}
          placeholder="Buscar por título..."
          className="border rounded px-3 py-2 w-64"
        />
        <input
          name="min"
          defaultValue={searchParams.min ?? ""}
          placeholder="Preço mín. (R$)"
          inputMode="numeric"
          className="border rounded px-3 py-2 w-40"
        />
        <input
          name="max"
          defaultValue={searchParams.max ?? ""}
          placeholder="Preço máx. (R$)"
          inputMode="numeric"
          className="border rounded px-3 py-2 w-40"
        />
        <select
          name="per"
          defaultValue={String(per)}
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
          className="border rounded px-4 py-2 bg-black text-white"
        >
          Filtrar
        </button>

        <Link
          href="/vitrine"
          className="border rounded px-4 py-2 ml-2 bg-gray-100"
        >
          Limpar
        </Link>
      </form>

      <p className="text-sm text-gray-600 mb-4">
        {start + 1}–{Math.min(end, total)} de {total} resultados.
      </p>

      <div className="flex flex-col gap-4">
        {pageItems.map((item) => (
          <article
            key={item.id}
            className="rounded border p-3 flex gap-4 items-center"
          >
            <div className="relative w-40 h-28 rounded overflow-hidden flex-shrink-0">
              <Image
                src={item.images[0]}
                alt={item.title}
                fill
                sizes="160px"
                style={{ objectFit: "cover" }}
                priority={false}
              />
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-semibold">{item.title}</h2>
              <p className="text-sm text-gray-600">
                {item.city} - {item.state}
              </p>
              <p className="font-medium mt-1">{formatBRL(item.price)}</p>

              <div className="flex gap-2 mt-3">
                <a
                  href={buildWhatsAppLink(item.title, item.price)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border rounded px-3 py-2"
                >
                  Chamar no WhatsApp
                </a>
                <Link
                  href={`/anuncio/${item.id}`}
                  className="border rounded px-3 py-2 bg-gray-100"
                >
                  Ver detalhes
                </Link>
                <span className="text-xs self-center text-gray-500 ml-2">
                  Atualizado em{" "}
                  {new Date(item.updatedAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Paginação */}
      <div className="flex items-center gap-3 mt-6">
        <Link
          aria-disabled={page <= 1}
          href={{
            pathname: "/vitrine",
            query: { ...searchParams, page: String(Math.max(1, page - 1)) },
          }}
          className={`border rounded px-3 py-2 ${
            page <= 1 ? "pointer-events-none opacity-50" : ""
          }`}
        >
          ← Anterior
        </Link>

        <span className="text-sm">Página {page}</span>

        <Link
          aria-disabled={end >= total}
          href={{
            pathname: "/vitrine",
            query: {
              ...searchParams,
              page: String(end >= total ? page : page + 1),
            },
          }}
          className={`border rounded px-3 py-2 ${
            end >= total ? "pointer-events-none opacity-50" : ""
          }`}
        >
          Próxima →
        </Link>
      </div>

      <div className="mt-8">
        <label className="block text-sm text-gray-600 mb-1">
          Compartilhar esta busca:
        </label>
        <input
          readOnly
          className="w-full border rounded px-3 py-2"
          value={`https://qwip.pro/vitrine${buildQueryString({
            q,
            min: searchParams.min,
            max: searchParams.max,
            per: String(per),
            page: String(page),
          })}`}
        />
      </div>
    </main>
  );
}

// monta a query string “bonitinha” para exibir no input de compartilhamento
function buildQueryString(obj: Record<string, string | undefined>): string {
  const p = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v && v.trim() !== "") p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}
