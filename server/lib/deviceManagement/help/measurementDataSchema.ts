import { createInsertSchema } from "drizzle-zod";
import { measurements } from "../../../db/schema";
import { camelizeKeys } from "./keying";
import z from "zod";
import { heartbeatDataSchema } from "./types";

export const rawMeasurementDataSchema = createInsertSchema(measurements, {
	temperature: (schema) => schema.min(-40).max(85),
	humidity: (schema) => schema.min(0).max(100),
	pressureHpa: (schema) => schema.min(300).max(1100),
	iaq: (schema) => schema.min(0).max(500),
	iaqAccuracy: (schema) => schema.min(0).max(3),
	eco2Ppm: (schema) => schema.min(0),
	bvocPpm: (schema) => schema.min(0),
	lux: (schema) => schema.min(0).max(65535),
	noiseDbRel: (schema) => schema.min(0).max(130),
	pm10Ugm3: (schema) => schema.min(0),
	pm25Ugm3: (schema) => schema.min(0),
	pm40Ugm3: (schema) => schema.min(0),
	pm100Ugm3: (schema) => schema.min(0),
	co2Ppm: (schema) => schema.min(0),
	nearbyDevices: (schema) => schema.min(0),
	dewPointC: (schema) => schema.min(0),
	absHumidityGm3: (schema) => schema.min(0),
	moldRiskIndex: (schema) => schema.min(-1).max(6),
	heatIndexC: (schema) => schema.min(0),
	room: (schema) => schema.optional(), // room is not part of the measurement data sent by the device, but we add it here for convenience
}).omit({
	id: true,
	timestamp: true,
});

export const measurementDataSchema = z.preprocess(camelizeKeys, rawMeasurementDataSchema);

export const devicePropertySchema = z.object({
	roomName: z.string(),
	macAddress: z.string(),
	state: z.enum(["ok", "errored", "offline"]),
	lastReportedAt: z.date(),
	_data: heartbeatDataSchema.optional(),
	latestMeasurement: measurementDataSchema.optional(),
});

export type HeartbeatData = z.infer<typeof heartbeatDataSchema>;
export type DeviceProperty = z.infer<typeof devicePropertySchema>;

export type MeasurementData = z.infer<typeof measurementDataSchema>;
export type MeasurementSnapshot = MeasurementData & { room: string; timestamp: Date };