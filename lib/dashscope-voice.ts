const CUSTOMIZATION_URL =
  "https://dashscope.aliyuncs.com/api/v1/services/audio/tts/customization";

export type CreateVoiceParams = {
  apiKey: string;
  sampleUrl: string;
  /** 仅小写字母与数字，长度小于 10 */
  prefix: string;
  /** 与后续合成所用模型一致，如 cosyvoice-v2 */
  targetModel: string;
};

export type CreateVoiceResult = {
  voiceId: string;
  requestId?: string;
};

export async function createVoiceEnrollment(
  params: CreateVoiceParams,
): Promise<CreateVoiceResult> {
  const res = await fetch(CUSTOMIZATION_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "voice-enrollment",
      input: {
        action: "create_voice",
        target_model: params.targetModel,
        prefix: params.prefix,
        url: params.sampleUrl,
      },
    }),
  });

  const data = (await res.json()) as {
    output?: { voice_id?: string };
    message?: string;
    code?: string;
    request_id?: string;
  };

  if (!res.ok) {
    throw new Error(
      data.message ?? data.code ?? `DashScope HTTP ${res.status}`,
    );
  }

  const voiceId = data.output?.voice_id;
  if (!voiceId) {
    throw new Error("DashScope 未返回 voice_id");
  }

  return { voiceId, requestId: data.request_id };
}
