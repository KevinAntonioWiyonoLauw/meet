# ---- deps ----
FROM oven/bun:1.4.2 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---- build ----
FROM deps AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build

# ---- runtime ----
FROM oven/bun:1.4.2 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV DB_PATH=/data/meet.db

# mkdir as root, world-writable so the named volume is writable by the app user
RUN mkdir -p /data && chmod 777 /data

COPY --from=build --chown=1000:1000 /app/public ./public
COPY --from=build --chown=1000:1000 /app/.next/standalone ./
COPY --from=build --chown=1000:1000 /app/.next/static ./.next/static

USER 1000

EXPOSE 3000
CMD ["bun", "server.js"]