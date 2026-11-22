import type { DeviceProperty, LatestMeasurement } from "./types";

/** Typical indoor ranges used to generate a believable demo series per variable. */
const SAMPLE_RANGES: Record<string, [number, number]> = {
	temperature: [20, 24],
	humidity: [40, 60],
	pressureHpa: [1005, 1015],
	iaq: [50, 150],
	staticIaq: [45, 120],
	iaqAccuracy: [1, 3],
	eco2Ppm: [500, 900],
	bvocPpm: [0.3, 1.2],
	gasPercentage: [2, 10],
	lux: [50, 600],
	noiseDbRel: [35, 55],
	dustMgm3: [0.5, 3],
	pm100Ugm3: [1, 5],
	pm25Ugm3: [1, 4],
	pm40Ugm3: [1, 4.5],
	pm10Ugm3: [0.5, 3],
	co2Ppm: [500, 900],
	nearbyDevices: [3, 12],
	dewPointC: [8, 14],
	absHumidityGm3: [7, 12],
	moldRiskIndex: [0, 1],
	heatIndexC: [19, 25],
};

function mid(range: [number, number]): number {
	return (range[0] + range[1]) / 2;
}

export const SAMPLE_ROOM = "sample";

export const SAMPLE_MEASUREMENT: LatestMeasurement = Object.fromEntries(
	Object.entries(SAMPLE_RANGES).map(([key, range]) => [key, Math.round(mid(range) * 100) / 100]),
) as LatestMeasurement;
SAMPLE_MEASUREMENT.warmingUp = false;

export const SAMPLE_DEVICES: Record<string, DeviceProperty> = {
	[SAMPLE_ROOM]: {
		roomName: SAMPLE_ROOM,
		macAddress: "00:00:00:00:00:00",
		state: "ok",
		lastReportedAt: new Date().toISOString(),
		latestMeasurement: SAMPLE_MEASUREMENT,
	},
};

/** A smooth bounded random walk standing in for a real day of sensor readings. */
export function sampleSeries(variable: string, pointCount = 140): { time: Date; value: number }[] {
	const range = SAMPLE_RANGES[variable] ?? [0, 100];
	const [min, max] = range;
	const center = mid(range);
	const spread = max - min;

	const now = new Date();
	const start = new Date(now);
	start.setHours(0, 0, 0, 0);
	const span = Math.max(now.getTime() - start.getTime(), 60_000);

	let value = center;
	const points: { time: Date; value: number }[] = [];
	for (let i = 0; i < pointCount; i++) {
		value += (Math.random() - 0.5) * spread * 0.08;
		value += (center - value) * 0.06;
		value = Math.max(min, Math.min(max, value));
		const time = new Date(start.getTime() + (i / (pointCount - 1)) * span);
		points.push({ time, value: Math.round(value * 100) / 100 });
	}
	return points;
}

/** Two short "warming up" bursts early in the day, matching real sensor boot behavior. */
export function sampleWarmupFlags(): { time: Date; value: boolean }[] {
	const now = new Date();
	const start = new Date(now);
	start.setHours(0, 0, 0, 0);
	const span = Math.max(now.getTime() - start.getTime(), 60_000);
	const burstAt = (fraction: number, minutes: number) => {
		const from = new Date(start.getTime() + span * fraction);
		const to = new Date(from.getTime() + minutes * 60_000);
		return [from, to] as const;
	};

	const flags: { time: Date; value: boolean }[] = [];
	const bursts = span > 2 * 60 * 60 * 1000 ? [burstAt(0.1, 12), burstAt(0.55, 8)] : [burstAt(0.3, 10)];
	for (const [from, to] of bursts) {
		flags.push({ time: new Date(from.getTime() - 60_000), value: false });
		flags.push({ time: from, value: true });
		flags.push({ time: to, value: false });
	}
	return flags.sort((a, b) => a.time.getTime() - b.time.getTime());
}
