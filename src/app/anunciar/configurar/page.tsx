'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

/** === Tipos === */
type DraftBase = {
  title: string;
  priceDigits: string; // "1850" => R$ 18,50
  description: string;
  imageDataUrl: string; // data:image/...
  createdAt: string;
  // vindos da etapa anterior (/anunciar)
  city?: string;
  uf?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
};

type Config = {
  category: string;
  radiusKm: number;
  urgencyTimer: boolean;
  city?: string;
  uf?: string;
};

type LogoPrefs = {
  enabled: boolean;
  dataUrl: string | null;
  pos: 'br' | 'bl' | 'tr' | 'tl';
  sizePct: number; // % da largura da imagem exportada
};

/** === Utils === */
function classNames(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(' ');
}
function formatCentsBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    currencyDisplay: 'symbol',
  }).format((cents || 0) / 100);
}

/** === Página === */
export default function ConfigurarPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftBase | null>(null);
  const [cfg, setCfg] = useState<Config>({
    category: '',
    radiusKm: 10,
    urgencyTimer: true,
    city: '',
    uf: '',
  });

  // preferências da LOGO
  const [logo, setLogo] = useState<LogoPrefs>({
    enabled: false,
    dataUrl: null,
    pos: 'br',
    sizePct: 12,
  });

  const [loading, setLoading] = useState(false);

  /** Carrega draft e cfg do sessionStorage; usa cidade/UF/raio vindos da etapa anterior por padrão */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('qwip_draft_ad');
      if (!raw) {
        router.replace('/anunciar');
        return;
      }
      const d = JSON.parse(raw) as DraftBase;
      setDraft(d);

      // Config gravada (se houver)
      const rawCfg = sessionStorage.getItem('qwip_config_ad');
      const prevCfg = rawCfg ? (JSON.parse(rawCfg) as Partial<Config>) : {};

      setCfg((s) => ({
        category: prevCfg.category ?? s.category,
        urgencyTimer: prevCfg.urgencyTimer ?? s.urgencyTimer,
        // Padrões vindos do draft (tela anterior):
        city: prevCfg.city ?? d.city ?? s.city,
        uf: prevCfg.uf ?? d.uf ?? s.uf,
        radiusKm: prevCfg.radiusKm ?? d.radiusKm ?? s.radiusKm,
      }));

      // Logo prefs (se houver)
      const enabled = sessionStorage.getItem('qwip_logo_enabled') === '1';
      const dataUrl = sessionStorage.getItem('qwip_logo_dataurl');
      const pos = (sessionStorage.getItem('qwip_logo_pos') ?? 'br') as LogoPrefs['pos'];
      const sizePct = Number(sessionStorage.getItem('qwip_logo_size') ?? '12');
      setLogo({ enabled, dataUrl: dataUrl || null, pos, sizePct });
    } catch {
      router.replace('/anunciar');
    }
  }, [router]);

  /** Persiste cfg */
  useEffect(() => {
    sessionStorage.setItem('qwip_config_ad', JSON.stringify(cfg));
  }, [cfg]);

  /** Persiste preferências da LOGO (lidas no editor para fundir na foto) */
  useEffect(() => {
    sessionStorage.setItem('qwip_logo_enabled', logo.enabled ? '1' : '0');
    if (logo.dataUrl) sessionStorage.setItem('qwip_logo_dataurl', logo.dataUrl);
    else sessionStorage.removeItem('qwip_logo_dataurl');
    sessionStorage.setItem('qwip_logo_pos', logo.pos);
    sessionStorage.setItem('qwip_logo_size', String(logo.sizePct));
  }, [logo]);

  const cents = useMemo(
    () => (draft ? parseInt(draft.priceDigits || '0', 10) : 0),
    [draft]
  );

  const previewChips = [
    cfg.urgencyTimer ? { text: 'Oferta por tempo limitado', tone: 'warning' as const } : null,
    cfg.city && cfg.uf ? { text: `${cfg.city}, ${cfg.uf}`, tone: 'neutral' as const } : null,
    { text: `+ ${cfg.radiusKm}km`, tone: 'neutral' as const },
  ].filter(Boolean) as { text: string; tone: 'warning' | 'neutral' }[];

  /** Upload da LOGO */
  function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const okType = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(f.type);
    if (!okType) {
      alert('Formato inválido. Use PNG, JPG, WEBP ou SVG.');
      e.target.value = '';
      return;
    }
    if (f.size > 3 * 1024 * 1024) {
      alert('Logomarca muito grande. Máximo 3MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogo((s) => ({ ...s, dataUrl: String(reader.result || '') }));
    reader.readAsDataURL(f);
  }

  /** Publicar (MVP: envia dataURL como imageUrl; a fusão da logo já é feita no editor ao aplicar) */
  async function handleContinue() {
    if (!draft) return;
    if (!draft.title?.trim() || !draft.priceDigits) {
      alert('Preencha título e preço.');
      return;
    }
    if (!cfg.city || !cfg.uf) {
      alert('Informe Cidade e UF.');
      return;
    }

    setLoading(true);
    try {
      // payload
      const payload = {
        title: draft.title.trim(),
        description: draft.description.trim(),
        priceCents: parseInt(draft.priceDigits, 10) || 0,
        imageUrl: draft.imageDataUrl || null,
        city: cfg.city || null,
        uf: cfg.uf || null,
        radiusKm: Number(cfg.radiusKm) || 10,
      };

      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'Falha ao publicar.');
      }

      const data = (await res.json()) as { ok: boolean; id: string };
      const id = data?.id;
      if (!id) throw new Error('Resposta sem id.');

      const url = `${location.origin}/anuncio/${id}`;
      sessionStorage.setItem('qwip_published_ad', JSON.stringify({ id, url }));

      router.push('/anunciar/confirmar');
    } catch (e: any) {
      console.error(e);
      alert(e?.message || 'Erro ao publicar.');
    } finally {
      setLoading(false);
    }
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
          {/* ESQUERDA */}
          <section className="rounded-2xl border border-white/10 p-4">
            <div className="mb-4 flex gap-2">
              {['Produto', 'Templates', 'Copy Coach', 'Avançado'].map((tab, i) => (
                <span
                  key={tab}
                  className={classNames(
                    'cursor-default rounded-xl px-3 py-1 text-sm',
                    i === 0 ? 'bg-white/10 font-semibold' : 'border border-white/10 text-muted-foreground'
                  )}
                >
                  {tab}
                </span>
              ))}
            </div>

            <div className="space-y-4">
              {/* Título */}
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
                <p className="mt-1 text-xs text-muted-foreground">{draft.title.length}/80 caracteres</p>
              </div>

              {/* Preço + Categoria */}
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
                    placeholder="Ex.: 1850 para R$ 18,50"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Valor atual: {formatCentsBRL(parseInt(draft.priceDigits || '0'))}</p>
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

              {/* Cidade/UF (pré-preenchidos da etapa anterior) */}
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Cidade *</label>
                  <input
                    value={cfg.city || ''}
                    onChange={(e) => setCfg((s) => ({ ...s, city: e.target.value }))}
                    className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
                    placeholder="Ex.: Rio Verde"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">UF *</label>
                  <select
                    value={cfg.uf || ''}
                    onChange={(e) => setCfg((s) => ({ ...s, uf: e.target.value }))}
                    className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
                  >
                    <option value="">UF…</option>
                    {['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'].map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Descrição */}
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
                <p className="mt-1 text-xs text-muted-foreground">{draft.description.length}/500 caracteres</p>
              </div>

              {/* Raio + Timer */}
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
                    Atinge compradores até <strong>{cfg.radiusKm} km</strong>.
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

              {/* LOGO DO VENDEDOR */}
              <div className="rounded-xl border border-white/10 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Logomarca do vendedor</p>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={logo.enabled}
                      onChange={(e) => setLogo((s) => ({ ...s, enabled: e.target.checked }))}
                    />
                    Incluir na imagem do anúncio
                  </label>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-[1fr,1fr]">
                  <div>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={onLogoChange}
                      className="block w-full cursor-pointer rounded-xl border border-white/15 bg-[#0f1115] px-3 py-2 text-sm"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      PNG com fundo transparente recomendado.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Posição</label>
                      <div className="grid grid-cols-4 gap-1">
                        {([
                          ['tl','↖︎'],['tr','↗︎'],['bl','↙︎'],['br','↘︎'],
                        ] as [LogoPrefs['pos'], string][]).map(([p, label]) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setLogo((s) => ({ ...s, pos: p }))}
                            className={classNames(
                              'rounded-md border px-2 py-1 text-sm',
                              logo.pos === p ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300' : 'border-white/10'
                            )}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">Tamanho (%)</label>
                      <input
                        type="range"
                        min={5}
                        max={40}
                        value={logo.sizePct}
                        onChange={(e) => setLogo((s) => ({ ...s, sizePct: Number(e.target.value) }))}
                        className="w-full"
                      />
                      <div className="mt-1 text-xs text-muted-foreground">{logo.sizePct}% da largura</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleContinue}
                  disabled={loading}
                  className={classNames(
                    'rounded-xl px-4 py-2 text-sm font-semibold',
                    loading ? 'bg-white/10 cursor-not-allowed text-muted-foreground' : 'bg-emerald-600 hover:bg-emerald-500'
                  )}
                >
                  {loading ? 'Publicando…' : 'Salvar e continuar'}
                </button>
              </div>
            </div>
          </section>

          {/* DIREITA */}
          <aside className="space-y-6">
            <section className="rounded-2xl border border-white/10 p-4">
              <p className="mb-3 text-sm font-medium">Preview Final</p>
              <div className="relative overflow-hidden rounded-xl border border-white/10">
                {draft.imageDataUrl ? (
                  <>
                    {/* imagem base */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={draft.imageDataUrl}
                      alt={draft.title || 'Prévia da imagem'}
                      className="h-56 w-full object-cover md:h-64"
                    />
                    {/* overlay da LOGO (apenas visual) */}
                    {logo.enabled && logo.dataUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={logo.dataUrl}
                        alt="Logo"
                        className={classNames(
                          'pointer-events-none absolute max-h-[30%] max-w-[30%]',
                          logo.pos === 'br' && 'right-2 bottom-2',
                          logo.pos === 'bl' && 'left-2 bottom-2',
                          logo.pos === 'tr' && 'right-2 top-2',
                          logo.pos === 'tl' && 'left-2 top-2'
                        )}
                        style={{ width: `${logo.sizePct}%` }}
                      />
                    ) : null}
                  </>
                ) : (
                  <div className="flex h-56 items-center justify-center text-sm text-muted-foreground md:h-64">
                    (Prévia da imagem)
                  </div>
                )}
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                {previewChips.map((c) =>
                  c.tone === 'warning' ? (
                    <span key={c.text} className="rounded-md bg-amber-400/15 px-2 py-0.5 text-xs font-medium text-amber-300">
                      {c.text}
                    </span>
                  ) : (
                    <span key={c.text} className="rounded-md border border-white/10 px-2 py-0.5 text-xs text-muted-foreground">
                      {c.text}
                    </span>
                  )
                )}
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
