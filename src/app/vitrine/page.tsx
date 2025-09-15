import Link from 'next/link';
import UfSelect from '@/components/UfSelect';
import CitySelect from '@/components/CitySelect';
import { headers } from 'next/headers';

// se quiser desligar os filtros avançados no plano básico, use a env:
// NEXT_PUBLIC_ADV_FILTERS=false
const ADV = process.env.NEXT_PUBLIC_ADV_FILTERS !== 'false';

export default async function VitrinePage() {
  // headers() é assíncrono no Next 15 (só usamos se precisar de baseUrl)
  await headers();

  // TODO: seu fetch de anúncios aqui

  // Nota: os selects abaixo são client-only, então envolvemos em um .client
  // Você pode isolar num componente client, se preferir.

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Vitrine</h1>
          <Link href="/anunciar" className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-[#0F1115] hover:bg-emerald-500">
            Criar anúncio
          </Link>
        </div>

        {ADV ? (
          <ClientFilters />
        ) : (
          <p className="text-sm text-zinc-400">Filtros avançados disponíveis no plano Business.</p>
        )}

        {/* TODO: sua grid de cards */}
      </div>
    </main>
  );
}

// --- client sub-tree
'use client';
import { useState } from 'react';

function ClientFilters() {
  const [uf, setUf] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);

  return (
    <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
      <UfSelect value={uf} onChange={(v) => { setUf(v); setCity(null); }} />
      <CitySelect uf={uf} value={city} onChange={setCity} />
      {/* Exemplo de botão que dispararia a busca */}
      <button
        type="button"
        className="rounded-md bg-white/10 px-3 py-2 text-sm hover:bg-white/15"
        onClick={() => {
          // aqui você chama sua rota /api/ads/search usando uf/city
          // fetch(`/api/ads/search?uf=${uf ?? ''}&city=${city ?? ''}`)
        }}
      >
        Buscar
      </button>
    </div>
  );
}
