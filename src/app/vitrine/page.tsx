// src/app/vitrine/page.tsx
type Ad = {
  id: number;
  title: string;
  price: string;
  img: string;
  expiresIn: string;
};

const mockAds: Ad[] = Array.from({ length: 8 }).map((_, i) => ({
  id: i + 1,
  title: ["Sofá 3 lugares", "MacBook Pro M2", "Vestido Floral", "Pizza Artesanal"][
    i % 4
  ],
  price: ["R$ 1.200,00", "R$ 8.500,00", "R$ 89,00", "R$ 45,00"][i % 4],
  // pode trocar depois por assets próprios; por enquanto usamos picsum
  img: `https://picsum.photos/seed/qwip-${i}/600/400`,
  expiresIn: ["8h", "24h", "2d", "12h"][i % 4],
}));

export default function VitrinePage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-6xl mx-auto px-6 py-10">
        <header className="flex items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Vitrine Local</h1>
          <a
            href="/"
            className="text-sm text-slate-600 hover:text-black underline"
          >
            ← Voltar para Home
          </a>
        </header>

        {/* filtros simples (placeholder) */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button className="px-3 py-1 rounded-full border text-sm">Tudo</button>
          <button className="px-3 py-1 rounded-full border text-sm">Até 5km</button>
          <button className="px-3 py-1 rounded-full border text-sm">
            Expiram hoje
          </button>
          <button className="px-3 py-1 rounded-full border text-sm">
            Preço ↑
          </button>
        </div>

        {/* grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {mockAds.map((ad) => (
            <article
              key={ad.id}
              className="rounded-xl overflow-hidden border hover:shadow-md transition"
            >
              <div className="relative">
                <img
                  src={ad.img}
                  alt={ad.title}
                  className="aspect-[4/3] w-full object-cover"
                  loading="lazy"
                />
                <span className="absolute left-3 top-3 text-xs bg-black/80 text-white px-2 py-1 rounded">
                  Expira em {ad.expiresIn}
                </span>
              </div>

              <div className="p-4">
                <h3 className="font-semibold truncate">{ad.title}</h3>
                <p className="text-slate-700">{ad.price}</p>

                <div className="mt-3 flex items-center gap-2">
                  <a
                    href="https://wa.me/00000000000"
                    target="_blank"
                    className="flex-1 text-center px-3 py-2 rounded-lg bg-green-600 text-white text-sm hover:opacity-90"
                  >
                    WhatsApp
                  </a>
                  <button className="px-3 py-2 rounded-lg border text-sm">
                    Boost R$ 0,49
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
