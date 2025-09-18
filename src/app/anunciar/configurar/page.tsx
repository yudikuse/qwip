'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

type DraftBase = {
  title: string;
  priceDigits: string; // ex: "1850" = R$ 18,50
  description: string;
  imageDataUrl: string; // data:image/...
  createdAt: string;
};

type Config = {
  category: string;
  radiusKm: number;
  urgencyTimer: boolean;
  city?: string;
  uf?: string;
};

// helpers -------------------------------------------------------

function formatCentsBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    currencyDisplay: 'symbol',
  }).format(cents / 100);
}

function classNames(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(' ');
}

// page ----------------------------------------------------------

export default function ConfigurarPage() {
  const router = useRouter();

  const [draft, setDraft] = useState<DraftBase | null>(null);
  const [cfg, setCfg] = useState<Config>({
    category: '',
    radiusKm: 10,
    urgencyTimer: true,
  });

  // carrega rascunho e config salvos
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('qwip_draft_ad');
      if (!raw) {
        router.replace('/anunciar');
        return;
      }
      setDraft(JSON.parse(raw) as DraftBase);

      const rawCfg = sessionStorage.getItem('qwip_config_ad');
      if (rawCfg) {
        setCfg({ ...cfg, ...(JSON.parse(rawCfg) as Partial<Config>) });
      }
    } catch {
      router.replace('/anunciar');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // persiste config conforme o usuário mexe
  useEffect(() => {
    sessionStorage.setItem('qwip_config_ad', JSON.stringify(cfg));
  }, [cfg]);

  const cents = useMemo(
    () => (draft ? parseInt(draft.priceDigits || '0', 10) : 0),
    [draft]
  );

  // “Card” da direita (preview)
  const previewChips = [
    { text: 'Oferta por tempo limitado', tone: 'warning' as const },
    ...(cfg.city && cfg.uf ? [{ text: `${cfg.city}, ${cfg.uf}`, tone: 'neutral' as const }] : []),
    { text: `+ ${cfg.radiusKm}km`, tone: 'neutral' as const },
  ];

  // ações -------------------------------------------------------

  function handleContinue() {
    // Por enquanto só segue para a página “confirmar/compartilhar”.
    // No próximo passo ligamos aqui a publicação real -> salva id/url e empurra pra confirmar.
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

        <div className="mt-6 grid gap-6 md:grid-cols-[1.25fr,1fr]">
          {/* COLUNA ESQUERDA — formulário -------------------------------- */}
          <section className="rounded-2xl border border-white/10 p-4">
            {/* Abas fake (apenas visual por enquanto) */}
            <div className="mb-4 flex gap-2">
              {['Produto', 'Templates', 'Copy Coach', 'Avançado'].map((tab, i) => (
                <span
                  key={tab}
                  className={classNames(
                    'cursor-default rounded-xl px-3 py-1 text-sm',
                    i === 0
                      ? 'bg-white/10 font-semibold'
                      : 'border border-white/10 text-muted-foreground'
                  )}
                >
                  {tab}
                </span>
              ))}
            </div>

            {/* Campos do produto */}
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Título do anúncio *</label>
                <input
                  value={draft.title}
                  onChange={(e) => {
                    const v = e.target.value.slice(0, 80);
                    const next = { ...draft, title: v };
                    setDraft(next);
                    sessionStorage.setItem('qwip_draft_ad', JSON.stringify(next));
                  }}
                  className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
                  placeholder="Ex.: Marmita Caseira com Entrega"
                />
                <p className="mt-1 text-xs text-muted-foreground">0/80 caracteres</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Preço (R$) *</label>
                  <input
                    inputMode="numeric"
                    value={draft.priceDigits}
                    onChange={(e) => {
                      const digits = (e.target.value || '').replace(/\D/g, '');
                      const next = { ...draft, priceDigits: digits };
                      setDraft(next);
                      sessionStorage.setItem('qwip_draft_ad', JSON.stringify(next));
                    }}
                    className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
                    placeholder="Ex.: 18,50"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Valor atual: {formatCentsBRL(cents)}
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Categoria</label>
                  <select
                    value={cfg.category}
                    onChange={(e) => setCfg((s) => ({ ...s, category: e.target.value }))}
                    className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
                  >
                    <option value="">Selecione…</option>
                    <option value="alimentacao">Alimentação</option>
                    <option value="servicos">Serviços</option>
                    <option value="beleza">Beleza</option>
                    <option value="utilidades">Utilidades</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Descrição detalhada *</label>
                <textarea
                  rows={6}
                  value={draft.description}
                  onChange={(e) => {
                    const next = { ...draft, description: e.target.value.slice(0, 500) };
                    setDraft(next);
                    sessionStorage.setItem('qwip_draft_ad', JSON.stringify(next));
                  }}
                  className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
                  placeholder="Conte os detalhes importantes do produto/serviço…"
                />
                <p className="mt-1 text-xs text-muted-foreground">0/500 caracteres</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Raio de alcance</label>
                  <input
                    type="range"
                    min={1}
                    max={20}
                    value={cfg.radiusKm}
                    onChange={(e) => setCfg((s) => ({ ...s, radiusKm: Number(e.target.value) }))}
                    className="w-full"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Atinge compradores até <strong>{cfg.radiusKm} km</strong> de distância.
                  </p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Timer de urgência</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCfg((s) => ({ ...s, urgencyTimer: !s.urgencyTimer }))}
                      className={classNames(
                        'rounded-xl px-3 py-2 text-sm font-semibold border',
                        cfg.urgencyTimer
                          ? 'bg-emerald-600 border-emerald-500 hover:bg-emerald-500'
                          : 'border-white/15 hover:bg-white/5'
                      )}
                    >
                      {cfg.urgencyTimer ? 'Ativo' : 'Inativo'}
                    </button>
                    <span className="text-xs text-muted-foreground">
                      Mostra etiqueta “oferta por tempo limitado”.
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleContinue}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500"
                >
                  Salvar e continuar
                </button>
              </div>
            </div>
          </section>

          {/* COLUNA DIREITA — preview + resumo ---------------------------- */}
          <aside className="space-y-6">
            <section className="rounded-2xl border border-white/10 p-4">
              <p className="mb-3 text-sm font-medium">Preview Final</p>

              <div className="overflow-hidden rounded-xl border border-white/10">
                {draft.imageDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={draft.imageDataUrl}
                    alt={draft.title || 'Prévia da imagem'}
                    className="h-56 w-full object-cover md:h-64"
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">
                    (Prévía da imagem)
                  </div>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {cfg.urgencyTimer && (
                  <span className="rounded-md bg-amber-400/15 px-2 py-0.5 text-xs font-medium text-amber-300">
                    Oferta por tempo limitado
                  </span>
                )}
                {previewChips
                  .filter((c) => c.tone === 'neutral')
                  .map((c) => (
                    <span
                      key={c.text}
                      className="rounded-md border border-white/10 px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {c.text}
                    </span>
                  ))}
              </div>

              <div className="mt-2">
                <h3 className="text-lg font-semibold">{draft.title || 'Título do anúncio'}</h3>
                <div className="text-emerald-400">{formatCentsBRL(cents)}</div>
                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                  {draft.description || 'Descrição breve aparecerá aqui.'}
                </p>
              </div>

              <div className="mt-3">
                <button
                  disabled
                  className="w-full cursor-not-allowed rounded-xl bg-emerald-600/20 px-3 py-2 text-center text-sm font-semibold text-emerald-300"
                  title="Prévia"
                >
                  Entrar em contato
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 p-4">
              <p className="mb-3 text-sm font-medium">Resumo da configuração</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-white/10 p-3">
                  <p className="text-muted-foreground">Plano:</p>
                  <p className="mt-1 font-semibold">PRO</p>
                </div>
                <div className="rounded-xl border border-white/10 p-3">
                  <p className="text-muted-foreground">Template:</p>
                  <p className="mt-1 font-semibold">Moderno</p>
                </div>
                <div className="rounded-xl border border-white/10 p-3">
                  <p className="text-muted-foreground">Validade:</p>
                  <p className="mt-1 font-semibold">24 horas</p>
                </div>
                <div className="rounded-xl border border-white/10 p-3">
                  <p className="text-muted-foreground">Raio alcance:</p>
                  <p className="mt-1 font-semibold">{cfg.radiusKm} km</p>
                </div>
                <div className="rounded-xl border border-white/10 p-3">
                  <p className="text-muted-foreground">Timer urgência:</p>
                  <p className="mt-1 font-semibold">{cfg.urgencyTimer ? 'Ativo' : 'Inativo'}</p>
                </div>
                <div className="rounded-xl border border-white/10 p-3">
                  <p className="text-muted-foreground">Categoria:</p>
                  <p className="mt-1 font-semibold">{cfg.category || '—'}</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
