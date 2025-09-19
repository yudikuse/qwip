// components/PhotoEditor.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as ort from 'onnxruntime-web';

// Modelo U²-Net (recortador universal) hospedado publicamente.
// Você pode espelhar esse .onnx no seu storage/CDN depois.
const U2NET_URL =
  'https://huggingface.co/datasets/Xenova/onnx-models/resolve/main/u2net/u2net.onnx';

type Props = {
  srcDataUrl: string;              // data:image/...
  onCancel: () => void;
  onApply: (editedDataUrl: string) => void;
};

export default function PhotoEditor({ srcDataUrl, onCancel, onApply }: Props) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Filtros básicos
  const [brightness, setBrightness] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [saturation, setSaturation] = useState(1);
  const [sepia, setSepia] = useState(0);
  const [blur, setBlur] = useState(0);
  const [rotation, setRotation] = useState(0);    // graus
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  // IA — remoção de fundo
  const [removingBg, setRemovingBg] = useState(false);
  const [mask, setMask] = useState<ImageData | null>(null);
  const [session, setSession] = useState<ort.InferenceSession | null>(null);
  const [loadingModel, setLoadingModel] = useState(false);

  // Carrega modelo ONNX quando o usuário clicar em "Remover fundo"
  async function ensureSession() {
    if (session || loadingModel) return;
    setLoadingModel(true);
    try {
      const s = await ort.InferenceSession.create(U2NET_URL, {
        executionProviders: ['webgpu', 'wasm'], // tenta WebGPU; cai para WASM
      });
      setSession(s);
    } finally {
      setLoadingModel(false);
    }
  }

  // Desenha a imagem com filtros atuais
  function renderToCanvas(base?: HTMLImageElement, useMask?: ImageData | null) {
    const img = base ?? imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    // ajusta dimensões mantendo qualidade
    const maxW = 1280;
    const scale = Math.min(1, maxW / img.naturalWidth);
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d')!;
    ctx.save();

    // aplica transformações (girar/espelhar) no contexto
    ctx.translate(w / 2, h / 2);
    const rad = (rotation * Math.PI) / 180;
    ctx.rotate(rad);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.translate(-w / 2, -h / 2);

    // filtros CSS-like via context.filter
    ctx.filter = [
      `brightness(${brightness})`,
      `contrast(${contrast})`,
      `saturate(${saturation})`,
      `sepia(${sepia})`,
      blur > 0 ? `blur(${blur}px)` : '',
    ]
      .filter(Boolean)
      .join(' ');

    ctx.drawImage(img, 0, 0, w, h);
    ctx.restore();

    // aplica máscara (transparência) se houver
    if (useMask) {
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;
      const m = useMask.data;
      // usa canal R da máscara como alfa
      for (let i = 0; i < d.length; i += 4) {
        d[i + 3] = m[i]; // alpha = máscara
      }
      ctx.putImageData(imgData, 0, 0);
    }
  }

  // carrega imagem e desenha
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      renderToCanvas(img, mask);
    };
    img.src = srcDataUrl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [srcDataUrl]);

  // re-render quando filtros/transformações mudarem
  useEffect(() => {
    renderToCanvas(undefined, mask);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brightness, contrast, saturation, sepia, blur, rotation, flipH, flipV, mask]);

  // Gera máscara de recorte com U²-Net
  async function handleRemoveBg() {
    try {
      await ensureSession();
      if (!session || !canvasRef.current) return;

      setRemovingBg(true);

      // pega bitmap atual (sem máscara) como entrada do modelo
      const c = canvasRef.current;
      const w = c.width;
      const h = c.height;
      const ctx = c.getContext('2d')!;
      const imageData = ctx.getImageData(0, 0, w, h);

      // Pré-processamento simples: redimensiona para 320x320 e normaliza
      const INPUT_SIZE = 320;
      const off = new OffscreenCanvas(INPUT_SIZE, INPUT_SIZE);
      const octx = off.getContext('2d')!;
      octx.drawImage(c, 0, 0, INPUT_SIZE, INPUT_SIZE);
      const small = octx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE).data;

      const floatData = new Float32Array(1 * 3 * INPUT_SIZE * INPUT_SIZE);
      // RGBA -> CHW RGB [0,1]
      let p = 0;
      for (let i = 0; i < small.length; i += 4) {
        floatData[p] = small[i] / 255;           // R
        floatData[p + INPUT_SIZE * INPUT_SIZE] = small[i + 1] / 255; // G
        floatData[p + 2 * INPUT_SIZE * INPUT_SIZE] = small[i + 2] / 255; // B
        p += 1;
      }

      const tensor = new ort.Tensor('float32', floatData, [1, 3, INPUT_SIZE, INPUT_SIZE]);
      const outputs = await session.run({ 'input.1': tensor }); // nome da entrada varia por modelo
      const out = outputs[Object.keys(outputs)[0]] as ort.Tensor; // [1,1,320,320]

      // pós-processa para máscara 0..255 e redimensiona de volta
      const maskSmall = out.data as Float32Array;
      const maskImageData = new ImageData(INPUT_SIZE, INPUT_SIZE);
      for (let i = 0; i < maskSmall.length; i++) {
        const v = Math.max(0, Math.min(255, Math.round(maskSmall[i] * 255)));
        const j = i * 4;
        maskImageData.data[j] = v;
        maskImageData.data[j + 1] = v;
        maskImageData.data[j + 2] = v;
        maskImageData.data[j + 3] = v; // alpha igual
      }

      // escala a máscara para o tamanho do canvas
      const maskCanvas = new OffscreenCanvas(w, h);
      const mctx = maskCanvas.getContext('2d')!;
      // desenha pequena e estica
      const tmp = new OffscreenCanvas(INPUT_SIZE, INPUT_SIZE);
      const tctx = tmp.getContext('2d')!;
      tctx.putImageData(maskImageData, 0, 0);
      mctx.drawImage(tmp, 0, 0, w, h);
      const bigMask = mctx.getImageData(0, 0, w, h);

      setMask(bigMask);
      renderToCanvas(undefined, bigMask);
    } catch (e) {
      alert('Falha ao remover fundo (beta). Tente novamente.');
      console.error(e);
    } finally {
      setRemovingBg(false);
    }
  }

  function handleApply() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const out = canvas.toDataURL('image/webp', 0.95);
    onApply(out);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0b0e13] p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Editor de Foto (Beta)</h2>
          <button onClick={onCancel} className="rounded-lg border border-white/15 px-3 py-1 text-sm">
            Fechar
          </button>
        </div>

        <div className="mt-3 grid gap-4 md:grid-cols-[1fr,320px]">
          <div className="rounded-xl border border-white/10 bg-black/20 p-2">
            <canvas ref={canvasRef} className="block max-h-[60vh] w-full" />
          </div>

          <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="text-sm font-medium">Ajustes</div>

            <Range label="Brilho" value={brightness} setValue={setBrightness} min={0.5} max={1.5} step={0.01} />
            <Range label="Contraste" value={contrast} setValue={setContrast} min={0.5} max={1.5} step={0.01} />
            <Range label="Saturação" value={saturation} setValue={setSaturation} min={0} max={2} step={0.01} />
            <Range label="Sépia" value={sepia} setValue={setSepia} min={0} max={1} step={0.01} />
            <Range label="Desfoque" value={blur} setValue={setBlur} min={0} max={5} step={0.1} />

            <div className="grid grid-cols-3 gap-2 pt-2">
              <button onClick={() => setRotation((r) => (r + 90) % 360)} className="rounded-lg border border-white/15 px-2 py-1 text-sm">
                Girar 90°
              </button>
              <button onClick={() => setFlipH((v) => !v)} className="rounded-lg border border-white/15 px-2 py-1 text-sm">
                Espelhar H
              </button>
              <button onClick={() => setFlipV((v) => !v)} className="rounded-lg border border-white/15 px-2 py-1 text-sm">
                Espelhar V
              </button>
            </div>

            <div className="pt-3">
              <button
                onClick={handleRemoveBg}
                disabled={loadingModel || removingBg}
                className="w-full rounded-xl bg-emerald-500 px-3 py-2 font-semibold text-black/90 disabled:opacity-60"
              >
                {loadingModel ? 'Carregando IA…' : removingBg ? 'Removendo fundo…' : 'Remover fundo (IA)'}
              </button>
              <p className="mt-1 text-xs text-muted-foreground">
                Tudo roda no seu navegador. Não enviamos sua imagem para servidores.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button onClick={onCancel} className="rounded-xl border border-white/15 px-3 py-2 text-sm">
                Cancelar
              </button>
              <button onClick={handleApply} className="rounded-xl bg-[#25d366] px-3 py-2 font-semibold text-black/90">
                Aplicar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente auxiliar para slider
function Range({
  label,
  value,
  setValue,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  setValue: (n: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">{value.toFixed(2)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
