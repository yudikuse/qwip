"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

// carrega o mapa só no client
const GeoMap = dynamic(() => import("@/components/GeoMap"), { ssr: false });

type Plan = "FREE" | "LITE" | "PRO" | "BUSINESS";

const PLAN_LIMITS: Record<
  Plan,
  { maxPhotos: number; minRadius: number; maxRadius: number; expires: string }
> = {
  FREE: { maxPhotos: 1, minRadius: 10, maxRadius: 10, expires: "24h" },
  LITE: { maxPhotos: 3, minRadius: 2, maxRadius: 20, expires: "48h" },
  PRO: { maxPhotos: 10, minRadius: 2, maxRadius: 50, expires: "72h" },
  BUSINESS: { maxPhotos: 20, minRadius: 2, maxRadius: 50, expires: "72h" },
};

export default function NewAdPage() {
  const [plan, setPlan] = useState<Plan>("FREE");
  const limits = PLAN_LIMITS[plan];

  // form
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<string>("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  // geo
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [geoDenied, setGeoDenied] = useState(false);
  const [cep, setCep] = useState("");
  const [radius, setRadius] = useState<number>(limits.minRadius);

  // publish result
  const [saving, setSaving] = useState(false);
  const [publishLink, setPublishLink] = useState<string | null>(null);

  // quando o plano muda, garante que o raio respeite os novos limites
  useEffect(() => {
    setRadius((r) =>
      Math.min(Math.max(r, PLAN_LIMITS[plan].minRadius), PLAN_LIMITS[plan].maxRadius)
    );
  }, [plan]);

  // geolocalização real
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGeoDenied(true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoDenied(false);
      },
      () => setGeoDenied(true),
      { enableHighAccuracy: false, timeout: 6000 }
    );
  }, []);

  const errors = useMemo(() => {
    const list: string[] = [];
    if (!title.trim()) list.push("Informe um título.");
    if (!priceBRLToNumber(price)) list.push("Informe um preço válido.");
    if (!description.trim()) list.push("Escreva uma descrição.");
    if (files.length === 0) list.push("Envie pelo menos 1 foto.");
    if (files.length > limits.maxPhotos)
      list.push(`Seu plano permite até ${limits.maxPhotos} foto(s).`);
    if (!coords && !validCep(cep))
      list.push("Ative a localização ou informe um CEP válido.");
    return list;
  }, [title, price, description, files, coords, cep, limits.maxPhotos]);

  function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const f = Array.from(e.target.files ?? []);
    if (f.length === 0) return;
    const limited = f.slice(0, limits.maxPhotos);
    setFiles(limited);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (errors.length || saving) return;

    // mock de upload: mandamos só os nomes
    const photos = files.map((f) => f.name);
    const body = {
      plan,
      title,
      priceCents: Math.round(priceBRLToNumber(price) * 100),
      description,
      photos,
      location: coords
        ? { lat: coords.lat, lng: coords.lng, radiusKm: radius }
        : { cep: cepOnlyDigits(cep), radiusKm: radius },
    };

    setSaving(true);
    setPublishLink(null);
    try {
      const res = await fetch("/api/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Erro ao salvar.");

      setPublishLink(json.shortUrl as string);
      alert("Rascunho salvo! Link curto gerado.");
    } catch (err: any) {
      alert(err?.message || "Falha ao salvar anúncio.");
    } finally {
      setSaving(false);
    }
  }

  const firstImageURL =
    files[0] ? URL.createObjectURL(files[0]) : "/images/hero-card.jpg";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-xl font-semibold">Criar Anúncio</h1>

          <div className="flex items-center gap-2">
            {(["FREE", "LITE", "PRO", "BUSINESS"] as Plan[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlan(p)}
                className={
                  "rounded-full border px-3 py-1 text-xs " +
                  (plan === p
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-white/10 text-zinc-300 hover:bg-white/5")
                }
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <p className="mb-6 text-sm text-zinc-400">
          O WhatsApp é o número já verificado. Título, preço, descrição e foto
          são obrigatórios. A área de atendimento usa sua localização (ou CEP)
          + raio. O preview abaixo reflete o plano selecionado.
        </p>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          {/* FORM */}
          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-white/10 bg-card p-5"
          >
            {/* Fotos */}
            <div>
              <label className="mb-2 block text-sm font-medium">Fotos</label>
              <div className="rounded-lg border border-dashed border-white/10 p-4">
                <input
                  type="file"
                  accept="image/*"
                  multiple={plan !== "FREE"}
                  onChange={onPickFiles}
                />
                <p className="mt-2 text-xs text-zinc-400">
                  {plan === "FREE"
                    ? "Seu plano permite 1 foto."
                    : `Seu plano permite até ${limits.maxPhotos} fotos.`}
                </p>

                {files.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {files.map((f, i) => {
                      const url = URL.createObjectURL(f);
                      return (
                        <div
                          key={i}
                          className="relative aspect-square overflow-hidden rounded-md border border-white/10"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={f.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Título / Preço */}
            <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_180px]">
              <div>
                <label className="mb-2 block text-sm font-medium">Título</label>
                <input
                  className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-500 focus:border-white/20"
                  placeholder="Ex.: Vestido Midi Floral"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Preço</label>
                <input
                  inputMode="numeric"
                  className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-500 focus:border-white/20"
                  placeholder="R$ 129,90"
                  value={price}
                  onChange={(e) => setPrice(maskBRL(e.target.value))}
                  required
                />
              </div>
            </div>

            {/* Descrição */}
            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium">Descrição</label>
              <textarea
                className="h-28 w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-500 focus:border-white/20"
                placeholder="Conte um pouco sobre o produto/serviço."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Geo + Raio (MAPA REAL) */}
            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium">
                Área de atendimento (raio)
              </label>

              <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
                <GeoMap
                  center={coords ?? null}
                  cep={coords ? undefined : cepOnlyDigits(cep)}
                  radiusKm={radius}
                />

                <div>
                  <div className="rounded-lg border border-white/10 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-zinc-300">
                        Raio: <strong>{radius} km</strong>
                      </span>
                      <span className="text-xs text-zinc-500">
                        {limits.minRadius}–{limits.maxRadius} km
                      </span>
                    </div>
                    <input
                      type="range"
                      min={limits.minRadius}
                      max={limits.maxRadius}
                      step={1}
                      value={radius}
                      onChange={(e) => setRadius(Number(e.target.value))}
                      className="mt-2 w-full"
                    />

                    {geoDenied && (
                      <div className="mt-3">
                        <label className="mb-1 block text-xs text-zinc-400">
                          CEP (obrigatório ao negar localização)
                        </label>
                        <input
                          className="w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-zinc-500 focus:border-white/20"
                          placeholder="00000-000"
                          value={cep}
                          onChange={(e) => setCep(maskCEP(e.target.value))}
                          required
                        />
                        <p className="mt-1 text-[11px] text-zinc-500">
                          Usaremos o CEP como centro do raio.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Erros */}
            {errors.length > 0 && (
              <div className="mt-5 space-y-1 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">
                {errors.map((e, i) => (
                  <div key={i}>• {e}</div>
                ))}
              </div>
            )}

            {/* Ações */}
            <div className="mt-6 flex items-center gap-3">
              <a
                href="/"
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-zinc-300 hover:bg-white/5"
              >
                Cancelar
              </a>
              <button
                type="submit"
                disabled={errors.length > 0 || saving}
                className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#0F1115] hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar e continuar"}
              </button>
            </div>

            {publishLink && (
              <div className="mt-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                Link curto gerado:{" "}
                <a
                  href={publishLink}
                  target="_blank"
                  className="underline decoration-emerald-300"
                >
                  {publishLink}
                </a>
              </div>
            )}
          </form>

          {/* PREVIEWS */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-medium text-zinc-200">
                  Pré-visualização (Vitrine • {plan})
                </h2>
                <span className="rounded bg-amber-400/20 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                  expira em {limits.expires}
                </span>
              </div>

              <AdCardPreview
                img={firstImageURL}
                title={title || "Seu título aqui"}
                subtitle={
                  coords
                    ? `Raio ${radius} km`
                    : geoDenied && validCep(cep)
                    ? `CEP ${cepOnlyDigits(cep)} • raio ${radius} km`
                    : "Área não definida"
                }
                price={price || "R$ 0,00"}
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-card p-5">
              <div className="mb-3 text-sm font-medium text-zinc-200">
                Pré-visualização (WhatsApp)
              </div>
              <WhatsPreview
                title={title || "Vestido Midi Floral"}
                link={publishLink ?? "https://qwip.pro/preview-demo"}
                hour="14:32"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ---------- componentes de preview ---------- */
function AdCardPreview({
  img,
  title,
  subtitle,
  price,
}: {
  img: string;
  title: string;
  subtitle: string;
  price: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={img} alt={title} className="h-56 w-full object-cover" />
      <div className="space-y-2 p-4">
        <div className="text-sm font-semibold text-white">{title}</div>
        <div className="text-xs text-zinc-400">{subtitle}</div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-200">{price}</span>
          <button className="inline-flex items-center gap-2 rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-[#0F1115]">
            <WhatsIcon className="h-4 w-4" />
            Falar no WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

function WhatsPreview({
  title,
  link,
  hour,
}: {
  title: string;
  link: string;
  hour: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0B0E12] p-4">
      <div className="mb-3 flex items-center gap-2 text-sm text-zinc-300">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold">
          JS
        </div>
        <span className="font-medium">Boutique da Jéssica</span>
        <span className="text-zinc-500">online</span>
      </div>

      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white">
          Tenho interesse: {title} —{" "}
          <span className="underline decoration-white/60">{link}</span>
          <div className="mt-1 text-right text-[10px] text-white/70">{hour} ✓✓</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */
function maskBRL(v: string) {
  const n = v.replace(/[^\d]/g, "");
  const int = n.slice(0, -2) || "0";
  const dec = n.slice(-2).padStart(2, "0");
  const formatted = Number(int).toLocaleString("pt-BR");
  return `R$ ${formatted},${dec}`;
}
function priceBRLToNumber(v?: string) {
  if (!v) return 0;
  const n = v.replace(/[^\d]/g, "");
  if (!n) return 0;
  return Number(n) / 100;
}
function maskCEP(v: string) {
  const d = v.replace(/[^\d]/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return d.slice(0, 5) + "-" + d.slice(5);
}
function cepOnlyDigits(v: string) {
  return v.replace(/[^\d]/g, "");
}
function validCep(v: string) {
  return /^\d{5}-?\d{3}$/.test(v);
}

/* ---------- ícones ---------- */
function WhatsIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.04 2C6.58 2 2.16 6.29 2.16 11.62c0 1.9.57 3.67 1.56 5.16L2 22l5.4-1.47a10.3 10.3 0 004.64 1.1c5.46 0 9.88-4.29 9.88-9.62C21.92 6.29 17.5 2 12.04 2zm5.47 13.8c-.23.66-1.16 1.1-1.87 1.25-.5.1-1.16.19-3.38-.7-2.83-1.17-4.65-4.02-4.79-4.21-.14-.19-1.15-1.54-1.15-2.94 0-1.4.73-2.08.99-2.36.27-.28.59-.35.79-.35.2 0 .39.01.56.01.18.01.42-.07.66.5.23.56.78 1.93.85 2.07.07.14.11.31.02.5-.09.19-.14.31-.27.48-.14.17-.28.38-.4.51-.13.14-.27.29-.12.56.14.28.62 1.04 1.33 1.68.91.81 1.68 1.07 1.96 1.2.28.14.44.12.61-.07.18-.2.7-.81.89-1.09.19-.28.38-.23.63-.14.25.1 1.58.74 1.86.87.27.14.46.2.53.31.06.11.06.65-.17 1.31z" />
    </svg>
  );
}
