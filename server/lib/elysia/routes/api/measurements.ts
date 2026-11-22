import z from "zod";
import { measurementDataSchema, type DeviceProperty } from "../../../deviceManagement";
import { baseElysiaApp } from "../../index";
import { buildMeasurementFilterWhere, measurementFilterColumnNames, measurementFilterOperatorNames, measurementFilterSchema, type MeasurementFilter } from "../../help/measurementFilter";
import { measurements } from "../../../../db/schema";
import Papa from "papaparse";
import { t } from "elysia";
import { db } from "../../../../db";


baseElysiaApp
	.get(
		"/api/measurements",
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