import { useId } from "react";
import brightnessUpIcon from "../icons/brightness-up.svg";
import type { LatestMeasurement } from "../lib/types";
import { Icon } from "./Icon";

interface LuxCardProps {
	measurement: LatestMeasurement;
}

const WAVE_WIDTH = 140;
const WAVE_HEIGHT = 44;
const WAVE_AMPLITUDE = 17;
const WAVE_CYCLES = 1;
const WAVE_SAMPLES = 60;
// "Now" marker sits three quarters of the way along the trend line; the
// highlighted stretch is the single most recent hump leading up to it.
const DOT_X = WAVE_WIDTH * 0.74;

const LUX_MAX = 7400;

function pointsToPath(points: [number, number][]) {
	return points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
}

export function LuxCard({ measurement }: LuxCardProps) {
	const lux = measurement.lux ?? null;
	const gradientId = useId();

	// Lux perception is roughly logarithmic (same scale used for the
	// background filter), mapped to [-1, 1] so a dark reading pulls the dot
	// below the baseline and a bright one pushes it above.
	const normalized =
		lux != null ? Math.log10(Math.min(Math.max(lux, 0), LUX_MAX) + 1) / Math.log10(LUX_MAX + 1) : 0.5;
	const balance = 1 - 2 * normalized;

	// The wave's phase is solved so the curve passes through the dot at
	// exactly that target height, keeping the decorative curve and the real
	// reading visually consistent instead of the dot floating independently.
	// sineY subtracts A*sin(...), so sin(...) must equal -balance for a dark
	// (balance=1) reading to land below the baseline rather than above it.
	const sinArg = Math.min(1, Math.max(-1, -balance));
	const phase = Math.asin(sinArg) - (DOT_X / WAVE_WIDTH) * WAVE_CYCLES * Math.PI * 2;

	function sineY(x: number) {
		return WAVE_HEIGHT / 2 - WAVE_AMPLITUDE * Math.sin((x / WAVE_WIDTH) * WAVE_CYCLES * Math.PI * 2 + phase);
	}

	const wavePoints: [number, number][] = Array.from({ length: WAVE_SAMPLES + 1 }, (_, i) => {
		const x = (i / WAVE_SAMPLES) * WAVE_WIDTH;
		return [x, sineY(x)];
	});

	const dotY = sineY(DOT_X);
	const highlightStartX = Math.max(0, DOT_X - WAVE_WIDTH / WAVE_CYCLES);
	const highlightPoints = wavePoints.filter(([x]) => x >= highlightStartX);

	return (
		<div className="w-full aspect-square rounded-3xl p-4 flex flex-col justify-between bg-mist-900/20 backdrop-blur-3xl text-white">
			<div className="flex items-center gap-1.5 text-white/60">
				<Icon src={brightnessUpIcon} className="size-4" />
				<span className="text-xs font-semibold uppercase tracking-wide">Lux</span>
			</div>

			<svg viewBox={`0 0 ${WAVE_WIDTH} ${WAVE_HEIGHT}`} className="w-full h-11 shrink-0" fill="none">
				<defs>
					<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2={WAVE_HEIGHT} gradientUnits="userSpaceOnUse">
						<stop offset="0%" stopColor="white" />
						<stop offset="100%" stopColor="black" />
					</linearGradient>
				</defs>
				<line
					x1="0"
					y1={WAVE_HEIGHT / 2}
					x2={WAVE_WIDTH}
					y2={WAVE_HEIGHT / 2}
					stroke="white"
					strokeOpacity="0.2"
					strokeWidth="1"
				/>
				<path
					d={pointsToPath(wavePoints)}
					stroke={`url(#${gradientId})`}
					strokeOpacity="0.4"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d={pointsToPath(highlightPoints)}
					stroke={`url(#${gradientId})`}
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<circle cx={DOT_X} cy={dotY} r="4" fill="#453b34" stroke="white" strokeWidth="2" />
			</svg>

			<div className="flex flex-row items-baseline gap-1">
				<p className="text-4xl font-medium font-mono leading-none">{lux != null ? Math.round(lux) : "--"}</p>
				<p className="text-2xl truncate font-light">lx</p>
			</div>
		</div>
	);
}
