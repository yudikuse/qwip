"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// Tipo local para coordenadas (evita import apenas de tipo)
type LatLng = { lat: number; lng: number };

// Carrega o mapa somente no client
const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });

const LIMITS = { minRadius: 1, maxRadius: 50 } as const;

export default function NovaPaginaAnuncio() {
  // ---- Form fields ----
  const [title, setTitle] = useState("");               // novo: título
  const [file, setFile] = useState<File | null>(null);

  // Preço: guardamos só dígitos (centavos) e formatamos como BRL
  const [priceDigits, setPriceDigits] = useState("");   // ex.: "3790" = R$ 37,90
  const priceNumber = useMemo(
    () => (priceDigits ? Number(priceDigits) / 100 : 0),
    [priceDigits]
  );
  const priceMasked = useMemo(() => {
    if (!priceDigits) return "";
    return (Number(priceDigits) / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }, [priceDigits]);

  const [desc, setDesc] = useState("");

  // ---- Localização ----
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [cep, setCep] = useState("");
  const [geoDenied, setGeoDenied] = useState(false);
  const [city, setCity] = useState("Atual");
  const [radius, setRadius] = useState(5);

  // Preview da imagem
  const previewUrl = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  // Pede geolocalização (botão)
  const askGeolocation = () => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoDenied(false);
      },
      () => setGeoDenied(true),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Reverse geocode para nome da cidade
  useEffect(() => {
    let stop = false;
    (async () => {
      if (!coords) return;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.lng}`,
          { headers: { Accept: "application/json" } }
        );
        const data = await res.json();
        if (stop) return;
        const nome =
          data?.address?.city ||
          data?.address?.town ||
          data?.address?.village ||
          data?.address?.suburb ||
          "Atual";
        setCity(nome);
      } catch {
        setCity("Atual");
      }
    })();
    return () => {
      stop = true;
    };
  }, [coords]);

  // CEP -> múltiplos fallbacks (BrasilAPI -> ViaCEP+Nominatim -> Nominatim postalcode)
  const locateByCEP = async () => {
    const digits = (cep || "").replace(/\D/g, "");
    if (digits.length !== 8) {
      alert("Informe um CEP válido (8 dígitos).");
      return;
    }

    try {
      const r = await fetch(`https://brasilapi.com.br/api/cep/v2/${digits}`, {
        cache: "no-store",
      });
      if (r.ok) {
        const d = await r.json();
        const lat = d?.location?.coordinates?.latitude;
        const lng = d?.location?.coordinates?.longitude;
        if (typeof lat === "number" && typeof lng === "number") {
          setCoords({ lat, lng });
          setCity(d?.city && d?.state ? `${d.city} - ${d.state}` : "Atual");
          setGeoDenied(false);
          return;
        }
      }
    } catch {}

    try {
      const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`, {
        cache: "no-store",
      });
      if (r.ok) {
        const d = await r.json();
        if (!d.erro) {
          const cidade: string | undefined = d.localidade;
          const uf: string | undefined = d.uf;
          const pedacoRua: string = d.logradouro || d.bairro || "";
          const query = [pedacoRua, cidade && uf ? `${cidade} - ${uf}` : ""]
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
                  setCity(cidade && uf ? `${cidade} - ${uf}` : "Atual");
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
            const guessed =
              parts.length >= 3
                ? `${parts[parts.length - 4]} - ${parts[parts.length - 3]}`
                : "Atual";
            setCity(guessed);
            setGeoDenied(false);
            return;
          }
        }
      }
    } catch {}

    alert("CEP não encontrado. Tente outro CEP ou use 'Usar minha localização'.");
  };

  // Regras para habilitar publicação
  const canPublish =
    !!file && title.trim().length > 0 && desc.trim().length > 0 && priceNumber > 0;

  // Handler da máscara de preço (BRL)
  const onPriceInput = (v: string) => {
    const digitsOnly = v.replace(/\D/g, ""); // mantém só números
    setPriceDigits(digitsOnly);
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
            {/* Título */}
            <div className="mb-4">
              <label className="block text-sm font-medium">
                Título do anúncio <span className="text-emerald-400">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Manicure e Pedicure"
                maxLength={80}
                className="mt-1 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-500"
              />
              <div className="mt-1 text-xs text-zinc-500">
                {title.length}/80 caracteres
              </div>
            </div>

            {/* Foto */}
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
              {/* Preço (BRL) */}
              <div>
                <label className="block text-sm font-medium">
                  Preço <span className="text-emerald-400">*</span>
                </label>
                <input
                  value={priceMasked}
                  onChange={(e) => onPriceInput(e.target.value)}
                  placeholder="R$ 99,90"
                  inputMode="numeric"
                  className="mt-1 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-500"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium">
                  Descrição <span className="text-emerald-400">*</span>
                </label>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Descreva seu produto/serviço..."
                  rows={5}
                  maxLength={500}
                  className="mt-1 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-500"
                />
                <div className="mt-1 text-xs text-zinc-500">
                  {desc.length}/500 caracteres
                </div>
              </div>

              {/* Raio */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-sm font-medium">
                    Área de alcance (km)
                  </label>
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

              {/* Localização / CEP */}
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

                {geoDenied && (
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
            <div className="mb-2 text-sm font-medium text-zinc-300">
              Preview do Anúncio
            </div>

            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-300 ring-1 ring-amber-400/20">
              Expira em 24h
            </div>

            {/* Card */}
            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0B0E12]">
              {/* Foto ocupa todo o quadro (cover) */}
              <div className="w-full" style={{ aspectRatio: "16 / 9" }}>
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500 bg-zinc-900">
                    (Sua foto aparecerá aqui)
                  </div>
                )}
              </div>

              <div className="p-4">
                {/* Título destacado */}
                <div className="text-base font-semibold text-white">
                  {title || "Seu título aparecerá aqui"}
                </div>

                {/* Preço em destaque secundário */}
                <div className="mt-1 text-lg font-bold text-emerald-400">
                  {priceDigits ? priceMasked : "R$ —"}
                </div>

                {/* Descrição resumida */}
                <div className="mt-1 text-sm text-zinc-300">
                  {desc ? desc.slice(0, 140) : "Sua descrição aparecerá aqui..."}
                </div>

                {/* Cidade */}
                <div className="mt-2 text-xs text-zinc-400">📍 {city}</div>

                {/* Ações */}
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
          <GeoMap
            center={coords}
            radiusKm={radius}
            onLocationChange={setCoords}
            height={320}
          />
          <p className="mt-2 text-xs text-zinc-500">
            Se a localização não aparecer, clique em “Usar minha localização”.
            Caso negue, informe seu CEP.
          </p>
        </section>
      </div>
    </main>
  );
}
