'use client';

import * as React from 'react';
import * as ort from 'onnxruntime-web';

type PhotoEditorProps = {
  /** dataURL da imagem vinda do input de arquivo */
  srcDataUrl: string;
  /** callback com o resultado final como dataURL */
  onExport?: (dataUrl: string) => void;
  className?: string;
};

const MODEL_URL =
  'https://huggingface.co/onnx/models/resolve/main/vision/segmentation/u2net/u2net.onnx';

export default function PhotoEditor({ srcDataUrl, onExport, className }: PhotoEditorProps) {
  // refs mutáveis
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const ctxRef = React.useRef<CanvasRenderingContext2D | null>(null);
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  // controles de filtro
  const [brightness, setBrightness] = React.useState(100);
  const [contrast, setContrast] = React.useState(100);
  const [saturation, setSaturation] = React.useState(100);

  // sessão ONNX
  const sessionRef = React.useRef<ort.InferenceSession | null>(null);
  const [loadingBg, setLoadingBg] = React.useState(false);
  const [modelReady, setModelReady] = React.useState(false);

  // carrega a imagem no canvas quando src ou filtros mudam
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
      canvas.width = img.width;
      canvas.height = img.height;
      drawWithFilters(img);
    };
    img.src = srcDataUrl;
  }, [srcDataUrl, brightness, contrast, saturation]);

  function drawWithFilters(img: HTMLImageElement) {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const cssFilter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    // @ts-expect-error: ctx.filter existe nos browsers modernos
    ctx.filter = cssFilter || 'none';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    // @ts-expect-error
    ctx.filter = 'none';
  }

  async function ensureModel() {
    if (sessionRef.current) return sessionRef.current;
    const session = await ort.InferenceSession.create(MODEL_URL, {
      executionProviders: ['wasm'],
    });
    sessionRef.current = session;
    setModelReady(true);
    return session;
  }

  // Remoção de fundo (beta)
  async function handleRemoveBackground() {
    const baseImg = imgRef.current;
    const mainCanvas = canvasRef.current;
    const mainCtx = ctxRef.current;
    if (!baseImg || !mainCanvas || !mainCtx) return;

    setLoadingBg(true);
    try {
      const session = await ensureModel();

      // prepara tensor 320x320
      const { inputTensor, resizedW, resizedH } = imageToTensor(baseImg, 320, 320);

      // descobre o nome do input/saída dinamicamente
      const inputName = session.inputNames?.[0] ?? 'input';
      const outputs = await session.run({ [inputName]: inputTensor });
      const firstOutput = outputs[Object.keys(outputs)[0]];
      const mask = tensorToMask(firstOutput, resizedW, resizedH);

      // aplica a máscara no canvas principal (tamanho original)
      applyMaskToCanvas(baseImg, mask, mainCanvas);
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
          Exportar PNG
        </button>

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

// Converte imagem para tensor NCHW normalizado em 0..1, redimensionando para WxH
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
      // NCHW
      floatData[0 * W * H + y * W + x] = r;
      floatData[1 * W * H + y * W + x] = g;
      floatData[2 * W * H + y * W + x] = b;
    }
  }

  const inputTensor = new ort.Tensor('float32', floatData, [1, 3, H, W]);
  return { inputTensor, resizedW: W, resizedH: H };
}

// Converte a saída do modelo (1x1xHxW ou 1xHxW) em máscara 0..255 (Uint8ClampedArray)
function tensorToMask(output: ort.Tensor, W: number, H: number) {
  const raw = output.data as unknown as ArrayLike<number>;

  // Flattens: tenta detectar se veio [1,1,H,W] ou [1,H,W]
  // e posiciona os primeiros H*W elementos na ordem correta.
  // Para U2Net, normalmente é 1x1xH x W com valores contínuos.
  const flat = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) {
    flat[i] = Number(raw[i]);
  }

  // Normaliza 0..255
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < flat.length; i++) {
    const v = flat[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const rng = max - min || 1;

  const out = new Uint8ClampedArray(W * H);
  for (let i = 0; i < W * H; i++) {
    const norm = (flat[i] - min) / rng;
    out[i] = Math.round(norm * 255);
  }
  return out; // 8-bit alpha por pixel em 320x320
}

// Aplica a máscara na imagem base e desenha no canvas principal referenciado
function applyMaskToCanvas(
  img: HTMLImageElement,
  mask320: Uint8ClampedArray,
  mainCanvas: HTMLCanvasElement
) {
  const W = img.width;
  const H = img.height;

  // 1) constrói um canvas com a imagem original
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = W;
  srcCanvas.height = H;
  const srcCtx = srcCanvas.getContext('2d')!;
  srcCtx.drawImage(img, 0, 0, W, H);
  const imgData = srcCtx.getImageData(0, 0, W, H);
  const src = imgData.data;

  // 2) cria um canvas com a máscara 320x320 (grayscale)
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = 320;
  maskCanvas.height = 320;
  const mctx = maskCanvas.getContext('2d')!;
  const tmp = mctx.createImageData(320, 320);
  for (let i = 0; i < 320 * 320; i++) {
    const v = mask320[i];
    tmp.data[i * 4 + 0] = v;
    tmp.data[i * 4 + 1] = v;
    tmp.data[i * 4 + 2] = v;
    tmp.data[i * 4 + 3] = 255;
  }
  mctx.putImageData(tmp, 0, 0);

  // 3) escala a máscara para WxH
  const maskBig = document.createElement('canvas');
  maskBig.width = W;
  maskBig.height = H;
  const mbctx = maskBig.getContext('2d')!;
  mbctx.drawImage(maskCanvas, 0, 0, 320, 320, 0, 0, W, H);
  const maskImgData = mbctx.getImageData(0, 0, W, H).data;

  // 4) aplica a máscara como alpha
  for (let i = 0; i < W * H; i++) {
    src[i * 4 + 3] = maskImgData[i * 4]; // canal R como alpha
  }
  srcCtx.putImageData(imgData, 0, 0);

  // 5) desenha no canvas principal
  mainCanvas.width = W;
  mainCanvas.height = H;
  const mainCtx = mainCanvas.getContext('2d')!;
  mainCtx.clearRect(0, 0, W, H);
  mainCtx.drawImage(srcCanvas, 0, 0, W, H);
}
