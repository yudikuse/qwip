// src/lib/storage.ts
import { put, del } from '@vercel/blob';
import crypto from 'crypto';

type PutImageInput =
  | { base64: string }
  | { buffer: Buffer; mime?: string };

function fromBase64ToBuffer(b64: string): { buf: Buffer; mime?: string } {
  const m = b64.match(/^data:(.+?);base64,(.*)$/);
  if (m) {
    const mime = m[1];
    const payload = m[2];
    return { buf: Buffer.from(payload, 'base64'), mime };
  }
  return { buf: Buffer.from(b64, 'base64') };
}

function sniffMime(buf: Buffer, hint?: string): { mime: string; ext: string } {
  if (hint) {
    const h = hint.toLowerCase();
    if (h.includes('jpeg') || h.includes('jpg')) return { mime: 'image/jpeg', ext: 'jpg' };
    if (h.includes('png')) return { mime: 'image/png', ext: 'png' };
    if (h.includes('webp')) return { mime: 'image/webp', ext: 'webp' };
    if (h.includes('gif')) return { mime: 'image/gif', ext: 'gif' };
    if (h.includes('svg')) return { mime: 'image/svg+xml', ext: 'svg' };
  }
  // Magic numbers
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    return { mime: 'image/jpeg', ext: 'jpg' };
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  )
    return { mime: 'image/png', ext: 'png' };
  if (
    buf.length >= 12 &&
    buf.slice(0, 4).toString('ascii') === 'RIFF' &&
    buf.slice(8, 12).toString('ascii') === 'WEBP'
  )
    return { mime: 'image/webp', ext: 'webp' };
  if (
    buf.length >= 4 &&
    buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38
  )
    return { mime: 'image/gif', ext: 'gif' };
  if (buf.slice(0, 5).toString().toLowerCase().includes('<svg'))
    return { mime: 'image/svg+xml', ext: 'svg' };

  return { mime: 'application/octet-stream', ext: 'bin' };
}

export async function putImage(input: PutImageInput): Promise<{
  url: string;
  mime: string;
  sha256: string;
}> {
  let buf: Buffer;
  let hintedMime: string | undefined;

  if ('base64' in input) {
    const r = fromBase64ToBuffer(input.base64);
    buf = r.buf;
    hintedMime = r.mime;
  } else {
    buf = input.buffer;
    hintedMime = input.mime;
  }

  const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
  const { mime, ext } = sniffMime(buf, hintedMime);

  const pathname = `ads/${sha256}.${ext}`;

  const blob = await put(pathname, buf, {
    access: 'public',
    contentType: mime,
    addRandomSuffix: false, // queremos URL estável por hash
  });

  return { url: blob.url, mime, sha256 };
}

export async function deleteImage(url: string) {
  // Vercel Blob aceita deletar direto pela URL pública
  await del(url);
}
