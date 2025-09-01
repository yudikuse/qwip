"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";

/**
 * Criar Anúncio – requisitos deste passo:
 * - Sem WhatsApp e sem Cidade (número vem do cadastro da conta, cidade não é editável)
 * - Localização por Geolocation API + Raio
 * - Se o usuário negar permissão, aparece campo CEP (obrigatório) e o raio passa a usar esse CEP
 * - Pré-visualização ao vivo por plano (FREE, LITE, PRO, BUSINESS)
 * - Sem dependências externas
 */

type Plan = "FREE" | "LITE" | "PRO" | "BUSINESS";
type GeoSource = "gps" | "cep";
type Geo = { lat: number; lng: number; accuracy?: number; source: GeoSource };

export default function NewAdPage() {
  // -------- form ----------
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  // -------- localização ----------
  const [geo, setGeo] = useState<Geo | null>(null);
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [radiusKm, setRadiusKm] = useState(5);

  // CEP fallback quando nega a localização
  const [useCEP, setUseCEP] = useState(false);
  const [cep, setCEP] = useState("");
  const [cepTouched, setCepTouched] = useState(false);

  // -------- preview ----------
  const [plan, setPlan] = useState<Plan>("FREE");
  const [density, setDensity] = useState<"compact" | "normal">("normal");
  const [active, setActive] = useState(true);

  // imagem do preview
  const previewImg = useMemo<string>(() => {
    if (files.length > 0) return URL.createObjectURL(files[0]);
    return "/images/vitrine-1.jpg";
  }, [files]);

  // máscara e validação simples de CEP (#####-###)
  function formatCEP(v: string) {
    const digits = v.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }
  function isValidCEP(v: string) {
    return /^\d{5}-\d{3}$/.test(v);
  }

  // Geolocalização via navegador
  function detectLocation() {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      setUseCEP(true);
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeo({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          source: "gps",
        });
        setGeoStatus("ok");
        setUseCEP(false);
      },
      () => {
        setGeoStatus("error");
        setUseCEP(true); // negar/erro -> exige CEP
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  // “Geocoding” offline do CEP para lat/lng (apenas para preview, sem chamadas externas)
  // Mapeia deterministicamente para o bounding box do Brasil
  function pseudoGeocodeCEP(cepNum: string): { lat: number; lng: number } {
    // bounds aproximados BR
    const LAT_MIN = -33.75;
    const LAT_MAX = 5.27;
    const LNG_MIN = -73.99;
    const LNG_MAX = -34.79;

    // normaliza CEP -> [0,1)
    const n = parseInt(cepNum.replace(/\D/g, "") || "0", 10);
    const frac = (Math.sin(n) + 1) / 2; // 0..1

    // espalha em 2 dimensões (lat/lng) com 2 offsets
    const frac2 = (Math.sin(n * 1.7) + 1) / 2;

    const lat = LAT_MIN + (LAT_MAX - LAT_MIN) * frac;
    const lng = LNG_MIN + (LNG_MAX - LNG_MIN) * frac2;
    return { lat, lng };
  }

  // Atualiza geo a partir do CEP válido
  useEffect(() => {
    if (useCEP && isValidCEP(cep)) {
      const { lat, lng } = pseudoGeocodeCEP(cep);
      setGeo({ lat, lng, source: "cep" });
    }
  }, [useCEP, cep]);

  function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    const arr: File[] = [];
    for (let i = 0; i < list.length; i++) arr.push(list.item(i)!);
    setFiles(arr);
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // validações mínimas deste passo
    if (!title.trim()) {
      alert("Informe um título.");
      return;
    }
    if (!price.trim()) {
      alert("Informe um preço.");
      return;
    }
    // precisa ter geo por GPS OU CEP válido
    if (!geo) {
      alert("Defina a localização (GPS ou CEP).");
      return;
    }
    if (useCEP && !isValidCEP(cep)) {
      setCepTouched(true);
      alert("Informe um CEP válido (ex.: 01311-000).");
      return;
    }

    // aqui você chamaria sua API para persistir
    alert(
      `Anúncio salvo (mock):\nTítulo: ${title}\nPreço: ${price}\nPlano: ${plan}\nFonte: ${geo.source}\nRaio: ${radiusKm}km`
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Criar Anúncio</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Sem número de WhatsApp e sem cidade aqui — o WhatsApp vem do seu cadastro. A área de
              atendimento é definida por localização (GPS ou CEP) + raio.
            </p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-200 hover:bg-white/5"
          >
            ← Voltar
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* ================== FORM ================== */}
          <form className="rounded-2xl border border-white/10 bg-card p-5" onSubmit={onSubmit}>
            {/* Fotos */}
            <div>
              <label className="mb-2 block text-sm font-medium">Fotos</label>
              <div className="flex items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600/90 px-3 py-2 text-sm font-semibold text-[#0F1115] hover:bg-emerald-500">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFiles(e.target.files)}
                  />
                  Escolher arquivos
                </label>
                <span className="text-sm text-zinc-400">
                  {files.length === 0
                    ? "Nenhum arquivo selecionado"
                    : `${files.length} arquivo(s) selecionado(s)`}
                </span>
              </div>
            </div>

            {/* Título e Preço */}
            <div className="mt-5 grid gap-4 md:grid-cols-[1fr_180px]">
              <div>
                <label className="mb-2 block text-sm font-medium">Título</label>
                <input
                  className="w-full rounded-lg border border-white/10 bg-[#0B0E12] px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
                  placeholder="Ex.: Marmita Caseira Completa"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Preço</label>
                <input
                  className="w-full rounded-lg border border-white/10 bg-[#0B0E12] px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
                  placeholder="129,90"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium">Descrição</label>
              <textarea
                rows={5}
                className="w-full rounded-lg border border-white/10 bg-[#0B0E12] px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
                placeholder="Conte um pouco sobre o produto/serviço."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>

            {/* Localização + Raio */}
            <div className="mt-6 rounded-xl border border-white/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">Área de atendimento</div>
                  <div className="mt-1 text-xs text-zinc-400">
                    Use sua localização **ou** informe um CEP. O anúncio será exibido nesse raio.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={detectLocation}
                    className="rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
                  >
                    {geoStatus === "loading" ? "Detectando..." : "Detectar minha localização"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUseCEP(true);
                      if (geo?.source === "gps") setGeo(null); // força trocar p/ CEP
                    }}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      useCEP ? "border-emerald-500/40 bg-emerald-500/10" : "border-white/10 hover:bg-white/5"
                    }`}
                  >
                    Usar CEP
                  </button>
                </div>
              </div>

              {/* Status + CEP */}
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-white/10 p-3 text-sm">
                  <div className="text-zinc-400">Status</div>
                  <div className="mt-1 font-medium">
                    {useCEP
                      ? "Usando CEP"
                      : geoStatus === "idle"
                      ? "Aguardando detecção"
                      : geoStatus === "loading"
                      ? "Detectando..."
                      : geoStatus === "ok"
                      ? "Localização definida"
                      : "Falhou — selecione 'Usar CEP'"}
                  </div>
                  {geo && geo.source === "gps" && (
                    <div className="mt-2 text-xs text-zinc-400">
                      GPS • {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)} (±{Math.round(geo.accuracy ?? 0)}m)
                    </div>
                  )}
                  {geo && geo.source === "cep" && (
                    <div className="mt-2 text-xs text-zinc-400">
                      CEP • {cep} → {geo.lat.toFixed(5)}, {geo.lng.toFixed(5)}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-white/10 p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-zinc-400">Raio (km)</div>
                    <div className="font-semibold">{radiusKm} km</div>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    step={1}
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="mt-3 w-full"
                  />
                </div>
              </div>

              {/* Campo de CEP (obrigatório quando useCEP = true) */}
              {useCEP && (
                <div className="mt-4">
                  <label className="mb-1 block text-sm font-medium">CEP (obrigatório)</label>
                  <input
                    inputMode="numeric"
                    placeholder="Ex.: 01311-000"
                    value={cep}
                    onChange={(e) => setCEP(formatCEP(e.target.value))}
                    onBlur={() => setCepTouched(true)}
                    className={`w-full rounded-lg border px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2 ${
                      cepTouched && !isValidCEP(cep)
                        ? "border-rose-500/40 bg-rose-500/10"
                        : "border-white/10 bg-[#0B0E12]"
                    }`}
                  />
                  {cepTouched && !isValidCEP(cep) && (
                    <div className="mt-1 text-xs text-rose-400">Informe um CEP válido (#####-###).</div>
                  )}
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <Link
                href="/"
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-200 hover:bg-white/5"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#0F1115] hover:bg-emerald-400"
              >
                Salvar e continuar
              </button>
            </div>
          </form>

          {/* ================== PRÉ-VISUALIZAÇÃO ================== */}
          <div className="rounded-2xl border border-white/10 bg-card p-5">
            {/* Controles do preview */}
            <div className="flex flex-wrap items-center gap-2">
              {(["FREE", "LITE", "PRO", "BUSINESS"] as Plan[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlan(p)}
                  className={[
                    "rounded-full px-3 py-1 text-xs font-medium",
                    plan === p
                      ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/30"
                      : "bg-white/5 text-zinc-300 hover:bg-white/10",
                  ].join(" ")}
                >
                  {p}
                </button>
              ))}

              <span className="mx-2 h-4 w-px bg-white/10" />

              <button
                onClick={() => setDensity("compact")}
                className={[
                  "rounded-full px-3 py-1 text-xs",
                  density === "compact" ? "bg-white/10" : "bg-white/5 hover:bg-white/10",
                ].join(" ")}
              >
                Compacta
              </button>
              <button
                onClick={() => setDensity("normal")}
                className={[
                  "rounded-full px-3 py-1 text-xs",
                  density === "normal" ? "bg-white/10" : "bg-white/5 hover:bg-white/10",
                ].join(" ")}
              >
                Normal
              </button>

              <span className="mx-2 h-4 w-px bg-white/10" />

              <label className="inline-flex items-center gap-2 text-xs text-zinc-300">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
                Ativo
              </label>
            </div>

            {/* Card preview */}
            <div className="mt-5 rounded-2xl border border-white/10 bg-[#0B0E12] p-4">
              {/* header */}
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold">
                    Q
                  </div>
                  <span className="font-medium">QWIP Anúncios</span>
                  <span className="text-zinc-500">agora</span>
                </div>
                <PlanPill plan={plan} />
              </div>

              {/* imagem */}
              <div className="relative overflow-hidden rounded-lg">
                <Image
                  src={previewImg}
                  alt="preview"
                  width={1200}
                  height={650}
                  className={density === "compact" ? "h-44 w-full object-cover" : "h-56 w-full object-cover"}
                />
                <ExpiryBadge plan={plan} />
              </div>

              {/* info */}
              <div className="mt-3">
                <div className="flex items-end justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {title || "Seu título aparecerá aqui"}
                    </h3>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {!geo
                        ? "Defina GPS ou CEP para simular a área."
                        : geo.source === "gps"
                        ? `GPS • raio ${radiusKm}km (±${Math.round(geo.accuracy ?? 0)}m)`
                        : `CEP ${cep || "—"} • raio ${radiusKm}km`}
                    </p>
                  </div>
                  {plan !== "FREE" && (
                    <span className="rounded-md bg-rose-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                      {plan === "BUSINESS" ? "Destaque +" : "Últimas unidades"}
                    </span>
                  )}
                </div>

                {desc && <p className="mt-2 text-sm text-zinc-300 line-clamp-2">{desc}</p>}

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <a
                    href="#"
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-[#0F1115] transition hover:bg-emerald-400"
                  >
                    WhatsApp
                  </a>
                  <a
                    href="#"
                    className="inline-flex items-center justify-center rounded-md border border-white/10 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:bg-white/5"
                  >
                    Compartilhar
                  </a>
                </div>

                <div className="mt-3 text-sm font-semibold text-zinc-200">
                  {price ? `R$ ${price}` : "R$ 0,00"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Observação */}
        <p className="mt-8 text-center text-xs text-zinc-500">
          Obs.: seu WhatsApp usado na publicação vem do cadastro/conta. Para trocar, altere nas
          configurações do perfil — não aqui no anúncio.
        </p>
      </div>
    </main>
  );
}

/* ---------- componentes auxiliares do preview ---------- */

function PlanPill({ plan }: { plan: Plan }) {
  const map: Record<Plan, { text: string; classes: string }> = {
    FREE: { text: "Free", classes: "bg-white/5 text-zinc-300" },
    LITE: { text: "Lite", classes: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30" },
    PRO: { text: "Pro", classes: "bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/30" },
    BUSINESS: { text: "Business", classes: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30" },
  };
  const p = map[plan];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium ${p.classes}`}
    >
      {p.text}
    </span>
  );
}

function ExpiryBadge({ plan }: { plan: Plan }) {
  const txt =
    plan === "FREE"
      ? "Expira em 24h"
      : plan === "LITE"
      ? "Expira em 48h"
      : plan === "PRO"
      ? "Expira em 72h"
      : "Expira em 72h";
  return (
    <div className="absolute right-2 top-2 rounded-md bg-amber-400 px-2 py-0.5 text-[11px] font-semibold text-zinc-900">
      {txt}
    </div>
  );
}
