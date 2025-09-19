'use client';

import * as React from 'react';
import * as ort from 'onnxruntime-web';

/**
 * Editor simples com:
 * - preview do upload
 * - filtros básicos (brilho/contraste/saturação)
 * - botão "Remover fundo (beta)" usando ONNX Runtime (U^2-Net)
 *
 * Observação:
 * - O modelo é carregado em runtime via fetch (CDN pública). Em produção,
 *   espelhe o arquivo .onnx em /public/modelos/u2net.onnx ou em um storage seu.
 */

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
  // refs mutáveis (canvas e contexto)
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const ctxRef = React.useRef<CanvasRenderingContext2D | null>(null);

  // controles de filtro
  const [brightness, setBrightness] = React.useState(100);
  const [contrast, setContrast] = React.useState(100);
  const [saturation, setSaturation] = React.useState(100);

  // sessão ONNX
  const sessionRef = React.useRef<ort.InferenceSession | null>(null);
  const [loadingBg, setLoadingBg] = React.useState(false);
  const [modelReady, setModelReady] = React.useState(false);

  // carrega a imagem no canvas quando src muda
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
      // dimensiona canvas para a imagem
      canvas.width = img.width;
      canvas.height = img.height;
      // aplica filtros CSS-like via canvas (desenhando com composição)
      drawWithFilters(img);
    };
    img.src = srcDataUrl;
  }, [srcDataUrl, brightness, contrast, saturation]);

  function drawWithFilters(img: HTMLImageElement) {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    // Filtros equivalentes a CSS filter
    const cssFilter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
    // Canvas 2D moderno já suporta ctx.filter
    // Fallback: se não existir, desenha sem filtro
    // @ts-expect-error: filter existe na maioria dos browsers modernos
    ctx.filter = cssFilter || 'none';
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    // reseta para não “vazar” para outras operações
    // @ts-expect-error
    ctx.filter = 'none';
  }

  async function ensureModel() {
    if (sessionRef.current) return sessionRef.current;
    // tenta criar sessão (WASM)
    const session = await ort.InferenceSession.create(MODEL_URL, {
      executionProviders: ['wasm'],
    });
    sessionRef.current = session;
    setModelReady(true);
    return session;
  }

  // Remoção de fundo (beta): gera máscara e aplica
  async function handleRemoveBackground() {
    if (!srcDataUrl) return;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;

    setLoadingBg(true);
    try {
      const session = await ensureModel();

      // Carrega a imagem para um canvas offscreen para extrair tensor
      const img = await loadImage(srcDataUrl);
      const { inputTensor, resizedW, resizedH } = imageToTensor(img, 320, 320);

      // roda o modelo
      const outputs = await session.run({ input: inputTensor });
      // tentativa de achar a primeira saída (o nome pode variar por modelo)
      const first = outputs[Object.keys(outputs)[0]];
      const mask = tensorToMask(first, resizedW, resizedH);

      // redimensiona a máscara para o tamanho original e aplica como alpha
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
  const data = output.data as Float32Array | number[];
  const out = new Uint8ClampedArray(W * H);
  // Normaliza para 0..255
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
  return out; // 8-bit alpha para cada pixel
}

function applyMaskToCanvas(img: HTMLImageElement, mask: Uint8ClampedArray) {
  const canvas = document.createElement('canvas');
  const W = img.width;
  const H = img.height;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, W, H);

  const imgData = ctx.getImageData(0, 0, W, H);
  const src = imgData.data;

  // redimensiona a máscara (que veio 320x320) para WxH
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = 320;
  maskCanvas.height = 320;
  const mctx = maskCanvas.getContext('2d')!;
  const tmp = mctx.createImageData(320, 320);
  for (let i = 0; i < 320 * 320; i++) {
    tmp.data[i * 4 + 0] = mask[i];
    tmp.data[i * 4 + 1] = mask[i];
    tmp.data[i * 4 + 2] = mask[i];
    tmp.data[i * 4 + 3] = 255;
  }
  mctx.putImageData(tmp, 0, 0);

  // escala a máscara para o tamanho da imagem final
  const maskBig = document.createElement('canvas');
  maskBig.width = W;
  maskBig.height = H;
  const mbctx = maskBig.getContext('2d')!;
  mbctx.drawImage(maskCanvas, 0, 0, 320, 320, 0, 0, W, H);
  const maskImgData = mbctx.getImageData(0, 0, W, H).data;

  // aplica alpha no canal A
  for (let i = 0; i < W * H; i++) {
    src[i * 4 + 3] = maskImgData[i * 4]; // usa canal R como alpha
  }
  ctx.putImageData(imgData, 0, 0);

  // desenha no canvas principal
  const mainCanvas = document.querySelector('canvas');
  const mainCtx = mainCanvas?.getContext('2d');
  if (mainCanvas && mainCtx) {
    mainCanvas.width = W;
    mainCanvas.height = H;
    mainCtx.clearRect(0, 0, W, H);
    mainCtx.drawImage(canvas, 0, 0);
  }
}
