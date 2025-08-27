// src/app/vitrine/page.tsx
import Link from "next/link";

type Ad = {
  id: string;
  title: string;
  price: string;
  location: string;
  whatsapp: string; // E.164 ex: 5548999999999
};

const ADS: Ad[] = [
  { id: "1", title: "Geladeira Brastemp 375L", price: "R$ 1.900", location: "Florianópolis - SC", whatsapp: "5548999999999" },
  { id: "2", title: "Sofá 3 lugares",           price: "R$ 750",    location: "São José - SC",     whatsapp: "5548988888888" },
  { id: "3", title: "Notebook i5 8GB/256GB",    price: "R$ 1.650",  location: "Palhoça - SC",      whatsapp: "5548977777777" },
  { id: "4", title: "Bicicleta aro 29",         price: "R$ 890",    location: "Florianópolis - SC", whatsapp: "5548966666666" },
  { id: "5", title: "Cadeira gamer",            price: "R$ 520",    location: "Biguaçu - SC",       whatsapp: "5548955555555" },
  { id: "6", title: "Mesa de jantar 6 cadeiras",price: "R$ 1.200",  location: "Florianópolis - SC", whatsapp: "5548944444444" },
];

function waLink(phone: string, title: string) {
  const text = encodeURIComponent(`Olá! Vi "${title}" na Qwip. Ainda está disponível?`);
  return `https://wa.me/${phone}?text=${text}`;
}

export default function VitrinePage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-6">
        Vitrine (placeholder funcional)
      </h1>

      {/* Grid de anúncios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {ADS.map((ad) => (
          <div key={ad.id} className="rounded-2xl border p-4 shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-semibold">{ad.title}</h3>
            <p className="text-gray-600 mt-1">{ad.location}</p>
            <p className="text-xl font-bold mt-3">{ad.price}</p>

            <div className="mt-4 flex gap-2">
              <a
                href={waLink(ad.whatsapp, ad.title)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg border hover:bg-gray-50"
              >
                Chamar no WhatsApp
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <Link href="/" className="text-sm underline">
          ← Voltar para a Home
        </Link>
      </div>
    </main>
  );
}
