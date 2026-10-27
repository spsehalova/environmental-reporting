import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { measurements } from "../../db/schema";

export enum ResetReason {
	Unknown = 0,
	PowerOn = 1,
	External = 2,
	Software = 3,
	Panic = 4,
	IntWatchdog = 5,
	TaskWatchdog = 6,
	Watchdog = 7,
	DeepSleep = 8,
	Brownout = 9,
	Sdio = 10,
	Usb = 11,
	Jtag = 12,
	Efuse = 13,
	PowerGlitch = 14,
	CpuLockup = 15,
}

export const heartbeatDataSchema = z.object({
	station_id: z.string(),
	mac: z.string(), // STA MAC, e.g. "AA:BB:CC:A1:B2:C3"
	uptime_s: z.number(), // seconds since boot
	free_heap: z.number(), // bytes
	wifi_rssi: z.number(), // dBm, negative
	reset_reason: z.enum(ResetReason), // esp_reset_reason_t, see enum above
});

function snakeToCamel(key: string) {
	return key.replace(/_([a-z0-9])/g, (_, char) => char.toUpperCase());
}

function camelizeKeys(value: unknown) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return value;

	return Object.fromEntries(Object.entries(value).map(([key, val]) => [snakeToCamel(key), val]));
}

const rawMeasurementDataSchema = createInsertSchema(measurements, {
	temperature: (schema) => schema.min(-40).max(85),
	humidity: (schema) => schema.min(0).max(100),
	pressureHpa: (schema) => schema.min(300).max(1100),
	iaq: (schema) => schema.min(0).max(500),
	iaqAccuracy: (schema) => schema.min(0).max(3),
	eco2Ppm: (schema) => schema.min(0),
	bvocPpm: (schema) => schema.min(0),
	lux: (schema) => schema.min(0).max(65535),
	noiseDbRel: (schema) => schema.min(0).max(130),
	dustMgm3: (schema) => schema.min(0),
	nearbyDevices: (schema) => schema.min(0),
	dewPointC: (schema) => schema.min(0),
	absHumidityGm3: (schema) => schema.min(0),
	moldRiskIndex: (schema) => schema.min(-1).max(3),
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

const OFFLINE_THRESHOLD_MS = 10 * 60 * 1000;
const OFFLINE_CHECK_INTERVAL_MS = 60 * 1000;

export class DeviceManagerHolder {
	private _devices: Map<string, DeviceProperty> = new Map();

	constructor() {
		setInterval(() => this._markStaleDevicesOffline(), OFFLINE_CHECK_INTERVAL_MS).unref();
	}

	private _markStaleDevicesOffline() {
		let now = Date.now();
		for (let [roomName, device] of this._devices) {
			if (device.state === "offline") continue;
			if (now - device.lastReportedAt.getTime() <= OFFLINE_THRESHOLD_MS) continue;

			device.state = "offline";
			this._devices.set(roomName, device);
			console.log(`Device in room [${roomName}] marked offline after not reporting for over 10 minutes.`);
		}
	}

	public get devices() {
		return this._devices;
	}

	public pushMeasurementData(roomName: string, json: unknown): MeasurementSnapshot | null {
		const parsed = measurementDataSchema.safeParse(json);
		if (!parsed.success) {
			console.error(`Invalid measurement data for room [${roomName}]:`, parsed.error);
			return null;
		}

		const snapshot: MeasurementSnapshot = {
			...parsed.data,
			room: roomName,
			timestamp: new Date(),
		};

		let device = this._devices.get(roomName);
		if (device) {
			device.latestMeasurement = parsed.data;
			device.lastReportedAt = new Date();
			device.state = "ok";
			this._devices.set(roomName, device);
		} else {
			this._devices.set(roomName, {
				roomName,
				macAddress: "unknown",
				state: "ok",
				lastReportedAt: new Date(),
				latestMeasurement: parsed.data,
			})
		}
		return snapshot;
	}

	public setDeviceProperty(roomName: string, property: DeviceProperty) {
		this._devices.set(roomName, property);
	}

	public getDeviceProperty(roomName: string): DeviceProperty | undefined {
		return this._devices.get(roomName);
	}

	public pushDeviceData(roomName: string, json: unknown): DeviceProperty | null {
		const parsed = heartbeatDataSchema.safeParse(json);
		if (!parsed.success) {
			console.error(`Invalid heartbeat data for room [${roomName}]:`, parsed.error);
			return null;
		}

		const property: DeviceProperty = {
			roomName,
			macAddress: parsed.data.mac,
			state: "ok",
			lastReportedAt: new Date(),
			_data: parsed.data,
		};

		if (this._devices.has(roomName)) {
			const existing = this._devices.get(roomName)!;
			property.latestMeasurement = existing.latestMeasurement;
		}

		this._devices.set(roomName, property);
		return property;
	}
}

export const DeviceManager = new DeviceManagerHolder();
