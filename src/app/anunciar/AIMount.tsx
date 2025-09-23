'use client';

import { useEffect, useState } from 'react';

/**
 * Monta um botão "Editar com IA (grátis)" abaixo do preview (host="#ai-under-preview"),
 * ouvindo o <input type="file" data-ai="photo"> existente.
 * Mostra estado de trabalho + progresso suavizado (UI) sem depender do modal.
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
  const [file, setFile] = useState<File | null>(null);
  const [hostEl, setHostEl] = useState<HTMLElement | null>(null);
  const [inputEl, setInputEl] = useState<HTMLInputElement | null>(null);

  // Estados brutos vindos do modal
  const [working, setWorking] = useState(false);
  const [rawProgress, setRawProgress] = useState(0);

  // Progresso suavizado para UI
  const [uiProgress, setUiProgress] = useState(0);

  // Smoothing: evita saltos (mantém <= 97% até finalize)
  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    function step(now: number) {
      const dt = Math.max(0, now - last);
      last = now;

      const cap = working ? 97 : 100;
      const target = Math.min(rawProgress, cap);

      setUiProgress((prev) => {
        // aceleração suave + piso mínimo de avanço
        const diff = target - prev;
        if (diff <= 0) return prev;

        const speed = Math.max(0.15, Math.min(0.35, diff / 25)); // 15% ~ 35% do gap
        const advance = diff * speed * (dt / 100); // normaliza no tempo
        return Math.min(target, prev + advance);
      });

      // quando terminar (working=false), corre ao 100 e depois zera
      if (!working && uiProgress >= 99.5) {
        setUiProgress(100);
        cancelAnimationFrame(raf);
        return;
      }
      raf = requestAnimationFrame(step);
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [working, rawProgress]);

  // Ouve eventos do modal
  useEffect(() => {
    function onWorking(e: Event) {
      const v = Boolean((e as CustomEvent).detail);
      setWorking(v);
      if (v) {
        setRawProgress(0);
        setUiProgress(0);
      } else {
        // força corrida final ao 100%
        setRawProgress(100);
      }
    }
    function onProgress(e: Event) {
      const pct = Number((e as CustomEvent).detail || 0);
      // Normaliza para 0..100
      const clamped = Math.max(0, Math.min(100, pct));
      setRawProgress(clamped);
    }
    window.addEventListener('ai-edit:working', onWorking);
    window.addEventListener('ai-edit:progress', onProgress);
    return () => {
      window.removeEventListener('ai-edit:working', onWorking);
      window.removeEventListener('ai-edit:progress', onProgress);
    };
  }, []);

  // Encontra host e input
  useEffect(() => {
    const host = document.querySelector<HTMLElement>(hostSelector) ?? null;
    const input =
      document.querySelector<HTMLInputElement>(inputSelector) ??
      document.querySelector<HTMLInputElement>('input[type="file"]');
    setHostEl(host);
    setInputEl(input || null);
    if (!input) return;

    const onChange = () => setFile(input.files?.[0] ?? null);
    input.addEventListener('change', onChange);
    return () => input.removeEventListener('change', onChange);
  }, [hostSelector, inputSelector]);

  // Renderiza/atualiza o botão dentro do host
  useEffect(() => {
    if (!hostEl) return;
    hostEl.innerHTML = '';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className =
      'inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 ' +
      'text-xs font-semibold text-[var(--primary-foreground)] shadow-sm hover:opacity-95 transition';

    function updateContent() {
      if (!working) {
        btn.innerHTML = `
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 21l14-14M16 5l3 3M2 22l5-2-3-3-2 5z"></path>
          </svg>
          <span>Editar com IA (grátis)</span>
        `;
      } else {
        const pct = Math.round(uiProgress);
        btn.innerHTML = `
          <svg class="h-3.5 w-3.5" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="15" stroke="currentColor" stroke-width="3" opacity="0.25"/>
            <path d="${describeArc(18,18,15,0,3.6*pct)}" stroke="currentColor" stroke-width="3" fill="none"/>
          </svg>
          <span>${pct < 100 ? `Editando… ${pct}%` : 'Finalizando…'}</span>
        `;
      }
    }

    btn.addEventListener('click', () => {
      if (!file) {
        // micro-feedback
        btn.animate(
          [{ transform: 'translateX(0)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(3px)' }, { transform: 'translateX(0)' }],
          { duration: 180 }
        );
        return;
      }
      // abre o modal via evento público que seu modal já escuta
      window.dispatchEvent(new CustomEvent('ai-edit:open', { detail: { file } }));
    });

    updateContent();
    hostEl.appendChild(btn);

    const tick = setInterval(updateContent, 120);
    return () => clearInterval(tick);

    // --- helpers ---
    function polarToCartesian(cx: number, cy: number, r: number, angleInDegrees: number) {
      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
      return { x: cx + r * Math.cos(angleInRadians), y: cy + r * Math.sin(angleInRadians) };
    }
    function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
      const start = polarToCartesian(cx, cy, r, endAngle);
      const end = polarToCartesian(cx, cy, r, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
      return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
    }
  }, [hostEl, file, working, uiProgress]);

  // Quando modal aplicar o blob editado, este componente só repassa para a página (preview)
  useEffect(() => {
    function onApplied(e: Event) {
      const blob = (e as CustomEvent).detail as Blob;
      if (blob && onReplace) onReplace(blob);
    }
    window.addEventListener('ai-edit:applied', onApplied);
    return () => window.removeEventListener('ai-edit:applied', onApplied);
  }, [onReplace]);

  return null;
}
