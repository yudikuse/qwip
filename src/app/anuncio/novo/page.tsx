// src/app/anuncio/novo/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { createAdSecure, type CreatePayload } from "@/lib/ads-client";

type LatLng = { lat: number; lng: number };
const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });

const LIMITS = { minRadius: 1, maxRadius: 50 } as const;

const STATE_TO_UF: Record<string, string> = {
  Acre: "AC", Alagoas: "AL", Amapá: "AP", Amazonas: "AM",
  Bahia: "BA", Ceará: "CE", "Distrito Federal": "DF", "Espírito Santo": "ES",
  Goiás: "GO", Maranhão: "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS",
  "Minas Gerais": "MG", Pará: "PA", Paraíba: "PB", Paraná: "PR",
  Pernambuco: "PE", Piauí: "PI", "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN",
  "Rio Grande do Sul": "RS", Rondônia: "RO", Roraima: "RR", "Santa Catarina": "SC",
  "São Paulo": "SP", Sergipe: "SE", Tocantins: "TO",
};

// ===== Máscara de preço (R$) =====
const MAX_INT_DIGITS = 12;
function formatIntWithDots(intDigits: string) {
  const clean = intDigits.replace(/\D/g, "") || "0";
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
function clampDigits(s: string, max: number) {
  return s.replace(/\D/g, "").slice(0, max);
}

// File → base64 (somente payload, sem "data:image/...;base64,")
const toB64 = (f: File) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] || "");
    r.onerror = () => reject(new Error("Falha ao ler a imagem."));
    r.readAsDataURL(f);
  });

export default function NovaPaginaAnuncio() {
  // Guard: precisa do cookie de telefone verificado
  useEffect(() => {
    try {
      const has = document.cookie.split("; ").some((c) => c.startsWith("qwip_phone_e164="));
      if (!has) {
        const current = window.location.pathname + window.location.search;
        window.location.replace(`/verificar?redirect=${encodeURIComponent(current)}`);
      }
    } catch {}
  }, []);

  // Form
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  // Máscara
  const [intDigits, setIntDigits] = useState<string>("");
  const [centDigits, setCentDigits] = useState<string>("");
  const [editingCents, setEditingCents] = useState<boolean>(false);

  const priceMasked = useMemo(() => {
    const intPart = formatIntWithDots(intDigits || "0");
    const cents = (centDigits + "00").slice(0, 2);
    return `${intPart},${cents}`;
  }, [intDigits, centDigits]);

  const priceCents = useMemo(() => {
    const reais = parseInt(intDigits || "0", 10) || 0;
    const cents = parseInt((centDigits + "00").slice(0, 2), 10) || 0;
    return reais * 100 + cents;
  }, [intDigits, centDigits]);

  // Localização
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [cep, setCep] = useState("");
  const [geoDenied, setGeoDenied] = useState(false);
  const [triedGeo, setTriedGeo] = useState(false);
  const [city, setCity] = useState("Atual");
  const [uf, setUF] = useState<string>("");
  const [radius, setRadius] = useState(5);

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

  // GPS
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

  // Reverse geocode
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!coords) return;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.lat}&lon=${coords.lng}`,
          { headers: { Accept: "application/json" }, cache: "no-store" }
        );
        const data = await res.json();
        if (cancel) return;

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
        if (typeof iso === "string" && iso.startsWith("BR-")) ufGuess = iso.slice(3);
        else if (data?.address?.state && STATE_TO_UF[data.address.state])
          ufGuess = STATE_TO_UF[data.address.state];

        setCity(nomeCidade);
        setUF(ufGuess || "");
      } catch {
        setCity("Atual");
        setUF("");
      }
    })();
    return () => { cancel = true; };
  }, [coords]);

  // CEP → coords
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
          setCoords({ lat, lng }); setCity(d?.city || "Atual"); setUF(d?.state || ""); setGeoDenied(false);
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
          const query = [pedacoRua, cidade && ufLocal ? `${cidade} - ${ufLocal}` : ""].filter(Boolean).join(", ");
          if (query) {
            const q = encodeURIComponent(`${query}, Brasil`);
            const n = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`, { cache: "no-store" });
            if (n.ok) {
              const arr = await n.json();
              if (Array.isArray(arr) && arr.length > 0) {
                const lat = parseFloat(arr[0].lat); const lng = parseFloat(arr[0].lon);
                if (Number.isFinite(lat) && Number.isFinite(lng)) {
                  setCoords({ lat, lng }); setCity(cidade || "Atual"); setUF(ufLocal || ""); setGeoDenied(false);
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
        `https://nominatim.openstreetmap.org/search?format=json&country=BR&postalcode=${encodeURIComponent(digits)}&limit=1`,
        { cache: "no-store" }
      );
      if (n2.ok) {
        const arr = await n2.json();
        if (Array.isArray(arr) && arr.length > 0) {
          const lat = parseFloat(arr[0].lat); const lng = parseFloat(arr[0].lon);
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            setCoords({ lat, lng });
            const display = String(arr[0].display_name || "");
            const parts = display.split(",").map((s) => s.trim());
            let cidadeGuess = "Atual"; let ufGuess = "";
            if (parts.length >= 3) {
              cidadeGuess = parts[parts.length - 3];
              const estadoNome = parts[parts.length - 2];
              ufGuess = STATE_TO_UF[estadoNome] || "";
            }
            setCity(cidadeGuess); setUF(ufGuess); setGeoDenied(false);
            return;
          }
        }
      }
    } catch {}

    alert("CEP não encontrado. Tente outro CEP ou use “Usar minha localização”.");
  };

  const showCEP = geoDenied || (triedGeo && !coords);

  // Máscara handlers
  function handlePriceKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const k = e.key;
    if (k === "Tab") return;
    if (k === "," || k === ".") { if (!editingCents) setEditingCents(true); e.preventDefault(); return; }
    if (k === "Backspace") {
      if (editingCents && centDigits.length > 0) { setCentDigits(c => c.slice(0, -1)); if (centDigits.length <= 1) setEditingCents(false); }
      else { setIntDigits(i => i.slice(0, -1)); }
      e.preventDefault(); return;
    }
    if (k === "Delete") { setIntDigits(""); setCentDigits(""); setEditingCents(false); e.preventDefault(); return; }
    if (/^\d$/.test(k)) {
      if (editingCents) { if (centDigits.length < 2) setCentDigits(c => (c + k).slice(0, 2)); }
      else { setIntDigits(i => clampDigits(i + k, MAX_INT_DIGITS)); }
      e.preventDefault(); return;
    }
    e.preventDefault();
  }

  function handlePricePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const raw = e.clipboardData.getData("text") || "";
    const normalized = raw.replace(/\s+/g, "").replace(/\./g, "").replace(",", ".");
    const parts = normalized.split(".");
    const intPart = clampDigits(parts[0] || "0", MAX_INT_DIGITS);
    const centsPart = clampDigits(parts[1] || "", 2);
    setIntDigits(intPart.replace(/^0+(?=\d)/, "")); setCentDigits(centsPart); setEditingCents(centsPart.length > 0);
    e.preventDefault();
  }

  // Só habilita publicar com localização válida
  const canPublish = Boolean(file && title.trim() && priceCents > 0 && desc.trim() && coords);

  // Publicar
  const publish = async () => {
    try {
      if (!file) { alert("Selecione uma imagem."); return; }
      if (!file.type.startsWith("image/")) { alert("Arquivo inválido. Envie uma imagem."); return; }
      if (!coords) { alert("Defina a localização (GPS ou CEP)."); return; }

      // Limite amistoso para corpo do request (ajuste se necessário no backend)
      const MAX_BYTES = 4 * 1024 * 1024;
      if (file.size > MAX_BYTES) { alert("Imagem muito grande (máx. 4MB). Tente outra menor."); return; }

      const imageBase64 = await toB64(file);

      const body: CreatePayload = {
        title: title.trim(),
        description: desc.trim(),
        priceCents,
        city,
        uf,
        lat: coords.lat,
        lng: coords.lng,
        centerLat: coords.lat,
        centerLng: coords.lng,
        radiusKm: radius,
        imageBase64,
      };

      const res = await createAdSecure(body);

      if (!res.ok) {
        const status = res.status;
        const data = "data" in res ? (res as any).data : undefined;
        const errorText = "errorText" in res ? (res as any).errorText as (string | undefined) : undefined;

        const msg =
          (data && (data.error || data.message)) ||
          errorText ||
          (status === 400 && "Dados inválidos.") ||
          (status === 413 && "Arquivo muito grande para envio.") ||
          "Falha ao criar anúncio.";

        alert(msg);

        if (status === 401) {
          const current = window.location.pathname + window.location.search;
          window.location.replace(`/verificar?redirect=${encodeURIComponent(current)}`);
        }
        return;
      }

      alert(res.data?.id ? `Anúncio criado! ID: ${res.data.id}` : "Anúncio criado!");
    } catch (err) {
      console.error(err);
      alert("Erro inesperado ao criar anúncio.");
    }
  };

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
                  placeholder="Ex.: Bicicleta aro 29 semi-nova"
                  className="mt-1 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Preço <span className="text-emerald-400">*</span>
                </label>
                <input
                  inputMode="numeric"
                  value={priceMasked}
                  onKeyDown={handlePriceKeyDown}
                  onPaste={handlePricePaste}
                  onFocus={(e) => {
                    const len = e.currentTarget.value.length;
                    requestAnimationFrame(() => e.currentTarget.setSelectionRange(len, len));
                  }}
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
                  <label className="block text-sm font-medium">Área de alcance (km)</label>
                  <span className="text-xs text-zinc-400">{radius} km</span>
                </div>
                <input
                  type="range"
                  min={LIMITS.minRadius}
                  max={LIMITS.maxRadius}
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value, 10) || LIMITS.minRadius)}
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

                {(geoDenied || (triedGeo && !coords)) ? (
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

              <button
                onClick={publish}
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
                <div className="text-sm font-semibold">{title || "Título do anúncio"}</div>
                <div className="mt-1 text-xs text-zinc-400">Preço: {priceMasked ? `R$ ${priceMasked}` : "—"}</div>
                <div className="mt-1 text-xs text-zinc-400">Cidade: {city}{uf ? `, ${uf}` : ""}</div>

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

        {/* MAPA */}
        <section className="mt-8 rounded-2xl border border-white/10 bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Área no mapa</h2>
            <div className="text-xs text-zinc-400">
              Raio atual: <span className="font-medium text-zinc-200">{radius} km</span>
            </div>
          </div>
          <GeoMap center={coords} radiusKm={radius} onLocationChange={setCoords} height={320} />
          <p className="mt-2 text-xs text-zinc-500">
            Se a localização não aparecer, clique em “Usar minha localização”. Caso negue, informe seu CEP.
          </p>
        </section>
      </div>
    </main>
  );
}
