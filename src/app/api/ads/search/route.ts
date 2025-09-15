// src/app/api/ads/search/route.ts
import { NextResponse } from "next/server";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") || "").trim();
    const uf = (searchParams.get("uf") || "").trim().toUpperCase();
    const city = (searchParams.get("city") || "").trim();

    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const offset = (page - 1) * limit;

    // WHERE dinâmico em fragments Sql
    const conds: Prisma.Sql[] = [Prisma.sql`a."expiresAt" > NOW()`];

    if (q) conds.push(Prisma.sql`(a."title" ILIKE ${"%" + q + "%"} OR a."description" ILIKE ${"%" + q + "%"})`);
    if (uf) conds.push(Prisma.sql`a."uf" = ${uf}`);
    if (city) conds.push(Prisma.sql`a."city" = ${city}`);

    // Se não houver nenhuma cond adicional além do expiresAt, ainda assim gera WHERE
    const whereFrag: Prisma.Sql =
      conds.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(conds, Prisma.sql` AND `)}`
        : Prisma.sql``;

    // SELECT principal — tudo dentro de Prisma.sql
    const selectSql = Prisma.sql`
      SELECT
        a."id",
        a."title",
        a."priceCents",
        a."city",
        a."uf",
        a."imageUrl"
      FROM "Ad" a
      ${whereFrag}
      ORDER BY a."createdAt" DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countSql = Prisma.sql`
      SELECT COUNT(*)::int AS total
      FROM "Ad" a
      ${whereFrag}
    `;

    const [items, countRows] = await Promise.all([
      prisma.$queryRaw<Array<{
        id: string;
        title: string;
        priceCents: number;
        city: string | null;
        uf: string | null;
        imageUrl: string | null;
      }>>(selectSql),
      prisma.$queryRaw<Array<{ total: number }>>(countSql),
    ]);

    const total = countRows?.[0]?.total ?? 0;

    return NextResponse.json({ items, total });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ items: [], total: 0 }, { status: 500 });
  }
}
