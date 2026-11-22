#!/bin/sh
set -e

db_path="${DATABASE_URL:-sqlite.db}"
mkdir -p "$(dirname "$db_path")"

echo "Syncing database schema..."
bun run db:push --force

if [ -n "$TUNNEL_TOKEN" ]; then
	echo "Starting cloudflared tunnel..."
	cloudflared tunnel --no-autoupdate run --token "$TUNNEL_TOKEN" &
else
	echo "TUNNEL_TOKEN not set, skipping cloudflared tunnel." >&2
fi

exec "$@"
