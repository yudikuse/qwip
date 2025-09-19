'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

// ===== Tipos do rascunho =====
type Draft = {
  title: string;
  priceDigits: string;           // "1850" => R$ 18,50
  description: string;
  imageDataUrl: string;          // data:image/...
  createdAt: string;             // ISO
  // localização
  lat: number | null;
  lng: number | null;
  city?: string;
  uf?: string;
  radiusKm: number;              // slider
};

// ===== Helpers =====
function formatCentsBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    currencyDisplay: 'symbol',
  }).format(cents / 100);
}

function classNames(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(' ');
}

// ===== Mapa (Leaflet) – carregado só no client =====
type MapProps = { center: [number, number]; radiusKm: number };

const MapPreview = dynamic<MapProps>(
  async () => {
    const RL = await import('react-leaflet');
    const { MapContainer, TileLayer, Circle } = RL;

    const MapPreviewInner: React.FC<MapProps> = ({ center, radiusKm }) => (
      <div className="relative">
        <MapContainer
          center={center}
          zoom={13}
          scrollWheelZoom={false}
          style={{ height: 320, width: '100%', borderRadius: 12, overflow: 'hidden' }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* Pin do centro (círculo pequeno) */}
          <Circle
            center={center}
            radius={60}
            pathOptions={{ color: '#1d4ed8', fillColor: '#1d4ed8', fillOpacity: 0.95 }}
          />
          {/* Raio configurável */}
          <Circle
            center={center}
            radius={Math.max(200, radiusKm * 1000)}
            pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.12 }}
          />
        </MapContainer>

        <div className="pointer-events-none absolute right-3 top-3 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white">
          Raio atual: {radiusKm} km
        </div>
      </div>
    );

    return MapPreviewInner;
  },
  { ssr: false }
);

// ===== Reverse geocode (Nominatim) =====
async function reverseGeocode(lat: number, lng: number) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
    const r = await fetch(url, {
      headers: {
        // Boa prática para Nominatim
        'Accept': 'application/json',
      },
    });
    const j = await r.json();
    const city =
      j?.address?.city ||
      j?.address?.town ||
      j?.address?.village ||
      j?.address?.municipality ||
      '';
    const uf =
      j?.address?.state_code ||
      (j?.address?.state ? abbrevBR(j.address.state) : '') ||
      '';
    return { city: String(city), uf: String(uf).toUpperCase() };
  } catch {
    return { city: '', uf: '' };
  }
}

// tentativa de mapear alguns estados (caso Nominatim retorne nome completo)
function abbrevBR(state: string): string {
  const m: Record<string, string> = {
    'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM',
    'Bahia': 'BA', 'Ceará': 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES',
    'Goiás': 'GO', 'Maranhão': 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS',
    'Minas Gerais': 'MG', 'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR',
    'Pernambuco': 'PE', 'Piauí': 'PI', 'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN',
    'Rio Grande do Sul': 'RS', 'Rondônia': 'RO', 'Roraima': 'RR', 'Santa Catarina': 'SC',
    'São Paulo': 'SP', 'Sergipe': 'SE', 'Tocantins': 'TO',
  };
  return m[state] || '';
}

// =========================================================

export default function CriarAnuncioPage() {
  const router = useRouter();

  // Campos do formulário
  const [title, setTitle] = useState('');
  const [priceDigits, setPriceDigits] = useState(''); // só dígitos
  const [description, setDescription] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string>('');

  // Localização
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const centerTuple = lat != null && lng != null ? ([lat, lng] as [number, number]) : null;
  const [city, setCity] = useState<string>('');
  const [uf, setUf] = useState<string>('');
  const [radiusKm, setRadiusKm] = useState<number>(5);

  // Fallback por CEP (mostrado só se negar localização)
  const [needCep, setNeedCep] = useState(false);
  const [cep, setCep] = useState('');

  // ===== Restaura rascunho (se houver) =====
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('qwip_draft_ad');
      if (raw) {
        const d = JSON.parse(raw) as Partial<Draft>;
        setTitle(d.title || '');
        setPriceDigits(d.priceDigits || '');
        setDescription(d.description || '');
        setImageDataUrl(d.imageDataUrl || '');
        if (typeof d.radiusKm === 'number') setRadiusKm(d.radiusKm);
        if (Number.isFinite(d.lat)) setLat(d.lat!);
        if (Number.isFinite(d.lng)) setLng(d.lng!);
        if (d.city) setCity(d.city);
        if (d.uf) setUf(d.uf);
      }
    } catch {
      // ignore
    }
  }, []);

  // ===== Pede localização automaticamente ao abrir =====
  useEffect(() => {
    requestLocation(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Formata preço =====
  const cents = useMemo(() => parseInt(priceDigits || '0', 10), [priceDigits]);

  // ===== Handlers =====
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

  async function requestLocation(showPrompt = true) {
    if (!('geolocation' in navigator)) {
      setNeedCep(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        setNeedCep(false);

        // tenta descobrir cidade/UF
        const info = await reverseGeocode(latitude, longitude);
        if (info.city) setCity(info.city);
        if (info.uf) setUf(info.uf);
      },
      () => {
        // negado ou falhou
        if (showPrompt) alert('Não foi possível obter sua localização. Você pode informar o CEP.');
        setNeedCep(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  async function applyCep() {
    // muito simples: chama viacep pra pegar cidade/UF (sem setar coordenadas)
    const zip = (cep || '').replace(/\D/g, '');
    if (zip.length !== 8) {
      alert('CEP inválido');
      return;
    }
    try {
      const r = await fetch(`https://viacep.com.br/ws/${zip}/json/`);
      const j = await r.json();
      if (j?.erro) throw new Error('CEP não encontrado');
      setCity(j.localidade || '');
      setUf((j.uf || '').toUpperCase());
      // sem coords – mapa não aparece; mostramos apenas cidade/UF na prévia
      alert('Localização ajustada via CEP.');
    } catch {
      alert('Falha ao buscar CEP. Tente novamente.');
    }
  }

  function handleContinue() {
    if (!title.trim() || !priceDigits) {
      alert('Preencha título e preço.');
      return;
    }

    // Salva rascunho para próxima etapa
    const draft: Draft = {
      title: title.trim(),
      priceDigits,
      description: description.trim(),
      imageDataUrl,
      createdAt: new Date().toISOString(),
      lat,
      lng,
      city,
      uf,
      radiusKm,
    };
    sessionStorage.setItem('qwip_draft_ad', JSON.stringify(draft));

    // Garante config default (será refinada em /anunciar/configurar)
    if (!sessionStorage.getItem('qwip_config_ad')) {
      sessionStorage.setItem(
        'qwip_config_ad',
        JSON.stringify({ category: '', radiusKm, urgencyTimer: true, city, uf })
      );
    }

    router.push('/anunciar/configurar');
  }

  // ===== UI =====
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold">Crie seu anúncio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Versão inicial do passo de criação. Na próxima etapa ajustaremos os detalhes e faremos a confirmação para compartilhar no WhatsApp.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-[1.25fr,1fr]">
          {/* ===== Coluna esquerda: formulário ===== */}
          <section className="rounded-2xl border border-white/10 p-4">
            <div className="space-y-4">
              {/* Foto */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Foto do anúncio (JPEG/PNG/WEBP, máx. 4MB)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={onFileChange}
                  className={classNames(
                    'block w-full cursor-pointer rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm',
                    'file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-500'
                  )}
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
                <p className="mt-1 text-xs text-muted-foreground">{(title || '').length}/80 caracteres</p>
              </div>

              {/* Preço */}
              <div>
                <label className="mb-1 block text-sm font-medium">Preço (R$) *</label>
                <input
                  inputMode="numeric"
                  value={priceDigits}
                  onChange={(e) => setPriceDigits((e.target.value || '').replace(/\D/g, ''))}
                  className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
                  placeholder="Ex.: 18,50"
                />
                <p className="mt-1 text-xs text-muted-foreground">Valor atual: {formatCentsBRL(cents)}</p>
              </div>

              {/* Descrição */}
              <div>
                <label className="mb-1 block text-sm font-medium">Descrição *</label>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
                  placeholder="Conte os detalhes importantes do produto/serviço..."
                />
                <p className="mt-1 text-xs text-muted-foreground">{(description || '').length}/500 caracteres</p>
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
              <div className="rounded-xl border border-white/10 p-3">
                <div className="text-sm font-medium">Localização</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Usaremos sua posição atual. Se negar, informe seu CEP.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => requestLocation(true)}
                    className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold hover:bg-emerald-500"
                  >
                    Usar minha localização
                  </button>

                  <div className="text-sm text-muted-foreground">
                    {city && uf
                      ? `${city}, ${uf}`
                      : lat != null && lng != null
                        ? `(${lat.toFixed(4)}, ${lng.toFixed(4)})`
                        : '—'}
                  </div>
                </div>

                {needCep && (
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      inputMode="numeric"
                      maxLength={9}
                      placeholder="CEP (ex.: 01001-000)"
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      className="w-44 rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
                    />
                    <button
                      type="button"
                      onClick={applyCep}
                      className="rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5"
                    >
                      Usar CEP
                    </button>
                  </div>
                )}
              </div>

              {/* Continuar */}
              <div className="pt-2">
                <button
                  onClick={handleContinue}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500"
                >
                  Continuar
                </button>
              </div>
            </div>
          </section>

          {/* ===== Coluna direita: prévia ===== */}
          <aside className="rounded-2xl border border-white/10 p-4">
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

            <div className="flex flex-wrap gap-2">
              <span className="rounded-md bg-amber-400/15 px-2 py-0.5 text-xs font-medium text-amber-300">
                Expira em 24h
              </span>
              <span className="rounded-md border border-white/10 px-2 py-0.5 text-xs text-muted-foreground">
                alcança {radiusKm} km
              </span>
            </div>

            <div className="mt-2">
              <div className="text-sm text-muted-foreground">
                {city && uf ? `${city}, ${uf}` : '—'}
              </div>
              <h2 className="mt-1 text-lg font-semibold">{title || 'Título do anúncio'}</h2>
              <div className="text-emerald-400">{formatCentsBRL(cents)}</div>
              <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                {description || 'Descrição breve aparecerá aqui.'}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <button className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white opacity-60">
                WhatsApp
              </button>
              <button className="rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold opacity-60">
                Compartilhar
              </button>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">
              Prévia visual. Na próxima etapa abriremos a configuração do anúncio.
            </p>
          </aside>
        </div>

        {/* ===== Mapa ===== */}
        {centerTuple ? (
          <div className="mt-6 rounded-2xl border border-white/10 p-4 md:col-span-2">
            <div className="mb-2 text-sm font-medium">Área no mapa</div>
            <MapPreview center={centerTuple as [number, number]} radiusKm={radiusKm} />
          </div>
        ) : null}
      </div>
    </main>
  );
}
