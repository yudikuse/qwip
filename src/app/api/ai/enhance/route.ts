// src/app/api/ai/enhance/route.ts
import { NextRequest, NextResponse } from 'next/server';

type Mode = 'realce' | 'face' | 'paisagem';

function dataUrlToBuffer(dataUrl: string): Buffer {
  const [, meta, b64] = dataUrl.match(/^data:(.*?);base64,(.+)$/) || [];
  if (!meta || !b64) throw new Error('dataURL inválida');
  return Buffer.from(b64, 'base64');
}

async function callReplicate(mode: Mode, imageDataUrl: string): Promise<Uint8Array> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error('REPLICATE_API_TOKEN não configurado');

  // Pequeno roteamento de modelos por modo (simples e eficaz)
  // - face: CodeFormer (restauração de rosto)
  // - realce/paisagem: Real-ESRGAN (upscale + nitidez)
  // Obs.: os owners/modelos podem ser atualizados depois — começa assim para MVP.
  const models: Record<Mode, { model: string; version?: string; input: any }> = {
    face: {
      model: 'sczhou/codeformer',
      input: { upscale: 1, background_enhance: true, face_upsample: true },
    },
    realce: {
      model: 'xinntao/realesrgan',
      input: { scale: 2, face_enhance: false },
    },
    paisagem: {
      model: 'xinntao/realesrgan',
      input: { scale: 2, face_enhance: false },
    },
  };

  const buf = dataUrlToBuffer(imageDataUrl);
  const base64 = Buffer.from(buf).toString('base64');
  const entry = models[mode];

  // Chamada direta à Replicate (v3) – retorno binário em base64
  const res = await fetch('https://api.replicate.com/v1/models/' + entry.model + '/predictions', {
    method: 'POST',
    headers: {
      Authorization: `Token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: { ...entry.input, image: `data:image/png;base64,${base64}` },
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Replicate HTTP ${res.status}: ${txt || 'erro'}`);
  }

  const job = await res.json();
  // Poll simples até finalizar (MVP)
  let prediction = job;
  let guard = 0;
  while (prediction.status === 'starting' || prediction.status === 'processing') {
    await new Promise((r) => setTimeout(r, 750));
    const r2 = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
      headers: { Authorization: `Token ${token}` },
    });
    prediction = await r2.json();
    if (++guard > 60) throw new Error('Timeout no processamento');
  }

  if (prediction.status !== 'succeeded') {
    throw new Error(`Falha Replicate: ${prediction.status}`);
  }

  // A Replicate costuma retornar URL(s). Fazemos o download do primeiro resultado.
  const outUrl: string = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  const bin = await fetch(outUrl);
  const arr = new Uint8Array(await bin.arrayBuffer());
  return arr;
}

export async function POST(req: NextRequest) {
  try {
    const { mode, imageDataUrl } = (await req.json()) as { mode: Mode; imageDataUrl: string };
    if (!mode || !imageDataUrl) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 });
    }

    let bytes: Uint8Array;

    if (process.env.REPLICATE_API_TOKEN) {
      bytes = await callReplicate(mode, imageDataUrl);
    } else {
      // Fallback sem custo: devolve a própria imagem (não quebra a UX enquanto configuramos chave)
      bytes = new Uint8Array(dataUrlToBuffer(imageDataUrl));
    }

    return new NextResponse(
  new Blob([bytes], { type: 'image/png' }),
  {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro interno' }, { status: 500 });
  }
}
