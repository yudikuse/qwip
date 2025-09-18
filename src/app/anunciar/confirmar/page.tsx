'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Draft = {
  title: string;
  priceDigits: string;
  description: string;
  imageDataUrl: string; // data:image/...
  createdAt: string;
};

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
  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
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
  }, [router]);

  const cents = useMemo(
    () => (draft ? parseInt(draft.priceDigits || '0', 10) : 0),
    [draft]
  );

  const caption = useMemo(() => {
    if (!draft) return '';
    const price = formatCentsBRL(parseInt(draft.priceDigits || '0', 10));
    const lines = [
      '🔥 Tô vendendo! Olha que oferta boa! 📣',
      '',
      `${draft.title}`,
      `${price}`,
      draft.description ? `\n${draft.description}` : '',
      // Quando existir publicação, o link curto entra aqui ↓
      // 'https://qwip.pro/a/xxxxx'
    ];
    return lines.join('\n');
  }, [draft]);

  function handleCopy() {
    navigator.clipboard.writeText(caption).then(
      () => alert('Mensagem copiada!'),
      () => alert('Não foi possível copiar. Copie manualmente.')
    );
  }

  function openWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(caption)}`;
    window.open(url, '_blank');
  }

  if (!draft) return null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        {/* Header de sucesso */}
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600/20 ring-8 ring-emerald-500/10">
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6 text-emerald-400"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Seu anúncio está pronto!
            </span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Agora é só compartilhar e começar a vender.
            Esta é a confirmação pré-publicação. No próximo passo faremos o upload da imagem e
            geraremos o link final.
          </p>
        </div>

        {/* Topo — Preview à esquerda / Cartões à direita */}
        <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
          {/* Prévia estilo cartão do anúncio */}
          <section className="rounded-2xl border border-white/10 bg-white/2.5 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            <div className="overflow-hidden rounded-xl border border-white/10">
              {draft.imageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.imageDataUrl}
                  alt={draft.title}
                  className="h-64 w-full object-cover sm:h-72"
                />
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                  (Sem imagem)
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-emerald-600/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/15">
                {formatCentsBRL(cents)}
              </span>

              {/* Chips de contexto (visuais) */}
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-muted-foreground ring-1 ring-white/10">
                Alcance local
              </span>
              <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs text-muted-foreground ring-1 ring-white/10">
                Válido por 24h
              </span>
            </div>

            <h2 className="mt-2 text-lg font-semibold">{draft.title}</h2>

            {draft.description ? (
              <p className="mt-1 line-clamp-4 text-sm text-muted-foreground">
                {draft.description}
              </p>
            ) : null}

            {/* Mensagem editável (somente leitura por enquanto) */}
            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium">
                Mensagem a ser enviada
              </label>
              <textarea
                readOnly
                rows={8}
                className="w-full rounded-xl border border-white/12 bg-black/10 px-3 py-2 text-sm outline-none ring-0 focus:border-emerald-500/40"
                value={caption}
              />
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  onClick={openWhatsApp}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 md:flex-none md:px-5"
                >
                  Abrir no WhatsApp
                </button>
                <button
                  onClick={handleCopy}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5 md:flex-none md:px-5"
                >
                  Copiar mensagem
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/anunciar"
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5"
                >
                  Voltar e editar
                </Link>

                <button
                  disabled
                  title="Publicação virá no próximo passo (upload + salvar)."
                  className="inline-flex cursor-not-allowed items-center justify-center rounded-xl bg-white/8 px-4 py-2 text-sm font-semibold text-muted-foreground"
                >
                  Publicar (em breve)
                </button>
              </div>
            </div>
          </section>

          {/* Lateral — Próximos passos / Estatísticas / Link / Dicas */}
          <aside className="flex flex-col gap-6">
            {/* Próximos passos */}
            <div className="rounded-2xl border border-white/10 bg-white/2.5 p-4">
              <h3 className="text-sm font-semibold text-white/90">Próximos passos</h3>

              <div className="mt-3 grid gap-2">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/5"
                >
                  Ver anúncio completo
                </Link>

                <button
                  onClick={openWhatsApp}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500"
                >
                  Abrir no WhatsApp
                </button>

                <button
                  onClick={openWhatsApp}
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/5"
                >
                  Compartilhar em Grupo
                </button>

                <button
                  disabled
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-muted-foreground"
                  title="O link curto será gerado após publicar."
                >
                  Copiar Link
                </button>
              </div>

              <div className="mt-3 text-right text-xs text-muted-foreground">
                <Link href="/anunciar" className="hover:underline">
                  Criar outro anúncio
                </Link>
              </div>
            </div>

            {/* Estatísticas previstas */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
              <h3 className="text-sm font-semibold text-emerald-300">
                Estatísticas previstas
              </h3>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                  <div className="text-xs text-muted-foreground">Visualizações esperadas</div>
                  <div className="mt-1 font-semibold">150–300/dia</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                  <div className="text-xs text-muted-foreground">Taxa de conversão</div>
                  <div className="mt-1 font-semibold">8–15%</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                  <div className="text-xs text-muted-foreground">Tempo médio no site</div>
                  <div className="mt-1 font-semibold">2m 30s</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/10 p-3">
                  <div className="text-xs text-muted-foreground">Alcance local</div>
                  <div className="mt-1 font-semibold">&gt; 5 km</div>
                </div>
              </div>
            </div>

            {/* Link do anúncio */}
            <div className="rounded-2xl border border-white/10 bg-white/2.5 p-4">
              <h3 className="text-sm font-semibold text-white/90">Link do seu anúncio</h3>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 rounded-xl border border-white/12 bg-black/10 px-3 py-2 text-sm text-muted-foreground">
                  Será gerado após publicar.
                </div>
                <button
                  disabled
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-muted-foreground"
                >
                  Copiar
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Este link funciona em qualquer dispositivo e é otimizado para mecanismos de busca.
              </p>
            </div>

            {/* Dicas para vender mais rápido */}
            <div className="rounded-2xl border border-white/10 bg-white/2.5 p-4">
              <h3 className="text-sm font-semibold text-white/90">Dicas para vender mais rápido</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>• Responda em até 5 minutos para aumentar as chances de venda.</li>
                <li>• Mostre detalhes importantes nas fotos (defeitos, medidas, etc.).</li>
                <li>• Seja flexível nos meios de pagamento e no local de encontro.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
