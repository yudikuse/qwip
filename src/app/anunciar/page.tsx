'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdMap from '@/components/AdMap'; // prévia do mapa com círculo

export const dynamic = 'force-dynamic';

type Draft = {
  title: string;
  priceDigits: string; // ex: "1850" => R$ 18,50 (centavos em string)
  description: string;
  imageDataUrl: string; // data:image/...
  createdAt: string; // ISO
};

type LocationCfg = {
  city: string;
  uf: string;
  centerLat: number | null;
  centerLng: number | null;
  radiusKm: number; // 1..20
};

// ----------------------------------------
// Helpers
// ----------------------------------------
function formatCentsBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    currencyDisplay: 'symbol',
  }).format(cents / 100);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function onlyDigits(s: string) {
  return (s || '').replace(/\D/g, '');
}

// ----------------------------------------
// Page
// ----------------------------------------
export default function CriarAnuncioPage() {
  const router = useRouter();

  // formulário base
  const [title, setTitle] = useState('');
  const [priceDigits, setPriceDigits] = useState(''); // apenas dígitos
  const [description, setDescription] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string>('');

  // localização/alcance (herdado do fluxo antigo)
  const [loc, setLoc] = useState<LocationCfg>({
    city: '',
    uf: '',
    centerLat: null,
    centerLng: null,
    radiusKm: 5,
  });

  const [geoMessage, setGeoMessage] = useState<string>('');

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

      const rawCfg = sessionStorage.getItem('qwip_config_ad');
      if (rawCfg) {
        const c = JSON.parse(rawCfg) as Partial<LocationCfg & { urgencyTimer?: boolean; category?: string }>;
        setLoc((s) => ({
          city: c.city ?? s.city,
          uf: c.uf ?? s.uf,
          centerLat: Number.isFinite(c.centerLat as number) ? (c.centerLat as number) : s.centerLat,
          centerLng: Number.isFinite(c.centerLng as number) ? (c.centerLng as number) : s.centerLng,
          radiusKm: c.radiusKm ? clamp(c.radiusKm, 1, 20) : s.radiusKm,
        }));
      }
    } catch {
      // ignore
    }
  }, []);

  // valor em centavos para preview
  const cents = useMemo(() => parseInt(priceDigits || '0', 10), [priceDigits]);

  // ----------------------------------------
  // Handlers
  // ----------------------------------------
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

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoMessage('Seu navegador não permite geolocalização.');
      return;
    }
    setGeoMessage('Obtendo posição...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLoc((s) => ({ ...s, centerLat: latitude, centerLng: longitude }));
        setGeoMessage('Localização definida pelo GPS do aparelho.');
      },
      (err) => {
        const code = (err && err.code) || 0;
        if (code === 1) {
          setGeoMessage('Permissão negada. Informe sua cidade/UF manualmente.');
        } else {
          setGeoMessage('Não foi possível obter sua localização. Tente novamente.');
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 300000,
      }
    );
  }

  function handleContinue() {
    if (!title.trim() || !priceDigits) {
      alert('Preencha título e preço.');
      return;
    }

    // Salva rascunho
    const draft: Draft = {
      title: title.trim(),
      priceDigits: onlyDigits(priceDigits),
      description: description.trim(),
      imageDataUrl,
      createdAt: new Date().toISOString(),
    };
    sessionStorage.setItem('qwip_draft_ad', JSON.stringify(draft));

    // Salva config (aproveitada na etapa /anunciar/configurar)
    const cfgToSave = {
      city: loc.city.trim(),
      uf: loc.uf.trim().toUpperCase(),
      centerLat: loc.centerLat,
      centerLng: loc.centerLng,
      radiusKm: clamp(loc.radiusKm, 1, 20),
      // defaults do configurar:
      urgencyTimer: true,
      category: '',
    };
    sessionStorage.setItem('qwip_config_ad', JSON.stringify(cfgToSave));

    // vai para a etapa de configuração (preview final + chips + resumo)
    router.push('/anunciar/configurar');
  }

  // ----------------------------------------
  // UI
  // ----------------------------------------
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold">Crie seu anúncio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Esta é a etapa inicial. Depois você ajusta os detalhes (categoria, raio, cópia otimizada)
          e seguimos para a confirmação final de compartilhamento.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-[1.25fr,1fr]">
          {/* COLUNA ESQUERDA — formulário */}
          <section className="rounded-2xl border border-white/10 p-4">
            <div className="space-y-4">
              {/* Foto */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Foto do anúncio <span className="text-muted-foreground">(JPEG/PNG/WEBP, máx. 4MB)</span>
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={onFileChange}
                  className="block w-full cursor-pointer rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm hover:file:bg-white/20"
                />
              </div>

              {/* Título */}
              <div>
                <label className="mb-1 block text-sm font-medium">Título *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                  className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
                  placeholder="Ex.: Marmita Caseira com Entrega"
                />
                <p className="mt-1 text-xs text-muted-foreground">{title.length}/80 caracteres</p>
              </div>

              {/* Preço */}
              <div>
                <label className="mb-1 block text-sm font-medium">Preço (R$) *</label>
                <input
                  inputMode="numeric"
                  value={priceDigits}
                  onChange={(e) => setPriceDigits(onlyDigits(e.target.value))}
                  className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
                  placeholder="Ex.: 18,50"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Valor atual: {formatCentsBRL(cents)}
                </p>
              </div>

              {/* Descrição */}
              <div>
                <label className="mb-1 block text-sm font-medium">Descrição *</label>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
                  placeholder="Conte os detalhes importantes do produto/serviço…"
                />
                <p className="mt-1 text-xs text-muted-foreground">{description.length}/500 caracteres</p>
              </div>

              {/* Raio de alcance */}
              <div>
                <label className="mb-1 block text-sm font-medium">Área de alcance (km)</label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={loc.radiusKm}
                  onChange={(e) => setLoc((s) => ({ ...s, radiusKm: clamp(Number(e.target.value), 1, 20) }))}
                  className="w-full"
                />
                <div className="mt-1 text-xs text-muted-foreground">
                  Raio atual: <strong>{loc.radiusKm} km</strong>
                </div>
              </div>

              {/* Localização */}
              <div>
                <label className="mb-1 block text-sm font-medium">Localização</label>
                <p className="mb-2 text-xs text-muted-foreground">
                  Usaremos sua posição atual. Se negar, informe cidade e UF.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={useMyLocation}
                    className="rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5"
                  >
                    Usar minha localização
                  </button>
                  <input
                    placeholder="Cidade (ex.: São Paulo)"
                    value={loc.city}
                    onChange={(e) => setLoc((s) => ({ ...s, city: e.target.value }))}
                    className="w-full max-w-[260px] rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
                  />
                  <input
                    placeholder="UF (ex.: SP)"
                    value={loc.uf}
                    onChange={(e) => setLoc((s) => ({ ...s, uf: e.target.value.toUpperCase().slice(0, 2) }))}
                    className="w-20 rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
                  />
                </div>
                {geoMessage ? (
                  <p className="mt-2 text-xs text-muted-foreground">{geoMessage}</p>
                ) : null}
              </div>

              {/* Ações */}
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

          {/* COLUNA DIREITA — prévia do cartão */}
          <aside className="rounded-2xl border border-white/10 p-4">
            {/* imagem */}
            <div className="mb-3 h-48 overflow-hidden rounded-xl border border-white/10 md:h-56">
              {imageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageDataUrl} alt="Prévia da imagem" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  (Prévia da imagem)
                </div>
              )}
            </div>

            {/* chips */}
            <div className="mb-2 flex flex-wrap gap-2">
              <span className="rounded-md bg-amber-400/15 px-2 py-0.5 text-xs font-medium text-amber-300">
                Expira em 24h
              </span>
              {loc.city && loc.uf ? (
                <span className="rounded-md border border-white/10 px-2 py-0.5 text-xs text-muted-foreground">
                  {loc.city}, {loc.uf}
                </span>
              ) : null}
              <span className="rounded-md border border-white/10 px-2 py-0.5 text-xs text-muted-foreground">
                alcança {loc.radiusKm} km
              </span>
            </div>

            {/* título/preço/descrição */}
            <p className="text-lg font-semibold">{title || 'Título do anúncio'}</p>
            <p className="text-emerald-400">{formatCentsBRL(cents)}</p>
            <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
              {description || 'Descrição breve aparecerá aqui.'}
            </p>

            {/* CTA fake */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold hover:bg-emerald-500">
                WhatsApp
              </button>
              <button className="rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5">
                Compartilhar
              </button>
            </div>

            {/* prévia do mapa (opcional, se já tivermos lat/lng) */}
            <div className="mt-6">
              {Number.isFinite(loc.centerLat as number) && Number.isFinite(loc.centerLng as number) ? (
                <div className="overflow-hidden rounded-xl border border-white/10">
                  <AdMap
                    center={{ lat: loc.centerLat as number, lng: loc.centerLng as number }}
                    radiusKm={loc.radiusKm}
                  />
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 p-3 text-xs text-muted-foreground">
                  Defina sua localização para ver a prévia do alcance no mapa.
                </div>
              )}
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Prévia visual. Na próxima etapa ajustaremos os detalhes e faremos a confirmação para
              compartilhar no WhatsApp.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
