'use client';

import * as React from 'react';
import * as ort from 'onnxruntime-web';

type PhotoEditorProps = {
  /** dataURL da imagem vinda do input de arquivo */
  srcDataUrl: string;
  /** callback com o resultado final como dataURL (compat) */
  onExport?: (dataUrl: string) => void;
  /** compat com página que usa onApply/onCancel */
  onApply?: (dataUrl: string) => void;
  onCancel?: () => void;
  className?: string;
};

const MODEL_URL =
  'https://huggingface.co/onnx/models/resolve/main/vision/segmentation/u2net/u2net.onnx';

export default function PhotoEditor({
  srcDataUrl,
  onExport,
  onApply,
  onCancel,
  className,
}: PhotoEditorProps) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const ctxRef = React.useRef<CanvasRenderingContext2D | null>(null);

  const [brightness, setBrightness] = React.useState(100);
  const [contrast, setContrast] = React.useState(100);
  const [saturation, setSaturation] = React.useState(100);

  const sessionRef = React.useRef<ort.InferenceSession | null>(null);
  const [loadingBg, setLoadingBg] = React.useState(false);
  const [modelReady, setModelReady] = React.useState(false);

  const drawWithFilters = React.useCallback((img: HTMLImageElement) => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const cssFilter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

    // Canvas 2D moderno tem ctx.filter — cast simples pra evitar erro de tipo
    (ctx as CanvasRenderingContext2D & { filter?: string }).filter = cssFilter || 'none';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    (ctx as CanvasRenderingContext2D & { filter?: string }).filter = 'none';
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
      canvas.width = img.width;
      canvas.height = img.height;
      drawWithFilters(img);
    };
    img.src = srcDataUrl;
  }, [srcDataUrl, drawWithFilters]);

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
    if (!srcDataUrl) return;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    setLoadingBg(true);
    try {
      const session = await ensureModel();
      const img = await loadImage(srcDataUrl);
      const { inputTensor, resizedW, resizedH } = imageToTensor(img, 320, 320);

      const outputs = await session.run({ input: inputTensor });
      const first = outputs[Object.keys(outputs)[0]];
      const mask = tensorToMask(first, resizedW, resizedH);

      applyMaskToCanvas(img, mask);
    } catch (e) {
      console.error('remove-bg error:', e);
      alert('Não foi possível remover o fundo agora. Tente novamente em instantes.');
    } finally {
      setLoadingBg(false);
    }
  }

  function exportPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL('image/png');
    onExport?.(data);
    onApply?.(data); // compat com a página que espera onApply
  }

  return (
    <div className={className}>
      <div className="mb-3 flex items-center gap-3 text-sm">
        <label className="w-40">Brilho: {brightness}%</label>
        <input
          type="range"
          min={50}
          max={150}
          value={brightness}
          onChange={(e) => setBrightness(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="mb-3 flex items-center gap-3 text-sm">
        <label className="w-40">Contraste: {contrast}%</label>
        <input
          type="range"
          min={50}
          max={150}
          value={contrast}
          onChange={(e) => setContrast(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="mb-4 flex items-center gap-3 text-sm">
        <label className="w-40">Saturação: {saturation}%</label>
        <input
          type="range"
          min={0}
          max={200}
          value={saturation}
          onChange={(e) => setSaturation(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="mb-3 overflow-hidden rounded-xl border border-white/10 bg-black/10">
        <canvas ref={canvasRef} className="block w-full" />
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleRemoveBackground}
          className="inline-flex items-center rounded-xl bg-[#25d366] px-4 py-2 font-semibold text-black/90 shadow-sm hover:bg-[#1fd05f] transition disabled:opacity-60"
          disabled={loadingBg}
        >
          {loadingBg ? 'Removendo fundo…' : 'Remover fundo (beta)'}
        </button>

        <button
          type="button"
          onClick={exportPng}
          className="inline-flex items-center rounded-xl border border-white/15 px-4 py-2 font-semibold text-foreground hover:bg-white/5 transition"
        >
          Aplicar / Exportar PNG
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center rounded-xl border border-white/15 px-4 py-2 font-semibold text-foreground/80 hover:bg-white/5 transition"
          >
            Cancelar
          </button>
        )}

        {!modelReady && (
          <span className="text-xs text-muted-foreground">
            O modelo carrega na 1ª vez que você clica em “Remover fundo”.
          </span>
        )}
      </div>
    </div>
  );
}

/* ---------------- helpers de imagem/onnx ---------------- */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

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
  return { inputTensor, resizedW: W, resizedH: H };
}

function tensorToMask(output: ort.Tensor, W: number, H: number) {
  const data = output.data as Float32Array | number[];
  const out = new Uint8ClampedArray(W * H);
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < data.length; i++) {
    const v = Number(data[i]);
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const rng = max - min || 1;
  for (let i = 0; i < W * H; i++) {
    const v = Number(data[i]);
    const norm = (v - min) / rng;
    out[i] = Math.round(norm * 255);
  }
  return out;
}

function applyMaskToCanvas(img: HTMLImageElement, mask: Uint8ClampedArray) {
  const W = img.width;
  const H = img.height;

  const tmpCanvas = document.createElement('canvas');
  tmpCanvas.width = 320;
  tmpCanvas.height = 320;
  const tctx = tmpCanvas.getContext('2d')!;
  const tmpImg = tctx.createImageData(320, 320);
  for (let i = 0; i < 320 * 320; i++) {
    tmpImg.data[i * 4 + 0] = mask[i];
    tmpImg.data[i * 4 + 1] = mask[i];
    tmpImg.data[i * 4 + 2] = mask[i];
    tmpImg.data[i * 4 + 3] = 255;
  }
  tctx.putImageData(tmpImg, 0, 0);

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = W;
  maskCanvas.height = H;
  maskCanvas.getContext('2d')!.drawImage(tmpCanvas, 0, 0, 320, 320, 0, 0, W, H);
  const maskData = maskCanvas.getContext('2d')!.getImageData(0, 0, W, H).data;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = W;
  outCanvas.height = H;
  const octx = outCanvas.getContext('2d')!;
  octx.drawImage(img, 0, 0, W, H);
  const imgData = octx.getImageData(0, 0, W, H);
  const src = imgData.data;

  for (let i = 0; i < W * H; i++) {
    src[i * 4 + 3] = maskData[i * 4]; // canal R vira alpha
  }
  octx.putImageData(imgData, 0, 0);

  const main = document.querySelector('canvas');
  const mctx = main?.getContext('2d');
  if (main && mctx) {
    main.width = W;
    main.height = H;
    mctx.clearRect(0, 0, W, H);
    mctx.drawImage(outCanvas, 0, 0);
  }
}
