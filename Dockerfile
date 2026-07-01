# Môi trường base
FROM node:18-alpine AS base

# --- Giai đoạn 1: Cài đặt dependencies ---
FROM base AS deps
# Cài đặt libc6-compat cho các thư viện liên kết động trên Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Sao chép package.json và cài đặt dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# --- Giai đoạn 2: Biên dịch ứng dụng (Build) ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Tắt dữ liệu telemetry của Next.js trong quá trình build (tùy chọn)
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# --- Giai đoạn 3: Chạy ứng dụng (Runner) ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Sao chép các tệp tĩnh và cấu hình
COPY --from=builder /app/public ./public

# Tối ưu hóa dung lượng build bằng cách tận dụng standalone output nếu được cấu hình, 
# hoặc copy toàn bộ thư mục build và dependencies để chạy qua npm start.
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Lệnh khởi chạy ứng dụng
CMD ["npm", "run", "start"]
