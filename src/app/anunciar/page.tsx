'use client';

import { useState } from 'react';
import Link from 'next/link';

type Preview = {
  title: string;
  price: string; // aceitamos string aqui só para o preview
  description: string;
  imageUrl: string;
};

export default function AnunciarPage() {
  const [data, setData] = useState<Preview>({
    title: '',
    price: '',
    description: '',
    imageUrl: '',
  });

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-bold">Crie seu anúncio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          (Versão inicial — apenas estrutura. Próximos passos: upload de foto, categorias,
          melhorias de copy e publicação.)
        </p>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          {/* Coluna esquerda — formulário simples */}
          <div className="space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium">Título</label>
              <input
                className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 outline-none"
                placeholder="Ex.: Marmita Caseira com Entrega"
                value={data.title}
                onChange={(e) => setData((s) => ({ ...s, title: e.target.value }))}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Preço (R$)</label>
              <input
                inputMode="decimal"
                className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 outline-none"
                placeholder="Ex.: 18,50"
                value={data.price}
                onChange={(e) => setData((s) => ({ ...s, price: e.target.value }))}
              />
            </div>

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

            <div>
              <label className="mb-1 block text-sm font-medium">URL da imagem (temporário)</label>
              <input
                className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 outline-none"
                placeholder="Cole um link direto da imagem (vamos trocar por upload depois)"
                value={data.imageUrl}
                onChange={(e) => setData((s) => ({ ...s, imageUrl: e.target.value }))}
              />
            </div>

            <div className="flex gap-3">
              <button
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500"
                type="button"
                onClick={() => alert('No próximo passo salvaremos estas infos e seguiremos.')}
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

          {/* Coluna direita — preview básico do anúncio */}
          <div>
            <div className="rounded-2xl border border-white/10 p-4">
              <div className="overflow-hidden rounded-xl border border-white/10">
                {data.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={data.imageUrl}
                    alt={data.title || 'Prévia da imagem'}
                    className="h-64 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-64 w-full items-center justify-center text-sm text-muted-foreground">
                    (Prévia da imagem)
                  </div>
                )}
              </div>

              <div className="mt-4">
                <h2 className="text-lg font-semibold">{data.title || 'Título do anúncio'}</h2>
                <div className="mt-1 text-emerald-400">
                  {data.price ? `R$ ${data.price}` : 'R$ 0,00'}
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                  {data.description || 'Descrição breve aparecerá aqui.'}
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
              Prévia (somente visual). Depois vamos incluir o cartão grande do WhatsApp e a página final.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
