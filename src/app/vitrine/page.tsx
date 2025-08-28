// src/app/vitrine/page.tsx
import Link from "next/link";

// Tipos
type Ad = {
  id: number;
  title: string;
  city: string;
  state: string;
  price: number;
  updatedAt: string;
  description: string;
  image: string;
  thumbs: string[];
  phone: string; // só dígitos, ex.: 5599999999999
};

// --- MOCK DE DADOS (pode trocar depois pelo seu backend) ---
const ADS: Ad[] = [
  {
    id: 1,
    title: "Geladeira Brastemp 375L",
    city: "Florianópolis",
    state: "SC",
    price: 1900,
    updatedAt: "2025-08-27",
    description: "Geladeira em ótimo estado, frost-free.",
    image: "/public/geladeira-1.jpg",
    thumbs: ["/public/geladeira-1.jpg", "/public/geladeira-2.jpg"],
    phone: "5599999999999",
  },
  {
    id: 2,
    title: "Sofá 3 lugares",
    city: "São José",
    state: "SC",
    price: 750,
    updatedAt: "2025-08-26",
    description:
      "Sofá confortável, 3 lugares, tecido suede. Sem manchas. Inclui 2 almofadas.",
    image: "/public/sofa-1.jpg",
    thumbs: ["/public/sofa-1.jpg", "/public/sofa-2.jpg"],
    phone: "5599999999999",
  },
  {
    id: 3,
    title: "Bicicleta aro 29",
    city: "Florianópolis",
    state: "SC",
    price: 890,
    updatedAt: "2025-08-27",
    description: "Bicicleta em bom estado, aro 29, freio a disco.",
    image: "/public/bike-1.jpg",
    thumbs: ["/public/bike-1.jpg", "/public/bike-2.jpg"],
    phone: "5599999999999",
  },
  {
    id: 4,
    title: "Notebook i5 8GB/256GB",
    city: "Palhoça",
    state: "SC",
    price: 1650,
    updatedAt: "2025-08-27",
    description: "Notebook i5, 8GB RAM, SSD 256GB. Bateria ok.",
    image: "/public/notebook-1.jpg",
    thumbs: ["/public/notebook-1.jpg", "/public/notebook-2.jpg"],
    phone: "5599999999999",
  },
  {
    id: 5,
    title: "Cadeira gamer",
    city: "Biguaçu",
    state: "SC",
    price: 520,
    updatedAt: "2025-08-27",
    description: "Cadeira gamer com apoio lombar.",
    image: "/public/cadeira-1.jpg",
    thumbs: ["/public/cadeira-1.jpg", "/public/cadeira-2.jpg"],
    phone: "5599999999999",
  },
  {
    id: 6,
    title: "Mesa de jantar 6 cadeiras",
    city: "Florianópolis",
    state: "SC",
    price: 1200,
    updatedAt: "2025-08-27",
    description: "Mesa de madeira e 6 cadeiras estofadas.",
    image: "/public/mesa-1.jpg",
    thumbs: ["/public/mesa-1.jpg", "/public/mesa-2.jpg"],
    phone: "5599999999999",
  },
];

// Cidades disponíveis (puxe de onde quiser)
const CITIES = ["Florianópolis - SC", "São José - SC", "Palhoça - SC", "Biguaçu - SC"];

// Helpers
function parsePositive(n: unknown): number | undefined {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? v : undefined;
}
function parsePage(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 1) return 1;
  return Math.floor(v);
}
function parseSize(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v) || v < 1) return 6;
  return Math.min(Math.floor(v), 30);
}

// Construção de URL para paginação mantendo filtros
function buildQuery(params: URLSearchParams, patch: Record<string, string | undefined>) {
  const q = new URLSearchParams(params.toString());
  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined || v === "") q.delete(k);
    else q.set(k, v);
  }
  return `?${q.toString()}`;
}

export default function VitrinePage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  // Normaliza filtros da URL
  const title =
    typeof searchParams.q === "string" && searchParams.q.trim() !== ""
      ? searchParams.q.trim()
      : undefined;

  const cityParam = typeof searchParams.city === "string" ? searchParams.city : "";
  const city =
    cityParam && cityParam !== "all" ? cityParam.replace(" - ", " - ") : undefined;

  const minPrice = parsePositive(searchParams.min);
  const maxPrice = parsePositive(searchParams.max);

  const page = parsePage(searchParams.page);
  const size = parseSize(searchParams.size);

  // Aplica filtros
  let filtered = ADS.slice();

  if (title) {
    const t = title.toLowerCase();
    filtered = filtered.filter((ad) => ad.title.toLowerCase().includes(t));
  }

  if (city) {
    // esperamos formato "Cidade - UF"
    const [c, uf] = city.split(" - ").map((s) => s.trim());
    filtered = filtered.filter((ad) => ad.city === c && ad.state === uf);
  }

  if (typeof minPrice === "number") {
    filtered = filtered.filter((ad) => ad.price >= minPrice);
  }
  if (typeof maxPrice === "number") {
    filtered = filtered.filter((ad) => ad.price <= maxPrice);
  }

  // Paginação
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * size;
  const items = filtered.slice(start, start + size);

  // Para os botões Anterior/Próxima
  const params = new URLSearchParams();
  if (title) params.set("q", title);
  if (city) params.set("city", city);
  if (typeof minPrice === "number") params.set("min", String(minPrice));
  if (typeof maxPrice === "number") params.set("max", String(maxPrice));
  params.set("size", String(size));

  const prevHref = buildQuery(params, { page: String(Math.max(1, current - 1)) });
  const nextHref = buildQuery(params, { page: String(Math.min(totalPages, current + 1)) });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Vitrine</h1>

      {/* FILTROS */}
      <form method="get" className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-3">
        <input
          type="text"
          name="q"
          placeholder="Buscar por título..."
          defaultValue={title ?? ""}
          className="border rounded-md px-3 py-2"
        />

        <select
          name="city"
          defaultValue={city ?? "all"}
          className="border rounded-md px-3 py-2"
        >
          <option value="all">Todos os locais</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <input
          type="number"
          name="min"
          min={0}
          placeholder="Preço mín. (R$)"
          // IMPORTANTE: vazio por padrão (não envia 0)
          defaultValue={typeof minPrice === "number" ? String(minPrice) : ""}
          className="border rounded-md px-3 py-2"
        />

        <input
          type="number"
          name="max"
          min={0}
          placeholder="Preço máx. (R$)"
          // IMPORTANTE: vazio por padrão (não envia 0)
          defaultValue={typeof maxPrice === "number" ? String(maxPrice) : ""}
          className="border rounded-md px-3 py-2"
        />

        <div className="flex gap-2">
          <select
            name="size"
            defaultValue={String(size)}
            className="border rounded-md px-3 py-2 w-28"
          >
            {[6, 9, 12, 15, 24].map((n) => (
              <option key={n} value={n}>
                {n}/página
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="border rounded-md px-4 py-2 bg-black text-white"
          >
            Filtrar
          </button>

          {/* Limpa: volta só para /vitrine */}
          <Link
            href="/vitrine"
            className="border rounded-md px-4 py-2 bg-gray-100"
          >
            Limpar
          </Link>
        </div>
      </form>

      {/* LISTA */}
      {items.length === 0 ? (
        <p className="text-sm text-gray-600">Nenhum resultado.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {items.map((ad) => (
            <div
              key={ad.id}
              className="border rounded-lg p-4 flex gap-4 items-start"
            >
              {/* imagem principal */}
              <div className="w-36 h-28 flex-shrink-0 border rounded overflow-hidden bg-gray-50">
                {/* Você pode trocar por <Image /> se quiser */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={ad.image}
                  alt={ad.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1">
                <h3 className="font-semibold">{ad.title}</h3>
                <p className="text-xs text-gray-500">
                  {ad.city} - {ad.state}
                </p>
                <p className="font-semibold mt-2">
                  R${" "}
                  {ad.price.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>

                <div className="mt-3 flex gap-2">
                  <a
                    href={`https://api.whatsapp.com/send?phone=${ad.phone}&text=${encodeURIComponent(
                      `Olá! Vi seu anúncio "${ad.title}" na Qwip. Ainda está disponível?`
                    )}&type=phone_number&app_absent=0`}
                    target="_blank"
                    rel="noreferrer"
                    className="border rounded-md px-3 py-2 text-sm bg-green-50 hover:bg-green-100"
                  >
                    Chamar no WhatsApp
                  </a>

                  <Link
                    href={`/anuncio/${ad.id}`}
                    className="border rounded-md px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100"
                  >
                    Ver detalhes
                  </Link>
                </div>

                <p className="text-[11px] text-gray-400 mt-2">
                  Atualizado em{" "}
                  {new Date(ad.updatedAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINAÇÃO */}
      <div className="mt-6 flex items-center gap-3">
        <Link
          aria-disabled={current <= 1}
          href={current <= 1 ? "#" : prevHref}
          className={`border rounded-md px-3 py-2 text-sm ${
            current <= 1 ? "pointer-events-none opacity-40" : "bg-gray-50 hover:bg-gray-100"
          }`}
        >
          ← Anterior
        </Link>
        <span className="text-sm text-gray-600">Página {current}</span>
        <Link
          aria-disabled={current >= totalPages}
          href={current >= totalPages ? "#" : nextHref}
          className={`border rounded-md px-3 py-2 text-sm ${
            current >= totalPages
              ? "pointer-events-none opacity-40"
              : "bg-gray-50 hover:bg-gray-100"
          }`}
        >
          Próxima →
        </Link>
      </div>

      <div className="mt-6">
        <Link href="/" className="text-sm underline text-gray-600">
          ← Voltar para a Home
        </Link>
      </div>
    </div>
  );
}
