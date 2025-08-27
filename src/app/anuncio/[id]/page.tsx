import Link from "next/link";
import { notFound } from "next/navigation";

// -----------------------------
// MOCK: "base de dados" local
// -----------------------------
type Ad = {
  id: string;
  title: string;
  city: string;
  state: string;
  price: number; // em reais
  description: string;
  phone: string; // Whats com DDI, ex: 5547999999999
  images: string[]; // URLs públicas
  updatedAt: string; // ISO
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

// -----------------------------
// utils
// -----------------------------
function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

function waLink(phone: string, title: string) {
  const msg = encodeURIComponent(`Olá! Tenho interesse no anúncio: ${title}`);
  return `https://wa.me/${phone}?text=${msg}`;
}

function getAdById(id: string): Ad | undefined {
  return ADS.find((a) => a.id === id);
}

// -----------------------------
// SEO dinâmico
// -----------------------------
export async function generateMetadata({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { img?: string };
}) {
  const ad = getAdById(params.id);
  if (!ad) {
    return {
      title: "Anúncio não encontrado – Qwip",
      description: "O anúncio solicitado não foi localizado.",
    };
  }

  const idx = Math.max(
    0,
    Math.min(Number.isFinite(Number(searchParams?.img)) ? Number(searchParams?.img) : 0, ad.images.length - 1)
  );
  const ogImage = ad.images[idx] ?? ad.images[0];

  const url = `https://qwip.pro/anuncio/${ad.id}${idx ? `?img=${idx}` : ""}`;

  return {
    title: `${ad.title} – Qwip`,
    description: `${ad.title} por ${formatBRL(ad.price)} em ${ad.city} - ${ad.state}`,
    alternates: { canonical: url },
    openGraph: {
      title: `${ad.title} – Qwip`,
      description: `${ad.title} por ${formatBRL(ad.price)} em ${ad.city} - ${ad.state}`,
      images: ogImage ? [ogImage] : undefined,
      url,
    },
  };
}

// -----------------------------
// Página
// -----------------------------
export default function AdPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams?: { img?: string };
}) {
  const ad = getAdById(params.id);
  if (!ad) {
    notFound();
  }

  const idx = Math.max(
    0,
    Math.min(Number.isFinite(Number(searchParams?.img)) ? Number(searchParams?.img) : 0, ad.images.length - 1)
  );

  const selectedImg = ad.images[idx] ?? "https://picsum.photos/1200/800";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <Link
          href="/vitrine"
          className="text-gray-600 hover:text-black underline-offset-2 hover:underline"
        >
          ← Voltar para a Vitrine
        </Link>
      </nav>

      {/* Cabeçalho */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{ad.title}</h1>
        <p className="mt-1 text-gray-600">
          {ad.city} - {ad.state}
        </p>
      </header>

      {/* Conteúdo */}
      <section className="grid gap-8 md:grid-cols-2">
        {/* Galeria com troca via searchParams (?img=) */}
        <div>
          <div className="overflow-hidden rounded-xl border">
            <img
              src={selectedImg}
              alt={ad.title}
              className="h-auto w-full object-cover"
              loading="eager"
            />
          </div>

          {ad.images.length > 1 && (
            <div className="mt-3 grid grid-cols-4 gap-3">
              {ad.images.slice(0, 4).map((src, i) => {
                const href = i === 0 ? `/anuncio/${ad.id}` : `/anuncio/${ad.id}?img=${i}`;
                const isActive = i === idx;
                return (
                  <Link
                    key={i}
                    href={href}
                    className={`block overflow-hidden rounded-lg border hover:opacity-80 ${
                      isActive ? "ring-2 ring-black" : ""
                    }`}
                  >
                    <img
                      src={src}
                      alt={`${ad.title} - foto ${i + 1}`}
                      className="h-24 w-full object-cover"
                      loading="lazy"
                    />
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Painel de infos */}
        <div className="space-y-6">
          <div className="rounded-xl border p-5">
            <div className="text-2xl font-semibold">{formatBRL(ad.price)}</div>
            <div className="mt-2 text-sm text-gray-600">
              {ad.category ? `${ad.category} • ` : ""}
              {ad.condition ? `Estado: ${ad.condition}` : ""}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={waLink(ad.phone, ad.title)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border px-4 py-2 font-medium hover:bg-gray-50"
              >
                Chamar no WhatsApp
              </a>
              <Link
                href="/vitrine"
                className="rounded-lg border px-4 py-2 font-medium hover:bg-gray-50"
              >
                Ver outros anúncios
              </Link>
            </div>
          </div>

          <div className="rounded-xl border p-5">
            <h2 className="mb-2 text-lg font-semibold">Descrição</h2>
            <p className="whitespace-pre-line text-gray-800">{ad.description}</p>
          </div>

          <div className="text-sm text-gray-500">
            Atualizado em{" "}
            {new Date(ad.updatedAt).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </div>
        </div>
      </section>

      {/* JSON-LD para SEO */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: ad.title,
            image: ad.images,
            description: ad.description,
            offers: {
              "@type": "Offer",
              priceCurrency: "BRL",
              price: ad.price,
              availability: "https://schema.org/InStock",
            },
            areaServed: `${ad.city} - ${ad.state}`,
            url: `https://qwip.pro/anuncio/${ad.id}${idx ? `?img=${idx}` : ""}`,
          }),
        }}
      />
    </div>
  );
}
