// src/app/anunciar/page.tsx
import { cookies } from "next/headers";
import Link from "next/link";
import React from "react";

// ===== Helpers de preço (R$) =====
function formatBRLFromCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

/** Converte um input livre (ex.: "12,34" ou "12.34") para centavos inteiros. */
function parsePriceToCents(input: string): number {
  const onlyDigits = input.replace(/[^\d]/g, "");
  if (!onlyDigits) return 0;
  // Regra simples: últimos 2 dígitos são os centavos
  const inteiro = onlyDigits.slice(0, -2) || "0";
  const centavos = onlyDigits.slice(-2);
  const asNumber = Number(inteiro) * 100 + Number(centavos);
  return Number.isFinite(asNumber) ? asNumber : 0;
}

// ====== Client component ======
function PreviewCard(props: {
  title: string;
  priceCents: number;
  city: string;
  uf: string;
  imageUrl?: string | null;
}) {
  const { title, priceCents, city, uf, imageUrl } = props;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      {/* “Tela” do WhatsApp (visual) */}
      <div className="rounded-xl bg-[#0B141A] p-3 text-white">
        {/* Cabeçalho fake */}
        <div className="mb-3 flex items-center gap-2 text-xs text-white/60">
          <div className="size-2 rounded-full bg-emerald-500" />
          <span>Você</span>
          <span className="ml-auto">agora</span>
        </div>

        {/* Card do anúncio */}
        <div className="overflow-hidden rounded-xl bg-[#1F2C34]">
          {/* Imagem */}
          <div className="aspect-[16/9] w-full bg-black/30">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt=""
              src={
                imageUrl ||
                "https://images.unsplash.com/photo-1514516870926-2059896b9b32?q=80&w=1200&auto=format&fit=crop"
              }
              className="h-full w-full object-cover"
            />
          </div>

          {/* Conteúdo */}
          <div className="p-3">
            <div className="mb-2 inline-flex items-center gap-2">
              <span className="rounded bg-emerald-600/90 px-2 py-0.5 text-[11px] font-bold">
                {formatBRLFromCents(priceCents)}
              </span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-[11px]">
                {city || "Cidade"}, {uf || "UF"}
              </span>
            </div>

            <div className="text-[15px] font-semibold leading-tight">{title || "Título do anúncio"}</div>

            <div className="mt-2 text-xs text-white/60">qwip.pro</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WizardClient(props: { phoneE164: string | null }) {
  "use client";
  const verified = !!props.phoneE164;

  const [title, setTitle] = React.useState("");
  const [priceInput, setPriceInput] = React.useState("");
  const [priceCents, setPriceCents] = React.useState(0);
  const [description, setDescription] = React.useState("");
  const [city, setCity] = React.useState("");
  const [uf, setUf] = React.useState("");
  const [radiusKm, setRadiusKm] = React.useState(10);
  // imagem virá no passo 2 (upload). Mantemos opcional para já alimentar o preview:
  const [imageUrl] = React.useState<string | null>(null);

  // Formata input monetário enquanto o usuário digita
  const displayPrice = React.useMemo(() => {
    if (!priceInput) return "";
    const cents = parsePriceToCents(priceInput);
    return formatBRLFromCents(cents);
  }, [priceInput]);

  React.useEffect(() => {
    setPriceCents(parsePriceToCents(priceInput));
  }, [priceInput]);

  if (!verified) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-2xl px-4 py-16">
          <h1 className="text-2xl font-bold">Verifique seu telefone</h1>
          <p className="mt-2 text-muted-foreground">
            Para criar anúncios é preciso ter um número verificado por SMS.
          </p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center rounded-xl border border-white/15 px-4 py-2 font-medium hover:bg-white/5"
            >
              Voltar para o início
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Adicione fotos e informações</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Este é o primeiro passo. Ainda não vamos salvar — é só para você
            ajustar as informações e ver o <span className="font-semibold">preview</span> ao lado.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Coluna esquerda: formulário */}
          <div className="space-y-6">
            {/* Fotos (virá no passo 2) */}
            <div className="rounded-2xl border border-white/10 p-4">
              <div className="mb-3 text-sm font-semibold">Suas fotos (1/10)</div>
              <div className="aspect-[16/9] w-full overflow-hidden rounded-xl border border-white/10 bg-black/20" />
              <p className="mt-2 text-xs text-muted-foreground">
                Upload e melhorias de imagem serão adicionados no próximo passo.
              </p>
            </div>

            {/* Informações básicas */}
            <div className="rounded-2xl border border-white/10 p-4">
              <div className="mb-4 text-sm font-semibold">Informações do Produto</div>

              <label className="block text-sm">
                <span className="mb-1 inline-block text-muted-foreground">Título do anúncio *</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                  placeholder="Ex.: Marmita Caseira com Entrega"
                  className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 outline-none focus:border-white/20"
                />
                <span className="mt-1 block text-right text-xs text-muted-foreground">
                  {title.length}/80
                </span>
              </label>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="block text-sm">
                  <span className="mb-1 inline-block text-muted-foreground">Preço (R$) *</span>
                  <input
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    placeholder="Ex.: 18,50"
                    className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 outline-none focus:border-white/20"
                  />
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {priceInput ? `Interpretado: ${displayPrice}` : "Formato: 1.234,56"}
                  </span>
                </label>

                <label className="block text-sm">
                  <span className="mb-1 inline-block text-muted-foreground">Categoria</span>
                  <select
                    className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 outline-none focus:border-white/20"
                    defaultValue="Alimentação"
                  >
                    <option className="bg-background">Alimentação</option>
                    <option className="bg-background">Serviços</option>
                    <option className="bg-background">Moda</option>
                    <option className="bg-background">Outros</option>
                  </select>
                </label>
              </div>

              <label className="mt-4 block text-sm">
                <span className="mb-1 inline-block text-muted-foreground">
                  Descrição detalhada *
                </span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  placeholder="Conte os detalhes importantes. Ex.: formas de entrega/pagamento, tamanhos, sabores…"
                  rows={5}
                  className="w-full resize-none rounded-xl border border-white/10 bg-transparent px-3 py-2 outline-none focus:border-white/20"
                />
                <span className="mt-1 block text-right text-xs text-muted-foreground">
                  {description.length}/500
                </span>
              </label>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <label className="col-span-2 block text-sm">
                  <span className="mb-1 inline-block text-muted-foreground">Cidade *</span>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value.slice(0, 40))}
                    placeholder="Ex.: Barra do Garças"
                    className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 outline-none focus:border-white/20"
                  />
                </label>

                <label className="block text-sm">
                  <span className="mb-1 inline-block text-muted-foreground">UF *</span>
                  <input
                    value={uf}
                    onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))}
                    placeholder="MT"
                    className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 uppercase outline-none focus:border-white/20"
                  />
                </label>
              </div>

              <label className="mt-4 block text-sm">
                <span className="mb-1 inline-block text-muted-foreground">
                  Raio de alcance (km)
                </span>
                <input
                  type="range"
                  min={1}
                  max={25}
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-full"
                />
                <span className="mt-1 block text-xs text-muted-foreground">
                  Alcança ~ {radiusKm} km
                </span>
              </label>
            </div>

            {/* Rodapé do passo 1 */}
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="inline-flex items-center rounded-xl border border-white/15 px-4 py-2 hover:bg-white/5"
              >
                Voltar
              </Link>

              {/* No passo 2, este botão vai salvar (POST /api/ads) e redirecionar. */}
              <button
                className="inline-flex items-center rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
                disabled={!title || priceCents <= 0 || !city || !uf}
                title="No próximo passo vamos ativar o salvamento"
              >
                Continuar configuração
              </button>
            </div>
          </div>

          {/* Coluna direita: preview */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 p-4">
              <div className="mb-2 text-sm font-semibold">Preview do seu anúncio</div>
              <p className="mb-4 text-xs text-muted-foreground">
                Veja como pode aparecer no WhatsApp dos seus clientes.
              </p>

              <PreviewCard
                title={title || "Seu produto incrível"}
                priceCents={priceCents}
                city={city || "Sua cidade"}
                uf={uf || "UF"}
                imageUrl={imageUrl ?? undefined}
              />
            </div>

            <div className="rounded-2xl border border-white/10 p-4">
              <div className="text-xs text-muted-foreground">
                Dicas rápidas:
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Use fotos nítidas e bem iluminadas.</li>
                  <li>Título claro e objetivo.</li>
                  <li>Descrição com formas de pagamento e entrega.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// ====== Page (Server Component) ======
export default async function Page() {
  const jar = await cookies();
  const raw = jar.get("qwip_phone_e164")?.value || null;
  let phone: string | null = raw;
  if (phone) {
    try {
      phone = decodeURIComponent(phone);
    } catch {}
  }

  return <WizardClient phoneE164={phone} />;
}
