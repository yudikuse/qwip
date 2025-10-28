// src/lib/ai/EnhanceService.ts
export type EnhanceMode = 'realce' | 'face' | 'paisagem';

export async function enhanceImageViaAPI(
  mode: EnhanceMode,
  imageDataUrl: string,
  onProgress?: (p: number) => void
): Promise<Blob> {
  // Progress fake suave (0→85%) enquanto o servidor processa
  let soft = 5;
  const t = setInterval(() => {
    soft = Math.min(soft + 3, 85);
    onProgress?.(soft);
  }, 200);

  try {
    const res = await fetch('/api/ai/enhance', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode, imageDataUrl }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(txt || `Falha HTTP ${res.status}`);
    }

    const buf = await res.arrayBuffer();
    onProgress?.(95);
    return new Blob([buf], { type: 'image/png' });
  } finally {
    clearInterval(t);
    onProgress?.(100);
  }
}
