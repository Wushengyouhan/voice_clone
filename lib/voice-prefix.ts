/**
 * CosyVoice 音色 prefix：仅数字和小写字母，长度小于 10。
 */
export function buildVoicePrefix(displayName: string): string {
  const cleaned = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 5);
  const base = cleaned.length > 0 ? cleaned : "v";
  const rand = Math.random().toString(36).slice(2, 6);
  const prefix = `${base}${rand}`;
  return prefix.slice(0, 9);
}
