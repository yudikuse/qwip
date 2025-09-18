'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

type Draft = {
  title: string;
  priceDigits: string;
  description: string;
  imageDataUrl: string;
  createdAt: string;
};

type Config = {
  category: string;
  radiusKm: number;
  validityHours: number;
};

function formatCentsBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export default function ConfigurarPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [cfg, setCfg] = useState<Config>({
    category: 'Alimentação',
    radiusKm: 10,
    validityHours: 24,
  });

  useEffect(() => {
    const raw = sessionStorage.getItem('qwip_draft_ad');
    if (!raw) {
      router.replace('/anunciar');
      return;
    }
    try {
      setDraft(JSON.parse(raw) as Draft);

      // read old config if exists
      const prev = sessionStorage.getItem('qwip_draft_config');
      if (prev) setCfg(JSON.parse(prev) as Config);
    } catch {
      router.replace('/anunciar');
    }
  }, [router]);

  const cents = useMemo(
    () => (draft ? parseInt(draft.priceDigits || '0', 10) : 0),
    [draft]
  );

  function goNext() {
    sessionStorage.setItem('qwip_draft_config', JSON.stringify(cfg));
    router.push('/anunciar/confirmar');
  }

  if (!draft) return null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold">Configure seu anúncio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Otimize as informações para atrair mais compradores no seu bairro.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-[1.1fr,1fr]">
          {/* Formulário de configuração */}
          <div className="space-y-4 rounded-2xl border border-white/10 p-4">
            <div>
              <label className="block text-sm font-medium">Categoria</label>
              <select
                className="mt-1 w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm"
                value={cfg.category}
                onChange={(e) =>
                  setCfg((c) => ({ ...c, category: e.target.value }))
                }
              >
                <option>Alimentação</option>
                <option>Serviços</option>
                <option>Beleza & Estética</option>
                <option>Moda & Acessórios</option>
                <option>Casa & Jardim</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Raio de entrega / atendimento (km)</label>
              <input
                type="range"
                min={2}
                max={50}
                step={1}
                value={cfg.radiusKm}
                onChange={(e) =>
                  setCfg((c) => ({ ...c, radiusKm: parseInt(e.target.value, 10) }))
                }
                className="mt-3 w-full"
              />
              <p className="mt-1 text-sm text-muted-foreground">
                Alcance selecionado: <span className="font-semibold">{cfg.radiusKm} km</span>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium">Validade do anúncio</label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {[24, 48, 72].map((h) => (
                  <button
                    key={h}
                    onClick={() => setCfg((c) => ({ ...c, validityHours: h }))}
                    className={`rounded-xl border px-3 py-2 text-sm ${
                      cfg.validityHours === h
                        ? 'border-amber-400/40 bg-amber-400/10 text-amber-200'
                        : 'border-white/15 hover:bg-white/5'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={goNext}
                className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500"
              >
                Continuar
              </button>
            </div>
          </div>

          {/* Preview final (lado direito) */}
          <aside className="rounded-2xl border border-white/10 p-4">
            <p className="mb-3 text-sm font-medium">Preview Final</p>
            <div className="overflow-hidden rounded-xl border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {draft.imageDataUrl ? (
                <div className="relative">
                  <img
                    src={draft.imageDataUrl}
                    alt={draft.title}
                    className="h-56 w-full object-cover"
                  />
                  <span className="absolute left-2 top-2 rounded-md bg-amber-400/90 px-2 py-0.5 text-xs font-semibold text-black">
                    Oferta por tempo limitado
                  </span>
                  <span className="absolute bottom-2 left-2 rounded-md bg-emerald-600 px-2 py-0.5 text-xs font-semibold">
                    {formatCentsBRL(cents)}
                  </span>
                </div>
              ) : (
                <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                  (Sem imagem)
                </div>
              )}
            </div>

            <div className="mt-3">
              <h3 className="font-semibold">{draft.title}</h3>
              <p className="text-sm text-muted-foreground">{draft.description || '—'}</p>

              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-xl border border-white/10 p-2">
                  Plano: <span className="font-semibold">PRO</span>
                </div>
                <div className="rounded-xl border border-white/10 p-2">
                  Validade: <span className="font-semibold">{cfg.validityHours}h</span>
                </div>
                <div className="rounded-xl border border-white/10 p-2">
                  Raio: <span className="font-semibold">{cfg.radiusKm} km</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
