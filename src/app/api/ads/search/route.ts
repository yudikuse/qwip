// src/app/api/ads/search/route.ts
import { NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

type Row = {
  id: string;
  title: string;
  description: string | null;
  priceCents: number;
  city: string;
  uf: string;
  imageUrl: string | null;
  createdAt: Date;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);

    const q = (url.searchParams.get("q") ?? "").trim();
    const city = (url.searchParams.get("city") ?? "").trim();
    const uf = (url.searchParams.get("uf") ?? "").trim();
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Math.min(50, Math.max(1, Number(url.searchParams.get("pageSize") ?? "12")));

    const offset = Math.max(0, (Number.isFinite(page) ? page : 1) - 1) * pageSize;
    const limit = pageSize;

    // Condições dinâmicas
    const conds: Prisma.Sql[] = [];
    if (q) {
      conds.push(
        Prisma.sql`(a."title" ILIKE ${"%" + q + "%"} OR a."description" ILIKE ${"%" + q + "%"})`
      );
    }
    if (city) conds.push(Prisma.sql`a."city" = ${city}`);
    if (uf) conds.push(Prisma.sql`a."uf" = ${uf}`);

    // ❇️ Aqui está a correção: separador como STRING
    const whereFrag =
      conds.length > 0 ? Prisma.sql`WHERE ${Prisma.join(conds, " AND ")}` : Prisma.sql``;

    const query = Prisma.sql<Row[]>`
      SELECT
        a."id",
        a."title",
        a."description",
        a."priceCents",
        a."city",
        a."uf",
        a."imageUrl",
        a."createdAt"
      FROM "Ad" a
      ${whereFrag}
      ORDER BY a."createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const rows = await prisma.$queryRaw<Row[]>(query);

    return NextResponse.json({
      ok: true,
      items: rows,
      page,
      pageSize,
      count: rows.length,
    });
  } catch (err) {
    console.error("[/api/ads/search][GET] error:", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
