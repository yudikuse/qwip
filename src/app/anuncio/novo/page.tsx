"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// 1) Carrega o mapa SOMENTE no cliente (evita "window is not defined")
const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });

// 2) Evita o Next tentar pré-renderizar esta página
export const dynamic = "force-dynamic";

type LatLng = { lat: number; lng: number };
type Limits = { minRadius: number; maxRadius: number };
const LIMITS: Limits = { minRadius: 1, maxRadius: 20 };

const onlyDigits = (s: string) => (s || "").replace(/\D+/g, "");

export default function NovoAnuncioPage() {
  const [foto, setFoto] = useState<File | null>(null);
  const [preco, setPreco] = useState<string>("");
  const [descricao, setDescricao] = useState<string>("");

  const [coords, setCoords] = useState<LatLng | null>(null);
  const [permDenied, setPermDenied] = useState(false);
  const [cep, setCep] = useState("");

  const [radius, setRadius] = useState<number>(5);

  // Geolocalização: se negar, obriga CEP
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setPermDenied(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setPermDenied(false);
      },
      () => {
        setPermDenied(true);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, []);

  // Clampa o raio 1x ao montar
  useEffect(() => {
    setRadius((r) => Math.min(LIMITS.maxRadius, Math.max(LIMITS.minRadius, r)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cepDigits = useMemo(() => onlyDigits(cep), [cep]);
  const hasPreco = useMemo(() => onlyDigits(preco).length > 0, [preco]);

  const formValid =
    Boolean(foto) &&
    descricao.trim().length >= 3 &&
    hasPreco &&
    (coords !== null || (!!cepDigits && cepDigits.length === 8));

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Criar anúncio</h1>
          <Link
            href="/"
            className="rounded-md border border-white/10 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/5"
          >
            Voltar
          </Link>
        </div>

        <p className="mt-1 text-sm text-zinc-400">
          Preencha os campos. A localização usará sua posição atual ou um CEP.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* FORM */}
          <form
            className="rounded-2xl border border-white/10 bg-card p-5"
            onSubmit={(e) => {
              e.preventDefault();
              alert("Validação OK. (Próximo passo: salvar anúncio e ir para link de compartilhamento)");
            }}
          >
            <div>
              <label className="block text-sm font-medium text-zinc-200">
                Foto do produto <span className="text-rose-400">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFoto(e.target.files?.[0] ?? null)}
                className="mt-2 block w-full rounded-md border border-white/10 bg-transparent p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-emerald-500 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-[#0F1115] hover:file:bg-emerald-400"
                required
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-zinc-200">
                Preço <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Ex.: 18,50"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                className="mt-2 w-full rounded-md border border-white/10 bg-transparent p-2 text-sm outline-none focus:border-emerald-500/50"
                required
              />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-zinc-200">
                Descrição <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={4}
                placeholder="Descreva seu produto/serviço…"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                className="mt-2 w-full rounded-md border border-white/10 bg-transparent p-2 text-sm outline-none focus:border-emerald-500/50"
                required
              />
            </div>

            {/* ALCANCE */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold">Área de alcance</h3>
              <p className="mt-1 text-xs text-zinc-400">
                Se não permitir localização, informe um CEP.
              </p>

              {permDenied && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-zinc-200">
                    CEP (obrigatório se localização negada)
                  </label>
                  <input
                    type="text"
                    maxLength={9}
                    placeholder="00000-000"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    className="mt-2 w-full rounded-md border border-white/10 bg-transparent p-2 text-sm outline-none focus:border-emerald-500/50"
                  />
                  <p className="mt-1 text-xs text-zinc-500">
                    Digite 8 dígitos (com ou sem traço).
                  </p>
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium text-zinc-200">
                  Raio (km): <span className="text-emerald-400">{radius} km</span>
                </label>
                <input
                  type="range"
                  min={LIMITS.minRadius}
                  max={LIMITS.maxRadius}
                  value={radius}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setRadius(Math.min(LIMITS.maxRadius, Math.max(LIMITS.minRadius, v)));
                  }}
                  className="mt-2 w-full"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!formValid}
              className="mt-6 w-full rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#0F1115] disabled:cursor-not-allowed disabled:opacity-60 hover:bg-emerald-400"
            >
              Publicar anúncio
            </button>
          </form>

          {/* MAPA + PRÉVIA */}
          <div className="space-y-4">
            {/* GeoMap só é carregado no cliente por causa do dynamic + ssr:false */}
            {/* @ts-expect-error - o componente é dinâmico e carrega no client */}
            <GeoMap
              center={coords ?? null}
              cep={coords ? undefined : cepDigits}
              radiusKm={radius}
              className="h-72 rounded-2xl overflow-hidden border border-white/10"
            />

            <div className="rounded-2xl border border-white/10 bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-zinc-400">Pré-visualização</div>
                <span className="rounded-md bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-black">
                  Expira em 24h
                </span>
              </div>

              <div className="mt-3 rounded-lg border border-white/10 p-3">
                <div className="text-sm font-semibold text-zinc-100">
                  {descricao ? descricao.slice(0, 60) : "Seu título/descrição aparecerá aqui"}
                </div>
                <div className="mt-1 text-xs text-zinc-400">
                  {hasPreco ? `Preço: R$ ${preco}` : "Preço não informado"}
                </div>
                <div className="mt-2 flex gap-2">
                  <button className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-[#0F1115]">
                    WhatsApp
                  </button>
                  <button className="rounded-md border border-white/10 px-3 py-1.5 text-xs text-zinc-200">
                    Compartilhar
                  </button>
                </div>
              </div>

              {/* depois conectamos a prévia do link real do WhatsApp com o número verificado */}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
