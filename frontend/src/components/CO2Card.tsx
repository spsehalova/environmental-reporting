import { useState } from "react";
import filterIcon from "../icons/color-filter.svg";
import alertTriangleIcon from "../icons/alert-triangle.svg";
import type { LatestMeasurement } from "../lib/types";
import { Icon } from "./Icon";
import { GraphModal } from "./GraphModal";

interface IaqCardProps {
	measurement: LatestMeasurement;
	roomName: string;
}

export function CO2Card({ measurement, roomName }: IaqCardProps) {
	const co2ppm = measurement.co2Ppm ?? null;
	const eco2ppm = measurement.eco2Ppm ?? null;
	const [modalOpen, setModalOpen] = useState(false);

	return (
		<div
			onClick={() => setModalOpen(true)}
			className="w-full aspect-square rounded-3xl p-4 flex flex-col justify-between bg-mist-900/20 backdrop-blur-3xl text-white cursor-pointer"
		>
			<div className="flex items-center gap-1.5 text-white/60">
				<Icon src={filterIcon} className="size-4" />
				<span className="text-xs font-semibold uppercase tracking-wide">CO2</span>
			</div>

			<div>
				<p className="text-4xl font-medium font-mono leading-none">{co2ppm != null ? Math.round(co2ppm) : "--"}</p>
				<p className="text-2xl truncate font-light">ppm</p>
			</div>

			<div className="flex items-center justify-between text-xs">
				<span className="text-white/60 ">eCO₂</span>
				<span className="font-semibold font-mono">{eco2ppm != null ? Math.round(eco2ppm) : "--"}</span>
			</div>

			{modalOpen && (
				<GraphModal
					icon={filterIcon}
					title="CO2"
					roomName={roomName}
					series={[
						{ key: "co2Ppm", label: "CO2", color: "#60A5FA", defaultActive: true },
						{ key: "eco2Ppm", label: "eCO₂", color: "#5EEAD4", defaultActive: false },
					]}
					value={co2ppm != null ? Math.round(co2ppm).toString() : "--"}
					unit="ppm"
					onClose={() => setModalOpen(false)}
				/>
			)}
		</div>
	);
}
