"use client";

import { useEffect, useState } from "react";
import ImageEditorModal from "./ImageEditorModal";

/**
 * Renderiza um botão "Editar com IA (grátis)" no hostSelector (ex.: abaixo do preview),
 * mas observa o arquivo do inputSelector (seu <input type="file"> existente).
 *
 * - inputSelector: CSS do input de foto (ex.: '[data-ai="photo"]')
 * - hostSelector:  CSS de onde o botão deve aparecer (ex.: '#ai-under-preview')
 * - onReplaceFile: callback chamado com o Blob editado (para atualizar o preview)
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

  // localiza elementos (host e input)
  useEffect(() => {
    const input =
      document.querySelector<HTMLInputElement>(inputSelector) ||
      document.querySelector<HTMLInputElement>('input[type="file"]');
    setInputEl(input || null);

    const host =
      document.querySelector<HTMLDivElement>(hostSelector) ||
      (input ? ((): HTMLDivElement => {
        const div = document.createElement("div");
        div.className = "mt-2";
        input.insertAdjacentElement("afterend", div);
        return div;
      })() : null);

    setHostEl(host || null);

    // cleanup se criarmos um host dinâmico
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
    inputEl.addEventListener("change", onChange);
    return () => inputEl.removeEventListener("change", onChange);
  }, [inputEl]);

  // injeta o botão e um hint no host
  useEffect(() => {
    if (!hostEl) return;
    hostEl.innerHTML = "";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-1.5 " +
      "text-xs font-semibold text-black hover:bg-emerald-400";
    btn.textContent = "Editar com IA (grátis)";
    btn.onclick = () => {
      if (!file) {
        // feedback simples se ainda não há arquivo
        btn.animate([{ transform: "translateX(0)" }, { transform: "translateX(-4px)" }, { transform: "translateX(4px)" }, { transform: "translateX(0)" }], { duration: 200 });
        return;
      }
      setOpen(true);
    };
    hostEl.appendChild(btn);

    const hint = document.createElement("p");
    hint.className = "text-[10px] text-zinc-500 mt-1";
    hint.textContent = "Remove fundo + ajustes rápidos no navegador.";
    hostEl.appendChild(hint);
  }, [hostEl, file]);

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
      // dispara 'change' para qualquer listener existente na página
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
