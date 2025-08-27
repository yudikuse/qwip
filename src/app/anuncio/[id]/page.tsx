import Link from "next/link";

type AdDetail = {
  id: number;
  title: string;
  city: string;
  uf: string;
  price: number;
  phone: string;
  category: string;
  condition: "novo" | "usado";
  description: string;
  images: string[];
  updatedAt: string; // ISO
};

const ADS: AdDetail[] = [
  {
    id: 1,
    title: "Geladeira Brastemp 375L",
    city: "Florianópolis",
    uf: "SC",
    price: 1900,
    phone: "5599999999999",
    category: "Eletrodomésticos",
    condition: "usado",
    description:
      "Geladeira Brastemp em ótimo estado, 375L, frost free. Único dono. Motivo da venda: mudança.",
    images: [
      "https://images.unsplash.com/photo-1544551763-7ef42055b5e6?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1470167290877-7d5d3446de4c?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1519985176271-adb1088fa94c?q=80&w=1600&auto=format&fit=crop",
    ],
    updatedAt: "2025-08-27T12:00:00Z",
  },
  {
    id: 2,
    title: "Sofá 3 lugares",
    city: "São José",
    uf: "SC",
    price: 750,
    phone: "5599999999999",
    category: "Móveis",
    condition: "usado",
    description:
      "Sofá confortável, 3 lugares, tecido suede. Sem manchas. Inclui 2 almofadas.",
    images: [
      "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1493666438817-866a91353ca9?q=80&w=1600&auto=format&fit=crop",
    ],
    updatedAt: "2025-08-27T12:00:00Z",
  },
];

function formatPrice(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AdPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const ad = ADS.find((a) => a.id === id);

  if (!ad) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <p className="mb-4">Anúncio não encontrado.</p>
        <Link href="/vitrine" className="underline">
          ← Voltar para a Vitrine
        </Link>
      </div>
    );
  }

  const waText = encodeURIComponent(
    `Olá! Vi seu anúncio "${ad.title}" na Qwip. Ainda está disponível?`
  );
  const waUrl = `https://wa.me/${ad.phone}?text=${waText}`;

  // JSON-LD para SEO (sem ts-expect-error)
  const jsonLd = {
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
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/vitrine" className="underline text-sm">
        ← Voltar para a Vitrine
      </Link>

      <h1 className="text-3xl font-bold mt-3">{ad.title}</h1>
      <p className="text-gray-600">
        {ad.city} - {ad.uf}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Imagem grande */}
        <div>
          <img
            src={ad.images[0]}
            alt={ad.title}
            className="w-full aspect-[16/10] object-cover rounded"
          />
          {/* Miniaturas simples */}
          <div className="flex gap-3 mt-3">
            {ad.images.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`${ad.title} ${i + 1}`}
                className="w-28 h-20 object-cover rounded border"
              />
            ))}
          </div>
        </div>

        {/* Painel lateral */}
        <div>
          <div className="border rounded p-4">
            <p className="text-2xl font-semibold">{formatPrice(ad.price)}</p>
            <p className="text-sm text-gray-600 mt-1">
              {ad.category} · Estado: {ad.condition}
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border rounded px-3 py-2 hover:bg-gray-50"
              >
                Chamar no WhatsApp
              </a>

              <Link
                href="/vitrine"
                className="border rounded px-3 py-2 hover:bg-gray-50"
              >
                Ver outros anúncios
              </Link>
            </div>
          </div>

          <div className="border rounded p-4 mt-4">
            <h2 className="font-semibold mb-2">Descrição</h2>
            <p className="text-gray-800">{ad.description}</p>
          </div>

          <p className="text-xs text-gray-500 mt-2">
            Atualizado em {new Date(ad.updatedAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>

      {/* JSON-LD para SEO */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
