"use client";

import AIMagicBar from "@/components/ai/AIMagicBar";

/**
 * Monta a barra de IA ao lado do input de foto já existente em /anunciar
 * Sem quebrar layout. Ajuste o anchorSelector se o id/atributo do seu input for diferente.
 */
export default function AIMount() {
  return (
    <AIMagicBar
      anchorSelector='[data-ai="photo"], #foto, input[type="file"]'
      onReplaceFile={() => {
        // no-op; se você atualiza preview em tempo real, ele continua igual.
      }}
    />
  );
}
