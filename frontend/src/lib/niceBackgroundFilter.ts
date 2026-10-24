const LUX_MIN = 0;
const LUX_MAX = 7400;

export interface LuxCategory {
	name: string;
	min: number;
	max: number;
	description: string;
}

/**
 * Indoor-oriented lux bands (sensor caps at 7400 lux, so this isn't the full
 * outdoor scale up to direct sunlight at ~100,000 lux). Weighted toward the
 * low end since that's where most indoor readings actually land — a hallway
 * at night and a lit living room are both "under 300 lux" but look nothing
 * alike, so a single "Dark" bucket from 0-10 isn't useful on its own.
 */
export const LUX_CATEGORIES: LuxCategory[] = [
	{ name: "Pitch black", min: 0, max: 1, description: "No light source, lights off, blackout curtains" },
	{ name: "Night", min: 1, max: 5, description: "Standby LEDs, moonlight through a window" },
	{ name: "Very dim", min: 5, max: 20, description: "Night light or hallway glow only" },
	{ name: "Dim", min: 20, max: 50, description: "Single lamp, mood lighting" },
	{ name: "Low light", min: 50, max: 150, description: "Evening living-room lighting" },
	{ name: "Moderate", min: 150, max: 300, description: "Normal indoor room lighting" },
	{ name: "Bright", min: 300, max: 500, description: "Well-lit room, task/office lighting" },
	{ name: "Very bright", min: 500, max: 1000, description: "Near a window in daylight" },
	{ name: "Overcast daylight", min: 1000, max: 3000, description: "Overcast daylight through windows" },
	{ name: "Direct sunlight", min: 3000, max: LUX_MAX, description: "Direct sun through a window" },
];

export function getLuxCategory(lux: number | null | undefined): LuxCategory | null {
	if (lux == null || Number.isNaN(lux)) return null;
	const clamped = Math.min(Math.max(lux, LUX_MIN), LUX_MAX);
	return LUX_CATEGORIES.find((category) => clamped >= category.min && clamped <= category.max) ?? null;
}

// "Night" look (lux -> 0): genuinely dimmer, slightly flatter and less
// saturated. "Day" (lux -> max) is brighter and a touch richer/warmer than
// the source image. The blue cast itself comes from a separate blend-mode
// overlay (see getNightTintOpacity) rather than hue-rotate: rotating hues
// shifts *every* color uniformly, so a big enough rotation to turn warm
// yellow light blue also drags the green plant toward purple.
const NIGHT_BRIGHTNESS = 0.18;
const NIGHT_CONTRAST = 0.85;
const NIGHT_SATURATE = 0.85;

const DAY_BRIGHTNESS = 1.05;
const DAY_CONTRAST = 1.05;
const DAY_SATURATE = 1.1;

function lerp(from: number, to: number, t: number) {
	return from + (to - from) * t;
}

function getNormalizedLux(lux: number | null | undefined): number | null {
	if (lux == null || Number.isNaN(lux)) return null;
	const clamped = Math.min(Math.max(lux, LUX_MIN), LUX_MAX);
	return Math.log10(clamped + 1) / Math.log10(LUX_MAX + 1);
}

/**
 * Lux perception is roughly logarithmic, so a linear map would make
 * everything above a few hundred lux look equally "bright". Scaling on log10
 * keeps dim rooms visibly distinct from each other instead of all crushing
 * to the same night grade.
 */
export function getNiceBackgroundFilter(lux: number | null | undefined): string {
	const normalized = getNormalizedLux(lux);
	if (normalized == null) return "none";

	const brightness = lerp(NIGHT_BRIGHTNESS, DAY_BRIGHTNESS, normalized);
	const contrast = lerp(NIGHT_CONTRAST, DAY_CONTRAST, normalized);
	const saturate = lerp(NIGHT_SATURATE, DAY_SATURATE, normalized);

	return `brightness(${brightness.toFixed(2)}) contrast(${contrast.toFixed(2)}) saturate(${saturate.toFixed(2)})`;
}

const NIGHT_TINT_MAX_OPACITY = 0.55;

/**
 * Opacity for a blue `mix-blend-mode: overlay` layer painted on top of the
 * background photo — darkens and cools it without rotating individual
 * object hues the way filter: hue-rotate() would.
 */
export function getNightTintOpacity(lux: number | null | undefined): number {
	const normalized = getNormalizedLux(lux);
	if (normalized == null) return 0;
	return (1 - normalized) * NIGHT_TINT_MAX_OPACITY;
}
