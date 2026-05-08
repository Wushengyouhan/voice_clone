"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type VoiceRow = {
  id: string;
  name: string;
  sampleUrl: string;
  voiceId: string;
  createdAt: string;
};

export function VoiceCreateForm() {
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VoiceRow | null>(null);
  const [list, setList] = useState<VoiceRow[]>([]);

  const refreshList = useCallback(async () => {
    const res = await fetch("/api/voices");
    if (!res.ok) return;
    const data = (await res.json()) as { voices: VoiceRow[] };
    setList(data.voices ?? []);
  }, []);

  useEffect(() => {
    void refreshList();
  }, [refreshList]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!name.trim()) {
      setError("请填写音色名称");
      return;
    }
    if (!file) {
      setError("请选择音频文件");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.set("name", name.trim());
      fd.set("file", file);

      const res = await fetch("/api/voices", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as {
        error?: string;
        voice?: VoiceRow;
      };

      if (!res.ok) {
        setError(data.error ?? `请求失败 (${res.status})`);
        return;
      }
      if (data.voice) {
        setResult(data.voice);
        setName("");
        setFile(null);
        await refreshList();
      }
    } catch {
      setError("网络异常，请重试");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="voice-name"
            className="text-sm font-medium text-slate-700"
          >
            音色名称
          </label>
          <input
            id="voice-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：我的播客声线"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-slate-200 focus-visible:ring-2"
            disabled={loading}
            maxLength={64}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="voice-file"
            className="text-sm font-medium text-slate-700"
          >
            样本音频
          </label>
          <input
            id="voice-file"
            type="file"
            accept="audio/wav,audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/m4a,.wav,.mp3,.m4a"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
            disabled={loading}
          />
          <p className="text-xs text-slate-500">
            建议 10～20 秒清晰干声，WAV/MP3/M4A，最大 10MB；需公网可读的 OSS
            地址供百炼拉取。
          </p>
        </div>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        {result ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            <p className="font-medium">创建成功</p>
            <p className="mt-1 break-all">
              本地 id：<span className="font-mono">{result.id}</span>
            </p>
            <p className="mt-1 break-all">
              百炼 voice_id：
              <span className="font-mono">{result.voiceId}</span>
            </p>
          </div>
        ) : null}

        <Button type="submit" disabled={loading}>
          {loading ? "上传并创建中…" : "上传并创建音色"}
        </Button>
      </form>

      <div className="border-t border-slate-200 pt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-slate-800">最近音色</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refreshList()}
          >
            刷新列表
          </Button>
        </div>
        {list.length === 0 ? (
          <p className="text-xs text-slate-500">暂无记录，创建后在此显示。</p>
        ) : (
          <ul className="max-h-48 space-y-2 overflow-y-auto text-xs text-slate-700">
            {list.map((v) => (
              <li
                key={v.id}
                className="rounded-md border border-slate-100 bg-slate-50 px-2 py-1.5"
              >
                <span className="font-medium">{v.name}</span>
                <span className="ml-2 font-mono text-slate-500">
                  {v.voiceId}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
