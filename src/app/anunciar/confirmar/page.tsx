'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type Draft = {
  title: string;
  priceDigits: string;
  description: string;
  imageDataUrl: string; // data:image/...
  createdAt: string;
};

function formatCentsBRL(cents: number) {
  // ✅ currency aparece só uma vez (erro do build era chave duplicada)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    currencyDisplay: 'symbol',
  }).format(cents / 100);
}

export default function ConfirmarPublicadoPage() {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [adUrl, setAdUrl] = useState<string>('');

  useEffect(() => {
    // 1) resgata o rascunho (apenas para desenhar o cartão)
    const raw = sessionStorage.getItem('qwip_draft_ad');
    if (raw) {
      try {
        setDraft(JSON.parse(raw) as Draft);
      } catch {
        /* ignore */
      }
    }

    // 2) tenta descobrir o link REAL já publicado
    const u1 = sessionStorage.getItem('qwip_last_ad_url');
    const u2 = sessionStorage.getItem('qwip_published_ad_url');
    const id = sessionStorage.getItem('qwip_last_ad_id');

    let url = u1 || u2 || '';
    if (!url && id && typeof window !== 'undefined') {
      url = `${location.origin}/anuncio/${id}`;
    }
    setAdUrl(url);
  }, []);

  const cents = useMemo(
    () => (draft ? parseInt(draft.priceDigits || '0', 10) : 0),
    [draft]
  );

  const caption = useMemo(() => {
    if (!draft) return '';
    const price = formatCentsBRL(parseInt(draft.priceDigits || '0', 10));
    const lines = [
      `🔥 Tô vendendo! Olha que oferta boa!`,
      '',
      `${draft.title}`,
      `${price}`,
      draft.description ? `\n${draft.description}` : '',
      adUrl ? `\n${adUrl}` : '',
    ];
    return lines.join('\n');
  }, [draft, adUrl]);

  function copy(text: string) {
    navigator.clipboard.writeText(text).catch(() => {
      alert('Não foi possível copiar. Copie manualmente.');
    });
  }

  function openWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(caption)}`;
    window.open(url, '_blank');
  }

  if (!draft) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto max-w-5xl px-4 py-10">
          <h1 className="text-2xl font-bold">Seu anúncio está pronto!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Compartilhe o link do anúncio já publicado.
          </p>

          <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
            <label className="block text-xs font-medium text-amber-300">
              Link do seu anúncio
            </label>
            <div className="mt-2 flex items-center gap-2">
              <input
                readOnly
                value={adUrl || '—'}
                className="flex-1 rounded-xl border border-amber-400/30 bg-transparent px-3 py-2 text-sm"
              />
              <button
                onClick={() => adUrl && copy(adUrl)}
                className="rounded-xl border border-amber-400/40 px-3 py-2 text-sm font-semibold hover:bg-amber-400/10 disabled:opacity-50"
                disabled={!adUrl}
              >
                Copiar
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        {/* cabeçalho com feedback visual */}
        <div className="mx-auto mb-6 flex max-w-3xl items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
          <div className="h-3 w-3 animate-pulse rounded-full bg-emerald-400" />
          <div>
            <h1 className="text-lg font-semibold">Seu anúncio está pronto!</h1>
            <p className="text-sm text-muted-foreground">
              Agora é só compartilhar. Seu anúncio já está publicado e otimizado.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.3fr,1fr]">
          {/* Coluna esquerda – cartão/preview + mensagem */}
          <div className="rounded-2xl border border-white/10 p-4">
            <div className="overflow-hidden rounded-xl border border-white/10">
              {draft.imageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.imageDataUrl}
                  alt={draft.title}
                  className="h-64 w-full object-cover md:h-72"
                />
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                  (Sem imagem)
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-md bg-emerald-600/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                {formatCentsBRL(cents)}
              </span>
              <span className="inline-flex rounded-md border border-white/10 px-2 py-0.5 text-xs text-muted-foreground">
                Alcance local
              </span>
              <span className="inline-flex rounded-md border border-white/10 px-2 py-0.5 text-xs text-muted-foreground">
                Válido por 24h
              </span>
            </div>

            <h2 className="mt-2 text-xl font-semibold">{draft.title}</h2>
            {draft.description ? (
              <p className="mt-1 text-sm text-muted-foreground">{draft.description}</p>
            ) : null}

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium">
                Mensagem a ser enviada
              </label>
              <textarea
                readOnly
                rows={8}
                className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
                value={caption}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={openWhatsApp}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold hover:bg-emerald-500"
              >
                Abrir no WhatsApp
              </button>
              <button
                onClick={() => copy(caption)}
                className="inline-flex items-center justify-center rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5"
              >
                Copiar mensagem
              </button>
            </div>

            <div className="mt-4 flex gap-3">
              <Link
                href="/anunciar"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5"
              >
                Criar outro anúncio
              </Link>
              {adUrl ? (
                <Link
                  href={adUrl}
                  target="_blank"
                  className="inline-flex items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-400/20"
                >
                  Ver anúncio completo
                </Link>
              ) : null}
            </div>
          </div>

          {/* Coluna direita – próximos passos + métricas + link + dicas */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-white/10 p-4">
              <p className="mb-3 text-sm font-medium">Próximos passos</p>

              {adUrl ? (
                <Link
                  href={adUrl}
                  target="_blank"
                  className="mb-2 block rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-center text-sm font-semibold text-emerald-200 hover:bg-emerald-400/20"
                >
                  Ver anúncio completo
                </Link>
              ) : null}

              <button
                onClick={openWhatsApp}
                className="mb-2 block w-full rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold hover:bg-emerald-500"
              >
                Abrir no WhatsApp
              </button>

              <button
                onClick={() => copy(caption)}
                className="mb-2 block w-full rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5"
              >
                Compartilhar em Grupo
              </button>

              <button
                onClick={() => adUrl && copy(adUrl)}
                className="block w-full rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5 disabled:opacity-50"
                disabled={!adUrl}
              >
                Copiar Link
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 p-4">
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
            </div>

            {/* Link com "máscara" amarela */}
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
              <p className="mb-2 text-sm font-medium">Link do seu anúncio</p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={adUrl || 'Será gerado após publicar.'}
                  className="flex-1 rounded-xl border border-amber-400/30 bg-transparent px-3 py-2 text-sm"
                />
                <button
                  onClick={() => adUrl && copy(adUrl)}
                  className="rounded-xl border border-amber-400/40 px-3 py-2 text-sm font-semibold hover:bg-amber-400/10 disabled:opacity-50"
                  disabled={!adUrl}
                >
                  Copiar
                </button>
              </div>
              <p className="mt-2 text-xs text-amber-200/80">
                Este link funciona em qualquer dispositivo e é otimizado para mecanismos de busca.
              </p>
            </div>

            {/* Dicas – caixa amarela */}
            <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-4">
              <p className="mb-2 text-sm font-semibold text-amber-200">
                ⚡ Dicas para vender mais rápido
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm text-amber-100/90">
                <li>Responda em até 5 minutos para aumentar as chances de venda.</li>
                <li>Mostre detalhes importantes nas fotos (defeitos, medidas, etc.).</li>
                <li>Seja flexível nos meios de pagamento e no local de encontro.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
