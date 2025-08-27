import Image from "next/image";
import Link from "next/link";
import Script from "next/script";

// Reaproveita o mesmo mock da vitrine.
// Em produção, leia de uma API/DB compartilhando o tipo.
type Listing = {
  id: number;
  title: string;
  city: string;
  state: string;
  price: number;
  category: string;
  condition: "novo" | "usado";
  description: string;
  updatedAt: string;
  images: string[];
};

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
      "https://images.unsplash.com/photo-1527814050087-3793815479db?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1518834107812-67b50a2b2c04?q=80&w=1600&auto=format&fit=crop",
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
      "https://images.unsplash.com/photo-1484101403633-562f891dc89a?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1600&auto=format&fit=crop",
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
      "https://images.unsplash.com/photo-1516542076529-1ea3854896e1?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1518655048521-f130df041f66?q=80&w=1600&auto=format&fit=crop",
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
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1600&auto=format&fit=crop",
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
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?q=80&w=1600&auto=format&fit=crop",
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
      "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1600&auto=format&fit=crop",
    ],
  },
];

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function buildWhatsAppLink(title: string, price: number): string {
  const numero = "5547999999999"; // fictício
  const msg = encodeURIComponent(
    `Olá! Tenho interesse no anúncio "${title}" por ${formatBRL(price)}.`
  );
  return `https://wa.me/${numero}?text=${msg}`;
}

export default async function AnuncioPage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);
  const item = LISTINGS.find((x) => x.id === id);

  if (!item) {
    return (
      <main className="container mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl font-semibold mb-4">Anúncio não encontrado</h1>
        <Link href="/vitrine" className="underline text-sm">
          ← Voltar para a Vitrine
        </Link>
      </main>
    );
  }

  // JSON-LD (Product)
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.title,
    description: item.description,
    image: item.images,
    offers: {
      "@type": "Offer",
      price: item.price,
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      url: `https://qwip.pro/anuncio/${item.id}`,
    },
    brand: "Qwip",
    category: item.category,
  };

  return (
    <main className="container mx-auto max-w-5xl px-4 py-10">
      {/* JSON-LD sem @ts-expect-error */}
      <Script
        id="product-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link href="/vitrine" className="underline text-sm">
        ← Voltar para a Vitrine
      </Link>

      <h1 className="text-3xl font-semibold mt-4 mb-2">{item.title}</h1>
      <p className="text-gray-600 mb-4">
        {item.city} - {item.state}
      </p>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Imagem principal */}
        <div>
          <div className="relative w-full aspect-[4/3] rounded overflow-hidden">
            <Image
              src={item.images[0]}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
              priority
            />
          </div>

          {/* Thumbs (sem JS) */}
          <div className="flex gap-3 mt-3">
            {item.images.slice(0, 3).map((src, i) => (
              <div
                key={i}
                className="relative w-28 h-20 rounded overflow-hidden border"
              >
                <Image
                  src={src}
                  alt={`${item.title} ${i + 1}`}
                  fill
                  sizes="112px"
                  style={{ objectFit: "cover" }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Card de preço/ações */}
        <aside className="space-y-3">
          <div className="rounded border p-4">
            <p className="text-2xl font-semibold">{formatBRL(item.price)}</p>
            <p className="text-sm text-gray-600 mt-1">
              {item.category} · Estado: {item.condition}
            </p>

            <div className="flex gap-2 mt-4">
              <a
                href={buildWhatsAppLink(item.title, item.price)}
                target="_blank"
                rel="noopener noreferrer"
                className="border rounded px-3 py-2"
              >
                Chamar no WhatsApp
              </a>
              <Link
                href="/vitrine"
                className="border rounded px-3 py-2 bg-gray-100"
              >
                Ver outros anúncios
              </Link>
            </div>
          </div>

          <div className="rounded border p-4">
            <h2 className="font-semibold mb-2">Descrição</h2>
            <p className="text-gray-800">{item.description}</p>
          </div>

          <p className="text-xs text-gray-500">
            Atualizado em {new Date(item.updatedAt).toLocaleDateString("pt-BR")}
          </p>
        </aside>
      </section>

      <footer className="text-center text-sm text-gray-500 mt-10">
        Qwip © {new Date().getFullYear()} · Feito com <span>❤️</span>
      </footer>
    </main>
  );
}
