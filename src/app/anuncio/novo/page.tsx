"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { LatLng } from "@/components/GeoMap";

const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });

const LIMITS = { minRadius: 1, maxRadius: 50 } as const;

export default function NovaPaginaAnuncio() {
  // form
  const [file, setFile] = useState<File | null>(null);
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");

  // localização
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [cep, setCep] = useState("");
  const [geoDenied, setGeoDenied] = useState(false);
  const [city, setCity] = useState("Atual");
  const [radius, setRadius] = useState(5);

  const previewUrl = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  // botão: pedir geolocalização explicitamente
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

  // reverse geocode pra cidade
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

  // fallback por CEP
  const locateByCEP = async () => {
    const digits = (cep || "").replace(/\D/g, "");
    if (digits.length < 8) return alert("Informe um CEP válido (8 dígitos).");
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=br&postalcode=${digits}&limit=1`
      );
      const data = await r.json();
      if (!data?.[0]) return alert("CEP não encontrado.");
      const lat = parseFloat(data[0].lat);
      const lng = parseFloat(data[0].lon);
      setCoords({ lat, lng });
      setGeoDenied(false);
    } catch {
      alert("Não foi possível localizar o CEP.");
    }
  };

  const canPublish = file && price.trim() && desc.trim();

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
                  Preço <span className="text-emerald-400">*</span>
                </label>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex.: 99,90"
                  className="mt-1 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-500"
                />
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
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-300 ring-1 ring-amber-400/20">
              Expira em 24h
            </div>

            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0B0E12]">
              <div className="h-56 w-full bg-zinc-900">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="preview"
                    className="h-56 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center text-xs text-zinc-500">
                    (Sua foto aparecerá aqui)
                  </div>
                )}
              </div>

              <div className="p-4">
                <div className="text-sm font-semibold">
                  {desc ? desc.slice(0, 64) : "Seu título/descrição aparecerá aqui"}
                </div>
                <div className="mt-1 text-xs text-zinc-400">
                  Preço: {price ? `R$ ${price}` : "—"}
                </div>
                <div className="mt-1 text-xs text-zinc-400">Cidade: {city}</div>

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
