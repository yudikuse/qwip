"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Tipo local simples para não depender de import só-de-tipo.
type LatLng = { lat: number; lng: number };

// Carrega o mapa apenas no client (evita “window is not defined” no build)
const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });

const LIMITS = { minRadius: 1, maxRadius: 50 } as const;

// Mapa “estado → UF” caso o Nominatim não entregue ISO
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

// Helpers de preço
const formatBRL = (v: number | null) =>
  typeof v === "number"
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v)
    : "—";

const parseToNumber = (raw: string): number | null => {
  const clean = raw.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(clean);
  return Number.isFinite(n) ? n : null;
};

export default function NovaPaginaAnuncio() {
  // form
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [priceRaw, setPriceRaw] = useState(""); // mantemos o texto do input
  const priceNumber = useMemo(() => parseToNumber(priceRaw), [priceRaw]);
  const [desc, setDesc] = useState("");

  // localização
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [cep, setCep] = useState("");
  const [geoDenied, setGeoDenied] = useState(false); // fallback
  const [triedGeo, setTriedGeo] = useState(false);
  const [perm, setPerm] = useState<"granted" | "denied" | "prompt" | "unknown">("unknown");
  const [city, setCity] = useState("Atual");
  const [uf, setUF] = useState<string>("");
  const [radius, setRadius] = useState(5);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  // Permissions API para controlar quando mostrar o CEP
  useEffect(() => {
    if (typeof navigator !== "undefined" && "permissions" in navigator) {
      // @ts-ignore PermissionName não tipado em alguns TS
      navigator.permissions
        .query({ name: "geolocation" as PermissionName })
        .then((status: any) => {
          setPerm(status.state); // 'granted' | 'denied' | 'prompt'
          status.onchange = () => setPerm(status.state);
        })
        .catch(() => setPerm("unknown"));
    }
  }, []);

  // Pede geolocalização explicitamente
  const askGeolocation = () => {
    if (!("geolocation" in navigator)) return;
    setTriedGeo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoDenied(false);
      },
      (err) => {
        // 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
        if (err?.code === 1) setGeoDenied(true);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Regra única para exibir CEP (com Permissions API + fallback)
  const showCEP =
    perm === "unknown"
      ? geoDenied || (triedGeo && !coords)
      : perm === "denied" || (perm !== "granted" && triedGeo && !coords);

  // Reverse geocode → cidade + UF
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

        // UF pode vir no ISO3166-2-lvlX (“BR-SP”)
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

  // CEP com múltiplos fallbacks
  const locateByCEP = async () => {
    const digits = (cep || "").replace(/\D/g, "");
    if (digits.length !== 8) {
      alert("Informe um CEP válido (8 dígitos).");
      return;
    }

    // 1) BrasilAPI (pode vir com coordenadas)
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

    // 2) ViaCEP → endereço → Nominatim
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

    // 3) Nominatim por postalcode
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
            // tenta inferir cidade/UF do display_name
            const display = String(arr[0].display_name || "");
            // normalmente "... , Cidade, Estado, Brasil"
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

  const canPublish = Boolean(file && title.trim() && priceNumber !== null && desc.trim());

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
                  Título do anúncio <span className="text-emerald-400">*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Vestido midi floral"
                  className="mt-1 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Preço (R$) <span className="text-emerald-400">*</span>
                </label>
                <input
                  value={priceRaw}
                  onChange={(e) => setPriceRaw(e.target.value)}
                  placeholder="Ex.: 129,90"
                  inputMode="decimal"
                  className="mt-1 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-500"
                />
                <div className="mt-1 text-[11px] text-zinc-500">
                  Formato aceito: 1.234,56 (vírgula nos centavos).
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

                {showCEP && (
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
              {/* Foto ocupa o quadro inteiro (object-cover) */}
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
                {/* Título maior que a descrição */}
                <div className="text-base font-semibold leading-tight">
                  {title || "Título do anúncio"}
                </div>

                {/* Preço em destaque */}
                <div className="mt-2 text-lg font-bold text-emerald-400">
                  {formatBRL(priceNumber)}
                </div>

                {/* Descrição enxuta só para preview */}
                <div className="mt-1 text-xs text-zinc-400 line-clamp-3">
                  {desc || "Sua descrição aparecerá aqui..."}
                </div>

                <div className="mt-2 text-xs text-zinc-400">
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
          <div className="relative z-0">
            <GeoMap center={coords} radiusKm={radius} onLocationChange={setCoords} height={320} />
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Se a localização não aparecer, clique em “Usar minha localização”. Caso negue, informe
            seu CEP.
          </p>
        </section>
      </div>
    </main>
  );
}
