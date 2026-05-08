const TTS_URL =
  "https://dashscope.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer";

export type SynthesizeParams = {
  apiKey: string;
  /** 须与创建音色时 COSYVOICE_TARGET_MODEL 一致 */
  model: string;
  /** 百炼侧音色 ID（create_voice 返回的 voice_id） */
  voice: string;
  text: string;
  format?: string;
  sampleRate?: number;
};

export type SynthesizeResult = {
  /** 官方结果 URL，约 24h 有效；业务侧应再转存 OSS */
  audioUrl: string;
  requestId?: string;
};

export async function synthesizeSpeech(
  params: SynthesizeParams,
): Promise<SynthesizeResult> {
  const res = await fetch(TTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      input: {
        text: params.text,
        voice: params.voice,
        format: params.format ?? "mp3",
        sample_rate: params.sampleRate ?? 24000,
      },
    }),
  });

  const raw = await res.text();
  let data: {
    output?: {
      audio?: { url?: string; data?: string };
      finish_reason?: string;
    };
    message?: string;
    code?: string;
    request_id?: string;
    error?: { message?: string; code?: string };
  };
  try {
    data = JSON.parse(raw) as typeof data;
  } catch {
    throw new Error(
      `百炼合成返回非 JSON（HTTP ${res.status}）：${raw.slice(0, 280)}`,
    );
  }

  const errMsg =
    (typeof data.message === "string" ? data.message : "") ||
    (typeof data.error?.message === "string" ? data.error.message : "") ||
    (typeof data.code === "string" ? data.code : "") ||
    undefined;

  if (!res.ok) {
    throw new Error(errMsg || `百炼合成 HTTP ${res.status}`);
  }

  const url = data.output?.audio?.url;
  if (url) {
    return { audioUrl: url, requestId: data.request_id };
  }

  const b64 = data.output?.audio?.data;
  if (typeof b64 === "string" && b64.length > 0) {
    throw new Error(
      "当前为非流式调用，预期返回 audio.url；收到 base64 数据，请检查接口参数。",
    );
  }

  throw new Error(
    errMsg
      ? `百炼: ${errMsg}`
      : `百炼未返回音频 URL。片段：${raw.slice(0, 240)}`,
  );
}
