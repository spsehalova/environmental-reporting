import rippleDropletIcon from "../icons/ripple-droplet.svg";
import alertTriangleIcon from "../icons/alert-triangle.svg";
import type { LatestMeasurement } from "../lib/types";
import { Icon } from "./Icon";

interface IaqCardProps {
	measurement: LatestMeasurement;
}

export function HumidityCard({ measurement }: IaqCardProps) {
	const humidityPerc = measurement.humidity ?? null;
	const dewPointC = measurement.dewPointC ?? null;
	const absoluteHumidity = measurement.absHumidityGm3 ?? null;

	return (
		<div className="w-44 h-44 rounded-3xl p-4 flex flex-col justify-between bg-mist-900/20 backdrop-blur-3xl text-white">
			<div className="flex items-center gap-1.5 text-white/60">
				<Icon src={rippleDropletIcon} className="size-4" />
				<span className="text-xs font-semibold uppercase tracking-wide">Vlhkost</span>
				{/*{measurement.warmingUp && <Icon src={alertTriangleIcon} className="size-4 text-yellow-300 ml-auto" />}*/}
			</div>

			<div className="flex flex-row items-baseline gap-1">
				<p className="text-4xl font-medium font-mono leading-none">
					{humidityPerc != null ? Math.round(humidityPerc) : "--"}
				</p>
				<p className="text-2xl truncate font-light">%</p>
			</div>

			<div className="flex flex-col gap-1 text-xs">
				<div className="flex items-center justify-between text-xs">
					<span className="text-white/60 ">Rosny bod</span>
					<span className="font-semibold font-mono">{dewPointC != null ? Math.round(dewPointC) : "--"}°</span>
				</div>
				<div className="flex items-center justify-between text-xs">
					<span className="text-white/60 ">AbsH</span>
					<span className="font-semibold font-mono">{absoluteHumidity != null ? Math.round(absoluteHumidity) : "--"} g/m³</span>
				</div>
			</div>
		</div>
	);
}
