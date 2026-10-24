import { Elysia, t } from "elysia";
import { db } from "../../db";
import { measurements } from "../../db/schema";
import { DeviceManager, devicePropertySchema, measurementDataSchema, type DeviceProperty } from "../deviceManagement";
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
	.get("/device/:roomName", ({ params }) => {
		const device = DeviceManager.getDeviceProperty(params.roomName);
		if (!device) {
			return { error: "Device not found" };
		}
		return device;
	})
	.get(
		"/measurements",
		({ query, set }) => {
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

			try {
				return db.select().from(measurements).where(buildMeasurementFilterWhere(filter));
			} catch (error) {
				set.status = 400;
				return { error: `${error}` };
			}
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
			}),
			detail: {
				summary: "List measurements",
				description: "Returns measurements, optionally filtered via the `filter` query parameter.",
				tags: ["Measurements"],
			},
			body: t.Object({}),
			response: {
				200: z.array(measurementDataSchema),
				400: z.object({
					error: z.string(),
					details: z.optional(z.any()),
				}),
			},
		},
	)
