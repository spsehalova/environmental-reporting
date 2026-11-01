import { useState } from "react";
import rippleDropletIcon from "../icons/ripple-droplet.svg";
import alertTriangleIcon from "../icons/alert-triangle.svg";
import type { LatestMeasurement } from "../lib/types";
import { Icon } from "./Icon";
import { GraphModal } from "./GraphModal";

interface IaqCardProps {
	measurement: LatestMeasurement;
	roomName: string;
}

export function HumidityCard({ measurement, roomName }: IaqCardProps) {
	const humidityPerc = measurement.humidity ?? null;
	const dewPointC = measurement.dewPointC ?? null;
	const absoluteHumidity = measurement.absHumidityGm3 ?? null;
	const [modalOpen, setModalOpen] = useState(false);

	return (
		<div
			onClick={() => setModalOpen(true)}
			className="w-full aspect-square rounded-3xl p-4 flex flex-col justify-between bg-mist-900/20 backdrop-blur-3xl text-white cursor-pointer"
		>
			<div className="flex items-center gap-1.5 text-white/60">
				<Icon src={rippleDropletIcon} className="size-4" />
				<span className="text-xs font-semibold uppercase tracking-wide">Vlhkosť</span>
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
					<span className="text-white/60 ">Rosný bod</span>
					<span className="font-semibold font-mono">{dewPointC != null ? Math.round(dewPointC) : "--"}°</span>
				</div>
				<div className="flex items-center justify-between text-xs">
					<span className="text-white/60 ">AbsH</span>
					<span className="font-semibold font-mono">{absoluteHumidity != null ? Math.round(absoluteHumidity) : "--"} g/m³</span>
				</div>
			</div>

			{modalOpen && (
				<GraphModal
					icon={rippleDropletIcon}
					title="Vlhkosť"
					roomName={roomName}
					series={[{ key: "humidity", label: "Vlhkosť", color: "#38BDF8" }]}
					value={humidityPerc != null ? Math.round(humidityPerc).toString() : "--"}
					unit="%"
					yDomain={{ min: 0, max: 100 }}
					gradientStops={[
						{ offset: 0, color: "#A78BFA" },
						{ offset: 45, color: "#60A5FA" },
						{ offset: 100, color: "#34D399" },
					]}
					onClose={() => setModalOpen(false)}
				/>
			)}
		</div>
	);
}
