# 1. Aşama: Bağımlılıkları Kur
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2. Aşama: Kodu Derle (Build)
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Environment variable'ları build aşamasında okuyabilmesi için
RUN npm run build

# 3. Aşama: Çalıştırma (Runner - Sadece gerekli dosyalar)
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

# Güvenlik için root olmayan kullanıcı oluştur
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Sadece standalone klasörünü ve statik dosyaları kopyala
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

# Standalone sunucuyu başlat
CMD ["node", "server.js"]