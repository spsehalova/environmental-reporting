import { useState } from "react";
import scatterIcon from "../icons/chart-scatter-3d.svg";
import alertTriangleIcon from "../icons/alert-triangle.svg";
import type { LatestMeasurement } from "../lib/types";
import { Icon } from "./Icon";
import { GraphModal } from "./GraphModal";

interface IaqCardProps {
	measurement: LatestMeasurement;
	roomName: string;
}

export function PM25Card({ measurement, roomName }: IaqCardProps) {
	const pm25mgm3 = measurement.pm25Ugm3 ?? null;
	const pm100mgm3 = measurement.pm100Ugm3 ?? null;
	const [modalOpen, setModalOpen] = useState(false);

	return (
		<div
			onClick={() => setModalOpen(true)}
			className="w-full aspect-square rounded-3xl p-5 flex flex-col justify-between bg-mist-900/20 backdrop-blur-3xl text-white cursor-pointer"
		>
			<div className="flex items-center gap-1.5 text-white/60">
				<Icon src={scatterIcon} className="size-4" />
				<span className="text-xs font-semibold uppercase tracking-wide">PM2.5</span>
				{/*{measurement.warmingUp && <Icon src={alertTriangleIcon} className="size-4 text-yellow-300 ml-auto" />}*/}
			</div>

			<div>
				<p className="text-3xl font-medium font-mono leading-none">
					{pm25mgm3 != null ? pm25mgm3.toFixed(2).replace("0.", ".").replace("0,", ",") : "--"}
				</p>
				<p className="text-lg truncate font-light">µg/m³</p>
			</div>

			<div className="flex items-center justify-between gap-1 text-xs">
				<span className="shrink-0 text-white/60">PM10</span>
				<span className="truncate font-semibold font-mono">{pm100mgm3 != null ? pm100mgm3.toFixed(2) : "--"} µg/m³</span>
			</div>

			{modalOpen && (
				<GraphModal
					icon={scatterIcon}
					title="PM2.5"
					roomName={roomName}
					series={[
						{ key: "pm25Ugm3", label: "PM2.5", color: "#E879F9", defaultActive: true },
						{ key: "pm10Ugm3", label: "PM1.0", color: "#5EEAD4", defaultActive: false },
						{ key: "pm40Ugm3", label: "PM4.0", color: "#FBBF24", defaultActive: false },
						{ key: "pm100Ugm3", label: "PM10", color: "#F87171", defaultActive: false },
					]}
					value={pm25mgm3 != null ? pm25mgm3.toFixed(2) : "--"}
					unit="µg/m³"
					onClose={() => setModalOpen(false)}
				/>
			)}
		</div>
	);
}
