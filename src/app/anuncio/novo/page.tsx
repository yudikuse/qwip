// src/app/anuncio/novo/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import nextDynamic from "next/dynamic";
import Image from "next/image";

// Evita a pré-renderização dessa rota no lado do servidor
// (necessário porque usamos APIs do browser como geolocalização/Leaflet)
export const dynamic = "force-dynamic";

// Carrega o componente do mapa somente no cliente
const GeoMap = nextDynamic(() => import("@/components/GeoMap"), { ssr: false });

type LatLng = { lat: number; lng: number };

const LIMITS = {
  minRadius: 1, // km
  maxRadius: 50, // km
};

export default function NovoAnuncioPage() {
  // Formulário
  const [file, setFile] = useState<File | null>(null);
  const [price, setPrice] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // Localização
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [cep, setCep] = useState<string>(""); // usado se o usuário negar geolocalização
  const [radius, setRadius] = useState<number>(5);

  // Pré-visualização da imagem
  const previewUrl = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  // Pede a localização do usuário (apenas no cliente)
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        // Negou ou falhou: ficará null e o usuário deverá informar CEP
        setCoords(null);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  // Helpers
  const cepDigits = useMemo(() => cep.replace(/\D/g, "").slice(0, 8), [cep]);
  const radiusLabel = `${radius} km`;

  // Form submit (apenas visual por enquanto)
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !price || !description) return;
    // Neste momento apenas bloqueamos o submit real; integração de backend será feita depois
    alert("Anúncio validado localmente. Integração de backend virá em seguida.");
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-6 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Criar anúncio</h1>
          <Link
            href="/"
            className="inline-flex items-center rounded-md border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5"
          >
            Voltar
          </Link>
        </div>

        <p className="mt-1 text-sm text-zinc-400">
          Preencha os campos. A localização usará sua posição atual ou um CEP.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* COLUNA: FORM */}
          <section className="rounded-2xl border border-white/10 bg-card p-5">
            <form className="space-y-5" onSubmit={onSubmit}>
              {/* Foto */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Foto do produto <span className="text-rose-400">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="block w-full rounded-md border border-white/10 bg-transparent file:mr-3 file:rounded-md file:border-0 file:bg-emerald-500 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#0F1115] hover:file:bg-emerald-400"
                  required
                />
              </div>

              {/* Preço */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Preço <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ex.: 99,90"
                  className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Descrição <span className="text-rose-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva seu produto/serviço..."
                  rows={5}
                  className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Alcance: raio + CEP fallback */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Área de alcance
                </label>
                <p className="mb-2 text-xs text-zinc-400">
                  Se não permitir localização, informe um CEP.
                </p>

                {/* Slider de raio */}
                <div className="flex items-center gap-3">
                  <span className="text-sm">Raio (km):</span>
                  <span className="text-sm font-semibold text-emerald-400">{radiusLabel}</span>
                </div>
                <input
                  type="range"
                  min={LIMITS.minRadius}
                  max={LIMITS.maxRadius}
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="mt-2 w-full"
                />

                {/* CEP somente quando sem coords */}
                {!coords && (
                  <div className="mt-3">
                    <label className="mb-1 block text-sm">CEP (obrigatório se sem localização)</label>
                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      placeholder="Ex.: 01311000"
                      className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500"
                      required
                    />
                    <p className="mt-1 text-xs text-zinc-500">Somente números.</p>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#0F1115] transition hover:bg-emerald-400"
                  disabled={!file || !price || !description || (!coords && cepDigits.length < 8)}
                >
                  Publicar anúncio
                </button>
              </div>
            </form>
          </section>

          {/* COLUNA: MAPA + PRÉ-VISUALIZAÇÃO */}
          <section className="space-y-5">
            {/* Mapa (carregado no cliente) */}
            <div className="rounded-2xl border border-white/10 bg-card p-3">
              <GeoMap
                center={coords ?? null}
                cep={coords ? undefined : cepDigits}
                radiusKm={radius}
              />
            </div>

            {/* Card de pré-visualização do anúncio (simulação de vitrine) */}
            <div className="rounded-2xl border border-white/10 bg-card p-4">
              <div className="relative overflow-hidden rounded-lg">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Pré-visualização"
                    width={1200}
                    height={800}
                    className="h-56 w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-56 w-full items-center justify-center rounded-lg bg-zinc-900 text-sm text-zinc-500">
                    Sua foto aparecerá aqui
                  </div>
                )}

                <div className="absolute left-2 top-2 rounded-md bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-zinc-900">
                  Expira em 24h
                </div>
              </div>

              <div className="mt-3">
                <h3 className="text-base font-semibold text-white">
                  {description.trim() ? description.slice(0, 42) : "Seu título/descrição aparecerá aqui"}
                </h3>

                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="font-semibold text-zinc-200">
                    {price ? `Preço: R$ ${Number(price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Preço: —"}
                  </span>
                  <span className="text-zinc-400">Cidade: {coords ? "Atual" : cepDigits ? "por CEP" : "—"}</span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-[#0F1115] transition hover:bg-emerald-400"
                  >
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/5"
                  >
                    Compartilhar
                  </button>
                </div>
              </div>
            </div>

            {/* Simulação simples de “preview do WhatsApp” (placeholder) */}
            <div className="rounded-2xl border border-white/10 bg-card p-4">
              <p className="mb-3 text-sm font-medium text-zinc-300">Pré-visualização (WhatsApp)</p>
              <div className="rounded-lg border border-white/10 bg-[#0B0E12] p-3 text-sm">
                <div className="mb-2 rounded-md bg-emerald-900/30 px-3 py-2 text-emerald-200">
                  Tenho interesse: {description.trim() ? description.slice(0, 36) : "Seu produto"} — https://qwip.app/abc123
                </div>

                <div className="overflow-hidden rounded-md border border-white/10">
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt="Preview miniatura"
                      width={1200}
                      height={800}
                      className="h-40 w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center bg-zinc-900 text-zinc-500">
                      Thumb do seu anúncio
                    </div>
                  )}
                  <div className="space-y-1 bg-zinc-950/60 p-3">
                    <div className="text-xs text-zinc-400">QWIP.APP</div>
                    <div className="text-sm font-semibold text-white">
                      {description.trim() ? description.slice(0, 36) : "Seu título aqui"}
                    </div>
                    <div className="text-xs text-zinc-400">
                      {price ? `R$ ${Number(price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                      {" · "}Disponível por tempo limitado
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-right text-xs text-zinc-500">14:32 ✓✓</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
