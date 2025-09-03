"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// --- Tipos e utilitários ---
type LatLng = { lat: number; lng: number };

const STATE_TO_UF: Record<string, string> = {
  Acre: "AC",
  Alagoas: "AL",
  Amapá: "AP",
  Amazonas: "AM",
  Bahia: "BA",
  Ceará: "CE",
  "Distrito Federal": "DF",
  "Espírito Santo": "ES",
  Goiás: "GO",
  Maranhão: "MA",
  "Mato Grosso": "MT",
  "Mato Grosso do Sul": "MS",
  "Minas Gerais": "MG",
  Pará: "PA",
  Paraíba: "PB",
  Paraná: "PR",
  Pernambuco: "PE",
  Piauí: "PI",
  "Rio de Janeiro": "RJ",
  "Rio Grande do Norte": "RN",
  "Rio Grande do Sul": "RS",
  Rondônia: "RO",
  Roraima: "RR",
  "Santa Catarina": "SC",
  "São Paulo": "SP",
  Sergipe: "SE",
  Tocantins: "TO",
};

const LIMITS = { minRadius: 1, maxRadius: 50 } as const;

// Máscara BRL
function formatBRLMaskFromDigits(digits: string): string {
  if (!digits) return "";
  const only = digits.replace(/\D/g, "");
  const padded = only.padStart(3, "0");
  const cents = padded.slice(-2);
  const whole = padded.slice(0, -2);
  const wholeNumber = Number(whole);
  const wholeFormatted = wholeNumber.toLocaleString("pt-BR");
  return `${wholeFormatted},${cents}`;
}
function parseMaskToCents(masked: string): number {
  const digits = masked.replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits); // centavos
}
function formatCentsToBRL(cents: number): string {
  const value = cents / 100;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Formata exibição do E.164
function formatE164ForDisplay(e164: string): string {
  // Ex.: +5511912345678 -> +55 (11) 91234-5678
  const m = e164.match(/^\+?(\d{2})(\d{2})(\d+)?$/); // simples: +55 DDD resto
  if (!m) return e164;
  const cc = m[1]; // 55
  const ddd = m[2]; // 11
  const rest = e164.replace(/^\+?55\d{2}/, ""); // remove +55 + DDD
  if (rest.length === 9) return `+${cc} (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
  if (rest.length === 8) return `+${cc} (${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  return `+${cc} (${ddd}) ${rest}`;
}

// Leaflet só no client
const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });

export default function NovaPaginaAnuncio() {
  // --- Form ---
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  // preço
  const [priceMasked, setPriceMasked] = useState("");
  const priceCents = useMemo(() => parseMaskToCents(priceMasked), [priceMasked]);

  // número verificado (somente leitura)
  const [sellerPhoneE164, setSellerPhoneE164] = useState<string>("");

  // --- Localização / mapa ---
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [cep, setCep] = useState("");
  const [geoDenied, setGeoDenied] = useState(false);
  const [triedGeo, setTriedGeo] = useState(false);
  const [city, setCity] = useState("Atual");
  const [uf, setUF] = useState<string>("");
  const [radius, setRadius] = useState(5);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  // Carrega o número verificado do localStorage (fluxo de OTP irá gravar "qwip:phoneE164")
  useEffect(() => {
    try {
      const saved = localStorage.getItem("qwip:phoneE164");
      if (saved) setSellerPhoneE164(saved);
    } catch {}
  }, []);

  // --- Geolocalização ---
  const askGeolocation = () => {
    if (!("geolocation" in navigator)) return;
    setTriedGeo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoDenied(false);
      },
      (err) => {
        if (err?.code === 1) setGeoDenied(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Reverse geocode para cidade e UF
  useEffect(() => {
    let stop = false;
    (async () => {
      if (!coords) return;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.lng}`,
          { headers: { Accept: "application/json" }, cache: "no-store" }
        );
        const data = await res.json();
        if (stop) return;

        const nomeCidade =
          data?.address?.city ||
          data?.address?.town ||
          data?.address?.village ||
          data?.address?.suburb ||
          "Atual";

        const iso: string | undefined =
          data?.address?.["ISO3166-2-lvl4"] ||
          data?.address?.["ISO3166-2-lvl3"] ||
          data?.address?.["ISO3166-2-lvl2"];

        let ufGuess = "";
        if (typeof iso === "string" && iso.startsWith("BR-")) {
          ufGuess = iso.slice(3);
        } else if (data?.address?.state && STATE_TO_UF[data.address.state]) {
          ufGuess = STATE_TO_UF[data.address.state];
        }

        setCity(nomeCidade);
        setUF(ufGuess || "");
      } catch {
        setCity("Atual");
        setUF("");
      }
    })();
    return () => {
      stop = true;
    };
  }, [coords]);

  // CEP → localização (com fallbacks)
  const locateByCEP = async () => {
    const digits = (cep || "").replace(/\D/g, "");
    if (digits.length !== 8) {
      alert("Informe um CEP válido (8 dígitos).");
      return;
    }

    try {
      const r = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`, { cache: "no-store" });
      if (r.ok) {
        const d = await r.json();
        const lat = d?.location?.coordinates?.latitude;
        const lng = d?.location?.coordinates?.longitude;
        if (typeof lat === "number" && typeof lng === "number") {
          setCoords({ lat, lng });
          setCity(d?.city || "Atual");
          setUF(d?.state || "");
          setGeoDenied(false);
          return;
        }
      }
    } catch {}

    try {
      const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { cache: "no-store" });
      if (r.ok) {
        const d = await r.json();
        if (!d.erro) {
          const cidade: string | undefined = d.localidade;
          const ufLocal: string | undefined = d.uf;
          const pedacoRua: string = d.logradouro || d.bairro || "";
          const query = [pedacoRua, cidade && ufLocal ? `${cidade} - ${ufLocal}` : ""]
            .filter(Boolean)
            .join(", ");

          if (query) {
            const q = encodeURIComponent(`${query}, Brasil`);
            const n = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`,
              { cache: "no-store" }
            );
            if (n.ok) {
              const arr = await n.json();
              if (Array.isArray(arr) && arr.length > 0) {
                const lat = parseFloat(arr[0].lat);
                const lng = parseFloat(arr[0].lon);
                if (Number.isFinite(lat) && Number.isFinite(lng)) {
                  setCoords({ lat, lng });
                  setCity(cidade || "Atual");
                  setUF(ufLocal || "");
                  setGeoDenied(false);
                  return;
                }
              }
            }
          }
        }
      }
    } catch {}

    try {
      const n2 = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&country=BR&postalcode=${encodeURIComponent(
          digits
        )}&limit=1`,
        { cache: "no-store" }
      );
      if (n2.ok) {
        const arr = await n2.json();
        if (Array.isArray(arr) && arr.length > 0) {
          const lat = parseFloat(arr[0].lat);
          const lng = parseFloat(arr[0].lon);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            setCoords({ lat, lng });
            const display = String(arr[0].display_name || "");
            const parts = display.split(",").map((s) => s.trim());
            let cidadeGuess = "Atual";
            let ufGuess = "";
            if (parts.length >= 3) {
              cidadeGuess = parts[parts.length - 3];
              const estadoNome = parts[parts.length - 2];
              ufGuess = STATE_TO_UF[estadoNome] || "";
            }
            setCity(cidadeGuess);
            setUF(ufGuess);
            setGeoDenied(false);
            return;
          }
        }
      }
    } catch {}

    alert('CEP não encontrado. Tente outro CEP ou use "Usar minha localização".');
  };

  const showCEP = geoDenied || (triedGeo && !coords);

  // preço handler
  const onChangePrice = (value: string) => {
    const digits = value.replace(/\D/g, "");
    setPriceMasked(formatBRLMaskFromDigits(digits));
  };

  // Publicar
  const canPublish =
    Boolean(title.trim() && desc.trim() && priceCents > 0 && sellerPhoneE164) && Boolean(coords);

  const submitAd = async () => {
    if (!canPublish || !coords) return;

    try {
      const body = {
        title: title.trim(),
        description: desc.trim(),
        sellerPhoneE164, // vem de localStorage (verificado)
        priceCents,
        city: city || "Atual",
        uf: uf || "",
        lat: coords.lat,
        lng: coords.lng,
        centerLat: coords.lat,
        centerLng: coords.lng,
        radiusKm: radius,
      };

      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const t = await res.text();
        alert(`Falha ao criar anúncio: ${t}`);
        return;
      }

      const data = await res.json();
      alert(`Anúncio criado! ID: ${data?.id || "(sem id)"}`);
    } catch {
      alert("Erro ao publicar. Tente novamente.");
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Criar anúncio</h1>
          <Link
            href="/"
            className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
          >
            Voltar
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* FORM */}
          <div className="rounded-2xl border border-white/10 bg-card p-5">
            <label className="block text-sm font-medium">
              Foto do produto <span className="text-emerald-400">*</span>
            </label>
            <div className="mt-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full rounded-md border border-white/10 bg-transparent text-sm file:mr-4 file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[#0F1115] hover:file:bg-emerald-500"
              />
            </div>

            <div className="mt-5 grid gap-4">
              <div>
                <label className="block text-sm font-medium">
                  Título <span className="text-emerald-400">*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Manicure e Pedicure"
                  className="mt-1 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-500"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium">
                    Preço <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    value={priceMasked}
                    onChange={(e) => onChangePrice(e.target.value)}
                    inputMode="numeric"
                    placeholder="Ex.: 99,90"
                    className="mt-1 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-500"
                  />
                </div>

                {/* WhatsApp verificado – SOMENTE LEITURA */}
                <div>
                  <label className="block text-sm font-medium">
                    WhatsApp do vendedor (verificado)
                  </label>
                  <div className="mt-1 inline-flex min-h-[40px] w-full items-center rounded-md border border-white/10 bg-white/5 px-3 text-sm">
                    {sellerPhoneE164 ? (
                      <span className="font-medium">
                        {formatE164ForDisplay(sellerPhoneE164)}
                      </span>
                    ) : (
                      <span className="text-zinc-500">
                        — número ainda não verificado (publique após verificar)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Descrição <span className="text-emerald-400">*</span>
                </label>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Descreva seu produto/serviço..."
                  rows={5}
                  className="mt-1 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-500"
                />
              </div>

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-sm font-medium">Área de alcance (km)</label>
                  <span className="text-xs text-zinc-400">{radius} km</span>
                </div>
                <input
                  type="range"
                  min={LIMITS.minRadius}
                  max={LIMITS.maxRadius}
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value, 10))}
                  className="w-full"
                />
              </div>

              <div className="rounded-lg border border-white/10 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">Localização</div>
                    <div className="text-xs text-zinc-400">
                      Usaremos sua posição atual. Se negar, informe seu CEP.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={askGeolocation}
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-[#0F1115] hover:bg-emerald-500"
                  >
                    Usar minha localização
                  </button>
                </div>

                {(geoDenied || (triedGeo && !coords)) && (
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
                )}
              </div>

              <button
                onClick={submitAd}
                disabled={!canPublish}
                className="mt-2 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-[#0F1115] transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Publicar anúncio
              </button>
            </div>
          </div>

          {/* PREVIEW */}
          <div className="rounded-2xl border border-white/10 bg-card p-5">
            <div className="mb-2 text-xs font-medium text-zinc-400">Preview do Anúncio</div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-300 ring-1 ring-amber-400/20">
              Expira em 24h
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0B0E12]">
              <div className="h-56 w-full bg-zinc-900">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="preview" className="h-56 w-full object-cover" />
                ) : (
                  <div className="flex h-56 items-center justify-center text-xs text-zinc-500">
                    (Sua foto aparecerá aqui)
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="text-base font-semibold">
                  {title || "Seu título aparecerá aqui"}
                </div>
                <div className="mt-1 text-sm text-zinc-300 line-clamp-2">
                  {desc || "Sua descrição aparecerá aqui"}
                </div>

                <div className="mt-2 text-sm text-emerald-400 font-semibold">
                  {priceCents > 0 ? formatCentsToBRL(priceCents) : "R$ —"}
                </div>
                <div className="mt-1 text-xs text-zinc-400">
                  {city}
                  {uf ? `, ${uf}` : ""}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-[#0F1115] transition hover:bg-emerald-400">
                    WhatsApp
                  </button>
                  <button className="inline-flex items-center justify-center rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/5">
                    Compartilhar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MAPA ABAIXO */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Área no mapa</h2>
            <div className="text-xs text-zinc-400">
              Raio atual: <span className="font-medium text-zinc-200">{radius} km</span>
            </div>
          </div>
          <GeoMap center={coords} radiusKm={radius} onLocationChange={setCoords} height={320} />
          <p className="mt-2 text-xs text-zinc-500">
            Se a localização não aparecer, clique em “Usar minha localização”. Caso negue, informe
            seu CEP.
          </p>
        </section>
      </div>
    </main>
  );
}
