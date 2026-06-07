FROM node:20-alpine AS deps
WORKDIR /repo
RUN apk add --no-cache openssl
COPY api/package*.json ./api/
COPY api/prisma ./api/prisma/
RUN cd api && npm ci
RUN cd api && npx prisma generate

FROM node:20-alpine AS builder
WORKDIR /repo
RUN apk add --no-cache openssl
COPY --from=deps /repo/api/node_modules ./api/node_modules
COPY api ./api
RUN cd api && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl wget
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /repo/api/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/api/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/api/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /repo/api/public ./public

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
