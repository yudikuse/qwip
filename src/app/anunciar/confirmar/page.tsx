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
      `🔥 Tô vendendo! Olha que oferta boa!`,
      '',
      `${draft.title}`,
      `${price}`,
      draft.description ? `\n${draft.description}` : '',
      // quando publicarmos, colocamos o link curto aqui ↓
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

  if (!draft) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-bold">Seu anúncio está pronto para compartilhar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Esta é a confirmação pré-publicação. No próximo passo faremos o upload da imagem e a
          geração do link final.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Card grande estilo WhatsApp (visual) */}
          <div className="rounded-2xl border border-white/10 p-4">
            <div className="overflow-hidden rounded-xl border border-white/10">
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
            </div>

            <div className="mt-3">
              <div className="inline-flex rounded-md bg-emerald-600/20 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                {formatCentsBRL(cents)}
              </div>
              <h2 className="mt-2 text-lg font-semibold">{draft.title}</h2>
              {draft.description ? (
                <p className="mt-1 line-clamp-4 text-sm text-muted-foreground">
                  {draft.description}
                </p>
              ) : null}
            </div>
          </div>

          {/* Mensagem + ações */}
          <div className="flex flex-col">
            <label className="mb-2 block text-sm font-medium">Mensagem a ser enviada</label>
            <textarea
              readOnly
              rows={10}
              className="flex-1 rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
              value={caption}
            />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={openWhatsApp}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold hover:bg-emerald-500"
              >
                Abrir no WhatsApp
              </button>
              <button
                onClick={handleCopy}
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
                Voltar e editar
              </Link>

              <button
                disabled
                title="Publicação virá no próximo passo (upload + salvar)."
                className="inline-flex cursor-not-allowed items-center justify-center rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-muted-foreground"
              >
                Publicar (em breve)
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
