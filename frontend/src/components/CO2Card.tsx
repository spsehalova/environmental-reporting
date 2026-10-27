import filterIcon from "../icons/color-filter.svg";
import alertTriangleIcon from "../icons/alert-triangle.svg";
import { getIaqCategory, getIaqPercent } from "../lib/iaq";
import type { LatestMeasurement } from "../lib/types";
import { Icon } from "./Icon";

interface IaqCardProps {
	measurement: LatestMeasurement;
}

export function CO2Card({ measurement }: IaqCardProps) {
	const co2ppm = measurement.eco2Ppm ?? null;
	const eco2ppm = measurement.eco2Ppm ?? null;

	return (
		<div className="w-full aspect-square rounded-3xl p-4 flex flex-col justify-between bg-mist-900/20 backdrop-blur-3xl text-white">
			<div className="flex items-center gap-1.5 text-white/60">
				<Icon src={filterIcon} className="size-4" />
				<span className="text-xs font-semibold uppercase tracking-wide">CO2</span>
				{measurement.warmingUp && <Icon src={alertTriangleIcon} className="size-4 text-yellow-300 ml-auto" />}
			</div>

			<div>
				<p className="text-4xl font-medium font-mono leading-none">{co2ppm != null ? Math.round(co2ppm) : "--"}</p>
				<p className="text-2xl truncate font-light">ppm</p>
			</div>

			<div className="flex items-center justify-between text-xs">
				<span className="text-white/60 ">eCO₂</span>
				<span className="font-semibold font-mono">{eco2ppm != null ? Math.round(eco2ppm) : "--"}</span>
			</div>
		</div>
	);
}
