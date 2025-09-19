'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Carrega o mapa apenas no cliente
const MapPreview = dynamic(() => import('@/components/MapPreview'), { ssr: false });

type Draft = {
  title: string;
  priceDigits: string;          // "1850" => R$ 18,50
  description: string;
  imageDataUrl: string;         // data:image/...
  createdAt: string;
  city?: string;
  uf?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
};

// ---- helpers ----------------------------------------------------

function formatCentsBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format((cents || 0) / 100);
}

// máscara “R$ 0,00” usando somente dígitos internos
function maskBRLFromDigits(digits: string) {
  const clean = (digits || '').replace(/\D/g, '');
  const withMin = clean.replace(/^0+/, '') || '0';
  const cents = parseInt(withMin, 10);
  return formatCentsBRL(cents);
}

// ----------------------------------------------------------------

export default function CriarAnuncioPage() {
  const router = useRouter();

  // form
  const [title, setTitle] = useState('');
  const [priceDigits, setPriceDigits] = useState(''); // só dígitos; input exibe máscara
  const [description, setDescription] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string>('');

  // localização
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [city, setCity] = useState<string>('');
  const [uf, setUf] = useState<string>('');
  const [radiusKm, setRadiusKm] = useState<number>(8);

  // rascunho (quando volta da próxima tela)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('qwip_draft_ad');
      if (raw) {
        const d = JSON.parse(raw) as Draft;
        setTitle(d.title ?? '');
        setPriceDigits(d.priceDigits ?? '');
        setDescription(d.description ?? '');
        setImageDataUrl(d.imageDataUrl ?? '');
        if (typeof d.lat === 'number') setLat(d.lat);
        if (typeof d.lng === 'number') setLng(d.lng);
        if (d.city) setCity(d.city);
        if (d.uf) setUf(d.uf);
        if (typeof d.radiusKm === 'number') setRadiusKm(d.radiusKm);
      }
    } catch {}
  }, []);

  // geolocalização automática
  useEffect(() => {
    if (lat !== null && lng !== null) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        if (!city) setCity('Rio Verde');
        if (!uf) setUf('GO');
      },
      () => {
        // permissão negada: segue sem travar
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120_000 }
    );
  }, [lat, lng, city, uf]);

  const cents = useMemo(() => parseInt((priceDigits || '0').replace(/\D/g, ''), 10) || 0, [priceDigits]);

  // upload local (apenas dataURL)
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

  // usar localização manualmente
  function handleAskLocation() {
    if (!navigator.geolocation) {
      alert('Seu navegador não suporta geolocalização.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        if (!city) setCity('Rio Verde');
        if (!uf) setUf('GO');
      },
      () => alert('Não foi possível obter sua localização.'),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 120_000 }
    );
  }

  function handleContinue() {
    if (!title.trim() || !priceDigits) {
      alert('Preencha título e preço.');
      return;
    }

    const draft: Draft = {
      title: title.trim(),
      priceDigits: (priceDigits || '').replace(/\D/g, ''),
      description: description.trim(),
      imageDataUrl,
      createdAt: new Date().toISOString(),
      city,
      uf,
      lat: lat ?? undefined,
      lng: lng ?? undefined,
      radiusKm,
    };
    sessionStorage.setItem('qwip_draft_ad', JSON.stringify(draft));

    if (!sessionStorage.getItem('qwip_config_ad')) {
      sessionStorage.setItem(
        'qwip_config_ad',
        JSON.stringify({ category: '', radiusKm, urgencyTimer: true, city, uf })
      );
    }

    router.push('/anunciar/configurar');
  }

  const centerTuple: [number, number] =
    lat !== null && lng !== null ? [lat, lng] : [-17.792, -50.918]; // fallback Rio Verde

  // estilos curtos para botões/chips (Tailwind util-only)
  const btnPrimary =
    'inline-flex items-center justify-center rounded-xl bg-[#25d366] px-4 py-2 font-semibold text-black/90 ' +
    'shadow-sm hover:bg-[#1fd05f] transition';
  const btnOutline =
    'inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-2 font-semibold ' +
    'text-foreground hover:bg-white/5 transition';

  const chipYellow =
    'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ' +
    'bg-[#ffc857]/20 border-[#ffc857]/40 text-[#ffc857]';
  const chipNeutral =
    'inline-flex items-center rounded-md border border-white/15 px-2 py-0.5 text-xs text-muted-foreground';

  return (
    <main className="min-h-screen">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold">Crie seu anúncio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Versão inicial do passo de criação. Na próxima etapa ajustaremos os detalhes e faremos a confirmação
          para compartilhar no WhatsApp.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-[1.25fr,1fr]">
          {/* COLUNA ESQUERDA — formulário */}
          <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="space-y-5">
              {/* Foto */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Foto do anúncio (JPEG/PNG/WEBP, máx. 4MB)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={onFileChange}
                  className="block w-full cursor-pointer rounded-xl border border-white/15 bg-[#0f1115] px-3 py-2 text-sm
                             file:mr-3 file:rounded-lg file:border-0 file:bg-[#25d366] file:px-3 file:py-2
                             file:text-black/90 file:font-semibold hover:file:opacity-95"
                />
              </div>

              {/* Título */}
              <div>
                <label className="mb-1 block text-sm font-medium">Título *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                  className="w-full rounded-xl border border-white/15 bg-[#0f1115] px-3 py-2 text-sm outline-none"
                  placeholder="Ex.: Marmita Caseira com Entrega"
                />
                <p className="mt-1 text-xs text-muted-foreground">{title.length}/80 caracteres</p>
              </div>

              {/* Preço com máscara */}
              <div>
                <label className="mb-1 block text-sm font-medium">Preço (R$) *</label>
                <input
                  inputMode="numeric"
                  value={maskBRLFromDigits(priceDigits)}
                  onChange={(e) => setPriceDigits((e.target.value || '').replace(/\D/g, ''))}
                  className="w-full rounded-xl border border-white/15 bg-[#0f1115] px-3 py-2 text-sm outline-none"
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
                  className="w-full rounded-xl border border-white/15 bg-[#0f1115] px-3 py-2 text-sm outline-none"
                  placeholder="Conte os detalhes importantes do produto/serviço..."
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {description.length}/500 caracteres
                </p>
              </div>

              {/* Raio */}
              <div>
                <label className="mb-1 block text-sm font-medium">Área de alcance (km)</label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(Number(e.target.value))}
                  className="w-full"
                />
                <p className="mt-1 text-xs text-muted-foreground">Raio atual: {radiusKm} km</p>
              </div>

              {/* Localização */}
              <div className="rounded-xl border border-white/15 p-3">
                <p className="text-sm font-medium">Localização</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Usaremos sua posição atual. Se negar, informe seu CEP.
                </p>

                <div className="mt-2 flex items-center gap-3">
                  <button className={btnPrimary} type="button" onClick={handleAskLocation}>
                    Usar minha localização
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {city && uf ? `${city}, ${uf}` : lat && lng ? 'Localização definida' : '—'}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button onClick={handleContinue} className={btnPrimary}>
                  Continuar
                </button>
              </div>
            </div>
          </section>

          {/* COLUNA DIREITA — prévia */}
          <aside className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="mb-3 h-56 overflow-hidden rounded-xl border border-white/10">
              {imageDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageDataUrl}
                  alt="Prévia da imagem"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  (Prévia da imagem)
                </div>
              )}
            </div>

            {/* Chips visíveis no dark */}
            <div className="mb-2 flex flex-wrap gap-2">
              <span className={chipYellow}>Expira em 24h</span>
              <span className={chipNeutral}>alcança {radiusKm} km</span>
            </div>

            <h3 className="text-lg font-semibold">{title || 'Título do anúncio'}</h3>
            <div className="text-emerald-400 font-semibold">{formatCentsBRL(cents)}</div>

            {/* Descrição na prévia */}
            <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
              {description || 'Descrição breve aparecerá aqui.'}
            </p>

            <div className="mt-1 text-sm text-muted-foreground">
              {city && uf ? `${city}, ${uf}` : 'Defina sua localização'}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button className={btnPrimary} type="button">WhatsApp</button>
              <button className={btnOutline} type="button">Compartilhar</button>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Prévia visual. Na próxima etapa abriremos a configuração do anúncio.
            </p>
          </aside>
        </div>

        {/* Mapa grande com o raio */}
        <section className="rounded-2xl border border-white/10 bg-black/20 p-4 mt-6">
          <div className="text-sm font-medium">Área no mapa</div>
          <div className="mt-3">
            <MapPreview center={centerTuple} radiusKm={radiusKm} />
          </div>
          <div className="mt-2 text-right">
            <span className={chipNeutral}>Raio atual: {radiusKm} km</span>
          </div>
        </section>
      </div>
    </main>
  );
  }
