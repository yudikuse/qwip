'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { removeBackground } from '@imgly/background-removal';

type FilterId = 'original' | 'realce' | 'pb' | 'quente' | 'frio' | 'hdr';

type Props = {
  file: File;
  open: boolean;
  onClose: () => void;
  onApply: (blob: Blob) => void;
};

/** Presets (para export) usando CanvasRenderingContext2D.filter */
const FILTERS: Record<FilterId, string> = {
  original: 'none',
  realce: 'brightness(1.06) contrast(1.09) saturate(1.08) sharpness(0)',
  pb: 'grayscale(1) contrast(1.05)',
  quente: 'saturate(1.15) hue-rotate(-8deg) brightness(1.03)',
  frio: 'saturate(0.95) hue-rotate(8deg) brightness(1.02)',
  hdr: 'contrast(1.1) saturate(1.1) brightness(1.04)',
};

/** Fit “contain”: retorna área renderizada da imagem dentro do viewport */
function computeContainFit(
  imgW: number,
  imgH: number,
  viewW: number,
  viewH: number
) {
  const scale = Math.min(viewW / imgW, viewH / imgH);
  const w = Math.round(imgW * scale);
  const h = Math.round(imgH * scale);
  const x = Math.round((viewW - w) / 2);
  const y = Math.round((viewH - h) / 2);
  return { x, y, w, h, scale };
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/** Suaviza o progresso para não “oscilar” */
function smoothMonotonicProgress(prev: number, next: number) {
  // limita passos e garante monotonia
  const capped = Math.min(next, prev + 7); // no máx +7 por tick
  return Math.max(prev, Math.round(capped));
}

export default function ImageEditorModal({ file, open, onClose, onApply }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [imgUrl, setImgUrl] = useState<string>('');
  const [imgEl, setImgEl] = useState<HTMLImageElement | null>(null);

  // filtros e estado do IA
  const [filter, setFilter] = useState<FilterId>('original');
  const [bgBlob, setBgBlob] = useState<Blob | null>(null); // saída do removeBackground
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  // seleção de recorte (em coords do viewport)
  const [dragging, setDragging] = useState(false);
  const [sel, setSel] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [committedCrop, setCommittedCrop] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null); // normalizado [0..1] dentro da imagem renderizada

  // carregar a imagem do File
  useEffect(() => {
    if (!open || !file) return;
    const url = URL.createObjectURL(file);
    setImgUrl(url);
    const img = new Image();
    img.onload = () => setImgEl(img);
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file, open]);

  // limpar estados ao fechar
  useEffect(() => {
    if (!open) {
      setBgBlob(null);
      setFilter('original');
      setSel(null);
      setCommittedCrop(null);
      setRunning(false);
      setProgress(0);
    }
  }, [open]);

  const viewBox = useMemo(() => {
    const el = containerRef.current;
    if (!el || !imgEl) return null;
    const r = el.getBoundingClientRect();
    return computeContainFit(
      imgEl.naturalWidth,
      imgEl.naturalHeight,
      Math.floor(r.width),
      Math.floor(r.height)
    );
  }, [imgEl, containerRef.current?.clientWidth, containerRef.current?.clientHeight]);

  /** Converte a seleção (viewport) para frações (0..1) dentro da imagem renderizada */
  function commitSelection() {
    if (!sel || !viewBox) return;
    // interseção com área realmente renderizada da imagem
    const ix1 = clamp(sel.x, viewBox.x, viewBox.x + viewBox.w);
    const iy1 = clamp(sel.y, viewBox.y, viewBox.y + viewBox.h);
    const ix2 = clamp(sel.x + sel.w, viewBox.x, viewBox.x + viewBox.w);
    const iy2 = clamp(sel.y + sel.h, viewBox.y, viewBox.y + viewBox.h);
    if (ix2 - ix1 < 6 || iy2 - iy1 < 6) return; // muito pequeno

    const fx1 = (ix1 - viewBox.x) / viewBox.w;
    const fy1 = (iy1 - viewBox.y) / viewBox.h;
    const fx2 = (ix2 - viewBox.x) / viewBox.w;
    const fy2 = (iy2 - viewBox.y) / viewBox.h;
    setCommittedCrop({ x1: fx1, y1: fy1, x2: fx2, y2: fy2 });
  }

  function clearSelection() {
    setSel(null);
    setCommittedCrop(null);
  }

  // eventos de recorte
  function onPointerDown(e: React.PointerEvent) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setDragging(true);
    setSel({ x, y, w: 0, h: 0 });
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging || !containerRef.current || !sel) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setSel({ ...sel, w: x - sel.x, h: y - sel.y });
  }
  function onPointerUp() {
    setDragging(false);
  }

  /** Aplica o pipeline e gera Blob final (PNG) */
  async function handleApply() {
    if (!imgEl) return;

    setRunning(true);
    setProgress(10);

    // 1) escolhe source base: original ou sem fundo
    let sourceBlob: Blob;
    if (bgBlob) {
      sourceBlob = bgBlob;
    } else {
      sourceBlob = file;
    }

    // 2) carrega sourceBlob para ImageBitmap (rápido e estável)
    const srcBitmap = await createImageBitmap(sourceBlob);
    setProgress((p) => smoothMonotonicProgress(p, 35));

    // 3) calcula crop em pixels reais (se houver)
    let sx = 0, sy = 0, sw = srcBitmap.width, sh = srcBitmap.height;
    if (committedCrop && viewBox) {
      const x1px = Math.round(committedCrop.x1 * srcBitmap.width);
      const y1px = Math.round(committedCrop.y1 * srcBitmap.height);
      const x2px = Math.round(committedCrop.x2 * srcBitmap.width);
      const y2px = Math.round(committedCrop.y2 * srcBitmap.height);
      sx = clamp(Math.min(x1px, x2px), 0, srcBitmap.width - 1);
      sy = clamp(Math.min(y1px, y2px), 0, srcBitmap.height - 1);
      sw = clamp(Math.abs(x2px - x1px), 1, srcBitmap.width - sx);
      sh = clamp(Math.abs(y2px - y1px), 1, srcBitmap.height - sy);
    }

    // 4) desenha recorte + filtro em um canvas
    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d')!;

    // aplica preset
    const filterCss = FILTERS[filter];
    ctx.filter = filterCss === 'none' ? 'none' : filterCss;

    ctx.drawImage(srcBitmap, sx, sy, sw, sh, 0, 0, sw, sh);
    setProgress((p) => smoothMonotonicProgress(p, 70));

    // 5) exporta PNG
    const blob: Blob = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b as Blob), 'image/png', 0.92)
    );
    setProgress((p) => smoothMonotonicProgress(p, 100));

    setRunning(false);
    onApply(blob);
    onClose();
  }

  /** IA: remover fundo */
  async function handleRemoveBg() {
    if (!imgEl) return;
    setRunning(true);
    setProgress(5);

    // Um progressor suave (0→85) enquanto a lib faz o trabalho
    let soft = 5;
    const timer = setInterval(() => {
      soft = Math.min(soft + 3, 85);
      setProgress((p) => smoothMonotonicProgress(p, soft));
    }, 180);

    try {
      const out = await removeBackground(imgUrl, {
        device: 'gpu',
        output: { format: 'image/png', quality: 0.92 },
        // ---- TIPAGEM CORRIGIDA AQUI ----
        progress: (_k: unknown, current: number, total: number) => {
          const pct = Math.round((current / Math.max(1, total)) * 85);
          setProgress((p) => smoothMonotonicProgress(p, pct));
        },
      } as any);

      clearInterval(timer);
      setProgress((p) => smoothMonotonicProgress(p, 92));
      setBgBlob(out); // guarda para export
    } catch (e) {
      clearInterval(timer);
      console.error('removeBackground failed', e);
    } finally {
      setRunning(false);
      setProgress(0);
    }
  }

  // UI helpers
  const hasCrop = !!committedCrop;
  const showUrl = useMemo(() => {
    if (bgBlob) return URL.createObjectURL(bgBlob);
    return imgUrl;
  }, [bgBlob, imgUrl]);

  useEffect(() => {
    // liberar blob de preview quando mudar
    return () => {
      if (showUrl && showUrl.startsWith('blob:')) URL.revokeObjectURL(showUrl);
    };
  }, [showUrl]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70">
      <div className="relative grid h-[86vh] w-[min(1000px,96vw)] grid-cols-1 gap-0 rounded-2xl border border-white/10 bg-[#0f1115] shadow-2xl md:grid-cols-[1.4fr,1fr]">
        {/* Header */}
        <div className="absolute left-0 top-0 z-10 w-full rounded-t-2xl border-b border-white/10 bg-[#101319] px-4 py-3 text-sm font-semibold">
          Editar com IA (grátis)
          <button
            className="absolute right-3 top-2.5 rounded-md px-2 py-1 text-zinc-400 hover:bg-white/5"
            onClick={onClose}
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        {/* LADO ESQUERDO — Canvas */}
        <div className="col-span-1 mt-12 overflow-hidden p-4">
          <div
            ref={containerRef}
            className="relative h-[66vh] w-full select-none overflow-hidden rounded-xl bg-black/40"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            {showUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={showUrl}
                alt=""
                className="pointer-events-none absolute left-0 top-0 h-full w-full object-contain"
              />
            ) : null}

            {/* Seleção atual */}
            {sel && (
              <div
                className="pointer-events-none absolute border-2 border-emerald-400/80"
                style={{
                  left: Math.min(sel.x, sel.x + sel.w),
                  top: Math.min(sel.y, sel.y + sel.h),
                  width: Math.abs(sel.w),
                  height: Math.abs(sel.h),
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
                }}
              />
            )}
            {/* Preview do recorte “comitado” */}
            {committedCrop && viewBox && (
              <div
                className="pointer-events-none absolute border-2 border-emerald-500/70"
                style={{
                  left: viewBox.x + committedCrop.x1 * viewBox.w,
                  top: viewBox.y + committedCrop.y1 * viewBox.h,
                  width: (committedCrop.x2 - committedCrop.x1) * viewBox.w,
                  height: (committedCrop.y2 - committedCrop.y1) * viewBox.h,
                }}
              />
            )}
          </div>
          <p className="mt-2 text-xs text-zinc-400">
            Dica: na primeira vez pode demorar um pouco para baixar o modelo. Depois, fica mais rápido.
          </p>
        </div>

        {/* LADO DIREITO — Controles */}
        <div className="col-span-1 mt-12 space-y-4 border-t border-white/10 p-4 md:border-l md:border-t-0">
          <div className="rounded-xl border border-white/10 bg-[#0b0f14] p-3">
            <div className="text-sm font-medium">Fundo</div>
            <button
              className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-emerald-500 px-4 py-2 font-semibold text-[#0F1115] hover:bg-emerald-400 disabled:opacity-50"
              onClick={handleRemoveBg}
              disabled={running}
            >
              {running && progress > 0
                ? `Removendo fundo… ${progress}%`
                : 'Remover fundo (IA)'}
            </button>
            <p className="mt-2 text-xs text-zinc-400">
              Roda no seu navegador. Nenhum upload para servidores externos.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0b0f14] p-3">
            <div className="text-sm font-medium">Filtros rápidos</div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {([
                ['original', 'Original'],
                ['realce', 'Realce'],
                ['pb', 'P&B'],
                ['quente', 'Quente'],
                ['frio', 'Frio'],
                ['hdr', 'HDR leve'],
              ] as [FilterId, string][]).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className={
                    'h-10 rounded-md border px-3 text-sm ' +
                    (filter === id
                      ? 'border-emerald-500/30 bg-emerald-500/20 text-emerald-300'
                      : 'border-white/10 bg-transparent text-zinc-200 hover:bg-white/5')
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0b0f14] p-3">
            <div className="text-sm font-medium">Recorte</div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                className="h-10 flex-1 rounded-md border border-white/10 bg-white/5 text-sm text-white hover:bg-white/10"
                onClick={commitSelection}
              >
                Aplicar recorte
              </button>
              <button
                type="button"
                className="h-10 rounded-md border border-white/10 bg-transparent px-3 text-sm text-white hover:bg-white/5"
                onClick={clearSelection}
              >
                Limpar seleção
              </button>
            </div>
            <p className="mt-2 text-xs text-zinc-400">Arraste na imagem para selecionar a área.</p>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              className="inline-flex h-11 flex-1 items-center justify-center rounded-md bg-emerald-500 px-4 font-semibold text-[#0F1115] hover:bg-emerald-400 disabled:opacity-60"
              onClick={handleApply}
              disabled={running}
            >
              Aplicar no meu anúncio
            </button>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-md border border-white/10 bg-transparent px-4 text-white hover:bg-white/5"
              onClick={onClose}
              disabled={running}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
