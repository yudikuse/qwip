"use client";

export async function fileToImageBitmap(file: File): Promise<ImageBitmap> {
  const arr = await file.arrayBuffer();
  return await createImageBitmap(new Blob([arr]));
}

export function drawImageToCanvas(
  img: CanvasImageSource,
  canvas: HTMLCanvasElement
) {
  const ctx = canvas.getContext("2d")!;
  const { width, height } = getFittedSize(img, 1080); // limita p/ performance
  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);
}

export function getFittedSize(
  img: CanvasImageSource,
  max: number
): { width: number; height: number } {
  // @ts-ignore
  const w = img.width as number;
  // @ts-ignore
  const h = img.height as number;
  if (w <= max && h <= max) return { width: w, height: h };
  const r = w > h ? max / w : max / h;
  return { width: Math.round(w * r), height: Math.round(h * r) };
}

export function applyBrightnessContrast(
  canvas: HTMLCanvasElement,
  brightness: number, // -100..100
  contrast: number // -100..100
) {
  const ctx = canvas.getContext("2d")!;
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  const b = (brightness / 100) * 255;
  const c = (contrast / 100) + 1; // escala
  const intercept = 128 * (1 - c);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp(c * data[i] + intercept + b);
    data[i + 1] = clamp(c * data[i + 1] + intercept + b);
    data[i + 2] = clamp(c * data[i + 2] + intercept + b);
  }
  ctx.putImageData(imgData, 0, 0);
}

function clamp(v: number) {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

export async function blobFromCanvas(canvas: HTMLCanvasElement): Promise<Blob> {
  return await new Promise<Blob>((resolve) =>
    canvas.toBlob((b) => resolve(b as Blob), "image/png", 0.92)
  );
}
