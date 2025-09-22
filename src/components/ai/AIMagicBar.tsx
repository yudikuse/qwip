"use client";

import { useEffect, useRef, useState } from "react";
import ImageEditorModal from "./ImageEditorModal";

/**
 * Renderiza um botão "Editar com IA (grátis)" colado ao seu <input type="file">.
 * - anchorSelector: CSS para localizar o input de foto já existente (ex.: '#foto' ou '[data-ai="photo"]').
 * - onReplaceFile: callback que recebe o Blob final para você substituir a imagem no seu form/state.
 */
export default function AIMagicBar({
  anchorSelector,
  onReplaceFile,
}: {
  anchorSelector: string;
  onReplaceFile: (blob: Blob) => void;
}) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File>();
  const containerRef = useRef<HTMLDivElement>(null);

  // "engancha" no input já existente sem quebrar layout
  useEffect(() => {
    const input = document.querySelector<HTMLInputElement>(anchorSelector) || document.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) return;

    // cria um pequeno container visual logo abaixo do input
    const host = document.createElement("div");
    host.className = "mt-2";
    input.insertAdjacentElement("afterend", host);
    containerRef.current = host;

    // listener p/ pegar o último arquivo selecionado
    const onChange = () => {
      const f = input.files?.[0];
      if (f) setFile(f);
    };
    input.addEventListener("change", onChange);
    return () => {
      input.removeEventListener("change", onChange);
      host.remove();
    };
  }, [anchorSelector]);

  function applyBlobToFileInput(blob: Blob) {
    // cria um File novo e injeta no input original
    const original = document.querySelector<HTMLInputElement>(anchorSelector) || document.querySelector<HTMLInputElement>('input[type="file"]');
    if (!original) return;
    const edited = new File([blob], "foto-editada.png", { type: "image/png", lastModified: Date.now() });
    const dt = new DataTransfer();
    dt.items.add(edited);
    original.files = dt.files; // substitui o arquivo no input
    onReplaceFile(blob);
  }

  // render da "barra" perto do input original
  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = "";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-black font-semibold hover:bg-emerald-400";
    btn.textContent = "Editar com IA (grátis)";
    btn.onclick = () => setOpen(true);
    containerRef.current.appendChild(btn);

    const hint = document.createElement("p");
    hint.className = "text-xs text-zinc-500 mt-1";
    hint.textContent = "Remoção de fundo + ajustes rápidos direto no navegador.";
    containerRef.current.appendChild(hint);
  }, [containerRef.current, file]);

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
