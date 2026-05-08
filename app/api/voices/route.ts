import { NextResponse } from "next/server";

import { createVoiceEnrollment } from "@/lib/dashscope-voice";
import { uploadVoiceSample } from "@/lib/oss";
import { prisma } from "@/lib/prisma";
import { buildVoicePrefix } from "@/lib/voice-prefix";

export const runtime = "nodejs";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "audio/wav",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
]);

function extFromMime(mime: string): string {
  if (mime.includes("wav")) return "wav";
  if (mime.includes("mpeg") || mime.includes("mp3")) return "mp3";
  if (mime.includes("mp4") || mime.includes("m4a")) return "m4a";
  return "bin";
}

export async function GET() {
  const rows = await prisma.voice.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      name: true,
      sampleUrl: true,
      voiceId: true,
      createdAt: true,
    },
  });
  return NextResponse.json({ voices: rows });
}

export async function POST(req: Request) {
  const apiKey = process.env.ALIYUN_DASHSCOPE_API_KEY;
  if (!apiKey?.trim()) {
    return NextResponse.json(
      { error: "未配置 ALIYUN_DASHSCOPE_API_KEY" },
      { status: 500 },
    );
  }

  const targetModel =
    process.env.COSYVOICE_TARGET_MODEL?.trim() || "cosyvoice-v2";

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "无法解析表单" }, { status: 400 });
  }

  const nameRaw = form.get("name");
  const name = typeof nameRaw === "string" ? nameRaw.trim() : "";
  if (!name || name.length > 64) {
    return NextResponse.json(
      { error: "请填写音色名称（1～64 字）" },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "请上传音频文件" }, { status: 400 });
  }

  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "音频大小需在 1 字节～10MB 之间" },
      { status: 400 },
    );
  }

  const mime = file.type || "application/octet-stream";
  if (!ALLOWED_TYPES.has(mime)) {
    return NextResponse.json(
      { error: "仅支持 WAV / MP3 / M4A 等常见音频格式" },
      { status: 400 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const ext = extFromMime(mime);
  const objectKey = `voice-samples/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  let sampleUrl: string;
  try {
    const up = await uploadVoiceSample(objectKey, buf, mime);
    sampleUrl = up.sampleUrl;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "OSS 上传失败";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const prefix = buildVoicePrefix(name);

  let voiceId: string;
  try {
    const out = await createVoiceEnrollment({
      apiKey,
      sampleUrl,
      prefix,
      targetModel,
    });
    voiceId = out.voiceId;
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "百炼创建音色失败，请检查音频与配置";
    return NextResponse.json({ error: msg, sampleUrl }, { status: 502 });
  }

  try {
    const voice = await prisma.voice.create({
      data: {
        name,
        sampleUrl,
        voiceId,
      },
    });
    return NextResponse.json({
      voice: {
        id: voice.id,
        name: voice.name,
        sampleUrl: voice.sampleUrl,
        voiceId: voice.voiceId,
        createdAt: voice.createdAt.toISOString(),
      },
    });
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "数据库写入失败（voiceId 可能已存在）";
    return NextResponse.json(
      { error: msg, voiceId, sampleUrl },
      { status: 409 },
    );
  }
}
