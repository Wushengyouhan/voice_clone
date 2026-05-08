"use client";

import { Download, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

type VoiceOption = {
  id: string;
  name: string;
  voiceId: string;
};

type SynthesisRow = {
  id: string;
  voiceId: string;
  voiceName: string;
  text: string;
  outputUrl: string | null;
  createdAt: string;
};

function iconActionClass(variant: "default" | "danger") {
  const base =
    "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border bg-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  if (variant === "danger") {
    return `${base} border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus-visible:ring-red-400 disabled:pointer-events-none disabled:opacity-40`;
  }
  return `${base} border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus-visible:ring-slate-400`;
}

function DownloadIconButton({
  href,
  downloadName,
  title,
}: {
  href: string;
  downloadName: string;
  title: string;
}) {
  return (
    <a
      href={href}
      download={downloadName}
      title={title}
      aria-label={title}
      className={iconActionClass("default")}
    >
      <Download className="size-4" strokeWidth={2} aria-hidden />
    </a>
  );
}

function DeleteIconButton({
  title,
  disabled,
  onClick,
}: {
  title: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={iconActionClass("danger")}
    >
      <Trash2 className="size-4" strokeWidth={2} aria-hidden />
    </button>
  );
}

export function VoiceSynthesizeForm() {
  const playersRootRef = useRef<HTMLDivElement>(null);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAudioUrl, setLastAudioUrl] = useState<string | null>(null);
  const [lastSynthesisId, setLastSynthesisId] = useState<string | null>(null);
  const [history, setHistory] = useState<SynthesisRow[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const pauseOtherAudios = useCallback(
    (current: HTMLAudioElement) => {
      const root = playersRootRef.current;
      if (!root) return;
      root.querySelectorAll("audio").forEach((node) => {
        if (node !== current) {
          node.pause();
        }
      });
    },
    [],
  );

  const loadVoices = useCallback(async () => {
    const res = await fetch("/api/voices");
    if (!res.ok) return;
    const data = (await res.json()) as { voices: VoiceOption[] };
    const list = data.voices ?? [];
    setVoices(list);
    setSelectedVoiceId((cur) => {
      if (cur && list.some((v) => v.id === cur)) return cur;
      return list[0]?.id ?? "";
    });
  }, []);

  const loadHistory = useCallback(async () => {
    const res = await fetch("/api/syntheses");
    if (!res.ok) return;
    const data = (await res.json()) as { syntheses: SynthesisRow[] };
    setHistory(data.syntheses ?? []);
  }, []);

  useEffect(() => {
    void loadVoices();
    void loadHistory();
  }, [loadVoices, loadHistory]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLastAudioUrl(null);
    setLastSynthesisId(null);

    if (!selectedVoiceId) {
      setError("请先创建至少一个音色");
      return;
    }
    if (!text.trim()) {
      setError("请输入要合成的文字");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId: selectedVoiceId,
          text: text.trim(),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        synthesis?: { id?: string; outputUrl?: string };
      };

      if (!res.ok) {
        setError(data.error ?? `请求失败 (${res.status})`);
        return;
      }

      const syn = data.synthesis;
      if (syn?.id) {
        setLastSynthesisId(syn.id);
      }
      const url = syn?.outputUrl;
      if (url) {
        setLastAudioUrl(url);
      }
      await loadHistory();
    } catch {
      setError("网络异常，请重试");
    } finally {
      setLoading(false);
    }
  }

  async function deleteSynthesis(id: string) {
    if (!window.confirm("确定删除这条合成记录？OSS 上的音频也会尽量一并删除。")) {
      return;
    }
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/syntheses/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? `删除失败 (${res.status})`);
        return;
      }
      if (lastSynthesisId === id) {
        setLastAudioUrl(null);
        setLastSynthesisId(null);
      }
      await loadHistory();
    } catch {
      setError("删除失败，请重试");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div ref={playersRootRef} className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label
            htmlFor="tts-voice"
            className="text-sm font-medium text-slate-700"
          >
            选择音色
          </label>
          <select
            id="tts-voice"
            value={selectedVoiceId}
            onChange={(e) => setSelectedVoiceId(e.target.value)}
            disabled={loading || voices.length === 0}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          >
            {voices.length === 0 ? (
              <option value="">暂无音色，请先在上方创建</option>
            ) : (
              voices.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                  {v.voiceId.length > 16
                    ? `（${v.voiceId.slice(0, 16)}…）`
                    : `（${v.voiceId}）`}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="tts-text"
            className="text-sm font-medium text-slate-700"
          >
            合成文本
          </label>
          <textarea
            id="tts-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="输入要转成语音的句子…"
            disabled={loading}
            maxLength={20000}
            className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
          />
          <p className="text-xs text-slate-500">
            单次不超过 2 万字符；模型与音色创建时一致（环境变量
            COSYVOICE_TARGET_MODEL）。
          </p>
        </div>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        {lastAudioUrl ? (
          <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-800">试听</p>
            <div className="flex items-center gap-2">
              <audio
                className="min-w-0 flex-1"
                controls
                src={lastAudioUrl}
                preload="metadata"
                onPlay={(e) => pauseOtherAudios(e.currentTarget)}
              />
              <DownloadIconButton
                href={lastAudioUrl}
                downloadName="tts-latest.mp3"
                title="下载本次合成 MP3"
              />
              {lastSynthesisId ? (
                <DeleteIconButton
                  title="删除本条合成记录"
                  disabled={deletingId === lastSynthesisId}
                  onClick={() => void deleteSynthesis(lastSynthesisId)}
                />
              ) : null}
            </div>
          </div>
        ) : null}

        <Button type="submit" disabled={loading || voices.length === 0}>
          {loading ? "合成中…" : "合成语音"}
        </Button>
      </form>

      <div className="border-t border-slate-200 pt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-sm font-medium text-slate-800">最近合成</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void loadHistory()}
          >
            刷新
          </Button>
        </div>
        {history.length === 0 ? (
          <p className="text-xs text-slate-500">暂无记录。</p>
        ) : (
          <ul className="max-h-56 space-y-2 overflow-y-auto text-xs">
            {history.map((h) => (
              <li
                key={h.id}
                className="rounded-md border border-slate-100 bg-slate-50 px-2 py-2"
              >
                <div className="font-medium text-slate-800">
                  {h.voiceName}
                  <span className="ml-2 font-normal text-slate-500">
                    {new Date(h.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-slate-600">{h.text}</p>
                {h.outputUrl ? (
                  <div className="mt-2 flex items-center gap-2">
                    <audio
                      className="h-9 min-w-0 flex-1"
                      controls
                      src={h.outputUrl}
                      preload="none"
                      onPlay={(e) => pauseOtherAudios(e.currentTarget)}
                    />
                    <DownloadIconButton
                      href={h.outputUrl}
                      downloadName={`tts-${h.id}.mp3`}
                      title="下载该条合成 MP3"
                    />
                    <DeleteIconButton
                      title="删除该条合成记录"
                      disabled={deletingId === h.id}
                      onClick={() => void deleteSynthesis(h.id)}
                    />
                  </div>
                ) : (
                  <div className="mt-2 flex justify-end">
                    <DeleteIconButton
                      title="删除该条合成记录"
                      disabled={deletingId === h.id}
                      onClick={() => void deleteSynthesis(h.id)}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
