import { useState } from "react";
import grainIcon from "../icons/grain.svg";
import alertTriangleIcon from "../icons/alert-triangle.svg";
import circleIcon from "../icons/circle.svg";
import { getIaqCategory, getIaqPercent } from "../lib/iaq";
import type { LatestMeasurement } from "../lib/types";
import { Icon } from "./Icon";
import { IaqModal } from "./IaqModal";

interface IaqCardProps {
	measurement: LatestMeasurement;
	roomName: string;
}

export function IaqCard({ measurement, roomName }: IaqCardProps) {
	const iaq = measurement.iaq ?? null;
	const staticIaq = measurement.staticIaq ?? null;
	const category = getIaqCategory(iaq);
	const percent = getIaqPercent(iaq);
	const [modalOpen, setModalOpen] = useState(false);

	return (
		<div
			onClick={() => setModalOpen(true)}
			className="w-full aspect-square rounded-3xl p-5 flex flex-col justify-between bg-mist-900/20 backdrop-blur-3xl text-white cursor-pointer"
		>
			<div className="flex items-center gap-1.5 text-white/60">
				<Icon src={grainIcon} className="size-4" />
				<span className="text-xs font-semibold uppercase tracking-wide">IAQ</span>
				{measurement.warmingUp
					? <Icon src={alertTriangleIcon} className="size-4 text-yellow-300 ml-auto" />
					: <Icon src={circleIcon} className="size-4 ml-auto" style={{ color: category?.color }} />
				}
			</div>

			<div>
				<p className="text-3xl font-medium leading-none font-mono">{iaq != null ? Math.round(iaq) : "--"}</p>
				<p className="text-lg truncate font-light">{category?.shortLabel ?? "Unknown"}</p>
			</div>

			<div className="relative h-1 shrink-0 rounded-full bg-[linear-gradient(90deg,#4792F2_0%,#5DC89B_10%,#99DF6D_20%,#EAE656_30%,#EFA253_40%,#E85252_50%,#B22E41_70%,#75212D_100%)]">
				<div
					className="absolute top-1/2 flex flex-col items-center -translate-y-1/2 -translate-x-1/2"
					style={{ left: `${percent}%` }}
				>
					<div className="size-3 rounded-full bg-white shadow" />
				</div>
			</div>

			<div className="flex items-center justify-between text-xs">
				<span className="text-white/60">sIAQ</span>
				<span className="font-semibold font-mono">{staticIaq != null ? Math.round(staticIaq) : "--"}</span>
			</div>

			{modalOpen && <IaqModal roomName={roomName} measurement={measurement} onClose={() => setModalOpen(false)} />}
		</div>
	);
}
