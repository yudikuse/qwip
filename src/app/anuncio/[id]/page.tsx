'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

// --- Dados de exemplo ---------------------------------------------------------
// Se você já tem uma fonte de dados centralizada, pode deletar este bloco e
// usar seu import atual. Mantive aqui para o arquivo ser "plug-and-play".
type Ad = {
  id: number;
  title: string;
  city: string;
  state: string;
  category: string;
  condition: 'novo' | 'usado';
  price: number;
  phone: string; // WhatsApp
  description: string;
  updatedAt: string; // ISO ou data simples
  images?: string[]; // pode ter strings vazias
};

const ADS: Ad[] = [
  {
    id: 1,
    title: 'Geladeira Brastemp 375L',
    city: 'Florianópolis',
    state: 'SC',
    category: 'Eletrodomésticos',
    condition: 'usado',
    price: 1900,
    phone: '5599999999999',
    description:
      'Geladeira Brastemp em ótimo estado, 375L, frost free. Único dono. Motivo da venda: mudança.',
    updatedAt: '2025-08-27',
    images: [
      'https://images.unsplash.com/photo-1544551763-7ef420c5ea07?q=80&w=1200&auto=format&fit=crop',
      '', // <- vazio (exemplo) será ignorado
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop',
    ],
  },
  {
    id: 2,
    title: 'Sofá 3 lugares',
    city: 'São José',
    state: 'SC',
    category: 'Móveis',
    condition: 'usado',
    price: 750,
    phone: '5599999999999',
    description:
      'Sofá confortável, 3 lugares, tecido suede. Sem manchas. Inclui 2 almofadas.',
    updatedAt: '2025-08-27',
    images: [
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1520975922323-911d8b3f0b1b?q=80&w=1200&auto=format&fit=crop',
      '', // <- vazio (exemplo) será ignorado
    ],
  },
  {
    id: 3,
    title: 'Bicicleta aro 29',
    city: 'Florianópolis',
    state: 'SC',
    category: 'Esportes',
    condition: 'usado',
    price: 890,
    phone: '5599999999999',
    description: 'Bike aro 29, freio a disco, 21 marchas. Muito bem conservada.',
    updatedAt: '2025-08-27',
    images: [
      'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1200&auto=format&fit=crop',
    ],
  },
  {
    id: 4,
    title: 'Notebook i5 8GB/256GB',
    city: 'Palhoça',
    state: 'SC',
    category: 'Informática',
    condition: 'usado',
    price: 1650,
    phone: '5599999999999',
    description: 'Notebook i5, 8GB RAM, SSD 256GB. Bateria OK, ótimo estado.',
    updatedAt: '2025-08-27',
    images: [
      'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=1200&auto=format&fit=crop',
    ],
  },
  {
    id: 5,
    title: 'Cadeira gamer',
    city: 'Biguaçu',
    state: 'SC',
    category: 'Móveis',
    condition: 'usado',
    price: 520,
    phone: '5599999999999',
    description: 'Cadeira gamer preta/vermelha, com ajuste de altura.',
    updatedAt: '2025-08-27',
    images: [
      'https://images.unsplash.com/photo-1580906855280-95e1c9c62c4c?q=80&w=1200&auto=format&fit=crop',
      '',
    ],
  },
  {
    id: 6,
    title: 'Mesa de jantar 6 cadeiras',
    city: 'Florianópolis',
    state: 'SC',
    category: 'Móveis',
    condition: 'usado',
    price: 1200,
    phone: '5599999999999',
    description:
      'Mesa de jantar em madeira maciça com 6 cadeiras. Pequenos sinais de uso.',
    updatedAt: '2025-08-27',
    images: [
      'https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?q=80&w=1200&auto=format&fit=crop',
    ],
  },
];

function getAdById(id: number): Ad | undefined {
  return ADS.find((a) => a.id === id);
}

// --- Página -------------------------------------------------------------------

type PageProps = {
  params: { id: string };
};

export default function AnuncioPage({ params }: PageProps) {
  const adId = Number(params.id);
  const ad = getAdById(adId);

  // Fallback simples se não achar o anúncio
  if (!ad) {
    return (
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/vitrine" className="underline text-sm">
          ← Voltar para a Vitrine
        </Link>
        <h1 className="text-2xl font-semibold mt-6">Anúncio não encontrado</h1>
      </main>
    );
  }

  // 1) filtra imagens válidas (remove undefined, null e strings vazias)
  const validImages = useMemo(
    () => (ad.images ?? []).filter((src) => typeof src === 'string' && src.trim().length > 0),
    [ad.images]
  );

  // 2) define principal como a primeira imagem válida (se não houver, usa placeholder)
  const initialMain =
    validImages[0] ??
    'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?q=80&w=1200&auto=format&fit=crop';
  const [mainImage, setMainImage] = useState<string>(initialMain);

  // 3) miniaturas (só mostra se houver mais de 1 imagem válida)
  const thumbs = useMemo(
    () => validImages.slice(0, 6), // limite de miniaturas (se quiser)
    [validImages]
  );

  // WhatsApp
  const waMessage = encodeURIComponent(
    `Olá! Vi seu anúncio "${ad.title}" na Qwip. Ainda está disponível?`
  );
  const waHref = `https://wa.me/${ad.phone}?text=${waMessage}`;

  const priceBRL = ad.price.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/vitrine" className="underline text-sm">
        ← Voltar para a Vitrine
      </Link>

      <h1 className="text-3xl font-bold mt-6">{ad.title}</h1>
      <p className="text-gray-600">
        {ad.city} - {ad.state}
      </p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Imagem principal */}
        <div className="w-full">
          <div className="relative w-full aspect-[16/9] overflow-hidden rounded-lg border">
            <Image
              src={mainImage}
              alt={ad.title}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>

          {/* Miniaturas — APARECE APENAS se houver mais de 1 imagem válida */}
          {thumbs.length > 1 && (
            <div className="flex gap-3 mt-4">
              {thumbs.map((src, idx) => (
                <button
                  key={`${src}-${idx}`}
                  type="button"
                  onClick={() => setMainImage(src)}
                  className="relative w-24 aspect-square rounded-md overflow-hidden border focus:outline-none focus:ring-2 focus:ring-black/30"
                  title="Ver imagem"
                >
                  <Image
                    src={src}
                    alt={`thumbnail-${idx + 1}`}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Painel lateral */}
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <div className="text-2xl font-bold">{priceBRL}</div>
            <div className="text-sm text-gray-600 mt-1">
              {ad.category} • Estado: {ad.condition}
            </div>

            <div className="flex gap-3 mt-4">
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-md border bg-white hover:bg-gray-50"
              >
                Chamar no WhatsApp
              </a>

              <Link
                href={`/vitrine?cidade=${encodeURIComponent(ad.city)}&categoria=${encodeURIComponent(
                  ad.category
                )}`}
                className="px-4 py-2 rounded-md border bg-white hover:bg-gray-50"
              >
                Ver outros anúncios
              </Link>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="font-semibold mb-2">Descrição</div>
            <p className="text-gray-800">{ad.description}</p>
          </div>

          <div className="text-xs text-gray-500">
            Atualizado em {new Date(ad.updatedAt).toLocaleDateString('pt-BR')}
          </div>
        </div>
      </div>
    </main>
  );
}
