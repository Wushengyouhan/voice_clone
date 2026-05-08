import { NextResponse } from "next/server";

import { synthesizeSpeech } from "@/lib/dashscope-tts";
import { uploadBinaryToOss } from "@/lib/oss";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_TEXT = 20_000;

export async function POST(req: Request) {
  const apiKey = process.env.ALIYUN_DASHSCOPE_API_KEY;
  if (!apiKey?.trim()) {
    return NextResponse.json(
      { error: "未配置 ALIYUN_DASHSCOPE_API_KEY" },
      { status: 500 },
    );
  }

  const model =
    process.env.COSYVOICE_TARGET_MODEL?.trim() || "cosyvoice-v2";

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体须为 JSON" }, { status: 400 });
  }

  const o = body as { voiceId?: string; text?: string };
  const localVoiceId =
    typeof o.voiceId === "string" ? o.voiceId.trim() : "";
  const text = typeof o.text === "string" ? o.text.trim() : "";

  if (!localVoiceId) {
    return NextResponse.json(
      { error: "请选择音色（voiceId 为本地数据库 Voice.id）" },
      { status: 400 },
    );
  }
  if (!text) {
    return NextResponse.json({ error: "请输入待合成文本" }, { status: 400 });
  }
  if (text.length > MAX_TEXT) {
    return NextResponse.json(
      { error: `文本长度不能超过 ${MAX_TEXT} 字符` },
      { status: 400 },
    );
  }

  const voice = await prisma.voice.findUnique({
    where: { id: localVoiceId },
  });
  if (!voice) {
    return NextResponse.json({ error: "音色不存在" }, { status: 404 });
  }

  let dashUrl: string;
  try {
    const out = await synthesizeSpeech({
      apiKey,
      model,
      voice: voice.voiceId,
      text,
    });
    dashUrl = out.audioUrl;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "百炼合成失败";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  let audioBuf: Buffer;
  try {
    const audioRes = await fetch(dashUrl);
    if (!audioRes.ok) {
      throw new Error(`拉取临时音频失败 HTTP ${audioRes.status}`);
    }
    audioBuf = Buffer.from(await audioRes.arrayBuffer());
  } catch (e) {
    const msg = e instanceof Error ? e.message : "下载合成音频失败";
    return NextResponse.json(
      { error: msg, dashScopeAudioUrl: dashUrl },
      { status: 502 },
    );
  }

  const objectKey = `tts-output/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.mp3`;

  let outputUrl: string;
  try {
    const up = await uploadBinaryToOss(objectKey, audioBuf, "audio/mpeg");
    outputUrl = up.sampleUrl;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "OSS 上传失败";
    return NextResponse.json(
      { error: msg, dashScopeAudioUrl: dashUrl },
      { status: 502 },
    );
  }

  const synthesis = await prisma.synthesis.create({
    data: {
      voiceId: voice.id,
      text,
      outputUrl,
    },
  });

  return NextResponse.json({
    synthesis: {
      id: synthesis.id,
      voiceId: synthesis.voiceId,
      voiceName: voice.name,
      text: synthesis.text,
      outputUrl: synthesis.outputUrl,
      createdAt: synthesis.createdAt.toISOString(),
    },
  });
}
