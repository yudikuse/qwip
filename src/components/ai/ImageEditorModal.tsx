'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

// Import opcional – usado apenas quando clicar em "Remover fundo (IA)"
let removeBgFn: null | ((
  input: Blob | ArrayBuffer | Uint8Array | string | URL,
  cfg?: any
) => Promise<Blob>) = null;

type Props = {
  open: boolean;
  file: File;
  onClose: () => void;
  onApply: (blob: Blob) => void;
};

type FilterKind = 'original' | 'boost' | 'bw' | 'warm' | 'cool' | 'hdr';

export default function ImageEditorModal({ open, file, onClose, onApply }: Props) {
  const [previewURL, setPreviewURL] = useState<string>('');
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);

  // região de desenho na prévia (para mapear seleção -> pixels reais)
  const drawRect = useRef<{ dx: number; dy: number; dw: number; dh: number }>({
    dx: 0,
    dy: 0,
    dw: 0,
    dh: 0,
  });

  // Seleção de recorte (coordenadas da pré-visualização)
  const [sel, setSel] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const dragRef = useRef<{ x0: number; y0: number; active: boolean }>({ x0: 0, y0: 0, active: false });

  // Filtros rápidos
  const [filter, setFilter] = useState<FilterKind>('original');

  // Estados da IA (progresso)
  const [working, setWorking] = useState(false);

  // refs do canvas de prévia
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  // Carrega o arquivo na prévia
  useEffect(() => {
    if (!open) return;
    const url = URL.createObjectURL(file);
    setPreviewURL(url);
    (async () => {
      const bmp = await createImageBitmap(file);
      setBitmap(bmp);
    })();

    return () => {
      URL.revokeObjectURL(url);
      setBitmap((old) => {
        if (old) old.close?.();
        return null;
      });
    };
  }, [open, file]);

  // Desenha a imagem na prévia (fit contain) e guarda drawRect para mapeamento correto
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !bitmap) return;

    const px = Math.max(1, Math.floor(devicePixelRatio || 1));
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * px;
    canvas.height = h * px;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(px, 0, 0, px, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const iw = bitmap.width;
    const ih = bitmap.height;
    const scale = Math.min(w / iw, h / ih);
    const dw = Math.max(1, Math.floor(iw * scale));
    const dh = Math.max(1, Math.floor(ih * scale));
    const dx = Math.floor((w - dw) / 2);
    const dy = Math.floor((h - dh) / 2);
    drawRect.current = { dx, dy, dw, dh };

    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, dx, dy, dw, dh);
  }, [bitmap, previewURL, open]);

  // Interação de recorte
  useEffect(() => {
    const overlay = overlayRef.current;
    const canvas = previewCanvasRef.current;
    if (!overlay || !canvas) return;

    function clampRect(r: { x: number; y: number; w: number; h: number }) {
      const { dx, dy, dw, dh } = drawRect.current;
      let x = Math.max(dx, Math.min(dx + dw, r.x));
      let y = Math.max(dy, Math.min(dy + dh, r.y));
      let w = Math.max(1, Math.min(dx + dw - x, r.w));
      let h = Math.max(1, Math.min(dy + dh - y, r.h));
      return { x, y, w, h };
    }

    const onDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      dragRef.current = { x0: x, y0: y, active: true };
      setSel(null);
    };
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const rx = Math.min(dragRef.current.x0, x);
      const ry = Math.min(dragRef.current.y0, y);
      const rw = Math.abs(x - dragRef.current.x0);
      const rh = Math.abs(y - dragRef.current.y0);
      setSel(clampRect({ x: rx, y: ry, w: rw, h: rh }));
    };
    const onUp = () => {
      dragRef.current.active = false;
    };

    overlay.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      overlay.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // Desenha o retângulo da seleção por cima
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    overlay.innerHTML = '';
    if (!sel) return;

    const el = document.createElement('div');
    el.style.position = 'absolute';
    el.style.left = `${sel.x}px`;
    el.style.top = `${sel.y}px`;
    el.style.width = `${sel.w}px`;
    el.style.height = `${sel.h}px`;
    el.style.border = '2px solid #22c55e';
    el.style.borderRadius = '10px';
    el.style.boxShadow = '0 0 0 200vmax rgba(0,0,0,.35) inset';
    overlay.appendChild(el);
  }, [sel]);

  // === util ===
  function dispatchWorking(v: boolean) {
    setWorking(v);
    window.dispatchEvent(new CustomEvent('ai-edit:working', { detail: v }));
  }
  function dispatchProgress(p: number) {
    window.dispatchEvent(new CustomEvent('ai-edit:progress', { detail: p }));
  }

  // Aplica filtros/recorte (e opcionalmente já sobre o recorte)
  async function renderWithEdits(src: ImageBitmap): Promise<Blob> {
    const { dx, dy, dw, dh } = drawRect.current;

    // Converte seleção da visualização para pixels reais
    let crop = { x: 0, y: 0, w: src.width, h: src.height };
    if (sel && sel.w > 2 && sel.h > 2) {
      const sx = Math.max(0, Math.round(((sel.x - dx) / dw) * src.width));
      const sy = Math.max(0, Math.round(((sel.y - dy) / dh) * src.height));
      const sw = Math.max(1, Math.round((sel.w / dw) * src.width));
      const sh = Math.max(1, Math.round((sel.h / dh) * src.height));
      // clamp para dentro da imagem
      crop = {
        x: Math.min(src.width - 1, sx),
        y: Math.min(src.height - 1, sy),
        w: Math.min(src.width - sx, sw),
        h: Math.min(src.height - sy, sh),
      };
    }

    const c = document.createElement('canvas');
    c.width = crop.w;
    c.height = crop.h;
    const ctx = c.getContext('2d', { willReadFrequently: false })!;

    // aplica filtros simples via CSS filters
    ctx.imageSmoothingQuality = 'high';
    ctx.filter = cssFilterFor(filter);
    ctx.drawImage(src, crop.x, crop.y, crop.w, crop.h, 0, 0, crop.w, crop.h);

    const blob = await new Promise<Blob>((r) => c.toBlob((b) => r(b!), 'image/png', 0.92));
    return blob;
  }

  function cssFilterFor(kind: FilterKind) {
    switch (kind) {
      case 'boost':
        return 'brightness(1.05) contrast(1.12) saturate(1.18)';
      case 'bw':
        return 'grayscale(1) contrast(1.05)';
      case 'warm':
        return 'brightness(1.03) contrast(1.06) sepia(.18) saturate(1.1)';
      case 'cool':
        return 'brightness(1.02) contrast(1.06) hue-rotate(190deg) saturate(1.05)';
      case 'hdr':
        return 'brightness(1.06) contrast(1.2) saturate(1.15)';
      default:
        return 'none';
    }
  }

  // Remoção de fundo via Imgly – emite progresso real
  async function onRemoveBg() {
    if (!bitmap) return;
    try {
      dispatchWorking(true);
      dispatchProgress(2);

      if (!removeBgFn) {
        const mod = await import('@imgly/background-removal');
        // @ts-expect-error types
        removeBgFn = mod.default || mod;
      }

      // Usa o File original para melhor qualidade
      const out = await removeBgFn!(file, {
        device: 'gpu',
        output: { format: 'image/png', quality: 0.92 },
        progress: (_k: any, cur: number, tot: number) => {
          const pct = Math.max(3, Math.min(97, Math.round((cur / tot) * 100)));
          dispatchProgress(pct);
        },
      });

      // Atualiza a preview (e bitmap) com o PNG com alpha
      const url = URL.createObjectURL(out);
      setPreviewURL((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });
      const bmp = await createImageBitmap(out);
      setBitmap((old) => {
        if (old) old.close?.();
        return bmp;
      });
      dispatchProgress(100);
    } catch (e) {
      console.error('remove-bg', e);
      alert('Falha ao remover fundo.');
      dispatchProgress(0);
    } finally {
      dispatchWorking(false);
    }
  }

  async function handleApply() {
    if (!bitmap) return;
    const blob = await renderWithEdits(bitmap);
    onApply(blob);
  }

  // Fechar ao ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center overflow-y-auto bg-black/70 p-4">
      <div className="mx-auto mt-4 grid w-full max-w-5xl grid-cols-1 gap-4 md:grid-cols-[1.6fr,1fr]">
        {/* Preview */}
        <div className="relative rounded-2xl border border-white/10 bg-[#0f1115]/95 p-3">
          <div className="relative h-[58vh] min-h-[340px] w-full overflow-hidden rounded-xl bg-black/40">
            <canvas ref={previewCanvasRef} className="h-full w-full" />
            <div
              ref={overlayRef}
              className="pointer-events-auto absolute inset-0 cursor-crosshair"
              aria-label="Área de recorte"
            />
          </div>
          <p className="mt-2 text-[11px] text-zinc-400">
            Dica: arraste para selecionar um recorte. Clique novamente para refazer.
          </p>
        </div>

        {/* Painel */}
        <div className="rounded-2xl border border-white/10 bg-[#0f1115]/95 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">Fundo</h3>
            <button
              onClick={onClose}
              className="rounded-lg border border-white/15 px-2 py-1 text-sm text-zinc-300 hover:bg-white/5"
            >
              Fechar
            </button>
          </div>

          {/* Botão IA */}
          <button
            disabled={working}
            onClick={onRemoveBg}
            className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-md bg-emerald-500 font-semibold text-[#0F1115] hover:bg-emerald-400 disabled:opacity-60"
          >
            {working ? 'Processando…' : 'Remover fundo (IA)'}
          </button>

          {/* Filtros rápidos */}
          <div className="mt-6">
            <h4 className="mb-2 text-sm font-medium text-zinc-200">Filtros rápidos</h4>
            <div className="grid grid-cols-2 gap-2">
              {([
                ['original', 'Original'],
                ['boost', 'Realce'],
                ['bw', 'P&B'],
                ['warm', 'Quente'],
                ['cool', 'Frio'],
                ['hdr', 'HDR leve'],
              ] as [FilterKind, string][]).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={
                    'h-10 rounded-md border px-3 text-sm ' +
                    (filter === k
                      ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                      : 'border-white/12 bg-white/5 text-zinc-300 hover:bg-white/8')
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Recorte */}
          <div className="mt-6">
            <h4 className="mb-2 text-sm font-medium text-zinc-200">Recorte</h4>
            <div className="flex gap-2">
              <button
                onClick={() => setSel((s) => (s ? s : { x: 30, y: 30, w: 180, h: 120 }))}
                className="h-10 flex-1 rounded-md border border-white/12 bg-white/5 text-sm text-zinc-200 hover:bg-white/8"
              >
                Aplicar recorte
              </button>
              <button
                onClick={() => setSel(null)}
                className="h-10 flex-1 rounded-md border border-white/12 bg-white/5 text-sm text-zinc-200 hover:bg-white/8"
              >
                Limpar seleção
              </button>
            </div>
            <p className="mt-1 text-[11px] text-zinc-400">Arraste na imagem para selecionar a área.</p>
          </div>

          {/* Ações */}
          <div className="mt-6 flex items-center justify-end gap-2">
            <button
              onClick={handleApply}
              className="inline-flex h-11 flex-1 items-center justify-center rounded-md bg-emerald-500 font-semibold text-[#0F1115] hover:bg-emerald-400"
            >
              Aplicar no meu anúncio
            </button>
            <button
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-md border border-white/12 bg-transparent px-4 text-sm text-zinc-200 hover:bg-white/5"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
