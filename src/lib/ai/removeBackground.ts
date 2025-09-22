"use client";

/**
 * Chamamos @imgly/background-removal via import dinâmico para ficar compatível
 * com diferentes formatos de build (ESM/CJS) e variações de types.
 * - Tenta usar module.default
 * - Se não houver, tenta module.removeBackground
 * - Se ainda não houver, tenta chamar o módulo em si como função
 */
export async function aiRemoveBackground(
  input: Blob | ArrayBuffer | Uint8Array | string | URL,
  _onProgress?: (current: number, total: number) => void
): Promise<Blob> {
  // Import dinâmico evita problemas de tipos “não chamável”
  const mod = await import("@imgly/background-removal");

  // Seleciona o export correto em tempo de execução
  const fn =
    (mod as any).default ??
    (mod as any).removeBackground ??
    (mod as any);

  if (typeof fn !== "function") {
    throw new Error(
      "Falha ao carregar @imgly/background-removal: export não é função. " +
      "Verifique a versão instalada ou tente limpar o cache do Vercel."
    );
  }

  const out: Blob = await fn(input);
  return out;
}
