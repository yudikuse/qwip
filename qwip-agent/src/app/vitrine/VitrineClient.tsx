'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ADS } from '@/lib/ads';

function priceToNumber(brPrice: string) {
  // "R$ 1.900" -> 1900 ; "R$ 1.650" -> 1650
  const digits = brPrice.replace(/[^\d]/g, '');
  return Number(digits || '0');
}

function waLink(phone: string, title: string) {
  const text = encodeURIComponent(`Olá! Vi "${title}" na Qwip. Ainda está disponível?`);
  return `https://wa.me/${phone}?text=${text}`;
}

function useQueryState() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const set = (next: Record<string, string | null | undefined>) => {
    const sp = new URLSearchParams(search.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') sp.delete(k);
      else sp.set(k, String(v));
    });
    // sempre volta pra página 1 quando muda filtro
    if ('q' in next || 'loc' in next || 'min' in next || 'max' in next || 'size' in next) {
      sp.delete('p');
    }
    router.push(`${pathname}?${sp.toString()}`);
  };

  return { search, set };
}

export default function VitrineClient() {
  const { search, set } = useQueryState();

  const q = search.get('q') ?? '';
  const loc = search.get('loc') ?? 'all';
  const min = search.get('min') ?? '';
  const max = search.get('max') ?? '';
  const size = Number(search.get('size') ?? 6);
  const p = Math.max(1, Number(search.get('p') ?? 1));

  const locations = useMemo(() => {
    const setLoc = new Set<string>();
    ADS.forEach(a => setLoc.add(a.location));
    return Array.from(setLoc).sort();
  }, []);

  const filtered = useMemo(() => {
    let rows = ADS.map(a => ({ ...a, _price: priceToNumber(a.price) }));
    if (q) rows = rows.filter(a => a.title.toLowerCase().includes(q.toLowerCase()));
    if (loc !== 'all') rows = rows.filter(a => a.location === loc);
    if (min) rows = rows.filter(a => a._price >= Number(min.replace(/[^\d]/g, '')));
    if (max) rows = rows.filter(a => a._price <= Number(max.replace(/[^\d]/g, '')));
    return rows;
  }, [q, loc, min, max]);

  const total = filtered.length;
  const pageSize = !Number.isFinite(size) || size <= 0 ? 6 : size;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(p, totalPages);
  const start = (page - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  const clear = () =>
    set({ q: null, loc: null, min: null, max: null, p: '1', size: null });

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Vitrine</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 items-center mb-4">
        <input
          className="border rounded-lg px-3 py-2 w-[240px]"
          placeholder="Buscar por título..."
          defaultValue={q}
          onChange={(e) => set({ q: e.target.value })}
        />

        <select
          className="border rounded-lg px-3 py-2"
          value={loc}
          onChange={(e) => set({ loc: e.target.value })}
        >
          <option value="all">Todos os locais</option>
          {locations.map(l => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        <input
          className="border rounded-lg px-3 py-2 w-[140px]"
          placeholder="Preço mín. (R$)"
          inputMode="numeric"
          defaultValue={min}
          onChange={(e) => set({ min: e.target.value })}
        />
        <input
          className="border rounded-lg px-3 py-2 w-[140px]"
          placeholder="Preço máx. (R$)"
          inputMode="numeric"
          defaultValue={max}
          onChange={(e) => set({ max: e.target.value })}
        />

        <select
          className="border rounded-lg px-3 py-2"
          value={pageSize}
          onChange={(e) => set({ size: e.target.value })}
        >
          {[6, 9, 12, 18].map(n => (
            <option key={n} value={n}>{n}/página</option>
          ))}
        </select>

        <button
          className="border rounded-lg px-3 py-2"
          onClick={clear}
        >
          Limpar
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        {start + 1}–{Math.min(start + pageSize, total)} de {total} resultados.
      </p>

      {/* Lista */}
      <div className="grid gap-4 md:grid-cols-2">
        {pageRows.map(ad => (
          <div key={ad.id} className="border rounded-xl p-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-semibold">
                <Link href={`/anuncio/${ad.id}`} className="hover:underline">
                  {ad.title}
                </Link>
              </h3>
              <p className="text-gray-600 text-sm">{ad.location}</p>
              <p className="font-bold text-lg mt-2">{ad.price}</p>
            </div>

            <div className="mt-3 flex gap-3">
              <a
                href={waLink(ad.whatsapp, ad.title)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg border hover:bg-gray-50 text-sm"
              >
                Chamar no WhatsApp
              </a>

              <Link
                href={`/anuncio/${ad.id}`}
                className="px-3 py-2 rounded-lg border hover:bg-gray-50 text-sm"
              >
                Ver detalhes
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Paginação */}
      <div className="flex items-center gap-3 mt-6">
        <button
          className="border rounded-lg px-3 py-1 disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => set({ p: String(page - 1) })}
        >
          ← Anterior
        </button>
        <span className="text-sm text-gray-600">
          Página {page} de {totalPages}
        </span>
        <button
          className="border rounded-lg px-3 py-1 disabled:opacity-50"
          disabled={page >= totalPages}
          onClick={() => set({ p: String(page + 1) })}
        >
          Próxima →
        </button>
      </div>

      <div className="mt-8">
        <Link href="/" className="underline">← Voltar para a Home</Link>
      </div>
    </main>
  );
}
