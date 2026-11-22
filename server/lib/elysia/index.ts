import { Elysia, t } from "elysia";
import { openapi } from "@elysia/openapi";
import staticPlugin from "@elysia/static";
import path from "node:path";

const frontendSrc = path.join(import.meta.dir, "../../../frontend/src");

// @elysia/cors registers an onRequest hook, which disables Elysia's native
// Bun route fast-path (the one that knows how to serve the frontend's
// HTMLBundle from the static plugin below). Set CORS headers as static
// defaults instead - no request hook, no interference with that fast path.
const corsHeaders = {
	"access-control-allow-origin": "*",
	"access-control-allow-methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
	"access-control-allow-headers": "*",
};

export const baseElysiaApp = new Elysia()
	.use(openapi())
	.headers(corsHeaders)
	.options("/*", () => new Response(null, { status: 204, headers: corsHeaders }))
	.use(
		await staticPlugin({
			assets: frontendSrc,
			prefix: "/",
			bunFullstack: true,
		}),
	)

await import("./routes/api/index.ts");
await import("./routes/api/device-:roomname.ts");
await import("./routes/api/measurements.ts");
await import("./routes/api/day-:roomname-:variable.ts");

export const elysiaApp = baseElysiaApp