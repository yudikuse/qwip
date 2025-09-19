'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type Draft = {
  title: string;
  priceDigits: string;
  description: string;
  imageDataUrl: string;
  createdAt: string;
};

function formatCentsBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    currencyDisplay: "symbol",
  }).format(cents / 100);
}


export default function ConfirmarPage() {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [published, setPublished] = useState<{ id: string; url: string } | null>(null);

  useEffect(() => {
    try {
      const d = sessionStorage.getItem('qwip_draft_ad');
      if (d) setDraft(JSON.parse(d) as Draft);
      const p = sessionStorage.getItem('qwip_published_ad');
      if (p) setPublished(JSON.parse(p));
    } catch {}
  }, []);

  const cents = useMemo(() => (draft ? parseInt(draft.priceDigits || '0', 10) : 0), [draft]);

  const caption = useMemo(() => {
    if (!draft) return '';
    const price = formatCentsBRL(parseInt(draft.priceDigits || '0', 10));
    const lines = [
      '🔥 Tô vendendo! Olha que oferta boa! 📢',
      '',
      draft.title,
      price,
      draft.description ? `\n${draft.description}` : '',
      published?.url || '',
    ];
    return lines.join('\n').trim();
  }, [draft, published?.url]);

  if (!draft) return null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-4 rounded-xl border border-emerald-700/40 bg-emerald-900/20 px-4 py-3 text-sm">
          <span className="font-semibold">Seu anúncio está pronto!</span>{' '}
          Agora é só compartilhar. Seu anúncio já está publicado e otimizado.
        </div>

        <div className="grid gap-6 md:grid-cols-[1.25fr,1fr]">
          {/* ESQUERDA: cartão + mensagem */}
          <section className="rounded-2xl border border-white/10 p-4">
            <div className="overflow-hidden rounded-xl border border-white/10">
              {draft.imageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.imageDataUrl} alt={draft.title} className="h-64 w-full object-cover" />
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                  (Sem imagem)
                </div>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-md bg-emerald-600/20 px-2 py-0.5 font-medium text-emerald-300">
                {formatCentsBRL(cents)}
              </span>
              <span className="rounded-md border border-white/10 px-2 py-0.5 text-muted-foreground">
                Alcance local
              </span>
              <span className="rounded-md border border-white/10 px-2 py-0.5 text-muted-foreground">
                Válido por 24h
              </span>
            </div>

            <h2 className="mt-2 text-lg font-semibold">{draft.title}</h2>
            {draft.description ? (
              <p className="mt-1 text-sm text-muted-foreground">{draft.description}</p>
            ) : null}

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium">Mensagem a ser enviada</label>
              <textarea
                readOnly
                rows={10}
                className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
                value={caption}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(caption)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold hover:bg-emerald-500"
              >
                Abrir no WhatsApp
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(caption)}
                className="inline-flex items-center justify-center rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5"
              >
                Copiar mensagem
              </button>
            </div>

            <div className="mt-4">
              <Link
                href="/anunciar"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5"
              >
                Criar outro anúncio
              </Link>
            </div>
          </section>

          {/* DIREITA: próximos passos / stats / link / dicas */}
          <aside className="space-y-6">
            <section className="rounded-2xl border border-white/10 p-4">
              <p className="mb-3 text-sm font-medium">Próximos passos</p>
              <div className="grid gap-3">
                {published?.url && (
                  <a
                    href={published.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5"
                  >
                    Ver anúncio completo
                  </a>
                )}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(caption)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold hover:bg-emerald-500"
                >
                  Abrir no WhatsApp
                </a>
                <button
                  onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(caption)}`, '_blank')}
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5"
                >
                  Compartilhar em Grupo
                </button>
                <button
                  onClick={() => published?.url && navigator.clipboard.writeText(published.url)}
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5"
                >
                  Copiar Link
                </button>
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 p-4">
              <p className="mb-3 text-sm font-medium">Estatísticas previstas</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-white/10 p-3">
                  <p className="text-muted-foreground">Visualizações esperadas</p>
                  <p className="mt-1 font-semibold">150–300/dia</p>
                </div>
                <div className="rounded-xl border border-white/10 p-3">
                  <p className="text-muted-foreground">Taxa de conversão</p>
                  <p className="mt-1 font-semibold">8–15%</p>
                </div>
                <div className="rounded-xl border border-white/10 p-3">
                  <p className="text-muted-foreground">Tempo médio no site</p>
                  <p className="mt-1 font-semibold">2m 30s</p>
                </div>
                <div className="rounded-xl border border-white/10 p-3">
                  <p className="text-muted-foreground">Alcance local</p>
                  <p className="mt-1 font-semibold">&gt; 5 km</p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-amber-400/25 bg-amber-400/5 p-4">
              <p className="mb-1 text-sm font-medium">⚡ Dicas para vender mais rápido</p>
              <ul className="list-disc space-y-1 pl-5 text-sm">
                <li>Responda em até 5 minutos para aumentar as chances de venda.</li>
                <li>Mostre detalhes importantes nas fotos (defeitos, medidas, etc.).</li>
                <li>Seja flexível nos meios de pagamento e no local de encontro.</li>
              </ul>
            </section>

            <section className="rounded-2xl border border-white/10 p-4">
              <p className="mb-2 text-sm font-medium">Link do seu anúncio</p>
              <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-2">
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={published?.url || 'Será gerado após publicar.'}
                    className="w-full bg-transparent px-2 py-1 text-sm outline-none"
                  />
                  <button
                    onClick={() => published?.url && navigator.clipboard.writeText(published.url)}
                    className="rounded-lg border border-white/15 px-2 py-1 text-sm hover:bg-white/5"
                  >
                    Copiar
                  </button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Este link funciona em qualquer dispositivo e é otimizado para mecanismos de busca.
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
