import { sampleSeries, sampleWarmupFlags } from "./sampleData";

export const MEASUREMENTS_BASE = "/api"; // todo: env

export interface DayDataPoint {
	time: Date;
	value: number;
}

export async function fetchDayData(roomName: string, variable: string): Promise<DayDataPoint[]> {
	try {
		const res = await fetch(`${MEASUREMENTS_BASE}/day/${encodeURIComponent(roomName)}/${variable}`);
		if (!res.ok) throw new Error(`${res.status}`);
		const data: { timestamp: string; value: number | string | boolean | null }[] = await res.json();

		return data
			.filter((point): point is { timestamp: string; value: number } => typeof point.value === "number")
			.map((point) => ({ time: new Date(point.timestamp), value: point.value }));
	} catch {
		// Backend/sensor unreachable — fall back to a believable sample series so the dashboard stays demoable.
		return sampleSeries(variable);
	}
}

export interface DayFlag {
	time: Date;
	value: boolean;
}

export async function fetchDayFlags(roomName: string, variable: string): Promise<DayFlag[]> {
	try {
		const res = await fetch(`${MEASUREMENTS_BASE}/day/${encodeURIComponent(roomName)}/${variable}`);
		if (!res.ok) throw new Error(`${res.status}`);
		const data: { timestamp: string; value: number | string | boolean | null }[] = await res.json();

		return data
			.filter((point): point is { timestamp: string; value: boolean } => typeof point.value === "boolean")
			.map((point) => ({ time: new Date(point.timestamp), value: point.value }));
	} catch {
		return sampleWarmupFlags();
	}
}
