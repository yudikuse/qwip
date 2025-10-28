// src/app/api/ai/enhance/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

/**
 * Esta rota recebe uma imagem (multipart/form-data: campo "file")
 * e retorna um PNG. Se houver configuração futura do Replicate e você enviar
 * um `image_url` público via JSON, dá para plugar no bloco comentado.
 *
 * Hoje: fallback seguro (sem dependências): devolve o próprio arquivo como PNG.
 * - Corrige o erro anterior de tipo usando Blob/ArrayBuffer no NextResponse.
 */

function badRequest(msg: string) {
  return NextResponse.json({ ok: false, error: msg }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // 1) Se vier multipart (upload do <input type="file">)
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");

      if (!(file instanceof File)) {
        return badRequest("Envie a imagem no campo 'file' (multipart/form-data).");
      }

      // ⚠️ Aqui poderíamos validar mimetype/tamanho, se quiser
      const arrayBuffer = await file.arrayBuffer();
      const type = file.type || "image/png";

      // Fallback atual: devolve a própria imagem.
      // (Se quiser FORÇAR PNG, converta via Canvas no cliente antes de enviar,
      //  ou instale 'sharp' no servidor e converta aqui.)
      return new NextResponse(
        new Blob([arrayBuffer], { type }),
        {
          status: 200,
          headers: {
            "Content-Type": type,
            "Cache-Control": "no-store",
          },
        }
      );
    }

    // 2) Alternativamente, se quiser enviar JSON com uma URL pública da imagem
    //    (útil para integrar com Replicate — muitos modelos pedem URL)
    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({} as any));
      const imageUrl: string | undefined = body?.image_url;

      if (!imageUrl) {
        return badRequest("Envie multipart com 'file' OU JSON com 'image_url'.");
      }

      // === Gancho opcional para Replicate (apenas se quiser usar) ===
      // Deixe as variáveis no Vercel:
      // - REPLICATE_API_TOKEN
      // - REPLICATE_MODEL (ex.: "owner/model")
      // - REPLICATE_VERSION (hash da versão do modelo) OU use deployments
      const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
      const REPLICATE_MODEL = process.env.REPLICATE_MODEL;      // opcional
      const REPLICATE_VERSION = process.env.REPLICATE_VERSION;  // opcional
      const REPLICATE_DEPLOYMENT = process.env.REPLICATE_DEPLOYMENT; // opcional, form "owner/name"

      if (REPLICATE_API_TOKEN && (REPLICATE_DEPLOYMENT || (REPLICATE_MODEL && REPLICATE_VERSION))) {
        try {
          // Você pode usar 'predictions' com model+version,
          // ou 'deployments' se tiver um deployment configurado na sua conta.
          // Abaixo mostro as duas formas. Escolha uma e comente a outra.

          let apiUrl = "";
          let payload: any = {};

          if (REPLICATE_DEPLOYMENT) {
            // Forma A: Deployments (mais simples p/ produção)
            // POST https://api.replicate.com/v1/deployments/{owner}/{name}/predictions
            apiUrl = `https://api.replicate.com/v1/deployments/${REPLICATE_DEPLOYMENT}/predictions`;
            payload = {
              input: { image: imageUrl },
            };
          } else {
            // Forma B: Models + Version
            // POST https://api.replicate.com/v1/predictions
            apiUrl = "https://api.replicate.com/v1/predictions";
            payload = {
              version: REPLICATE_VERSION,
              input: { image: imageUrl },
              model: REPLICATE_MODEL, // alguns clients nem exigem esta key, mas deixo por clareza
            };
          }

          const start = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Authorization": `Token ${REPLICATE_API_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!start.ok) {
            const msg = await start.text();
            console.warn("[replicate] start failed:", msg);
            // Fallback: baixa a imagem original e devolve como PNG
            const orig = await fetch(imageUrl);
            const ab = await orig.arrayBuffer();
            return new NextResponse(new Blob([ab], { type: "image/png" }), {
              status: 200,
              headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
            });
          }

          const started = await start.json();
          const pollUrl: string = started?.urls?.get;

          // Poll simples até terminar (ou você pode usar webhooks do Replicate)
          let outputUrl: string | null = null;
          for (let i = 0; i < 40; i++) { // ~40 tentativas
            await new Promise((r) => setTimeout(r, 1500));
            const poll = await fetch(pollUrl, {
              headers: { "Authorization": `Token ${REPLICATE_API_TOKEN}` },
            });
            const data = await poll.json();

            if (data?.status === "succeeded") {
              // Alguns modelos retornam array de URLs; outros, uma string
              const out = data?.output;
              if (Array.isArray(out)) {
                outputUrl = out[out.length - 1] || null;
              } else if (typeof out === "string") {
                outputUrl = out;
              } else if (out?.image) {
                outputUrl = out.image;
              }
              break;
            }
            if (data?.status === "failed" || data?.status === "canceled") {
              console.warn("[replicate] failed/canceled:", data?.error || data);
              break;
            }
          }

          if (outputUrl) {
            const resp = await fetch(outputUrl);
            const ab = await resp.arrayBuffer();
            return new NextResponse(new Blob([ab], { type: "image/png" }), {
              status: 200,
              headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
            });
          }

          // Se não saiu nada do Replicate, devolve original como fallback
          const orig = await fetch(imageUrl);
          const ab = await orig.arrayBuffer();
          return new NextResponse(new Blob([ab], { type: "image/png" }), {
            status: 200,
            headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
          });
        } catch (err) {
          console.error("[replicate] error:", err);
          // fallback para a imagem original
          const orig = await fetch(imageUrl);
          const ab = await orig.arrayBuffer();
          return new NextResponse(new Blob([ab], { type: "image/png" }), {
            status: 200,
            headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
          });
        }
      }

      // Sem token/modelo configurado: apenas retorna a imagem original
      const resp = await fetch(imageUrl);
      const ab = await resp.arrayBuffer();
      return new NextResponse(new Blob([ab], { type: "image/png" }), {
        status: 200,
        headers: { "Content-Type": "image/png", "Cache-Control": "no-store" },
      });
    }

    return badRequest("Content-Type inválido. Use multipart/form-data (file) ou JSON (image_url).");
  } catch (e) {
    console.error("[ai/enhance] error:", e);
    return NextResponse.json({ ok: false, error: "Falha ao processar imagem." }, { status: 500 });
  }
}
