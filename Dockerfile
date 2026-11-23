FROM oven/bun:1

# cloudflared runs alongside the app in this same container, tunneling to
# localhost. Grab the static binary matching the image's architecture.
RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && arch="$(dpkg --print-architecture)" \
 && curl -fsSL -o /usr/local/bin/cloudflared \
      "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${arch}" \
 && chmod +x /usr/local/bin/cloudflared \
 && apt-get purge -y curl \
 && apt-get autoremove -y \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first so they're cached independently of source changes.
# The server statically bundles the frontend's source at runtime (see
# server/lib/elysia/index.ts), so both package trees need their deps installed
# and both directories need to stay siblings on disk (/app/server, /app/frontend).
COPY server/package.json server/bun.lock ./server/
COPY frontend/package.json frontend/bun.lock ./frontend/

# bun-plugin-tailwind declares a peerDependency on a package literally named
# "bun", which bun's installer resolves as a real npm package (bundling a
# duplicate ~100MB platform binary) rather than treating it as already
# satisfied by the Bun runtime itself. Omit peers; nothing imports it.
RUN cd server && bun install --frozen-lockfile --omit=peer
RUN cd frontend && bun install --frozen-lockfile --omit=peer

COPY server ./server
COPY frontend ./frontend

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

WORKDIR /app/server

ENV NODE_ENV=production \
    ELYISA_PORT=8080 \
    MQTT_BROKER_PORT=1883 \
    DATABASE_URL=/data/sqlite.db

EXPOSE 8080 1883

VOLUME ["/data"]

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["bun", "run", "index.ts"]
