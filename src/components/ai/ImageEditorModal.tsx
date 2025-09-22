"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { aiRemoveBackground } from "@/lib/ai/removeBackground";
import {
  blobFromCanvas,
  drawImageToCanvas,
  fileToImageBitmap,
} from "@/lib/ai/canvas";

type Props = {
  file: File;
  open: boolean;
  onClose: () => void;
  onApply: (blob: Blob) => void;
};

/** Presets usando ctx.filter (canvas) aplicados sempre a partir do "base" */
type PresetId = "original" | "pop" | "bw" | "warm" | "cool" | "hdr";

export default function ImageEditorModal({
  file,
  open,
  onClose,
  onApply,
}: Props) {
  const [working, setWorking] = useState(false);
  const [progressPct, setProgressPct] = useState(0);

  // seleção de recorte
  const [crop, setCrop] = useState<{ x: number; y: number; w: number; h: number }>();

  // preset selecionado
  const [preset, setPreset] = useState<PresetId>("original");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // guardamos a imagem base (após última edição aplicada no canvas)
  const baseBitmapRef = useRef<ImageBitmap | null>(null);

  // controla barra do botão flutuante (AIMagicBar)
  function emitProgress(p: number) {
    const pct = Math.max(0, Math.min(100, Math.round(p)));
    window.dispatchEvent(new CustomEvent("ai-edit:progress", { detail: pct }));
  }
  function emitWorking(b: boolean) {
    window.dispatchEvent(new CustomEvent("ai-edit:working", { detail: b }));
  }

  const fileKey = useMemo(
    () => `${file.name}-${file.size}-${file.lastModified}`,
    [file]
  );

  // carrega a foto no canvas sempre que abrir
  useEffect(() => {
    if (!open) return;
    (async () => {
      const bmp = await fileToImageBitmap(file);
      baseBitmapRef.current = bmp;
      if (!canvasRef.current) return;
      drawImageToCanvas(bmp, canvasRef.current);
      setPreset("original");
      setCrop(undefined);
      setProgressPct(0);
      emitProgress(0);
    })();
  }, [fileKey, open]);

  // ====== PROGRESSO MONOTÔNICO ======
  // Algumas libs chamam progress(current,total) várias vezes por etapas, às vezes
  // reiniciando current. Tornamos o progresso "não-regressivo".
  const lastProgressRef = useRef(0);
  function trackProgress(current: number, total: number) {
    const raw = total > 0 ? (current / total) * 100 : 0;
    const monotonic = Math.max(lastProgressRef.current, raw);
    lastProgressRef.current = monotonic;
    const pct = Math.min(99, Math.floor(monotonic)); // deixa 100% só no fim
    setProgressPct(pct);
    emitProgress(pct);
  }

  async function onRemoveBg() {
    try {
      setWorking(true);
      emitWorking(true);
      lastProgressRef.current = 0;
      setProgressPct(0);
      emitProgress(0);

      const blob = await aiRemoveBackground(file, (cur, tot) =>
        trackProgress(cur, tot)
      );

      const bmp = await createImageBitmap(blob);
      baseBitmapRef.current = bmp;
      if (!canvasRef.current) return;
      drawImageToCanvas(bmp, canvasRef.current);

      // força 100% ao terminar
      setProgressPct(100);
      emitProgress(100);
    } finally {
      setWorking(false);
      emitWorking(false);
      // volta para 0 após 1s para limpar o mini-loader do botão
      setTimeout(() => {
        setProgressPct(0);
        emitProgress(0);
      }, 1000);
    }
  }

  // ====== PRESETS ======
  function applyPreset(p: PresetId) {
    if (!canvasRef.current || !baseBitmapRef.current) return;
    const c = canvasRef.current;
    const ctx = c.getContext("2d")!;
    // redesenha a partir do "base"
    ctx.save();
    ctx.filter = presetToFilter(p);
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(baseBitmapRef.current, 0, 0, c.width, c.height);
    ctx.restore();
    setPreset(p);
  }

  function presetToFilter(p: PresetId): string {
    switch (p) {
      case "original":
        return "none";
      case "pop":
        // contraste + leve brilho + saturação
        return "contrast(1.15) brightness(1.05) saturate(1.2)";
      case "bw":
        // desaturar e puxar contraste
        return "grayscale(1) contrast(1.15) brightness(1.02)";
      case "warm":
        // tom quente: um pouco de sepia e saturação
        return "sepia(0.25) saturate(1.15) brightness(1.03) contrast(1.05)";
      case "cool":
        // tom frio: reduzir sepia e aumentar contraste
        return "sepia(0.05) contrast(1.1) saturate(1.05)";
      case "hdr":
        // sensação de nitidez/alcance: bastante contraste + leve brilho + saturação
        return "contrast(1.25) brightness(1.06) saturate(1.15)";
      default:
        return "none";
    }
  }

  async function handleApply() {
    if (!canvasRef.current) return;
    const blob = await blobFromCanvas(canvasRef.current);
    onApply(blob);
    onClose();
  }

  // ====== RECORTE ======
  // arraste para selecionar
  useEffect(() => {
    if (!canvasRef.current || !overlayRef.current) return;
    const el = overlayRef.current;
    let startX = 0,
      startY = 0,
      dragging = false;

    const onDown = (e: MouseEvent) => {
      dragging = true;
      const rect = el.getBoundingClientRect();
      startX = e.clientX - rect.left;
      startY = e.clientY - rect.top;
      setCrop({ x: startX, y: startY, w: 0, h: 0 });
    };
    const onMove = (e: MouseEvent) => {
      if (!dragging) return;
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCrop((c) =>
        c
          ? {
              x: Math.min(startX, x),
              y: Math.min(startY, y),
              w: Math.abs(x - startX),
              h: Math.abs(y - startY),
            }
          : c
      );
    };
    const onUp = () => (dragging = false);

    el.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      el.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [open]);

  async function applyCrop() {
    if (!canvasRef.current || !crop) return;
    const { x, y, w, h } = crop;
    const src = canvasRef.current;
    const tmp = document.createElement("canvas");
    tmp.width = Math.max(1, Math.round(w));
    tmp.height = Math.max(1, Math.round(h));
    const ctx = tmp.getContext("2d")!;
    ctx.drawImage(src, x, y, w, h, 0, 0, tmp.width, tmp.height);

    const bmp = await createImageBitmap(await blobFromCanvas(tmp));
    // novo "base" passa a ser o recorte
    baseBitmapRef.current = bmp;
    drawImageToCanvas(bmp, canvasRef.current);
    setCrop(undefined);
    // reaplica preset selecionado para manter o mesmo look
    applyPreset(preset);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60">
      <div className="w-[min(100%,1000px)] max-h-[90vh] rounded-2xl bg-zinc-900 shadow-2xl border border-zinc-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <h3 className="text-zinc-100 font-semibold">Editar com IA (grátis)</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100">✕</button>
        </div>

        <div className="grid md:grid-cols-[1.2fr,0.8fr] gap-4 p-4">
          {/* PREVIEW */}
          <div className="relative rounded-xl border border-zinc-800 overflow-hidden bg-zinc-950">
            <canvas ref={canvasRef} className="w-full h-auto block" />
            <div ref={overlayRef} className="absolute inset-0 cursor-crosshair">
              {crop && (
                <div
                  className="absolute border-2 border-emerald-400/90 bg-emerald-500/10"
                  style={{ left: crop.x, top: crop.y, width: crop.w, height: crop.h }}
                />
              )}
            </div>
          </div>

          {/* CONTROLES */}
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <p className="text-sm text-zinc-300 mb-2">Fundo</p>
              <button
                onClick={onRemoveBg}
                disabled={working}
                className="w-full rounded-lg px-3 py-2 bg-emerald-500 text-black font-semibold hover:bg-emerald-400 disabled:opacity-50"
              >
                {working
                  ? `Removendo fundo… ${progressPct}%`
                  : "Remover fundo (IA)"}
              </button>
              <p className="text-xs text-zinc-500 mt-2">
                Roda no seu navegador. Nenhum upload para servidores externos.
              </p>
            </div>

            {/* PRESETS */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <p className="text-sm text-zinc-300 mb-2">Filtros rápidos</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: "original", label: "Original" },
                  { id: "pop", label: "Realce" },
                  { id: "bw", label: "P&B" },
                  { id: "warm", label: "Quente" },
                  { id: "cool", label: "Frio" },
                  { id: "hdr", label: "HDR leve" },
                ] as { id: PresetId; label: string }[]).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => applyPreset(opt.id)}
                    className={`rounded-lg px-3 py-2 text-sm border transition ${
                      preset === opt.id
                        ? "bg-emerald-500 text-black border-emerald-400"
                        : "bg-zinc-900 text-zinc-200 border-zinc-700 hover:bg-zinc-800"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* RECORTE */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <p className="text-sm text-zinc-300 mb-2">Recorte</p>
              <div className="flex gap-2">
                <button
                  onClick={applyCrop}
                  className="flex-1 rounded-lg px-3 py-2 bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                >
                  Aplicar recorte
                </button>
                <button
                  onClick={() => setCrop(undefined)}
                  className="px-3 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Limpar seleção
                </button>
              </div>
              <p className="text-xs text-zinc-500 mt-2">Arraste na imagem para selecionar a área.</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleApply}
                className="flex-1 rounded-lg px-3 py-2 bg-emerald-500 text-black font-semibold hover:bg-emerald-400"
              >
                Aplicar no meu anúncio
              </button>
              <button
                onClick={onClose}
                className="px-3 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4 text-xs text-zinc-500">
          Dica: na primeira vez pode demorar um pouco para baixar o modelo. Depois, fica mais rápido no mesmo navegador.
        </div>
      </div>
    </div>
  );
}
