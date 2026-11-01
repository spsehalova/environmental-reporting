import { Elysia, t } from "elysia";
import { db } from "../../db";
import { measurements } from "../../db/schema";
import { DeviceManager, devicePropertySchema, measurementDataSchema, rawMeasurementDataSchema, type DeviceProperty } from "../deviceManagement";
import {
	buildMeasurementFilterWhere,
	measurementFilterColumnNames,
	measurementFilterOperatorNames,
	measurementFilterSchema,
	type MeasurementFilter,
} from "./measurementFilter";
import { openapi } from "@elysia/openapi";
import z from "zod";
import cors from "@elysia/cors";
import Papa from "papaparse";
import { and, asc, eq, gte, lt } from "drizzle-orm";

export const elysiaApp = new Elysia()
	.use(openapi())
	.use(cors())
	.get("/", () => {
		let returning: { [roomName: string]: DeviceProperty } = {}
		for (const [roomName, device] of DeviceManager.devices.entries()) {
			returning[roomName] = device;
		}
		return returning;
	}, {
		detail: {
			summary: "List devices",
			description: "Returns a list of all devices and their properties.",
			tags: ["Devices"],
		},
		response: {
			200: z.record(z.string(), devicePropertySchema),
		},
	})
	.get(
		"/device/:roomName",
		({ params, set }) => {
			const device = DeviceManager.getDeviceProperty(params.roomName);
			if (!device) {
				set.status = 404;
				return { error: "Device not found" };
			}
			return device;
		},
		{
			params: z.object({
				roomName: z.string().meta({
					description: "The name of the room to retrieve the device for.",
					examples: ["jedalen", "a"],
				}),
			}),
			detail: {
				summary: "Get a device",
				description: "Returns a single device and its properties.",
				tags: ["Devices"],
			},
			response: {
				200: devicePropertySchema,
				404: z.object({
					error: z.string(),
				}),
			},
		},
	)
	.get(
		"/measurements",
		async ({ query, set }) => {
			let filter: MeasurementFilter = {};
			if (query.filter) {
				let json: unknown;
				try {
					json = JSON.parse(query.filter);
				} catch (error) {
					set.status = 400;
					return { error: "filter must be valid JSON" };
				}

				let parsed = measurementFilterSchema.safeParse(json);
				if (!parsed.success) {
					set.status = 400;
					return { error: "Invalid filter", details: parsed.error.issues };
				}
				filter = parsed.data;
			}

			let rows: (typeof measurements.$inferSelect)[];
			try {
				rows = await db.select().from(measurements).where(buildMeasurementFilterWhere(filter));
			} catch (error) {
				set.status = 400;
				return { error: `${error}` };
			}

			if (query.format === "csv") {
				const csv = Papa.unparse(
					rows.map((row) => ({
						...row,
						timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : row.timestamp,
					})),
				);
				set.headers["Content-Type"] = "text/csv; charset=utf-8";
				set.headers["Content-Disposition"] = `attachment; filename="measurements.csv"`;
				return csv;
			}

			return rows;
		},
		{
			query: t.Object({
				filter: t.Optional(
					t.String({
						description:
							"JSON-encoded filter object, shaped as `{ [column]: { [operator]: value } }`.\n\n" +
							`Columns: ${measurementFilterColumnNames.join(", ")}.\n\n` +
							`Operators: ${measurementFilterOperatorNames.join(", ")}.\n\n` +
							"`between` and `in`/`notIn` take an array value; `isNull`/`isNotNull` ignore the value; " +
							"the rest take a single value. Date/timestamp columns accept ISO 8601 strings.",
						examples: [JSON.stringify({ room: { eq: "jedalen" }, noiseDbRel: { gt: 80 } })],
					}),
				),
				format: t.Optional(
					t.Union([t.Literal("json"), t.Literal("csv")], {
						description: "Response format. Defaults to `json`; `csv` returns a downloadable CSV file.",
						default: "json",
					}),
				),
			}),
			detail: {
				summary: "List measurements",
				description:
					"Returns measurements, optionally filtered via the `filter` query parameter. " +
					"Set `format=csv` to download the results as a CSV file instead of JSON.",
				tags: ["Measurements"],
			},
			body: t.Object({}),
			response: {
				200: z.union([z.array(measurementDataSchema), z.string()]),
				400: z.object({
					error: z.string(),
					details: z.optional(z.any()),
				}),
			},
		},
	)
	.get("/day/:roomName/:variable", async ({ params, query, set }) => {
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
