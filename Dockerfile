# ============================================================================
# STAGE 1: Dependencies
# ============================================================================
# Instala apenas as dependências de produção
FROM node:20.18.1-alpine AS deps

# Instala apenas as ferramentas necessárias
RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copia apenas os arquivos de dependências
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Instala dependências de produção + Prisma CLI (necessário para gerar o client)
RUN npm ci --omit=dev && \
    npx prisma generate && \
    npm cache clean --force

# ============================================================================
# STAGE 2: Builder
# ============================================================================
# Compila o código TypeScript
FROM node:20.18.1-alpine AS builder

RUN apk add --no-cache libc6-compat openssl

WORKDIR /app

# Copia package files
COPY package.json package-lock.json* ./
COPY prisma ./prisma

# Instala TODAS as dependências (incluindo devDependencies para o build)
RUN npm ci && \
    npx prisma generate

# Copia código fonte e arquivos de configuração
COPY . .

# Build da aplicação
RUN npm run build && \
    npm cache clean --force

# ============================================================================
# STAGE 3: Runner (Imagem Final)
# ============================================================================
# Imagem mínima para rodar a aplicação
FROM node:20.18.1-alpine AS runner

# Instala apenas o OpenSSL (necessário para o Prisma)
RUN apk add --no-cache openssl dumb-init && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app

# Copia apenas o necessário para produção
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

# Muda para usuário não-root (segurança)
USER nestjs

# Expõe a porta da aplicação
EXPOSE 3000

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Usa dumb-init para lidar com sinais corretamente
ENTRYPOINT ["dumb-init", "--"]

# Comando para iniciar a aplicação
CMD ["node", "dist/src/main.js"]
