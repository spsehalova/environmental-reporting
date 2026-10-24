import temperaturePlusIcon from "../icons/temperature-plus.svg";
import type { LatestMeasurement } from "../lib/types";
import { Icon } from "./Icon";

interface HeatIndexCardProps {
	measurement: LatestMeasurement;
}

const DIFF_RANGE = 10; // °C either side, clamps how far the pill can travel

export function HeatIndexCard({ measurement }: HeatIndexCardProps) {
	const heatIndexC = measurement.heatIndexC ?? null;
	const actualC = measurement.temperature ?? null;
	const diff = heatIndexC != null && actualC != null ? heatIndexC - actualC : null;

	const isCooler = diff != null && diff < -0.5;
	const isWarmer = diff != null && diff > 0.5;
	const accentColor = isCooler ? "#5BC8E8" : isWarmer ? "#F5A65C" : "#9CA3AF";

	const percent = diff != null ? 50 + (Math.min(Math.max(diff, -DIFF_RANGE), DIFF_RANGE) / DIFF_RANGE) * 42 : 50;

	const caption =
		diff == null
			? "Bez dostupných údajov."
			: isCooler
				? "Vlhkost schladzuje."
				: isWarmer
					? "Vlhkosť zvyšuje pocit tepla."
					: "Pocitová teplota je rovnaká ako skutočná.";

	return (
		<div className="w-44 h-44 rounded-3xl p-4 flex flex-col justify-between bg-mist-900/20 backdrop-blur-3xl text-white">
			<div className="flex items-center gap-1.5 text-white/60">
				<Icon src={temperaturePlusIcon} className="size-4" />
				<span className="text-xs font-semibold uppercase tracking-wide">Heat Index</span>
			</div>

			<div>
				<p className="text-2xl font-semibold leading-none">{heatIndexC != null ? Math.round(heatIndexC) : "--"}°</p>
				<p className="text-2xl font-light" style={{ color: accentColor }}>
					Actual: {actualC != null ? Math.round(actualC) : "--"}°
				</p>
			</div>

			<div className="relative h-5 flex items-center">
				<div className="absolute inset-x-0 h-[3px] rounded-full bg-white/20" />
				<div
					className="absolute h-[3px] rounded-full"
					style={{ left: `${percent}%`, right: 0, backgroundColor: accentColor }}
				/>
				<div className="absolute right-0 w-[2px] h-4 bg-white/70 rounded-full" />
				{diff != null && (
					<div
						className="absolute -translate-x-1/2 flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold text-black"
						style={{ left: `${percent}%`, backgroundColor: accentColor }}
					>
						<span>{isCooler ? "↓" : isWarmer ? "↑" : "•"}</span>
						<span>{Math.abs(Math.round(diff))}°</span>
					</div>
				)}
			</div>

			<p className="text-xs text-white/70 leading-snug">{caption}</p>
		</div>
	);
}
