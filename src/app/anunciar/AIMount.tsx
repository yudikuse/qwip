'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import ImageEditorModal from './ImageEditorModal';

/**
 * Monta um botão "Editar com IA (grátis)" abaixo do preview (host="#ai-under-preview"),
 * ouvindo o <input type="file" data-ai="photo"> existente.
 * Abre o ImageEditorModal diretamente e exibe progresso suavizado no botão.
 */
export default function AIMount({
  hostSelector = '#ai-under-preview',
  inputSelector = 'input[data-ai="photo"]',
  onReplace,
}: {
  hostSelector?: string;
  inputSelector?: string;
  onReplace: (blob: Blob) => void;
}) {
  const [hostEl, setHostEl] = useState<HTMLElement | null>(null);
  const [inputEl, setInputEl] = useState<HTMLInputElement | null>(null);

  // arquivo selecionado no input
  const [file, setFile] = useState<File | null>(null);

  // controle do modal
  const [open, setOpen] = useState(false);

  // estados vindos do modal
  const [working, setWorking] = useState(false);    // true enquanto IA processa
  const [rawPct, setRawPct] = useState(0);          // progresso “cru” (0..100)

  // progresso suavizado (não pula para 99% e trava)
  const [uiPct, setUiPct] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef<number>(0);

  // ==== localizar host e input ====
  useEffect(() => {
    const host = document.querySelector<HTMLElement>(hostSelector) ?? null;
    setHostEl(host);

    const input =
      document.querySelector<HTMLInputElement>(inputSelector) ??
      document.querySelector<HTMLInputElement>('input[type="file"]') ??
      null;
    setInputEl(input);

    if (!input) return;
    const onChange = () => setFile(input.files?.[0] ?? null);
    input.addEventListener('change', onChange);
    return () => input.removeEventListener('change', onChange);
  }, [hostSelector, inputSelector]);

  // ==== smoothing do progresso ====
  useEffect(() => {
    function loop(now: number) {
      const last = lastRef.current || now;
      lastRef.current = now;
      const dt = Math.max(0, now - last);

      // trava em 97% enquanto working, para não “terminar” antes da IA
      const cap = working ? 97 : 100;
      const target = Math.min(cap, rawPct);

      setUiPct((prev) => {
        if (target <= prev) return prev;
        // aceleração suave baseada no gap + normalização no tempo
        const gap = target - prev;
        const speed = Math.max(0.12, Math.min(0.35, gap / 24)); // 12%~35% do gap
        const advance = gap * speed * (dt / 100);
        return Math.min(target, prev + advance);
      });

      // quando working=false, corre até 100 e encerra
      if (!working && uiPct >= 99.5) {
        setUiPct(100);
        rafRef.current && cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [working, rawPct]);

  // ==== render do botão dentro do host ====
  useEffect(() => {
    if (!hostEl) return;

    // cria/garante container único
    let container = hostEl.querySelector<HTMLDivElement>('[data-ai-btn]');
    if (!container) {
      container = document.createElement('div');
      container.setAttribute('data-ai-btn', '1');
      hostEl.appendChild(container);
    }

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className =
      'inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 ' +
      'text-xs font-semibold text-[var(--primary-foreground)] shadow-sm ' +
      'hover:opacity-95 transition';

    function svgArc(cx: number, cy: number, r: number, end: number) {
      // 0..100 -> 0..360deg
      const endDeg = (end / 100) * 360;
      const start = polar(cx, cy, r, endDeg);
      const finish = polar(cx, cy, r, 0);
      const large = endDeg - 0 <= 180 ? '0' : '1';
      return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${finish.x} ${finish.y}`;
    }
    function polar(cx: number, cy: number, r: number, deg: number) {
      const a = (deg - 90) * (Math.PI / 180);
      return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    }

    function render() {
      if (!working) {
        btn.innerHTML = `
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 21l14-14M16 5l3 3M2 22l5-2-3-3-2 5z"></path>
          </svg>
          <span>Editar com IA (grátis)</span>
        `;
      } else {
        const pct = Math.round(uiPct);
        btn.innerHTML = `
          <svg class="h-3.5 w-3.5" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="15" stroke="currentColor" stroke-width="3" opacity="0.25"/>
            <path d="${svgArc(18,18,15,pct)}" stroke="currentColor" stroke-width="3" fill="none"/>
          </svg>
          <span>${pct < 100 ? `Editando… ${pct}%` : 'Finalizando…'}</span>
        `;
      }
    }

    render();
    container.innerHTML = '';
    container.appendChild(btn);

    btn.onclick = () => {
      if (!file) {
        // micro feedback quando não há arquivo
        btn.animate(
          [
            { transform: 'translateX(0)' },
            { transform: 'translateX(-3px)' },
            { transform: 'translateX(3px)' },
            { transform: 'translateX(0)' },
          ],
          { duration: 180 }
        );
        return;
      }
      setOpen(true);
    };

    const id = setInterval(render, 120);
    return () => clearInterval(id);
  }, [hostEl, file, working, uiPct]);

  // ==== callbacks vindos do modal ====
  const modalHandlers = useMemo(
    () => ({
      onWorking: (v: boolean) => {
        setWorking(v);
        if (v) {
          setRawPct(0);
          setUiPct(0);
        } else {
          // força corrida ao fim
          setRawPct(100);
        }
      },
      onProgress: (current: number, total: number) => {
        const pct = Math.max(0, Math.min(100, Math.round((current / Math.max(1, total)) * 100)));
        setRawPct(pct);
      },
      onApply: async (blob: Blob) => {
        // substitui o arquivo no <input> para manter consistência
        if (inputEl) {
          const edited = new File([blob], 'foto-editada.png', { type: 'image/png', lastModified: Date.now() });
          const dt = new DataTransfer();
          dt.items.add(edited);
          inputEl.files = dt.files;
          inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        }
        onReplace(blob);
        setOpen(false);
      },
    }),
    [inputEl, onReplace]
  );

  return (
    <>
      {open && file && (
        <ImageEditorModal
          file={file}
          open={open}
          onClose={() => setOpen(false)}
          // os três abaixo precisam existir no seu modal; se seus nomes forem diferentes,
          // ajuste aqui para repassar corretamente.
          onApply={modalHandlers.onApply}
          onWorking={modalHandlers.onWorking}
          onProgress={modalHandlers.onProgress}
        />
      )}
    </>
  );
}
