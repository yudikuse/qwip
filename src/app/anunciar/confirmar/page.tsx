'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Draft = {
  title: string;
  priceDigits: string;     // em centavos, string
  description: string;
  imageDataUrl: string;    // data:image/...
  createdAt: string;
};

function formatCentsBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export default function ConfirmarPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);

  // no próximo passo, quando publicarmos de fato, populamos isso com o link curto
  const [shortLink, setShortLink] = useState<string | null>(null);

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
      '🔥 Tô vendendo! Olha que oferta boa! 🚀',
      '',
      `${draft.title}`,
      `${price}`,
      draft.description ? `\n${draft.description}` : '',
      shortLink ? `\n${shortLink}` : '',
    ];
    return lines.join('\n');
  }, [draft, shortLink]);

  function handleCopyMessage() {
    navigator.clipboard.writeText(caption).then(
      () => alert('Mensagem copiada!'),
      () => alert('Não foi possível copiar. Copie manualmente.')
    );
  }

  function handleOpenWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(caption)}`;
    window.open(url, '_blank');
  }

  function handleOpenWhatsAppGroup() {
    // mesmo fluxo – o usuário escolhe o grupo no WhatsApp
    const url = `https://wa.me/?text=${encodeURIComponent(caption)}`;
    window.open(url, '_blank');
  }

  function handleCopyLink() {
    if (!shortLink) {
      alert('Link ficará disponível após a publicação.');
      return;
    }
    navigator.clipboard.writeText(shortLink).then(
      () => alert('Link copiado!'),
      () => alert('Não foi possível copiar o link.')
    );
  }

  if (!draft) return null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        {/* Header com check */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600/20 text-emerald-400">
            ✓
          </div>
          <div>
            <h1 className="text-2xl font-bold">Seu anúncio está pronto!</h1>
            <p className="text-sm text-muted-foreground">
              Agora é só compartilhar o link e começar a vender. Esta é a confirmação
              <span className="hidden sm:inline"> pré-publicação</span>. No próximo passo faremos o upload da imagem e geraremos o link final.
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
          {/* Coluna esquerda: Preview estilo WhatsApp */}
          <section className="rounded-2xl border border-white/10 bg-black/10 p-4">
            <div className="overflow-hidden rounded-xl border border-white/10 relative">
              {draft.imageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={draft.imageDataUrl}
                  alt={draft.title}
                  className="h-64 w-full object-cover"
                />
              ) : (
                <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                  (Sem imagem)
                </div>
              )}

              {/* Badge de preço sobre a imagem (canto inferior esquerdo) */}
              <span className="absolute bottom-3 left-3 rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white">
                {formatCentsBRL(cents)}
              </span>
            </div>

            <div className="mt-3">
              <h2 className="text-lg font-semibold">{draft.title}</h2>
              {draft.description ? (
                <p className="mt-1 line-clamp-4 text-sm text-muted-foreground">
                  {draft.description}
                </p>
              ) : null}
            </div>

            {/* Mensagem (para copiar/editar antes de abrir o WhatsApp) */}
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
              <div className="mt-3">
                <button
                  onClick={handleCopyMessage}
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5"
                >
                  Copiar mensagem
                </button>
              </div>
            </div>
          </section>

          {/* Coluna direita: Próximos passos / estatísticas / link / dicas */}
          <section className="flex flex-col gap-6">
            {/* Próximos passos */}
            <div className="rounded-2xl border border-white/10 p-4">
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                Próximos passos
              </h3>

              <div className="grid gap-3">
                {/* Ver anúncio completo – depende de publicar */}
                <button
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-white/5 disabled:opacity-60"
                  disabled
                  title="Disponível após publicar (vamos criar o link final)."
                >
                  Ver anúncio completo
                </button>

                <button
                  onClick={handleOpenWhatsApp}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
                >
                  Abrir no WhatsApp
                </button>

                <button
                  onClick={handleOpenWhatsAppGroup}
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5"
                >
                  Compartilhar em Grupo
                </button>

                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5 disabled:opacity-60"
                  disabled={!shortLink}
                  title={shortLink ? 'Copiar link' : 'Disponível após publicar.'}
                >
                  Copiar Link
                </button>
              </div>

              <div className="mt-3 text-right">
                <Link href="/anunciar" className="text-xs text-muted-foreground hover:underline">
                  Criar outro anúncio
                </Link>
              </div>
            </div>

            {/* Estatísticas previstas (mock visual) */}
            <div className="rounded-2xl border border-white/10 p-4">
              <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                Estatísticas previstas
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-black/20 p-3">
                  <div className="text-xs text-muted-foreground">Visualizações esperadas</div>
                  <div className="mt-1 font-semibold">150–300/dia</div>
                </div>
                <div className="rounded-lg bg-black/20 p-3">
                  <div className="text-xs text-muted-foreground">Taxa de conversão</div>
                  <div className="mt-1 font-semibold">8–15%</div>
                </div>
                <div className="rounded-lg bg-black/20 p-3">
                  <div className="text-xs text-muted-foreground">Tempo médio no site</div>
                  <div className="mt-1 font-semibold">2m 30s</div>
                </div>
                <div className="rounded-lg bg-black/20 p-3">
                  <div className="text-xs text-muted-foreground">Alcance local</div>
                  <div className="mt-1 font-semibold">+5 km</div>
                </div>
              </div>
            </div>

            {/* Link do anúncio */}
            <div className="rounded-2xl border border-white/10 p-4">
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                Link do seu anúncio
              </h3>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  className="flex-1 rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm"
                  value={shortLink ?? 'Será gerado após publicar.'}
                />
                <button
                  onClick={handleCopyLink}
                  disabled={!shortLink}
                  className="rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5 disabled:opacity-60"
                  title={shortLink ? 'Copiar link' : 'Disponível após publicar.'}
                >
                  Copiar
                </button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Este link funciona em qualquer dispositivo e é otimizado para mecanismos de busca.
              </p>
            </div>

            {/* Dicas */}
            <div className="rounded-2xl border border-white/10 p-4">
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">
                Dicas para vender mais rápido
              </h3>
              <ul className="grid list-disc gap-2 pl-5 text-sm">
                <li>Responda em até 5 minutos para aumentar as chances de venda.</li>
                <li>Mostre detalhes importantes nas fotos (defeitos, medidas, etc.).</li>
                <li>Seja flexível nos meios de pagamento e no local de encontro.</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Rodapé com ações secundárias */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/anunciar"
            className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5"
          >
            Voltar e editar
          </Link>

          {/* Publicar ainda ficará para o próximo passo (upload+salvar) */}
          <button
            disabled
            title="Publicação virá no próximo passo (upload + salvar no banco)."
            className="inline-flex cursor-not-allowed items-center justify-center rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-muted-foreground"
          >
            Publicar (em breve)
          </button>
        </div>
      </div>
    </main>
  );
}
