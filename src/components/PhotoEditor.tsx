// src/components/PhotoEditor.tsx
'use client';

import * as React from 'react';
import * as ort from 'onnxruntime-web';

type PhotoEditorProps = {
  srcDataUrl: string;
  onApply?: (dataUrl: string) => void;
  onCancel?: () => void;
  className?: string;
};

// Dica forte: coloque o modelo local em /public/modelos/u2net.onnx
// e troque para: const MODEL_URL = '/modelos/u2net.onnx'
const MODEL_URL =
  'https://huggingface.co/onnx/models/resolve/main/vision/segmentation/u2net/u2net.onnx';

export default function PhotoEditor({ srcDataUrl, onApply, onCancel, className }: PhotoEditorProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const ctxRef = React.useRef<CanvasRenderingContext2D | null>(null);
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  // filtros
  const [brightness, setBrightness] = React.useState(100);
  const [contrast, setContrast] = React.useState(100);
  const [saturation, setSaturation] = React.useState(100);

  // onnx
  const sessionRef = React.useRef<ort.InferenceSession | null>(null);
  const [loadingBg, setLoadingBg] = React.useState(false);
  const [modelReady, setModelReady] = React.useState(false);

  const drawWithFilters = React.useCallback(() => {
    const img = imgRef.current;
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!img || !ctx || !canvas) return;

    const cssFilter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    (ctx as any).filter = cssFilter;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    (ctx as any).filter = 'none';
  }, [brightness, contrast, saturation]);

  React.useEffect(() => {
    if (!srcDataUrl) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctxRef.current = ctx;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      // dimensiona preview mantendo proporção (máx 900px de largura)
      const maxW = 900;
      const scale = img.width > maxW ? maxW / img.width : 1;
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      drawWithFilters();
    };
    img.onerror = () => alert('Falha ao carregar a imagem.');
    img.src = srcDataUrl;
  }, [srcDataUrl, drawWithFilters]);

  React.useEffect(() => {
    drawWithFilters();
  }, [drawWithFilters]);

  async function ensureModel() {
    if (sessionRef.current) return sessionRef.current;
    const session = await ort.InferenceSession.create(MODEL_URL, {
      executionProviders: ['wasm'],
    });
    sessionRef.current = session;
    setModelReady(true);
    return session;
  }

  async function handleRemoveBackground() {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    setLoadingBg(true);
    try {
      const session = await ensureModel();

      // pré-processa (320x320, float32 NCHW 0..1)
      const { inputTensor, W, H } = imageToTensor(img, 320, 320);

      // nomes dinâmicos (evita "input"/"output" errados)
      const inputName = Object.keys(session.inputMetadata)[0];
      const outputName = Object.keys(session.outputMetadata)[0];

      const outputs = await session.run({ [inputName]: inputTensor });
      const out = outputs[outputName];

      // máscara pequena -> 0..255
      const smallMask = tensorToMask(out as ort.Tensor, W, H);
      // escala para o tamanho do canvas do preview
      const mask = scaleMaskNearest(smallMask, W, H, canvas.width, canvas.height);

      // aplica alpha no próprio canvas do editor
      applyAlphaMaskOnCanvas(canvas, mask);
    } catch (e: any) {
      console.error('remove-bg error:', e);
      alert(
        typeof e?.message === 'string'
          ? e.message
          : 'Não foi possível remover o fundo agora. Tente novamente em instantes.'
      );
    } finally {
      setLoadingBg(false);
    }
  }

  function exportPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onApply?.(canvas.toDataURL('image/png'));
  }

  return (
    // MODAL overlay (fixo na tela)
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${className || ''}`}>
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-6xl rounded-2xl border border-white/10 bg-[#0b0f14] p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Editor de foto (Beta)</h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5"
          >
            Fechar
          </button>
        </div>

        {/* Grid: controles à esquerda / preview à direita (desktop) */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[360px_1fr]">
          {/* Controles */}
          <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <Slider
              label={`Brilho: ${brightness}%`}
              min={50}
              max={150}
              value={brightness}
              onChange={setBrightness}
            />
            <Slider
              label={`Contraste: ${contrast}%`}
              min={50}
              max={150}
              value={contrast}
              onChange={setContrast}
            />
            <Slider
              label={`Saturação: ${saturation}%`}
              min={0}
              max={200}
              value={saturation}
              onChange={setSaturation}
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleRemoveBackground}
                className="inline-flex items-center rounded-xl bg-[#25d366] px-4 py-2 font-semibold text-black/90 shadow-sm transition hover:bg-[#1fd05f] disabled:opacity-60"
                disabled={loadingBg}
              >
                {loadingBg ? 'Removendo fundo…' : 'Remover fundo (beta)'}
              </button>

              <button
                type="button"
                onClick={exportPng}
                className="inline-flex items-center rounded-xl border border-white/15 px-4 py-2 font-semibold text-foreground transition hover:bg-white/5"
              >
                Exportar PNG
              </button>

              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="inline-flex items-center rounded-xl border border-white/15 px-4 py-2 font-semibold text-foreground transition hover:bg-white/5"
                >
                  Cancelar
                </button>
              )}
            </div>

            {!modelReady && (
              <p className="mt-3 text-xs text-muted-foreground">
                O modelo carrega na 1ª vez que você clica em “Remover fundo”.
              </p>
            )}
          </div>

          {/* Preview */}
          <div className="rounded-2xl border border-white/10 bg-black/10 p-3">
            <div className="overflow-auto">
              <canvas ref={canvasRef} className="block max-w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- UI tiny ---------- */
function Slider({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="mb-4">
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}

/* ---------- helpers de imagem/ONNX ---------- */

function imageToTensor(img: HTMLImageElement, W: number, H: number) {
  const off = document.createElement('canvas');
  off.width = W;
  off.height = H;
  const octx = off.getContext('2d')!;
  octx.drawImage(img, 0, 0, W, H);
  const { data } = octx.getImageData(0, 0, W, H);

  const floatData = new Float32Array(3 * W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      floatData[0 * W * H + y * W + x] = r;
      floatData[1 * W * H + y * W + x] = g;
      floatData[2 * W * H + y * W + x] = b;
    }
  }

  const inputTensor = new ort.Tensor('float32', floatData, [1, 3, H, W]);
  return { inputTensor, W, H };
}

function tensorToMask(output: ort.Tensor, W: number, H: number) {
  const src = output.data as Float32Array | number[];
  // normaliza 0..1 e mapeia para 0..255
  let min = Infinity,
    max = -Infinity;
  for (let i = 0; i < src.length; i++) {
    const v = Number(src[i]);
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const rng = max - min || 1;

  const out = new Uint8ClampedArray(W * H);
  for (let i = 0; i < W * H; i++) {
    const norm = (Number(src[i]) - min) / rng;
    const v = Math.max(0, Math.min(1, norm));
    out[i] = Math.round(v * 255);
  }
  return out;
}

function scaleMaskNearest(
  src: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number
) {
  const dst = new Uint8ClampedArray(dstW * dstH);
  for (let y = 0; y < dstH; y++) {
    const sy = Math.floor((y / dstH) * srcH);
    for (let x = 0; x < dstW; x++) {
      const sx = Math.floor((x / dstW) * srcW);
      dst[y * dstW + x] = src[sy * srcW + sx];
    }
  }
  return dst;
}

function applyAlphaMaskOnCanvas(canvas: HTMLCanvasElement, mask: Uint8ClampedArray) {
  const ctx = canvas.getContext('2d')!;
  const { width: W, height: H } = canvas;
  const imgData = ctx.getImageData(0, 0, W, H);
  const data = imgData.data;

  for (let i = 0; i < W * H; i++) {
    data[i * 4 + 3] = mask[i]; // usa máscara como alpha
  }
  ctx.putImageData(imgData, 0, 0);
}
