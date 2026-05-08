import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const rows = await prisma.synthesis.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
    include: {
      voice: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({
    syntheses: rows.map((s) => ({
      id: s.id,
      voiceId: s.voiceId,
      voiceName: s.voice.name,
      text: s.text,
      outputUrl: s.outputUrl,
      createdAt: s.createdAt.toISOString(),
    })),
  });
}
