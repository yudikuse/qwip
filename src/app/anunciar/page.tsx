// src/app/anunciar/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

// ===== Tipos =====
type Draft = {
  title: string;
  priceDigits: string;     // ex "1850" = R$ 18,50
  description: string;
  imageDataUrl: string;    // data:image/...
  createdAt: string;       // ISO
};

type Config = {
  category: string;
  radiusKm: number;
  urgencyTimer: boolean;
  city?: string;
  uf?: string;
  lat?: number | null;
  lng?: number | null;
};

// ===== Helpers =====
function formatCentsBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

// UF por nome de estado (para reverse geocode)
const STATE_TO_UF: Record<string, string> = {
  Acre: 'AC', Alagoas: 'AL', Amapá: 'AP', Amazonas: 'AM',
  Bahia: 'BA', Ceará: 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES',
  Goiás: 'GO', Maranhão: 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS',
  'Minas Gerais': 'MG', Pará: 'PA', Paraíba: 'PB', Paraná: 'PR',
  Pernambuco: 'PE', Piauí: 'PI', 'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN',
  'Rio Grande do Sul': 'RS', Rondônia: 'RO', Roraima: 'RR', 'Santa Catarina': 'SC',
  'São Paulo': 'SP', Sergipe: 'SE', Tocantins: 'TO',
};

// ===== Página =====
export default function CriarAnuncioPage() {
  const router = useRouter();

  // Form básico
  const [title, setTitle] = useState('');
  const [priceDigits, setPriceDigits] = useState(''); // só dígitos
  const [description, setDescription] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState<string>('');

  // Localização (auto + fallback CEP)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [city, setCity] = useState<string | undefined>(undefined);
  const [uf, setUF] = useState<string | undefined>(undefined);
  const [radiusKm, setRadiusKm] = useState<number>(5);
  const [triedGeo, setTriedGeo] = useState(false);
  const [geoDenied, setGeoDenied] = useState(false);
  const [cep, setCep] = useState('');

  // Carrega rascunho anterior (se existir)
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
        const c = JSON.parse(rawCfg) as Partial<Config>;
        if (typeof c.radiusKm === 'number') setRadiusKm(c.radiusKm);
      }
    } catch {}
  }, []);

  // ===== Geolocalização automática ao abrir =====
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    setTriedGeo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(ll);
        setGeoDenied(false);
      },
      (err) => {
        if (err?.code === 1) setGeoDenied(true); // negou
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Botão “Usar minha localização” (re-tentar)
  function askGeolocationAgain() {
    if (!('geolocation' in navigator)) return;
    setTriedGeo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const ll = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(ll);
        setGeoDenied(false);
      },
      (err) => {
        if (err?.code === 1) setGeoDenied(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Descobre Cidade/UF a partir do GPS (reverse geocode — Nominatim)
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!coords) return;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.lng}`,
          { headers: { Accept: 'application/json' }, cache: 'no-store' }
        );
        const data = await res.json();
        if (cancel) return;

        const nomeCidade =
          data?.address?.city ||
          data?.address?.town ||
          data?.address?.village ||
          data?.address?.suburb;

        const iso: string | undefined =
          data?.address?.['ISO3166-2-lvl4'] ||
          data?.address?.['ISO3166-2-lvl3'] ||
          data?.address?.['ISO3166-2-lvl2'];

        let ufGuess = '';
        if (typeof iso === 'string' && iso.startsWith('BR-')) ufGuess = iso.slice(3);
        else if (data?.address?.state && STATE_TO_UF[data.address.state])
          ufGuess = STATE_TO_UF[data.address.state];

        setCity(nomeCidade);
        setUF(ufGuess || undefined);
      } catch {
        // silencia — não bloqueia fluxo
      }
    })();
    return () => {
      cancel = true;
    };
  }, [coords]);

  // CEP → coordenadas (3 tentativas como no antigo)
  async function locateByCEP() {
    const digits = (cep || '').replace(/\D/g, '');
    if (digits.length !== 8) {
      alert('Informe um CEP válido (8 dígitos).');
      return;
    }

    // 1) BrasilAPI (tem coordenadas)
    try {
      const r = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`, { cache: 'no-store' });
      if (r.ok) {
        const d = await r.json();
        const lat = d?.location?.coordinates?.latitude;
        const lng = d?.location?.coordinates?.longitude;
        if (typeof lat === 'number' && typeof lng === 'number') {
          setCoords({ lat, lng });
          setCity(d?.city);
          setUF(d?.state);
          setGeoDenied(false);
          return;
        }
      }
    } catch {}

    // 2) ViaCEP + Nominatim (monta consulta por rua/bairro + cidade + UF)
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { cache: 'no-store' });
      if (r.ok) {
        const d = await r.json();
        if (!d.erro) {
          const cidade: string | undefined = d.localidade;
          const ufLocal: string | undefined = d.uf;
          const pedacoRua: string = d.logradouro || d.bairro || '';
          const query = [pedacoRua, cidade && ufLocal ? `${cidade} - ${ufLocal}` : '']
            .filter(Boolean)
            .join(', ');
          if (query) {
            const q = encodeURIComponent(`${query}, Brasil`);
            const n = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`,
              { cache: 'no-store' }
            );
            if (n.ok) {
              const arr = await n.json();
              if (Array.isArray(arr) && arr.length > 0) {
                const lat = parseFloat(arr[0].lat);
                const lng = parseFloat(arr[0].lon);
                if (Number.isFinite(lat) && Number.isFinite(lng)) {
                  setCoords({ lat, lng });
                  setCity(cidade);
                  setUF(ufLocal);
                  setGeoDenied(false);
                  return;
                }
              }
            }
          }
        }
      }
    } catch {}

    // 3) Nominatim por postalcode
    try {
      const n2 = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&country=BR&postalcode=${encodeURIComponent(
          digits
        )}&limit=1`,
        { cache: 'no-store' }
      );
      if (n2.ok) {
        const arr = await n2.json();
        if (Array.isArray(arr) && arr.length > 0) {
          const lat = parseFloat(arr[0].lat);
          const lng = parseFloat(arr[0].lon);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            setCoords({ lat, lng });
            const display = String(arr[0].display_name || '');
            const parts = display.split(',').map((s) => s.trim());
            let cidadeGuess: string | undefined;
            let ufGuess: string | undefined;
            if (parts.length >= 3) {
              cidadeGuess = parts[parts.length - 3];
              const estadoNome = parts[parts.length - 2];
              ufGuess = STATE_TO_UF[estadoNome] || undefined;
            }
            setCity(cidadeGuess);
            setUF(ufGuess);
            setGeoDenied(false);
            return;
          }
        }
      }
    } catch {}

    alert('CEP não encontrado. Tente outro CEP ou use “Usar minha localização”.');
  }

  const showCEP = geoDenied || (triedGeo && !coords);
  const cents = useMemo(() => parseInt(priceDigits || '0', 10), [priceDigits]);

  // Upload local → dataURL
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

  // Continuar → salva rascunho + config e vai para /anunciar/configurar
  function handleContinue() {
    if (!title.trim() || !priceDigits) {
      alert('Preencha título e preço.');
      return;
    }

    const draft: Draft = {
      title: title.trim(),
      priceDigits,
      description: description.trim(),
      imageDataUrl,
      createdAt: new Date().toISOString(),
    };
    sessionStorage.setItem('qwip_draft_ad', JSON.stringify(draft));

    const cfg: Config = {
      category: '',
      radiusKm,
      urgencyTimer: true,
      city,
      uf,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    };
    sessionStorage.setItem('qwip_config_ad', JSON.stringify(cfg));

    router.push('/anunciar/configurar');
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-bold">Crie seu anúncio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Versão inicial do passo de criação. Na próxima etapa ajustaremos os detalhes e faremos a
          confirmação para compartilhar no WhatsApp.
        </p>

        <div className="mt-6 grid gap-6 md:grid-cols-[1.25fr,1fr]">
          {/* FORM */}
          <section className="rounded-2xl border border-white/10 p-4">
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Foto do anúncio (JPEG/PNG/WEBP, máx. 4MB)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={onFileChange}
                  className="block w-full cursor-pointer rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm
                             file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#0F1115]
                             hover:file:bg-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Título *</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
                  placeholder="Ex.: Marmita Caseira com Entrega"
                />
                <p className="mt-1 text-xs text-muted-foreground">0/80 caracteres</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Preço (R$) *</label>
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
                <label className="mb-1 block text-sm font-medium">Descrição *</label>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 text-sm outline-none"
                  placeholder="Conte os detalhes importantes do produto/serviço…"
                />
                <p className="mt-1 text-xs text-muted-foreground">0/500 caracteres</p>
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-sm font-medium">Área de alcance (km)</label>
                  <span className="text-xs text-muted-foreground">{radiusKm} km</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(parseInt(e.target.value, 10) || 1)}
                  className="w-full"
                />
              </div>

              {/* Localização */}
              <div className="rounded-xl border border-white/10 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">Localização</div>
                    <div className="text-xs text-muted-foreground">
                      Usaremos sua posição atual. Se negar, informe seu CEP.
                    </div>
                    {coords ? (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {city ? `${city}${uf ? `, ${uf}` : ''}` : 'Localização detectada'}
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={askGeolocationAgain}
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-[#0F1115] hover:bg-emerald-500"
                  >
                    Usar minha localização
                  </button>
                </div>

                {/* CEP só aparece se negou/errou o GPS */}
                {showCEP ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      placeholder="Informe seu CEP (apenas números)"
                      className="rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-500"
                    />
                    <button
                      type="button"
                      onClick={locateByCEP}
                      className="rounded-md border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
                    >
                      Localizar por CEP
                    </button>
                  </div>
                ) : null}
              </div>

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

          {/* PRÉVIA */}
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

            <p className="text-sm font-medium">{title || 'Título do anúncio'}</p>
            <p className="text-emerald-400">{formatCentsBRL(cents)}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {city ? `${city}${uf ? `, ${uf}` : ''}` : 'Defina sua localização para ver a prévia do alcance.'}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <button className="rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5">
                WhatsApp
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
