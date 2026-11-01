import { useState } from "react";
import matrixIcon from "../icons/matrix.svg";
import alertTriangleIcon from "../icons/alert-triangle.svg";
import type { LatestMeasurement } from "../lib/types";
import { Icon } from "./Icon";
import { GraphModal } from "./GraphModal";

interface IaqCardProps {
	measurement: LatestMeasurement;
	roomName: string;
}

export function VOCCard({ measurement, roomName }: IaqCardProps) {
	const bVOCppm = measurement.bvocPpm ?? null;
	const gasPerc = measurement.gasPercentage ?? null;
	const [modalOpen, setModalOpen] = useState(false);

	return (
		<div
			onClick={() => setModalOpen(true)}
			className="w-full aspect-square rounded-3xl p-4 flex flex-col justify-between bg-mist-900/20 backdrop-blur-3xl text-white cursor-pointer"
		>
			<div className="flex items-center gap-1.5 text-white/60">
				<Icon src={matrixIcon} className="size-4" />
				<span className="text-xs font-semibold uppercase tracking-wide">bVOC</span>
				{measurement.warmingUp && <Icon src={alertTriangleIcon} className="size-4 text-yellow-300 ml-auto" />}
			</div>

			<div className="">
				<p className="text-4xl font-medium font-mono leading-none">
					{bVOCppm != null ? bVOCppm.toFixed(3).replace("0.", ".").replace("0,", ",") : "--"}
				</p>
				<p className="text-2xl truncate font-light">ppm</p>
			</div>

			<div className="flex flex-col gap-1 text-xs">
				<div className="flex items-center justify-between text-xs">
					<span className="text-white/60 ">Gas %</span>
					<span className="font-semibold font-mono">{gasPerc != null ? gasPerc.toFixed(2) : "--"}%</span>
				</div>
			</div>

			{modalOpen && (
				<GraphModal
					icon={matrixIcon}
					title="bVOC"
					roomName={roomName}
					series={[
						{ key: "bvocPpm", label: "bVOC", color: "#F472B6", defaultActive: true },
						{ key: "gasPercentage", label: "Gas %", color: "#FFFFFF", defaultActive: false}
					]}
					value={bVOCppm != null ? bVOCppm.toFixed(3) : "--"}
					unit="ppm"
					onClose={() => setModalOpen(false)}
					yDomain={{ min: 0, max: 100 }}
				/>
			)}
		</div>
	);
}
