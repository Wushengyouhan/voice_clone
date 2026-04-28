import { Button } from "@/components/ui/button";

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
          <article className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">1. 创建音色</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              上传音频样本，服务端会保存到 OSS 并调用阿里云接口训练音色。
            </p>
            <Button className="mt-5">开始上传样本</Button>
          </article>

          <article className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">2. 文本合成</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              选择已就绪音色，输入文本后进行语音合成，结果支持试听和下载。
            </p>
            <Button className="mt-5" variant="outline">
              开始文本转语音
            </Button>
          </article>
        </section>

        <section className="rounded-xl border border-dashed bg-white p-6">
          <h3 className="font-medium text-slate-900">下一步开发建议</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-600">
            <li>补齐上传 API、OSS 签名上传和音频格式校验。</li>
            <li>封装阿里云音色创建与合成 SDK 适配层。</li>
            <li>接入 Prisma + MySQL 持久化音色与任务状态。</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
