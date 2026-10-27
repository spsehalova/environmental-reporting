import rosetteAsteriskIcon from "../icons/rosette-asterisk.svg";
import type { LatestMeasurement } from "../lib/types";
import { Icon } from "./Icon";

interface PressureCardProps {
	measurement: LatestMeasurement;
}

const CENTER = 51.5;
// Bearings measured clockwise from 12 o'clock, matching the baked-in artwork
// geometry: the ring is a 270° arc with a 90° gap centered at the bottom.
const GAUGE_START_ANGLE = 225; // "Low" end, bottom-left
const GAUGE_SWEEP = 270; // ends at 225+270=495 (=135°), "High" end, bottom-right
const DEFAULT_TICK_ANGLE = -27.7; // the tick's bearing as drawn in the source artwork

const PRESSURE_MIN = 970;
const PRESSURE_MAX = 1040;

const RING_PATH =
	"M87.916 87.916C95.1184 80.7136 100.023 71.5372 102.01 61.5472C103.998 51.5571 102.978 41.2022 99.0798 31.7918C95.1819 22.3814 88.581 14.3382 80.1119 8.67932C71.6427 3.02042 61.6857 4.65443e-07 51.5 0C41.3143 -4.65443e-07 31.3573 3.02042 22.8881 8.67931C14.419 14.3382 7.81812 22.3814 3.92021 31.7918C0.0222916 41.2022 -0.997581 51.5571 0.989557 61.5471C2.9767 71.5372 7.88159 80.7136 15.084 87.916L22.3672 80.6328C16.6053 74.8709 12.6814 67.5297 11.0916 59.5377C9.50194 51.5457 10.3178 43.2618 13.4362 35.7334C16.5545 28.2051 21.8352 21.7706 28.6105 17.2435C35.3858 12.7163 43.3514 10.3 51.5 10.3C59.6486 10.3 67.6142 12.7163 74.3895 17.2435C81.1648 21.7706 86.4455 28.2051 89.5638 35.7334C92.6822 43.2618 93.4981 51.5457 91.9084 59.5377C90.3186 67.5297 86.3947 74.8709 80.6328 80.6328L87.916 87.916Z";

const TICK_PATH =
	"M30.643 4.41246C29.5925 4.87778 28.5578 5.37812 27.5408 5.91265L32.3326 15.0301C33.1463 14.6025 33.974 14.2022 34.8144 13.83L30.643 4.41246Z";

export function PressureCard({ measurement }: PressureCardProps) {
	const pressureHpa = measurement.pressureHpa ?? null;

	const normalized =
		pressureHpa != null
			? (Math.min(Math.max(pressureHpa, PRESSURE_MIN), PRESSURE_MAX) - PRESSURE_MIN) / (PRESSURE_MAX - PRESSURE_MIN)
			: 0.5;
	const targetAngle = GAUGE_START_ANGLE + normalized * GAUGE_SWEEP;
	const tickRotation = targetAngle - DEFAULT_TICK_ANGLE;

	return (
		<div className="w-full aspect-square rounded-3xl p-4 flex flex-col items-center bg-mist-900/20 backdrop-blur-3xl text-white">
			<div className="flex items-center gap-1.5 text-white/60 self-start">
				<Icon src={rosetteAsteriskIcon} className="size-4" />
				<span className="text-xs font-semibold uppercase tracking-wide">Tlak</span>
			</div>

			<div className="relative flex-1 flex items-center justify-center w-full">
				<svg viewBox="0 0 103 103" className="absolute h-full" fill="none">
					<path d={RING_PATH} fill="white" fillOpacity="0.3" />
					<path
						d={TICK_PATH}
						stroke="white"
						strokeWidth="5.42105"
						strokeLinejoin="round"
						transform={`rotate(${tickRotation} ${CENTER} ${CENTER})`}
					/>
				</svg>

				<div className="relative flex flex-col items-center">
					<p className="text-2xl font-medium font-mono leading-none">
						{pressureHpa != null ? Math.round(pressureHpa) : "--"}
					</p>
					<p className="text-xs text-white/60 mt-0.5">hPa</p>
				</div>
			</div>

			<div className="flex items-center justify-between w-full text-xs text-white/60 px-1">
				<span>Low</span>
				<span>High</span>
			</div>
		</div>
	);
}
