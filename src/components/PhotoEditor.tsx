'use client';

import * as React from 'react';
import * as ort from 'onnxruntime-web';

type PhotoEditorProps = {
  /** dataURL da imagem vinda do input de arquivo */
  srcDataUrl: string;
  /** callback com o resultado final como dataURL (PNG) */
  onApply?: (dataUrl: string) => void;
  /** fecha modal/painel, se a tela pai quiser */
  onCancel?: () => void;
  className?: string;
};

const MODEL_URL =
  'https://huggingface.co/onnx/models/resolve/main/vision/segmentation/u2net/u2net.onnx';

export default function PhotoEditor({
  srcDataUrl,
  onApply,
  onCancel,
  className,
}: PhotoEditorProps) {
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

  // desenha imagem com filtros
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

  // carrega a imagem
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
      // tamanho do preview: limita pra não explodir layout,
      // mas mantém proporção (máx 900px de largura)
      const maxW = 900;
      const scale = img.width > maxW ? maxW / img.width : 1;
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      drawWithFilters();
    };
    img.onerror = () => {
      alert('Falha ao carregar a imagem.');
    };
    img.src = srcDataUrl;
  }, [srcDataUrl, drawWithFilters]);

  // redesenha quando mexe no filtro
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

      // 1) Pré-processa (320x320 NCHW [0..1])
      const { inputTensor, W, H } = imageToTensor(img, 320, 320);

      // 2) Descobre nome da entrada/saída do modelo
      const inputName = Object.keys(session.inputMetadata)[0];
      const outputName = Object.keys(session.outputMetadata)[0];

      // 3) Inference
      const outputs = await session.run({ [inputName]: inputTensor });
      const out = outputs[outputName];

      // 4) Pós-processa -> máscara 0..255 e escala para o tamanho do canvas atual
      const smallMask = tensorToMask(out as ort.Tensor, W, H);
      const maskForCanvas = scaleMaskNearest(smallMask, W, H, canvas.width, canvas.height);

      // 5) Aplica no preview
      applyAlphaMaskOnCanvas(canvas, maskForCanvas);
    } catch (e: any) {
      console.error('remove-bg error:', e);
      const msg =
        typeof e?.message === 'string'
          ? e.message
          : 'Não foi possível remover o fundo agora. Tente novamente em instantes.';
      alert(msg);
    } finally {
      setLoadingBg(false);
    }
  }

  function exportPng() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL('image/png');
    onApply?.(data);
  }

  return (
    <div className={className}>
      {/* GRID: controles à esquerda, preview à direita (no desktop) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[360px_1fr]">
        {/* Painel de controles */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">
              Brilho: {brightness}%
            </label>
            <input
              type="range"
              min={50}
              max={150}
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium">
              Contraste: {contrast}%
            </label>
            <input
              type="range"
              min={50}
              max={150}
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium">
              Saturação: {saturation}%
            </label>
            <input
              type="range"
              min={0}
              max={200}
              value={saturation}
              onChange={(e) => setSaturation(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex flex-wrap gap-3">
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
            <p className="mt-3 text-xs text-[var(--muted-foreground)]">
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
  );
}

/* ---------------- helpers ---------------- */

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
  // U2Net costuma devolver 1x1xHxW ou 1xHxW
  const data = output.data as Float32Array | number[];
  const flat = new Float32Array(W * H);

  if (data.length === W * H) {
    for (let i = 0; i < W * H; i++) flat[i] = Number(data[i]);
  } else {
    // assume 1x1xHxW
    for (let i = 0; i < W * H; i++) flat[i] = Number(data[i]);
  }

  // normaliza 0..1 e converte para 0..255
  let min = Infinity,
    max = -Infinity;
  for (let i = 0; i < flat.length; i++) {
    const v = flat[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const rng = max - min || 1;

  const out = new Uint8ClampedArray(W * H);
  for (let i = 0; i < flat.length; i++) {
    const norm = (flat[i] - min) / rng;
    // leve suavização para matte
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
    // usa máscara como alpha
    data[i * 4 + 3] = mask[i];
  }

  ctx.putImageData(imgData, 0, 0);
}
