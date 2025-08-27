// src/app/anuncio/[id]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { ADS, getAd } from "@/lib/ads";

function waLink(phone: string, title: string) {
  const text = encodeURIComponent(`Olá! Vi "${title}" na Qwip. Ainda está disponível?`);
  return `https://wa.me/${phone}?text=${text}`;
}

// gera rotas estáticas (ótimo pra SEO)
export async function generateStaticParams() {
  return ADS.map(a => ({ id: a.id }));
}

// metadados por anúncio
export async function generateMetadata({ params }: { params: { id: string } }) {
  const ad = getAd(params.id);
  if (!ad) return { title: "Anúncio não encontrado" };
  const title = `${ad.title} — Qwip`;
  const description = `${ad.title} em ${ad.location} por ${ad.price}`;
  return {
    title,
    description,
    openGraph: { title, description },
    twitter: { title, description, card: "summary_large_image" },
  };
}

export default function Page({ params }: { params: { id: string } }) {
  const ad = getAd(params.id);
  if (!ad) notFound();

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{ad.title}</h1>
      <p className="text-gray-600 mt-1">{ad.location}</p>
      <p className="text-2xl font-bold mt-4">{ad.price}</p>

      <div className="mt-6 flex gap-3">
        <a
          href={waLink(ad.whatsapp, ad.title)}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-lg border hover:bg-gray-50"
        >
          Chamar no WhatsApp
        </a>
        <Link href="/vitrine" className="px-4 py-2 rounded-lg border hover:bg-gray-50">
          ← Voltar para a Vitrine
        </Link>
      </div>

      {/* Se quiser, coloque descrição e imagens aqui */}
      {ad.description && <p className="mt-6 text-gray-700">{ad.description}</p>}
    </main>
  );
}
