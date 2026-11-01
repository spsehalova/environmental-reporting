export const MEASUREMENTS_BASE = "http://localhost:8080";

export interface DayDataPoint {
	time: Date;
	value: number;
}

export async function fetchDayData(roomName: string, variable: string): Promise<DayDataPoint[]> {
	const res = await fetch(`${MEASUREMENTS_BASE}/day/${encodeURIComponent(roomName)}/${variable}`);
	const data: { timestamp: string; value: number | string | boolean | null }[] = await res.json();

	return data
		.filter((point): point is { timestamp: string; value: number } => typeof point.value === "number")
		.map((point) => ({ time: new Date(point.timestamp), value: point.value }));
}

export interface DayFlag {
	time: Date;
	value: boolean;
}

export async function fetchDayFlags(roomName: string, variable: string): Promise<DayFlag[]> {
	const res = await fetch(`${MEASUREMENTS_BASE}/day/${encodeURIComponent(roomName)}/${variable}`);
	const data: { timestamp: string; value: number | string | boolean | null }[] = await res.json();

	return data
		.filter((point): point is { timestamp: string; value: boolean } => typeof point.value === "boolean")
		.map((point) => ({ time: new Date(point.timestamp), value: point.value }));
}
