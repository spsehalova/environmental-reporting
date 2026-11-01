import { useState } from "react";
import type { LatestMeasurement } from "../lib/types";
import moldIcon from "../icons/fold.svg";
import { Icon } from "./Icon";
import { GraphModal } from "./GraphModal";

interface MoldRiskCardProps {
	measurement: LatestMeasurement;
	roomName: string;
}

interface RiskLevel {
	label: string;
	color: string;
}

// Same color language as the IAQ/Noise gradient (#4792F2 → #65DB7C → #F5E753 → #E63A52 → #75212D).
const RISK_LEVELS: RiskLevel[] = [
	{ label: "Nízky risk", color: "#65DB7C" },
	{ label: "Mierny risk", color: "#F5E753" },
	{ label: "Vysoký risk", color: "#E63A52" },
	{ label: "Veľmi vysoký risk", color: "#75212D" },
];

const SEGMENT_WIDTH = 31.5;
const SEGMENT_GAP = 2;

export function MoldRiskCard({ measurement, roomName }: MoldRiskCardProps) {
	const moldRiskIndex = measurement.moldRiskIndex ?? null;
	const dewPointC = measurement.dewPointC ?? null;
	const [modalOpen, setModalOpen] = useState(false);

	const levelIndex = moldRiskIndex != null ? Math.min(Math.max(moldRiskIndex, 0), RISK_LEVELS.length - 1) : 0;
	const segmentsLit = moldRiskIndex != null ? levelIndex + 1 : 0;
	const level = RISK_LEVELS[levelIndex] ?? RISK_LEVELS[0]!;

	return (
		<div
			onClick={() => setModalOpen(true)}
			className="w-full aspect-square rounded-3xl p-4 flex flex-col justify-between bg-mist-900/20 backdrop-blur-3xl text-white cursor-pointer"
		>
			<div className="flex items-center gap-1.5 text-white/60">
				<Icon src={moldIcon} className="size-4" />
				<span className="text-xs font-semibold uppercase tracking-wide">Pleseň</span>
			</div>

			<div>
				<p className="text-2xl font-medium font-mono leading-none">
					{moldRiskIndex != null ? moldRiskIndex : "--"}
				</p>
				<p className="text-2xl truncate">{moldRiskIndex != null ? level.label : "Neznáme"}</p>
			</div>

			<svg viewBox="0 0 132 7" className="w-full shrink-0" fill="none">
				{RISK_LEVELS.map((_, i) => (
					<rect
						key={i}
						x={i * (SEGMENT_WIDTH + SEGMENT_GAP)}
						width={SEGMENT_WIDTH}
						height="7"
						rx="3.5"
						fill={i < segmentsLit ? level.color : "white"}
						fillOpacity={i < segmentsLit ? 1 : 0.3}
					/>
				))}
			</svg>

			<div className="flex items-center justify-between text-xs">
				<span className="text-white/60">Rosný bod</span>
				<span className="font-semibold font-mono">{dewPointC != null ? Math.round(dewPointC) : "--"}°</span>
			</div>

			{modalOpen && (
				<GraphModal
					icon={moldIcon}
					title="Pleseň"
					roomName={roomName}
					series={[{ key: "moldRiskIndex", label: "Pleseň", color: level.color }]}
					value={moldRiskIndex != null ? moldRiskIndex.toString() : "--"}
					summary={moldRiskIndex != null ? level.label : undefined}
					onClose={() => setModalOpen(false)}
				/>
			)}
		</div>
	);
}
