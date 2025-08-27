import Link from "next/link";
import { BASE_URL } from "@/lib/site";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

// —————————————————————————————————————————————
// MOCK: os mesmos anúncios usados na vitrine
// (mantenha alinhado ao que está em /app/vitrine/page.tsx)
type Ad = {
  id: number;
  titulo: string;
  cidade: string;
  estado: string;
  preco: number;
  condicao: "novo" | "usado";
  categoria: string;
  descricao: string;
  imagens: string[];
  atualizadoEm: string; // ISO
};

const ADS: Ad[] = [
  {
    id: 1,
    titulo: "Geladeira Brastemp 375L",
    cidade: "Florianópolis",
    estado: "SC",
    preco: 1900,
    condicao: "usado",
    categoria: "Eletrodomésticos",
    descricao:
      "Geladeira Brastemp em ótimo estado, 375L, frost free. Único dono. Motivo da venda: mudança.",
    imagens: [
      "https://images.unsplash.com/photo-1544551763-7ef56a923595?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544551763-7ef56a923595?q=80&w=600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1543363136-7a8c9b4f5f5f?q=80&w=600&auto=format&fit=crop",
    ],
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: 2,
    titulo: "Sofá 3 lugares",
    cidade: "São José",
    estado: "SC",
    preco: 750,
    condicao: "usado",
    categoria: "Móveis",
    descricao:
      "Sofá confortável, 3 lugares, tecido suede. Sem manchas. Inclui 2 almofadas.",
    imagens: [
      "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=600&auto=format&fit=crop",
    ],
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: 3,
    titulo: "Bicicleta aro 29",
    cidade: "Florianópolis",
    estado: "SC",
    preco: 890,
    condicao: "usado",
    categoria: "Esportes",
    descricao:
      "Bike aro 29 em ótimo estado. Trocas recentes na transmissão. Pronta para pedalar.",
    imagens: [
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=600&auto=format&fit=crop",
    ],
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: 4,
    titulo: "Notebook i5 8GB/256GB",
    cidade: "Palhoça",
    estado: "SC",
    preco: 1650,
    condicao: "usado",
    categoria: "Informática",
    descricao:
      "Notebook leve com SSD 256GB e 8GB RAM. Bateria OK. Perfeito para estudos e trabalho.",
    imagens: [
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=600&auto=format&fit=crop",
    ],
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: 5,
    titulo: "Cadeira gamer",
    cidade: "Biguaçu",
    estado: "SC",
    preco: 520,
    condicao: "usado",
    categoria: "Games",
    descricao: "Cadeira gamer reclinável, em ótimo estado. Sem rasgos.",
    imagens: [
      "https://images.unsplash.com/photo-1551033406-611cf9a28f67?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1551033406-611cf9a28f67?q=80&w=600&auto=format&fit=crop",
    ],
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: 6,
    titulo: "Mesa de jantar 6 cadeiras",
    cidade: "Florianópolis",
    estado: "SC",
    preco: 1200,
    condicao: "usado",
    categoria: "Móveis",
    descricao: "Mesa de jantar de madeira com 6 cadeiras estofadas.",
    imagens: [
      "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?q=80&w=1200&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?q=80&w=600&auto=format&fit=crop",
    ],
    atualizadoEm: new Date().toISOString(),
  },
];

function getAdById(id: number) {
  return ADS.find((a) => a.id === id) || null;
}

// —————————————————————————————————————————————
// SEO dinâmico por anúncio
export async function generateMetadata({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const ad = getAdById(id);
  if (!ad) return { title: "Anúncio não encontrado • Qwip" };

  const url = `${BASE_URL}/anuncio/${ad.id}`;
  const description = `${ad.categoria} • ${ad.cidade} - ${ad.estado} • R$ ${ad.preco.toLocaleString("pt-BR")}`;

  return {
    title: `${ad.titulo} • Qwip`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: ad.titulo,
      description,
      url,
      siteName: "Qwip",
      images: ad.imagens?.length
        ? [{ url: ad.imagens[0], width: 1200, height: 630, alt: ad.titulo }]
        : [],
      locale: "pt_BR",
      type: "product",
    },
    twitter: {
      card: "summary_large_image",
      title: ad.titulo,
      description,
      images: ad.imagens?.length ? [ad.imagens[0]] : [],
    },
  };
}

// —————————————————————————————————————————————
// Página
export default async function AnuncioPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const ad = getAdById(id);
  if (!ad) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold mb-4">Anúncio não encontrado</h1>
        <Link href="/vitrine" className="underline">← Voltar para a Vitrine</Link>
      </div>
    );
  }

  const adUrl = `${BASE_URL}/anuncio/${ad.id}`;
  // Troque por um número real quando for pra produção (E.164)
  const whatsappUrl = buildWhatsAppUrl({
    phoneE164: "5548999999999",
    title: ad.titulo,
    adUrl,
  });

  // JSON-LD Product
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: ad.titulo,
    category: ad.categoria,
    description: ad.descricao,
    url: adUrl,
    image: ad.imagens?.length ? ad.imagens[0] : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "BRL",
      price: ad.preco,
      availability: "http://schema.org/InStock",
      url: adUrl,
    },
    itemCondition:
      ad.condicao === "novo"
        ? "https://schema.org/NewCondition"
        : "https://schema.org/UsedCondition",
    brand: "Qwip", // opcional
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <script
        type="application/ld+json"
        // @ts-expect-error JSON
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link href="/vitrine" className="underline text-sm">← Voltar para a Vitrine</Link>

      <h1 className="text-3xl font-bold mt-4 mb-2">{ad.titulo}</h1>
      <p className="text-gray-600 mb-6">
        {ad.cidade} - {ad.estado}
      </p>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 md:col-span-7">
          <div className="rounded-lg overflow-hidden border">
            <img src={ad.imagens[0]} alt={ad.titulo} className="w-full h-auto" />
          </div>

          {ad.imagens.length > 1 && (
            <div className="flex gap-3 mt-3">
              {ad.imagens.slice(0, 3).map((src, i) => (
                <div key={i} className="w-28 h-20 rounded-lg overflow-hidden border">
                  <img src={src} alt={`${ad.titulo} ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="col-span-12 md:col-span-5">
          <div className="border rounded-lg p-4 mb-4">
            <div className="text-xl font-semibold mb-4">
              R$ {ad.preco.toLocaleString("pt-BR")}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {ad.categoria} • Estado: {ad.condicao}
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded border bg-green-50 hover:bg-green-100"
              >
                Chamar no WhatsApp
              </a>
              <Link
                href="/vitrine"
                className="px-4 py-2 rounded border hover:bg-gray-50"
              >
                Ver outros anúncios
              </Link>
            </div>
          </div>

          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Descrição</h2>
            <p className="text-gray-700">{ad.descricao}</p>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Atualizado em {new Date(ad.atualizadoEm).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>
    </div>
  );
}
