export interface IaqCategory {
	label: string;
	shortLabel: string;
	min: number;
	max: number;
}

/**
 * IAQ (0-500) bucketed onto the same bands/labels as the US EPA AQI scale,
 * since that's the label set + color ramp this card's design is based on.
 * shortLabel exists because "Unhealthy for Sensitive Groups" doesn't fit a
 * small card without wrapping or truncating mid-word.
 */
export const IAQ_CATEGORIES: IaqCategory[] = [
	{ label: "Good", shortLabel: "Good", min: 0, max: 50 },
	{ label: "Moderate", shortLabel: "Moderate", min: 50, max: 100 },
	{ label: "Unhealthy for Sensitive Groups", shortLabel: "Sensitive", min: 100, max: 150 },
	{ label: "Unhealthy", shortLabel: "Unhealthy", min: 150, max: 200 },
	{ label: "Very Unhealthy", shortLabel: "Very unhealthy", min: 200, max: 300 },
	{ label: "Hazardous", shortLabel: "Hazardous", min: 300, max: 500 },
];

export function getIaqCategory(iaq: number | null | undefined): IaqCategory | null {
	if (iaq == null || Number.isNaN(iaq)) return null;
	const clamped = Math.min(Math.max(iaq, 0), 500);
	return IAQ_CATEGORIES.find((category) => clamped >= category.min && clamped <= category.max) ?? null;
}

export function getIaqPercent(iaq: number | null | undefined): number {
	if (iaq == null || Number.isNaN(iaq)) return 0;
	return (Math.min(Math.max(iaq, 0), 500) / 500) * 100;
}
