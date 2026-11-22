import { db } from "../../../../db";
import { rawMeasurementDataSchema } from "../../../deviceManagement";
import z from "zod";
import { and, asc, eq, gte, lt } from "drizzle-orm";
import { baseElysiaApp } from "../../index";
import { measurements } from "../../../../db/schema";

baseElysiaApp
	.get("/api/day/:roomName/:variable", async ({ params, query, set }) => {
		const { roomName, variable } = params;

		const dayStart = new Date(query.date ?? Date.now());
		dayStart.setHours(0)
		dayStart.setMinutes(0)
		dayStart.setSeconds(0)
		dayStart.setMilliseconds(0)
		const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

		try {
			const rows = await db
				.select()
				.from(measurements)
				.where((table) =>
					and(eq(table.room, roomName), gte(table.timestamp, dayStart), lt(table.timestamp, dayEnd)),
				)
				.orderBy((table) => asc(table.timestamp));

			const result = rows.map((row) => ({
				timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : row.timestamp,
				value: row[variable],
			}));

			return result;
		} catch (error) {
			set.status = 500;
			return { error: `Database query failed: ${error}` };
		}
	}, {
		params: z.object({
			roomName: z.string().meta({
				description: "The name of the room to retrieve data for.",
				examples: ["jedalen", "a"],
			}),
			variable: rawMeasurementDataSchema
				.keyof()
				.exclude(["room"])
				.describe("The variable to retrieve (e.g., temperature, humidity)."),
		}),
		query: z.object({
			date: z.iso.date().optional().meta({
				description: "The day to retrieve data for, as an ISO 8601 date (`YYYY-MM-DD`), interpreted in UTC. Defaults to today.",
				examples: ["2026-10-31"],
			}),
		}),
		detail: {
			summary: "Get a day of a variable for a room",
			description: "Returns the full calendar day (UTC) of data for a specific variable in a specific room.",
			tags: ["Measurements"],
		},
		response: {
			200: z.array(z.object({
				timestamp: z.string(),
				value: z.union([z.number(), z.string(), z.boolean(), z.null()]), // Adjust the type based on your variable types
			})),
			400: z.object({
				error: z.string(),
			}),
			500: z.object({
				error: z.string(),
			}),
		},
	});