import scatterIcon from "../icons/chart-scatter-3d.svg";
import alertTriangleIcon from "../icons/alert-triangle.svg";
import type { LatestMeasurement } from "../lib/types";
import { Icon } from "./Icon";

interface IaqCardProps {
	measurement: LatestMeasurement;
}

export function PM25Card({ measurement }: IaqCardProps) {
	const pm25mgm3 = measurement.dustMgm3 ?? null;

	return (
		<div className="w-44 h-44 rounded-3xl p-4 flex flex-col justify-between bg-mist-900/20 backdrop-blur-3xl text-white">
			<div className="flex items-center gap-1.5 text-white/60">
				<Icon src={scatterIcon} className="size-4" />
				<span className="text-xs font-semibold uppercase tracking-wide">PM2.5</span>
				{/*{measurement.warmingUp && <Icon src={alertTriangleIcon} className="size-4 text-yellow-300 ml-auto" />}*/}
			</div>

			<div>
				<p className="text-4xl font-medium font-mono leading-none">
					{pm25mgm3 != null ? pm25mgm3.toFixed(3).replace("0.", ".").replace("0,", ",") : "--"}
				</p>
				<p className="text-2xl truncate font-light">mg/m³</p>
			</div>

			<div className="flex items-center justify-between text-xs">
				<span className="text-white/60">Prach</span>
			</div>
		</div>
	);
}
