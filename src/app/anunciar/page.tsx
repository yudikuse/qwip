'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Draft = {
  title: string;
  priceDigits: string; // ex: "1850" => R$ 18,50
  description: string;
  imageDataUrl: string; // data:image/...
  createdAt: string; // ISO
};

// Máscara/formatador de preço em centavos
function formatCentsBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    currencyDisplay: 'symbol',
  }).format(cents / 100);
}

export default function CriarAnuncioPage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [priceDigits, setPriceDigits] = useState(''); // somente dígitos
  const [description, setDescription] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string>('');

  // se o usuário voltou, preenche com o rascunho
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('qwip_draft_ad');
      if (raw) {
        const d = JSON.parse(raw) as Draft;
        setTitle(d.title || '');
        setPriceDigits(d.priceDigits || '');
        setDescription(d.description || '');
        setImageDataUrl(d.imageDataUrl || '');
      }
    } catch {
      // ignora
    }
  }, []);

  const cents = useMemo(
    () => parseInt(priceDigits || '0', 10),
    [priceDigits]
  );

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    const okType = ['image/jpeg', 'image/png', 'image/webp'].includes(f.type);
    if (!okType) {
      alert('Formato inválido. Use JPG, PNG ou WEBP.');
      e.target.value = '';
      return;
    }
    if (f.size > 4 * 1024 * 1024) {
      alert('Arquivo muito grande. Máximo 4MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(String(reader.result || ''));
    reader.readAsDataURL(f);
  }

  function handleContinue() {
    if (!title.trim() || !priceDigits) {
      alert('Preencha título e preço.');
      return;
    }

    // Salva rascunho
    const draft: Draft = {
      title: title.trim(),
      priceDigits,
      description: description.trim(),
      imageDataUrl,
      createdAt: new Date().toISOString(),
    };
    sessionStorage.setItem('qwip_draft_ad', JSON.stringify(draft));

    // Garante um config default para a próxima etapa
    if (!sessionStorage.getItem('qwip_config_ad')) {
      sessionStorage.setItem(
        'qwip_config_ad',
        JSON.stringify({ category: '', radiusKm: 10, urgencyTimer: true })
      );
    }

    // Agora vamos para a nova etapa de configuração
    router.push('/anunciar/configurar');
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold">Crie seu anúncio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Versão inicial do passo de criação. Próximos passos: upload real via Vercel Blob,
          categorias, cópia otimizada e publicação.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-[1.25fr,1fr]">
          {/* Formulário */}
          <section className="rounded-2xl border border-white/10 p-4">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Título</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
                  placeholder="Ex.: Marmita Caseira com Entrega"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Preço (R$)</label>
                <input
                  inputMode="numeric"
                  value={priceDigits}
                  onChange={(e) => setPriceDigits((e.target.value || '').replace(/\D/g, ''))}
                  className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
                  placeholder="Ex.: 18,50"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Valor atual: {formatCentsBRL(cents)}
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Descrição</label>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
                  placeholder="Conte os detalhes importantes do produto/serviço..."
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Foto do anúncio (JPEG/PNG/WEBP, máx. 4MB)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={onFileChange}
                    className="block w-full cursor-pointer rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm hover:file:bg-white/20"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Dica: escolha uma foto horizontal e nítida.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleContinue}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500"
                >
                  Continuar
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </section>

          {/* Prévia simples */}
          <aside className="rounded-2xl border border-white/10 p-4">
            <div className="mb-2 h-48 overflow-hidden rounded-xl border border-white/10">
              {imageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageDataUrl} alt="Prévia da imagem" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  (Prévia da imagem)
                </div>
              )}
            </div>

            <p className="text-sm font-medium">Título do anúncio</p>
            <p className="text-emerald-400">{formatCentsBRL(cents)}</p>
            <p className="mt-1 text-sm text-muted-foreground">Descrição breve aparecerá aqui.</p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <button className="rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5">
                Falar no WhatsApp
              </button>
              <button className="rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5">
                Compartilhar
              </button>
            </div>

            <p className="mt-2 text-xs text-muted-foreground">
              Prévia visual. Na próxima etapa abriremos a configuração do anúncio.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
