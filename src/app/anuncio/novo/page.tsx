"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

type LatLng = { lat: number; lng: number };
const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });

const LIMITS = { minRadius: 1, maxRadius: 50 } as const;
const STATE_TO_UF: Record<string, string> = { /* ...seu map atual aqui... */ };

export default function NovaPaginaAnuncio() {
  // form
  const [file, setFile] = useState<File | null>(null);
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");

  // ✅ novo: telefone verificado (somente leitura)
  const [phoneE164, setPhoneE164] = useState("");

  // localização
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [cep, setCep] = useState("");
  const [geoDenied, setGeoDenied] = useState(false);
  const [triedGeo, setTriedGeo] = useState(false);
  const [city, setCity] = useState("Atual");
  const [uf, setUF] = useState<string>("");
  const [radius, setRadius] = useState(5);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  // ✅ novo: lê o número verificado do cookie/localStorage
  useEffect(() => {
    try {
      const m = document.cookie.match(/(?:^|;\s*)qwip_phone_e164=([^;]+)/);
      if (m) setPhoneE164(decodeURIComponent(m[1]));
      else {
        const v = localStorage.getItem("qwip_phone_e164");
        if (v) setPhoneE164(v);
      }
    } catch {}
  }, []);

  // ... (resto do seu código atual: geolocalização, reverse geocode, CEP etc.)

  const canPublish = Boolean(file && price.trim() && desc.trim() && phoneE164); // ✅ exige telefone verificado

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Criar anúncio</h1>
          <Link href="/" className="rounded-lg border border-white/10 px-3 py-1.5 text-sm hover:bg-white/5">
            Voltar
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* FORM */}
          <div className="rounded-2xl border border-white/10 bg-card p-5">

            {/* ✅ campo somente leitura */}
            <div className="mb-4">
              <label className="block text-sm font-medium">WhatsApp (verificado)</label>
              <input
                value={phoneE164 || ""}
                readOnly
                placeholder="Faça login e verifique seu número"
                className="mt-1 w-full rounded-md border border-white/10 bg-zinc-900/40 px-3 py-2 text-sm text-zinc-400"
              />
              {!phoneE164 && (
                <p className="mt-1 text-xs text-amber-400">
                  Você precisa verificar o número por SMS para publicar.
                </p>
              )}
            </div>

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

            {/* ...seus campos de preço, descrição, raio, CEP, etc... */}

            <button
              disabled={!canPublish}
              className="mt-2 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-[#0F1115] transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Publicar anúncio
            </button>
          </div>

          {/* PREVIEW (igual ao atual) */}
          {/* ... */}
        </div>

        {/* MAPA ABAIXO (igual ao atual) */}
        {/* ... */}
      </div>
    </main>
  );
}
