"use client";

import { useEffect, useState } from "react";
import ImageEditorModal from "./ImageEditorModal";

/**
 * Renderiza um botão "Editar com IA (grátis)" no hostSelector (ex.: abaixo do preview),
 * mas observa o arquivo do inputSelector (seu <input type="file"> existente).
 *
 * - inputSelector: CSS do input de foto (ex.: '[data-ai="photo"]')
 * - hostSelector:  CSS do container onde o botão deve aparecer (ex.: '#ai-under-preview')
 * - onReplaceFile: callback que recebe o Blob editado (para atualizar preview/estado)
 */
export default function AIMagicBar({
  inputSelector,
  hostSelector,
  onReplaceFile,
}: {
  inputSelector: string;
  hostSelector: string;
  onReplaceFile: (blob: Blob) => void;
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File>();
  const [hostEl, setHostEl] = useState<HTMLDivElement | null>(null);
  const [inputEl, setInputEl] = useState<HTMLInputElement | null>(null);

  // estados para UI do botão
  const [working, setWorking] = useState(false);
  const [progress, setProgress] = useState<number>(0);

  // escuta eventos emitidos pelo modal (working/progress)
  useEffect(() => {
    const onWorking = (e: Event) => {
      const b = (e as CustomEvent).detail === true;
      setWorking(b);
      if (!b) setProgress(0);
    };
    const onProgress = (e: Event) => {
      const pct = Number((e as CustomEvent).detail || 0);
      setProgress(Number.isFinite(pct) ? pct : 0);
    };
    window.addEventListener("ai-edit:working", onWorking);
    window.addEventListener("ai-edit:progress", onProgress);
    return () => {
      window.removeEventListener("ai-edit:working", onWorking);
      window.removeEventListener("ai-edit:progress", onProgress);
    };
  }, []);

  // localiza elementos (host e input)
  useEffect(() => {
    const input =
      document.querySelector<HTMLInputElement>(inputSelector) ||
      document.querySelector<HTMLInputElement>('input[type="file"]');
    setInputEl(input || null);

    const host =
      document.querySelector<HTMLDivElement>(hostSelector) ||
      (input
        ? (() => {
            const div = document.createElement("div");
            div.className = "mt-2";
            input.insertAdjacentElement("afterend", div);
            return div;
          })()
        : null);

    setHostEl(host || null);

    return () => {
      if (host && !document.querySelector(hostSelector) && host.parentElement) {
        host.remove();
      }
    };
  }, [inputSelector, hostSelector]);

  // observa mudanças no input pra capturar o File selecionado
  useEffect(() => {
    if (!inputEl) return;
    const onChange = () => {
      const f = inputEl.files?.[0];
      if (f) setFile(f);
    };
    // inicializa com o arquivo já presente (se houver)
    if (inputEl.files?.[0]) setFile(inputEl.files[0]);

    inputEl.addEventListener("change", onChange);
    return () => inputEl.removeEventListener("change", onChange);
  }, [inputEl]);

  // injeta botão compacto com ícone / loader (re-renderiza quando working/progress mudam)
  useEffect(() => {
    if (!hostEl) return;
    hostEl.innerHTML = "";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "inline-flex items-center gap-2 rounded-lg bg-emerald-500/95 px-2.5 py-1.5 " +
      "text-xs font-semibold text-black hover:bg-emerald-400 shadow-sm";

    const renderContent = () => {
      if (working) {
        btn.innerHTML = `
          <svg class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4z"></path>
          </svg>
          <span>Editando… ${progress}%</span>
        `;
      } else {
        btn.innerHTML = `
          <svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 21l14-14M16 5l3 3M2 22l5-2-3-3-2 5z"></path>
          </svg>
          <span>Editar com IA (grátis)</span>
        `;
      }
    };

    renderContent();

    btn.onclick = () => {
      if (!file) {
        btn.animate(
          [
            { transform: "translateX(0)" },
            { transform: "translateX(-3px)" },
            { transform: "translateX(3px)" },
            { transform: "translateX(0)" },
          ],
          { duration: 180 }
        );
        return;
      }
      setOpen(true);
    };

    hostEl.appendChild(btn);

    // dica menor
    const hint = document.createElement("p");
    hint.className = "text-[10px] text-zinc-500 mt-1";
    hint.textContent = "Remove fundo + ajustes rápidos no navegador.";
    hostEl.appendChild(hint);

    // re-renderiza o conteúdo quando mudar estado (efeito é reexecutado porque depende de working/progress)
  }, [hostEl, file, working, progress]);

  // aplica Blob editado no input e dispara callback p/ atualizar preview
  function applyBlobToFileInput(blob: Blob) {
    if (inputEl) {
      const edited = new File([blob], "foto-editada.png", {
        type: "image/png",
        lastModified: Date.now(),
      });
      const dt = new DataTransfer();
      dt.items.add(edited);
      inputEl.files = dt.files;
      inputEl.dispatchEvent(new Event("change", { bubbles: true }));
    }
    onReplaceFile(blob);
  }

  return (
    <>
      {file && (
        <ImageEditorModal
          file={file}
          open={open}
          onClose={() => setOpen(false)}
          onApply={(blob) => applyBlobToFileInput(blob)}
        />
      )}
    </>
  );
}
