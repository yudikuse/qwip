'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

// ---- Tipos ----
type Draft = {
  title: string;
  priceDigits: string;
  description: string;
  imageDataUrl: string; // data:image/...
  createdAt: string;
};

type Ad = {
  id: string;
  title: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  createdAt: string;
  expiresAt: string | null;
};

// ---- Utils ----
function formatCentsBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    currencyDisplay: 'symbol',
  }).format(cents / 100);
}

export default function ConfirmarPage() {
  const router = useRouter();
  const qs = useSearchParams();

  const [draft, setDraft] = useState<Draft | null>(null);
  const [ad, setAd] = useState<Ad | null>(null);
  const [origin, setOrigin] = useState<string>('');

  // Captura a origem para montar links absolutos
  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);

  // Se veio ?id=..., buscamos o anúncio publicado; senão usamos o rascunho
  const adId = qs.get('id');

  useEffect(() => {
    if (adId) {
      fetch(`/api/ads/${adId}`, { cache: 'no-store' })
        .then(r => (r.ok ? r.json() : null))
        .then(data => setAd(data?.ad ?? null))
        .catch(() => setAd(null));
    } else {
      const raw = sessionStorage.getItem('qwip_draft_ad');
      if (!raw) {
        router.replace('/anunciar');
        return;
      }
      try {
        const d = JSON.parse(raw) as Draft;
        setDraft(d);
      } catch {
        router.replace('/anunciar');
      }
    }
  }, [adId, router]);

  // Dados de exibição unificados (published vs draft)
  const title = ad?.title ?? draft?.title ?? '';
  const description = ad?.description ?? draft?.description ?? '';
  const priceCents = ad?.priceCents ?? parseInt(draft?.priceDigits || '0', 10);
  const displayImage =
    ad?.imageUrl ??
    draft?.imageDataUrl ??
    ''; // pode ficar vazio (mostramos placeholder)

  const shareUrl = ad ? `${origin}/anuncio/${ad.id}` : 'Será gerado após publicar.';

  const caption = useMemo(() => {
    const lines = [
      '🔥 Tô vendendo! Olha que oferta boa! 📣',
      '',
      title,
      formatCentsBRL(priceCents),
      description ? `\n${description}` : '',
      ad ? `\n${shareUrl}` : '', // só inclui link se for anúncio publicado
    ];
    return lines.join('\n');
  }, [ad, description, priceCents, shareUrl, title]);

  function copy(text: string, okMsg: string) {
    navigator.clipboard.writeText(text).then(
      () => alert(okMsg),
      () => alert('Não foi possível copiar. Copie manualmente.')
    );
  }

  function openWhatsApp(text: string) {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  if (!title) return null;

  // ---- UI ----
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 rounded-full bg-emerald-500/15 p-3 ring-1 ring-emerald-400/40">
            <svg
              className="h-6 w-6 text-emerald-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Seu anúncio está pronto!</h1>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Agora é só compartilhar e começar a vender. Esta é a página de confirmação pós-publicação.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-12">
          {/* Esquerda */}
          <section className="md:col-span-7">
            {/* Card visual */}
            <div className="overflow-hidden rounded-2xl border border-white/10">
              {displayImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayImage}
                  alt={title}
                  className="h-64 w-full object-cover md:h-72"
                />
              ) : (
                <div className="flex h-64 w-full items-center justify-center text-sm text-muted-foreground md:h-72">
                  (Sem imagem)
                </div>
              )}

              <div className="space-y-3 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-400/30">
                    {formatCentsBRL(priceCents)}
                  </span>
                  <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-muted-foreground ring-1 ring-white/10">
                    Alcance local
                  </span>
                  <span className="rounded-md bg-white/5 px-2 py-1 text-xs text-muted-foreground ring-1 ring-white/10">
                    Válido por 24h
                  </span>
                </div>

                <h2 className="text-lg font-semibold">{title}</h2>
                {description ? (
                  <p className="text-sm text-muted-foreground">{description}</p>
                ) : null}
              </div>
            </div>

            {/* Mensagem */}
            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium">Mensagem a ser enviada</label>
              <textarea
                readOnly
                rows={9}
                className="min-h-[180px] w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
                value={caption}
              />
            </div>

            {/* Ações principais */}
            <div className="mt-4 flex flex-wrap gap-3">
              {/* Primário */}
              <button
                onClick={() => openWhatsApp(caption)}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold shadow-sm shadow-emerald-600/20 hover:bg-emerald-500"
              >
                Abrir no WhatsApp
              </button>

              {/* Secundário */}
              <button
                onClick={() => openWhatsApp(caption)}
                className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5"
              >
                Compartilhar em Grupo
              </button>

              {/* Tertiário */}
              <button
                onClick={() => copy(caption, 'Mensagem copiada!')}
                className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-white/5"
              >
                Copiar mensagem
              </button>

              <div className="ml-auto flex gap-3">
                <Link
                  href="/anunciar"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5"
                >
                  Voltar e editar
                </Link>

                <button
                  disabled
                  aria-disabled="true"
                  className="inline-flex cursor-not-allowed items-center justify-center rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-muted-foreground"
                >
                  Publicar (em breve)
                </button>
              </div>
            </div>
          </section>

          {/* Direita */}
          <aside className="md:col-span-5 md:pl-2">
            {/* Próximos passos */}
            <div className="rounded-2xl border border-white/10 p-4">
              <p className="mb-3 text-sm font-semibold text-muted-foreground">Próximos passos</p>

              <div className="space-y-3">
                <Link
                  href={ad ? `/anuncio/${ad.id}` : '#'}
                  aria-disabled={!ad}
                  className={
                    ad
                      ? 'flex w-full items-center justify-center rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5'
                      : 'flex w-full cursor-not-allowed items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-muted-foreground'
                  }
                >
                  Ver anúncio completo
                </Link>

                <button
                  onClick={() => openWhatsApp(caption)}
                  className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold shadow-sm shadow-emerald-600/20 hover:bg-emerald-500"
                >
                  Abrir no WhatsApp
                </button>

                <button
                  onClick={() => openWhatsApp(caption)}
                  className="flex w-full items-center justify-center rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5"
                >
                  Compartilhar em Grupo
                </button>

                <button
                  onClick={() => copy(shareUrl, 'Link copiado!')}
                  className="flex w-full items-center justify-center rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-white/5"
                >
                  Copiar Link
                </button>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="mt-4 rounded-2xl border border-white/10 p-4">
              <p className="mb-3 text-sm font-semibold text-emerald-400">Estatísticas previstas</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 p-3">
                  <p className="text-xs text-muted-foreground">Visualizações esperadas</p>
                  <p className="mt-1 text-sm font-semibold">150–300/dia</p>
                </div>
                <div className="rounded-xl border border-white/10 p-3">
                  <p className="text-xs text-muted-foreground">Taxa de conversão</p>
                  <p className="mt-1 text-sm font-semibold">8–15%</p>
                </div>
                <div className="rounded-xl border border-white/10 p-3">
                  <p className="text-xs text-muted-foreground">Tempo médio no site</p>
                  <p className="mt-1 text-sm font-semibold">2m 30s</p>
                </div>
                <div className="rounded-xl border border-white/10 p-3">
                  <p className="text-xs text-muted-foreground">Alcance local</p>
                  <p className="mt-1 text-sm font-semibold">&gt; 5 km</p>
                </div>
              </div>
            </div>

            {/* Link + máscara âmbar */}
            <div className="mt-4 rounded-2xl border border-amber-300/40 bg-amber-500/[0.06] p-4 relative overflow-hidden">
              <div
                className="pointer-events-none absolute inset-0 -z-10"
                style={{
                  background:
                    'radial-gradient(1100px 320px at 20% -10%, rgba(245, 158, 11, 0.22), transparent 62%)',
                }}
              />
              <p className="mb-3 text-sm font-semibold">Link do seu anúncio</p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 rounded-xl border border-amber-300/50 bg-amber-500/10 px-3 py-2 text-sm outline-none"
                />
                <button
                  onClick={() => copy(shareUrl, 'Link copiado!')}
                  className="rounded-xl border border-amber-300/60 bg-amber-500/20 px-3 py-2 text-sm font-semibold hover:bg-amber-500/30"
                >
                  Copiar
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Este link funciona em qualquer dispositivo e é otimizado para mecanismos de busca.
              </p>
            </div>

            {/* Dicas + máscara âmbar */}
            <div className="mt-4 rounded-2xl border border-amber-300/40 bg-amber-500/[0.07] p-4 relative overflow-hidden">
              <div
                className="pointer-events-none absolute inset-0 -z-10"
                style={{
                  background:
                    'radial-gradient(1200px 360px at 10% -10%, rgba(245, 158, 11, 0.26), transparent 64%)',
                }}
              />
              <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/25 text-amber-300 ring-1 ring-amber-300/40">
                  ⚡
                </span>
                Dicas para vender mais rápido
              </p>
              <ul className="space-y-2 text-sm">
                <li className="list-inside list-disc">
                  Responda em até <strong>5 minutos</strong> para aumentar as chances de venda.
                </li>
                <li className="list-inside list-disc">
                  Mostre detalhes importantes nas fotos (defeitos, medidas, etc.).
                </li>
                <li className="list-inside list-disc">
                  Seja flexível nos meios de pagamento e no local de encontro.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
