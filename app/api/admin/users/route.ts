import { NextResponse } from "next/server";
import { db } from "@/lib/db/db";
import { user as userTable } from "@/lib/db/schema";
import { desc, ilike, or, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/require-admin";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? String(DEFAULT_PAGE_SIZE), 10))
  );
  const search = searchParams.get("search")?.trim() ?? "";

  const offset = page * pageSize;
  const pattern = search ? `%${search}%` : null;
  const whereClause = pattern
    ? or(
        ilike(userTable.email, pattern),
        ilike(userTable.name, pattern)
      )
    : undefined;

  const [users, countResult] = await Promise.all([
    db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        image: userTable.image,
        role: userTable.role,
        banned: userTable.banned,
        banReason: userTable.banReason,
        banExpires: userTable.banExpires,
        createdAt: userTable.createdAt,
      })
      .from(userTable)
      .where(whereClause)
      .orderBy(desc(userTable.createdAt))
      .limit(pageSize)
      .offset(offset),
    whereClause
      ? db
          .select({ count: sql<number>`count(*)::int` })
          .from(userTable)
          .where(whereClause)
      : db.select({ count: sql<number>`count(*)::int` }).from(userTable),
  ]);

  const total = countResult[0]?.count ?? 0;

  return NextResponse.json({
    users: users.map((u) => ({
      ...u,
      createdAt: u.createdAt.toISOString(),
      banExpires: u.banExpires?.toISOString() ?? null,
    })),
    total,
    page,
    pageSize,
  });
}
