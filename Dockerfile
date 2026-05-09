# syntax=docker/dockerfile:1
# Next.js standalone 多阶段构建：体积小，运行时只带必要文件

# ---------- 基础镜像：Debian slim + OpenSSL（Prisma / Node 常用）----------
FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update -y \
  && apt-get install -y openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# ---------- 依赖层：只装 node_modules，方便利用构建缓存 ----------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---------- 构建层：Prisma generate + next build（产出 .next/standalone）----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# prisma generate 只要连接串格式合法即可，构建阶段不连真实库
ENV DATABASE_URL="mysql://build:build@127.0.0.1:3306/build"

RUN npx prisma generate
RUN npm run build

# ---------- 运行层：非 root，只拷贝 standalone 与静态资源 ----------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nextjs

# 静态资源
COPY --from=builder /app/public ./public

# Next standalone：server.js + 精简 node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma 生成代码（部分情况下 standalone 未全量打入，显式拷贝更稳）
COPY --from=builder --chown=nextjs:nodejs /app/lib/generated ./lib/generated

USER nextjs
EXPOSE 3000
# DATABASE_URL、OSS、百炼 Key 等在 docker run / K8s 里注入，勿写入镜像
CMD ["node", "server.js"]
