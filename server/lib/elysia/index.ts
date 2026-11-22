import { Elysia, t } from "elysia";
import { openapi } from "@elysia/openapi";
import cors from "@elysia/cors";
import staticPlugin from "@elysia/static";
import path from "node:path";

const frontendSrc = path.join(import.meta.dir, "../../../frontend/src");

export const baseElysiaApp = new Elysia()
	.use(openapi())
	.use(cors())
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