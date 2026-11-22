import { measurementDataSchema, type DeviceProperty, type MeasurementSnapshot } from "./help/measurementDataSchema";
import { heartbeatDataSchema } from "./help/types";

export {
	rawMeasurementDataSchema,
	measurementDataSchema,
	devicePropertySchema,
	type HeartbeatData,
	type DeviceProperty,
	type MeasurementData,
	type MeasurementSnapshot,
} from "./help/measurementDataSchema";

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
