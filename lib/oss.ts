import OSS from "ali-oss";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing env: ${name}`);
  }
  return v;
}

export function createOssClient() {
  return new OSS({
    region: requireEnv("OSS_REGION"),
    accessKeyId: requireEnv("OSS_ACCESS_KEY_ID"),
    accessKeySecret: requireEnv("OSS_ACCESS_KEY_SECRET"),
    bucket: requireEnv("OSS_BUCKET"),
    endpoint: process.env.OSS_ENDPOINT?.replace(/^https?:\/\//, ""),
  });
}

/** 公网可直接访问的样本 URL（百炼 create_voice 要求 url 公网可读） */
export function publicObjectUrl(objectKey: string): string {
  const custom = process.env.OSS_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (custom) {
    return `${custom}/${objectKey}`;
  }
  const bucket = requireEnv("OSS_BUCKET");
  const region = requireEnv("OSS_REGION");
  return `https://${bucket}.${region}.aliyuncs.com/${objectKey}`;
}

export async function uploadVoiceSample(
  objectKey: string,
  body: Buffer,
  contentType: string,
): Promise<{ objectKey: string; sampleUrl: string }> {
  const client = createOssClient();
  await client.put(objectKey, body, {
    headers: { "Content-Type": contentType },
  });
  return { objectKey, sampleUrl: publicObjectUrl(objectKey) };
}
