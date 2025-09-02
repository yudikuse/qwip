"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

// ⛔️ impede prerender (evita "window is not defined" em ambientes server)
export const dynamic = "force-dynamic";

// Leaflet só no cliente
const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });

type LatLng = { lat: number; lng: number };

const LIMITS = {
  minRadius: 1,   // km
  maxRadius: 50,  // km (ajuste depois por plano)
};

// Contagem regressiva (ms -> {h,m})
function getCountdown(targetMs: number) {
  const diff = Math.max(0, targetMs - Date.now());
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return { h, m };
}

function formatPriceBRL(v: string | number) {
  const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
  if (isNaN(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function NovaPaginaAnuncio() {
  // ---------- form state ----------
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [price, setPrice] = useState<string>("20");
  const [desc, setDesc] = useState<string>("");

  // localização
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [cep, setCep] = useState<string>(""); // solicitado apenas se negar location
  const [city, setCity] = useState<string>("");

  const [radius, setRadius] = useState<number>(5);

  // preview / tabs
  const [tab, setTab] = useState<"anuncio" | "whats">("anuncio");

  // expiração (FREE = 24h)
  const expiresAt = useMemo(() => Date.now() + 24 * 60 * 60 * 1000, []);
  const [left, setLeft] = useState(() => getCountdown(expiresAt));

  // -------- efeitos --------
  // foto preview
  useEffect(() => {
    if (!file) {
      setImageUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // timer
  useEffect(() => {
    const t = setInterval(() => setLeft(getCountdown(expiresAt)), 30_000);
    return () => clearInterval(t);
  }, [expiresAt]);

  // tenta pegar geolocalização
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        // usuário negou -> exige CEP
        setCoords(null);
      },
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 10_000 }
    );
  }, []);

  // reverse geocoding (coords -> cidade) ou cep -> cidade
  useEffect(() => {
    let controller = new AbortController();

    async function fetchCityByCoords(c: LatLng) {
      try {
        const q = new URLSearchParams({
          lat: String(c.lat),
          lon: String(c.lng),
          format: "jsonv2",
          addressdetails: "1",
        });
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?${q}`, {
          signal: controller.signal,
          headers: { "Accept-Language": "pt-BR" },
        });
        const j = (await r.json()) as any;
        const cityName =
          j?.address?.city ||
          j?.address?.town ||
          j?.address?.village ||
          j?.address?.municipality ||
          "";
        setCity(cityName);
      } catch {}
    }

    async function fetchCityByCep(c: string) {
      // ViaCEP – simples e sem key
      const clean = c.replace(/\D/g, "");
      if (clean.length !== 8) return;
      try {
        const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`, {
          signal: controller.signal,
        });
        const j = (await r.json()) as any;
        if (j?.localidade) setCity(j.localidade);
      } catch {}
    }

    if (coords) fetchCityByCoords(coords);
    else if (cep.replace(/\D/g, "").length === 8) fetchCityByCep(cep);

    return () => controller.abort();
  }, [coords, cep]);

  // validação rápida
  const isValid =
    !!file && !!desc.trim() && !!price && (coords !== null || cep.replace(/\D/g, "").length === 8);

  // --------- render ----------
  return (
    <div className="container mx-auto max-w-6xl px-5 py-10">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Criar anúncio</h1>
        <Link
          href="/"
          className="rounded-md border border-white/10 px-3 py-1.5 text-sm text-zinc-300 hover:bg-white/5"
        >
          Voltar
        </Link>
      </div>

      <p className="mb-6 text-zinc-400">
        Preencha os campos. A localização usará sua posição atual ou um CEP.
      </p>

      <div className="grid gap-6 lg:grid-cols-[520px_1fr]">
        {/* -------- FORM -------- */}
        <div className="rounded-2xl border border-white/10 bg-card p-5">
          {/* FOTO */}
          <label className="block text-sm font-medium">Foto do produto *</label>
          <div className="mt-2 flex items-center gap-3">
            <label className="inline-flex cursor-pointer items-center justify-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-[#0F1115] hover:bg-emerald-500">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              Escolher ficheiro
            </label>
            <span className="truncate text-sm text-zinc-400">
              {file ? file.name : "Nenhum ficheiro selecionado"}
            </span>
          </div>

          {/* PREÇO */}
          <div className="mt-5">
            <label className="block text-sm font-medium">Preço *</label>
            <input
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ex: 99,90"
              className="mt-2 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2"
            />
          </div>

          {/* DESCRIÇÃO */}
          <div className="mt-5">
            <label className="block text-sm font-medium">Descrição *</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Descreva seu produto/serviço..."
              rows={5}
              className="mt-2 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2"
            />
          </div>

          {/* ÁREA / CEP */}
          <div className="mt-6">
            <label className="block text-sm font-medium">Área de alcance</label>
            <p className="mt-1 text-xs text-zinc-500">
              Se não permitir localização, informe um CEP (obrigatório).
            </p>

            {!coords && (
              <input
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                maxLength={9}
                placeholder="CEP (obrigatório se não compartilhar localização)"
                className="mt-2 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2"
              />
            )}

            <div className="mt-4 text-sm">
              <span className="mr-2 text-zinc-400">Raio (km):</span>
              <span className="font-semibold text-emerald-400">{radius} km</span>
            </div>
            <input
              type="range"
              min={LIMITS.minRadius}
              max={LIMITS.maxRadius}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="mt-2 w-full"
            />
          </div>

          {/* MAPA REAL – abaixo do formulário */}
          <div className="mt-6">
            <div className="text-sm font-medium">Mapa</div>
            <div className="mt-2 overflow-hidden rounded-lg border border-white/10">
              <GeoMap
                center={coords ?? null}
                cep={coords ? undefined : cep.replace(/\D/g, "")}
                radiusKm={radius}
              />
            </div>
          </div>

          {/* AÇÕES */}
          <button
            disabled={!isValid}
            className="mt-6 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-[#0F1115] transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Publicar anúncio
          </button>
        </div>

        {/* -------- PREVIEWS -------- */}
        <div className="space-y-4">
          {/* abas simples */}
          <div className="flex gap-2">
            <button
              onClick={() => setTab("anuncio")}
              className={`rounded-md px-3 py-1.5 text-sm ${
                tab === "anuncio" ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              Vitrine / Card
            </button>
            <button
              onClick={() => setTab("whats")}
              className={`rounded-md px-3 py-1.5 text-sm ${
                tab === "whats" ? "bg-white/10" : "hover:bg-white/5"
              }`}
            >
              WhatsApp
            </button>
          </div>

          {tab === "anuncio" ? (
            <PhoneFrame>
              <AdCardMock
                imageUrl={imageUrl}
                price={price}
                desc={desc}
                city={city}
                left={left}
              />
            </PhoneFrame>
          ) : (
            <PhoneFrame>
              <WhatsPreview
                imageUrl={imageUrl}
                price={price}
                desc={desc}
                left={left}
              />
            </PhoneFrame>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------- componentes locais (sem imports extras) -------------------- */

function PhoneFrame({ children }: { children: React.ReactNode }) {
  // moldura de celular simples
  return (
    <div className="mx-auto w-[360px] rounded-[2.5rem] border border-white/10 bg-[#0B0E12] p-4 shadow-2xl">
      <div className="mx-auto h-4 w-24 rounded-full bg-black/40" />
      <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
        {children}
      </div>
    </div>
  );
}

function ExpireBadge({ left }: { left: { h: number; m: number } }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-md bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-zinc-900">
      Expira em {left.h}h {left.m}m
    </div>
  );
}

function AdCardMock({
  imageUrl,
  price,
  desc,
  city,
  left,
}: {
  imageUrl: string | null;
  price: string;
  desc: string;
  city: string;
  left: { h: number; m: number };
}) {
  return (
    <div className="bg-white">
      {/* imagem */}
      <div className="relative h-40 w-full bg-zinc-200">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
        <div className="absolute left-2 top-2">
          <ExpireBadge left={left} />
        </div>
        <div className="absolute right-2 top-2 rounded-full bg-zinc-900/80 px-2 py-0.5 text-[11px] font-semibold text-white">
          Qwip
        </div>
      </div>

      {/* corpo */}
      <div className="p-3">
        <div className="text-[15px] font-semibold text-zinc-900">
          {desc ? desc.split("\n")[0].slice(0, 42) : "Seu título/descrição aparecerá aqui"}
        </div>
        <div className="mt-1 text-[13px] leading-snug text-zinc-600">
          {desc ? desc.slice(0, 140) : "Preço e detalhes aparecerão aqui."}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <div className="text-xl font-extrabold text-emerald-600">{formatPriceBRL(price)}</div>
          <div className="flex items-center gap-1 text-[12px] text-zinc-500">
            {/* ícone pino minimalista */}
            <span>📍</span>
            <span>{city || "Cidade"}</span>
          </div>
        </div>

        <button className="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
          Tenho interesse — WhatsApp
        </button>

        <button className="mt-2 w-full cursor-not-allowed rounded-lg bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-400">
          Compartilhar
        </button>

        <div className="mt-3 border-t pt-2 text-center text-[12px] text-zinc-500">
          100% direto no WhatsApp — sem taxas sobre a venda
        </div>
      </div>
    </div>
  );
}

function WhatsPreview({
  imageUrl,
  price,
  desc,
  left,
}: {
  imageUrl: string | null;
  price: string;
  desc: string;
  left: { h: number; m: number };
}) {
  const title = desc ? desc.split("\n")[0].slice(0, 40) : "Título do anúncio";
  return (
    <div className="h-[640px] w-full bg-[url('/images/wa-bg.png')] bg-cover p-3">
      {/* balão do vendedor com link */}
      <div className="max-w-[88%] rounded-2xl rounded-tr-sm bg-emerald-600 px-3 py-2 text-[13px] text-white shadow">
        Tenho interesse: {title} — https://qwip.app/abc123
      </div>

      {/* card preview do link (similar ao Whats) */}
      <div className="mt-2 w-[92%] overflow-hidden rounded-lg bg-white shadow">
        {/* topo com “expira” */}
        <div className="relative h-28 w-full bg-zinc-200">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
          <div className="absolute left-2 top-2">
            <ExpireBadge left={left} />
          </div>
        </div>
        <div className="p-2">
          <div className="text-[12px] font-semibold text-emerald-700">QWIP.APP</div>
          <div className="text-[14px] font-semibold text-zinc-900">{title}</div>
          <div className="text-[13px] text-zinc-600">
            {desc ? desc.slice(0, 90) : "Descrição do anúncio…"}
          </div>
          <div className="mt-1 text-[14px] font-extrabold text-emerald-700">
            {formatPriceBRL(price)}
          </div>
          <div className="mt-1 text-[11px] text-zinc-500">Disponível por tempo limitado</div>
        </div>
      </div>
    </div>
  );
}
