// src/lib/storage.ts
import { put, del } from '@vercel/blob';
import crypto from 'crypto';

type PutImageInput =
  | { base64: string }                     // dataURL (ex.: "data:image/jpeg;base64,....") ou base64 puro
  | { buffer: Buffer; mime?: string };     // quando já vier em Buffer

export type StoredImage = {
  url: string;
  mime?: string;
  width?: number;
  height?: number;
  sha256?: string;
};

function parseBase64(input: string): { buffer: Buffer; mime?: string } {
  // Aceita "data:image/png;base64,AAAA" ou apenas "AAAA"
  const match = input.match(/^data:(.+?);base64,(.*)$/);
  if (match) {
    const [, mime, b64] = match;
    return { buffer: Buffer.from(b64, 'base64'), mime };
  }
  return { buffer: Buffer.from(input, 'base64') };
}

function sha256(buf: Buffer) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

/**
 * Salva a imagem no Vercel Blob e retorna URL + metadados básicos.
 * Observação: width/height são opcionais — você pode extrair dimensões depois se quiser.
 */
export async function putImage(input: PutImageInput): Promise<StoredImage> {
  const { buffer, mime: parsedMime } =
    'base64' in input ? parseBase64(input.base64) : { buffer: input.buffer, mime: input.mime };

  const hash = sha256(buffer);
  const mime = parsedMime ?? 'application/octet-stream';

  const objectName = `ads/${hash}`;

  const res = await put(objectName, buffer, {
    access: 'public',
    contentType: mime,
    addRandomSuffix: false, // chave estável por hash (dedupe natural)
    token: process.env.BLOB_READ_WRITE_TOKEN, // requerido em produção
  });

  return {
    url: res.url,
    mime,
    sha256: hash,
  };
}

/**
 * Remove um objeto do Vercel Blob a partir da URL.
 */
export async function deleteImage(url: string) {
  await del(url, {
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
}
