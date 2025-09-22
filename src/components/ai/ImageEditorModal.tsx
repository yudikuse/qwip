"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { aiRemoveBackground } from "@/lib/ai/removeBackground";
import {
  applyBrightnessContrast,
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

export default function ImageEditorModal({ file, open, onClose, onApply }: Props) {
  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>();
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [crop, setCrop] = useState<{ x: number; y: number; w: number; h: number }>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const fileKey = useMemo(() => `${file.name}-${file.size}-${file.lastModified}`, [file]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const bmp = await fileToImageBitmap(file);
      if (!canvasRef.current) return;
      drawImageToCanvas(bmp, canvasRef.current);
      setBrightness(0);
      setContrast(0);
      setCrop(undefined);
    })();
  }, [fileKey, open]);

  async function onRemoveBg() {
    try {
      setWorking(true);
      setProgress(undefined);
      const blob = await aiRemoveBackground(file, (current, total) =>
        setProgress({ current, total })
      );
      const bmp = await createImageBitmap(blob);
      if (!canvasRef.current) return;
      drawImageToCanvas(bmp, canvasRef.current);
    } finally {
      setWorking(false);
    }
  }

  function onAdjust() {
    if (!canvasRef.current) return;
    drawImageToCanvas(canvasRef.current, canvasRef.current); // garante base
    applyBrightnessContrast(canvasRef.current, brightness, contrast);
  }

  async function handleApply() {
    if (!canvasRef.current) return;
    const blob = await blobFromCanvas(canvasRef.current);
    onApply(blob);
    onClose();
  }

  // recorte simples: arraste para selecionar (UX leve; opcional)
  useEffect(() => {
    if (!canvasRef.current || !overlayRef.current) return;
    const el = overlayRef.current;
    let startX = 0, startY = 0, dragging = false;

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
      setCrop((c) => (c ? { x: Math.min(startX, x), y: Math.min(startY, y), w: Math.abs(x - startX), h: Math.abs(y - startY) } : c));
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
    const ctx = tmp.getContext("2d")!;
    tmp.width = w;
    tmp.height = h;
    ctx.drawImage(src, x, y, w, h, 0, 0, w, h);
    const bmp = await createImageBitmap(await blobFromCanvas(tmp));
    drawImageToCanvas(bmp, canvasRef.current);
    setCrop(undefined);
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
                  ? progress
                    ? `Removendo fundo… ${Math.round((progress.current / progress.total) * 100)}%`
                    : "Carregando modelo…"
                  : "Remover fundo (IA)"}
              </button>
              <p className="text-xs text-zinc-500 mt-2">Roda no seu navegador. Nenhum upload para servidores externos.</p>
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <p className="text-sm text-zinc-300 mb-2">Ajustes rápidos</p>
              <label className="text-xs text-zinc-400">Brilho: {brightness}</label>
              <input
                type="range"
                min={-100}
                max={100}
                value={brightness}
                onChange={(e) => { setBrightness(parseInt(e.target.value)); onAdjust(); }}
                className="w-full"
              />
              <label className="text-xs text-zinc-400">Contraste: {contrast}</label>
              <input
                type="range"
                min={-100}
                max={100}
                value={contrast}
                onChange={(e) => { setContrast(parseInt(e.target.value)); onAdjust(); }}
                className="w-full"
              />
            </div>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <p className="text-sm text-zinc-300 mb-2">Recorte</p>
              <div className="flex gap-2">
                <button onClick={applyCrop} className="flex-1 rounded-lg px-3 py-2 bg-zinc-800 text-zinc-100 hover:bg-zinc-700">
                  Aplicar recorte
                </button>
                <button onClick={() => setCrop(undefined)} className="px-3 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                  Limpar seleção
                </button>
              </div>
              <p className="text-xs text-zinc-500 mt-2">Arraste na imagem para selecionar a área.</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={handleApply} className="flex-1 rounded-lg px-3 py-2 bg-emerald-500 text-black font-semibold hover:bg-emerald-400">
                Aplicar no meu anúncio
              </button>
              <button onClick={onClose} className="px-3 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800">
                Cancelar
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 pb-4 text-xs text-zinc-500">
          Dica: na primeira vez pode demorar um pouco para baixar o modelo. Depois fica rápido no mesmo navegador. :contentReference[oaicite:2]{index=2}
        </div>
      </div>
    </div>
  );
}
