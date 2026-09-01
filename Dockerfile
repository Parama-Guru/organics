# syntax=docker/dockerfile:1

# ---- base -------------------------------------------------------------------
FROM node:22-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
# Prisma's query engine links against OpenSSL 3 on Debian.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- dependencies -----------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- migrator ---------------------------------------------------------------
# The Prisma CLI pulls in 33 packages (@prisma/config alone brings c12, effect,
# empathic...). Copying hand-picked directories out of the build stage misses
# them and fails at runtime with MODULE_NOT_FOUND, so npm resolves the closure
# here in an empty project instead. The version is read from package.json so the
# CLI can never drift from the generated client.
FROM base AS migrator
WORKDIR /version
COPY package.json ./
RUN node -p "require('./package.json').devDependencies.prisma" > /tmp/prisma-version
WORKDIR /migrator
RUN npm init -y > /dev/null \
    && npm install --no-audit --no-fund "prisma@$(cat /tmp/prisma-version)"

# ---- build ------------------------------------------------------------------
FROM base AS builder

# NEXT_PUBLIC_* values are inlined at build time, so they must arrive as build args.
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_CURRENCY=INR
ARG NEXT_PUBLIC_LOCALE=en-IN

# DATABASE_URL only has to be syntactically valid here; `prisma generate` never connects.
ENV NODE_ENV=production \
    BUILD_STANDALONE=true \
    NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_CURRENCY=$NEXT_PUBLIC_CURRENCY \
    NEXT_PUBLIC_LOCALE=$NEXT_PUBLIC_LOCALE \
    DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runtime ----------------------------------------------------------------
FROM base AS runner

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

# The standalone bundle already contains the traced Prisma client and Linux engine.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Schema, migrations and a self-contained Prisma CLI, so `migrate deploy` can run
# on startup. Kept out of ./node_modules so it cannot shadow the traced client
# that the standalone bundle ships.
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=migrator --chown=nextjs:nodejs /migrator/node_modules ./.migrate/node_modules

# The config is read at runtime from ./conf, relative to the working directory.
# conf/config.yaml is excluded by .dockerignore, so this is the template only:
# every secret in it resolves from an injected environment variable.
COPY --from=builder --chown=nextjs:nodejs /app/conf ./conf

COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
