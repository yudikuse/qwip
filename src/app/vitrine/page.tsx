import Link from "next/link";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { BASE_URL } from "@/lib/site";

type Ad = {
  id: number;
  titulo: string;
  cidade: string;
  estado: string;
  preco: number;
  categoria: string;
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
    categoria: "Eletrodomésticos",
    imagens: [
      "https://images.unsplash.com/photo-1544551763-7ef56a923595?q=80&w=600&auto=format&fit=crop",
    ],
    atualizadoEm: new Date().toISOString(),
  },
  {
    id: 2,
    titulo: "Sofá 3 lugares",
    cidade: "São José",
    estado: "SC",
    preco: 750,
    categoria: "Móveis",
    imagens: [
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
    categoria: "Esportes",
    imagens: [
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
    categoria: "Informática",
    imagens: [
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
    categoria: "Games",
    imagens: [
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
    categoria: "Móveis",
    imagens: [
      "https://images.unsplash.com/photo-1549187774-b4e9b0445b41?q=80&w=600&auto=format&fit=crop",
    ],
    atualizadoEm: new Date().toISOString(),
  },
];

export const metadata = {
  title: "Vitrine • Qwip",
  description: "Encontre anúncios locais e chame no WhatsApp.",
  openGraph: {
    title: "Vitrine • Qwip",
    description: "Encontre anúncios locais e chame no WhatsApp.",
    url: `${BASE_URL}/vitrine`,
    siteName: "Qwip",
    type: "website",
    locale: "pt_BR",
  },
};

export default async function VitrinePage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Vitrine</h1>

      <div className="space-y-5">
        {ADS.map((ad) => {
          const adUrl = `${BASE_URL}/anuncio/${ad.id}`;
          const whatsappUrl = buildWhatsAppUrl({
            phoneE164: "5548999999999", // troque por número real
            title: ad.titulo,
            adUrl,
          });

          return (
            <div key={ad.id} className="border rounded-lg p-4 flex gap-4">
              <div className="w-40 h-28 overflow-hidden rounded border">
                <img
                  src={ad.imagens[0]}
                  alt={ad.titulo}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1">
                <h2 className="text-lg font-semibold">{ad.titulo}</h2>
                <p className="text-sm text-gray-600">
                  {ad.cidade} - {ad.estado} • {ad.categoria}
                </p>
                <p className="mt-1 font-semibold">
                  R$ {ad.preco.toLocaleString("pt-BR")}
                </p>

                <div className="mt-3 flex flex-wrap gap-3">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded border bg-green-50 hover:bg-green-100 text-sm"
                  >
                    Chamar no WhatsApp
                  </a>
                  <Link
                    href={`/anuncio/${ad.id}`}
                    className="px-3 py-2 rounded border hover:bg-gray-50 text-sm"
                  >
                    Ver detalhes
                  </Link>
                  <span className="text-xs text-gray-500 self-center">
                    Atualizado em{" "}
                    {new Date(ad.atualizadoEm).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <Link href="/" className="underline text-sm">
          ← Voltar para a Home
        </Link>
      </div>
    </div>
  );
}
