import type { LatestMeasurement } from "../lib/types";
import moldIcon from "../icons/fold.svg";
import { Icon } from "./Icon";

interface MoldRiskCardProps {
	measurement: LatestMeasurement;
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

export function MoldRiskCard({ measurement }: MoldRiskCardProps) {
	const moldRiskIndex = measurement.moldRiskIndex ?? null;
	const dewPointC = measurement.dewPointC ?? null;

	const levelIndex = moldRiskIndex != null ? Math.min(Math.max(moldRiskIndex, 0), RISK_LEVELS.length - 1) : 0;
	const segmentsLit = moldRiskIndex != null ? levelIndex + 1 : 0;
	const level = RISK_LEVELS[levelIndex] ?? RISK_LEVELS[0]!;

	return (
		<div className="w-44 h-44 rounded-3xl p-4 flex flex-col justify-between bg-mist-900/20 backdrop-blur-3xl text-white">
			<div className="flex items-center gap-1.5 text-white/60">
				<Icon src={moldIcon} className="size-4" />
				<span className="text-xs font-semibold uppercase tracking-wide">Plesen</span>
			</div>

			<div>
				<p className="text-2xl font-medium font-mono leading-none">
					{moldRiskIndex != null ? moldRiskIndex : "--"}
				</p>
				<p className="text-2xl truncate">{moldRiskIndex != null ? level.label : "Unknown"}</p>
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
				<span className="text-white/60">Rosny bod</span>
				<span className="font-semibold font-mono">{dewPointC != null ? Math.round(dewPointC) : "--"}°</span>
			</div>
		</div>
	);
}

function MoldIcon({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" className={className}>
			<path d="M5 20V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
			<path
				d="M5 4L17 9L5 14"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
