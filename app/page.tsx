import { VoiceCreateForm } from "@/components/voice-create-form";
import { VoiceSynthesizeForm } from "@/components/voice-synthesize-form";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <main className="mx-auto w-full max-w-5xl space-y-8">
        <header className="space-y-3">
          <p className="text-sm font-medium text-slate-500">Voice Clone Studio</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
            一站式音色创建与语音合成
          </h1>
          <p className="max-w-3xl text-slate-600">
            上传示例音频创建自定义音色，输入文本后快速合成语音，支持预览与下载。
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border bg-white p-6 shadow-sm md:col-span-2">
            <h2 className="text-xl font-semibold text-slate-900">1. 创建音色</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              上传音频样本，服务端会保存到 OSS 并调用百炼 CosyVoice
              创建音色，并写入数据库。
            </p>
            <div className="mt-6">
              <VoiceCreateForm />
            </div>
          </article>

          <article className="rounded-xl border bg-white p-6 shadow-sm md:col-span-2">
            <h2 className="text-xl font-semibold text-slate-900">2. 文本合成</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              选择已创建音色，输入文本；服务端调用百炼合成后转存 OSS，并写入数据库，支持试听与下载。
            </p>
            <div className="mt-6">
              <VoiceSynthesizeForm />
            </div>
          </article>
        </section>

        <section className="rounded-xl border border-dashed bg-white p-6">
          <h3 className="font-medium text-slate-900">后续可优化</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>OSS 样本改为预签名直传，减轻服务端带宽。</li>
            <li>合成排队、字数计费展示、音色状态（OK/训练中）校验。</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
