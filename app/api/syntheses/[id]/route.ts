import { NextResponse } from "next/server";

import { deleteManagedOssObjectByUrl } from "@/lib/oss";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "缺少 id" }, { status: 400 });
  }

  const row = await prisma.synthesis.findUnique({
    where: { id },
  });

  if (!row) {
    return NextResponse.json({ error: "记录不存在" }, { status: 404 });
  }

  await deleteManagedOssObjectByUrl(row.outputUrl);
  await prisma.synthesis.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
