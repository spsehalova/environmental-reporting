export interface IaqCategory {
	label: string;
	shortLabel: string;
	min: number;
	max: number;
	color: string;
}

/**
 * IAQ (0-500) bucketed per the Bosch BSEC IAQ index reference table
 * (Excellent/Good/Lightly.../Extremely polluted, with breakpoints at
 * 50/100/150/200/250/350). shortLabel exists because the full adjective +
 * "znečistené" phrasing doesn't fit a small card without wrapping.
 */
export const IAQ_CATEGORIES: IaqCategory[] = [
	{ label: "Výborné", shortLabel: "Výborné", min: 0, max: 50, color: "#4792F2" },
	{ label: "Dobré", shortLabel: "Dobré", min: 50, max: 100, color: "#5DC89B" },
	{ label: "Mierne znečistené", shortLabel: "Mierne", min: 100, max: 150, color: "#99DF6D" },
	{ label: "Stredne znečistené", shortLabel: "Stredne", min: 150, max: 200, color: "#EAE656" },
	{ label: "Silne znečistené", shortLabel: "Silne", min: 200, max: 250, color: "#EFA253" },
	{ label: "Veľmi znečistené", shortLabel: "Veľmi", min: 250, max: 350, color: "#E85252" },
	{ label: "Extrémne znečistené", shortLabel: "Extrémne", min: 350, max: 500, color: "#B22E41" },
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
