import {
	and,
	between,
	eq,
	getTableColumns,
	gt,
	gte,
	inArray,
	isNotNull,
	isNull,
	like,
	lt,
	lte,
	ne,
	notInArray,
	type Column,
	type SQL,
} from "drizzle-orm";
import { z } from "zod";
import { measurements } from "../../db/schema";

const measurementColumns = getTableColumns(measurements);

const operators = {
	eq: (column: Column, value: unknown) => eq(column, value),
	ne: (column: Column, value: unknown) => ne(column, value),
	gt: (column: Column, value: unknown) => gt(column, value),
	gte: (column: Column, value: unknown) => gte(column, value),
	lt: (column: Column, value: unknown) => lt(column, value),
	lte: (column: Column, value: unknown) => lte(column, value),
	like: (column: Column, value: unknown) => like(column, String(value)),
	in: (column: Column, value: unknown) => inArray(column, value as unknown[]),
	notIn: (column: Column, value: unknown) => notInArray(column, value as unknown[]),
	between: (column: Column, value: unknown) => {
		const [from, to] = value as [unknown, unknown];
		return between(column, from, to);
	},
	isNull: (column: Column) => isNull(column),
	isNotNull: (column: Column) => isNotNull(column),
} satisfies Record<string, (column: Column, value?: unknown) => SQL>;

type Operator = keyof typeof operators;

export const measurementFilterOperatorNames = Object.keys(operators) as Operator[];
export const measurementFilterColumnNames = Object.keys(measurementColumns) as (keyof typeof measurementColumns)[];

export const measurementFilterSchema = z.record(z.string(), z.record(z.string(), z.unknown()));

export type MeasurementFilter = z.infer<typeof measurementFilterSchema>;

function coerceValue(column: Column, value: unknown): unknown {
	if (value === null || value === undefined) return value;
	if (column.dataType === "date") {
		return Array.isArray(value) ? value.map((v) => new Date(v as string)) : new Date(value as string);
	}
	return value;
}

export function buildMeasurementFilterWhere(filter: MeasurementFilter): SQL | undefined {
	const conditions: SQL[] = [];

	for (const [columnName, ops] of Object.entries(filter)) {
		const column = measurementColumns[columnName as keyof typeof measurementColumns];
		if (!column) {
			throw new Error(`Unknown column "${columnName}"`);
		}

		for (const [opName, rawValue] of Object.entries(ops)) {
			const operator = operators[opName as Operator];
			if (!operator) {
				throw new Error(`Unknown operator "${opName}"`);
			}
			conditions.push(operator(column, coerceValue(column, rawValue)));
		}
	}

	return conditions.length ? and(...conditions) : undefined;
}
