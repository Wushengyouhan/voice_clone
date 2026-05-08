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

function putHeaders(contentType: string): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": contentType };
  const acl = process.env.OSS_OBJECT_ACL?.trim();
  if (acl && acl !== "private") {
    headers["x-oss-object-acl"] = acl;
  }
  return headers;
}

export async function uploadVoiceSample(
  objectKey: string,
  body: Buffer,
  contentType: string,
): Promise<{ objectKey: string; sampleUrl: string }> {
  const client = createOssClient();
  await client.put(objectKey, body, {
    headers: putHeaders(contentType),
  });
  return { objectKey, sampleUrl: publicObjectUrl(objectKey) };
}

/** 合成结果等二进制对象，键前缀建议 `tts-output/` */
export async function uploadBinaryToOss(
  objectKey: string,
  body: Buffer,
  contentType: string,
): Promise<{ sampleUrl: string }> {
  const client = createOssClient();
  await client.put(objectKey, body, {
    headers: putHeaders(contentType),
  });
  return { sampleUrl: publicObjectUrl(objectKey) };
}

/**
 * 从当前项目生成的公网 URL 反推 OSS object key；无法识别则返回 null（不删对象）。
 */
export function objectKeyFromPublicUrl(urlString: string): string | null {
  try {
    const u = new URL(urlString);
    const path = decodeURIComponent(u.pathname.replace(/^\//, ""));

    const customRaw = process.env.OSS_PUBLIC_BASE_URL?.trim();
    if (customRaw) {
      const custom = customRaw.replace(/\/$/, "");
      const base = new URL(
        custom.startsWith("http://") || custom.startsWith("https://")
          ? custom
          : `https://${custom}`,
      );
      if (u.origin !== base.origin) return null;
      const basePath = base.pathname.replace(/\/$/, "").replace(/^\//, "");
      if (!basePath) return path || null;
      if (!path.startsWith(`${basePath}/`) && path !== basePath) return null;
      const key =
        path === basePath ? "" : path.slice(basePath.length + 1);
      return key || null;
    }

    const bucket = process.env.OSS_BUCKET;
    const region = process.env.OSS_REGION;
    if (!bucket || !region) return null;
    if (u.hostname !== `${bucket}.${region}.aliyuncs.com`) return null;
    return path || null;
  } catch {
    return null;
  }
}

/** 删除由本服务托管的 OSS 对象（解析失败或删除失败时静默忽略） */
export async function deleteManagedOssObjectByUrl(
  publicUrl: string | null | undefined,
): Promise<void> {
  if (!publicUrl) return;
  const key = objectKeyFromPublicUrl(publicUrl);
  if (!key) return;
  try {
    const client = createOssClient();
    await client.delete(key);
  } catch {
    // 对象已不存在或非本桶 URL 等情况忽略
  }
}
