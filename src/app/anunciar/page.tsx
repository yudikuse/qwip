'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Preview = {
  title: string;
  priceDigits: string; // apenas dígitos, ex.: "1850" = R$ 18,50
  description: string;
  imageFile: File | null;
};

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4MB
const ACCEPT = 'image/jpeg,image/png,image/webp';

function formatCentsBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function digitsToMaskedBRL(digits: string) {
  const clean = digits.replace(/\D/g, '');
  const s = clean.padStart(3, '0');
  const int = s.slice(0, -2).replace(/^0+(?=\d)/, '');
  const dec = s.slice(-2);
  return `${int || '0'},${dec}`;
}

function maskedToDigits(masked: string) {
  return masked.replace(/\D/g, '');
}

// transforma File -> dataURL (para pré-publicação)
async function fileToDataURL(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AnunciarPage() {
  const router = useRouter();
  const [data, setData] = useState<Preview>({
    title: '',
    priceDigits: '',
    description: '',
    imageFile: null,
  });
  const [imageError, setImageError] = useState<string | null>(null);

  const cents = useMemo(
    () => parseInt(data.priceDigits || '0', 10),
    [data.priceDigits]
  );

  async function handleContinue() {
    // validações básicas
    if (!data.title.trim()) {
      alert('Informe um título.');
      return;
    }
    if (!cents) {
      alert('Informe um preço válido.');
      return;
    }

    // gera dataURL da imagem (por enquanto, antes do upload real)
    let imageDataUrl = '';
    if (data.imageFile) {
      try {
        imageDataUrl = await fileToDataURL(data.imageFile);
      } catch {
        alert('Falha ao ler a imagem. Tente outra.');
        return;
      }
    }

    // salva rascunho para a página /anunciar/confirmar
    const draft = {
      title: data.title,
      priceDigits: data.priceDigits,
      description: data.description,
      imageDataUrl,
      createdAt: new Date().toISOString(),
    };
    sessionStorage.setItem('qwip_draft_ad', JSON.stringify(draft));

    router.push('/anunciar/confirmar');
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-bold">Crie seu anúncio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          (Versão inicial do passo de criação. Próximos passos: upload real para o Vercel Blob,
          categorias, cópia otimizada e publicação.)
        </p>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {/* Coluna esquerda — formulário */}
          <div className="space-y-5">
            {/* Título */}
            <div>
              <label className="mb-1 block text-sm font-medium">Título</label>
              <input
                className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 outline-none"
                placeholder="Ex.: Marmita Caseira com Entrega"
                value={data.title}
                onChange={(e) => setData((s) => ({ ...s, title: e.target.value }))}
              />
            </div>

            {/* Preço (com máscara) */}
            <div>
              <label className="mb-1 block text-sm font-medium">Preço (R$)</label>
              <input
                inputMode="numeric"
                className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 outline-none"
                placeholder="Ex.: 18,50"
                value={digitsToMaskedBRL(data.priceDigits)}
                onChange={(e) =>
                  setData((s) => ({ ...s, priceDigits: maskedToDigits(e.target.value) }))
                }
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Valor atual: <span className="font-medium">{formatCentsBRL(cents)}</span>
              </p>
            </div>

            {/* Descrição */}
            <div>
              <label className="mb-1 block text-sm font-medium">Descrição</label>
              <textarea
                rows={6}
                className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 outline-none"
                placeholder="Conte os detalhes importantes do produto/serviço…"
                value={data.description}
                onChange={(e) => setData((s) => ({ ...s, description: e.target.value }))}
              />
            </div>

            {/* Foto (upload local com preview futuro) */}
            <div>
              <label className="mb-1 block text-sm font-medium">
                Foto do anúncio (JPEG/PNG/WEBP, máx. 4MB)
              </label>
              <input
                type="file"
                accept={ACCEPT}
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  if (!f) {
                    setData((s) => ({ ...s, imageFile: null }));
                    setImageError(null);
                    return;
                  }
                  if (!ACCEPT.split(',').includes(f.type)) {
                    setImageError('Formato não suportado. Use JPEG, PNG ou WEBP.');
                    return;
                  }
                  if (f.size > MAX_IMAGE_BYTES) {
                    setImageError('Imagem muito grande (máx. 4MB).');
                    return;
                  }
                  setImageError(null);
                  setData((s) => ({ ...s, imageFile: f }));
                }}
                className="block w-full cursor-pointer rounded-xl border border-white/15 bg-transparent px-3 py-2 file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 hover:file:bg-white/20"
              />
              {imageError ? (
                <p className="mt-1 text-xs text-red-400">{imageError}</p>
              ) : (
                <p className="mt-1 text-xs text-muted-foreground">
                  Dica: escolha uma foto horizontal e nítida.
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500"
                type="button"
                onClick={handleContinue}
              >
                Continuar
              </button>

              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/5"
              >
                Cancelar
              </Link>
            </div>
          </div>

          {/* Coluna direita — preview simples (visual) */}
          <RightPreview
            title={data.title}
            cents={cents}
            description={data.description}
            file={data.imageFile}
          />
        </div>
      </div>
    </main>
  );
}

function RightPreview({
  title,
  cents,
  description,
  file,
}: {
  title: string;
  cents: number;
  description: string;
  file: File | null;
}) {
  const [url, setUrl] = useState<string>('');

  useEffect(() => {
    if (!file) {
      setUrl('');
      return;
    }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  return (
    <div>
      <div className="rounded-2xl border border-white/10 p-4">
        <div className="overflow-hidden rounded-xl border border-white/10">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={title || 'Prévia da imagem'} className="h-64 w-full object-cover" />
          ) : (
            <div className="flex h-64 w-full items-center justify-center text-sm text-muted-foreground">
              (Prévia da imagem)
            </div>
          )}
        </div>

        <div className="mt-4">
          <h2 className="text-lg font-semibold">{title || 'Título do anúncio'}</h2>
          <div className="mt-1 text-emerald-400">{formatCentsBRL(cents)}</div>
          <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
            {description || 'Descrição breve aparecerá aqui.'}
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            disabled
            className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl bg-white/5 px-3 py-2 text-sm font-semibold text-muted-foreground"
            title="Habilitaremos após publicar"
          >
            Falar no WhatsApp
          </button>
          <button
            disabled
            className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold text-muted-foreground"
            title="Habilitaremos após publicar"
          >
            Compartilhar
          </button>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Prévia visual. Na próxima etapa abriremos a confirmação com o cartão grande do WhatsApp.
      </p>
    </div>
  );
}
