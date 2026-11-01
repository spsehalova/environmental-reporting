import grainIcon from "../icons/grain.svg";
import { getIaqCategory, IAQ_CATEGORIES } from "../lib/iaq";
import type { LatestMeasurement } from "../lib/types";
import { GraphModal, type GradientStop } from "./GraphModal";

interface IaqModalProps {
	roomName: string;
	measurement: LatestMeasurement;
	onClose: () => void;
}

// The BME680 IAQ index is formally bounded 0-500 (matching getIaqCategory's
// own clamp), so the gradient/axis domain is fixed rather than data-driven.
const IAQ_DOMAIN_MAX = 500;

const IAQ_GRADIENT_STOPS: GradientStop[] = [0, ...IAQ_CATEGORIES.map((c) => c.min), IAQ_DOMAIN_MAX]
	.filter((value, index, all) => value <= IAQ_DOMAIN_MAX && all.indexOf(value) === index)
	.map((value) => ({
		offset: (1 - value / IAQ_DOMAIN_MAX) * 100,
		color: getIaqCategory(value)?.color ?? "#9CA3AF",
	}))
	.sort((a, b) => a.offset - b.offset);

export function IaqModal({ roomName, measurement, onClose }: IaqModalProps) {
	const iaq = measurement.iaq ?? null;
	const category = getIaqCategory(iaq);

	return (
		<GraphModal
			icon={grainIcon}
			title="IAQ"
			roomName={roomName}
			series={[
				{ key: "iaq", label: "IAQ", color: category?.color ?? "#9CA3AF", defaultActive: true },
				{ key: "staticIaq", label: "sIAQ", color: "#FFFFFF", defaultActive: false },
			]}
			value={iaq != null ? Math.round(iaq).toString() : "--"}
			subLabel={category?.label ?? "Neznáme"}
			summary={`Kvalita vzduchu je dnes ${category ? category.label.toLowerCase() : "neznáma"}.`}
			yDomain={{ min: 0, max: IAQ_DOMAIN_MAX }}
			gradientStops={IAQ_GRADIENT_STOPS}
			warmupVariable="warmingUp"
			mainFactor={{ subtitle: "—", text: "(text dopĺňa redakcia)" }}
			details={[
				{ abbr: "sIAQ", label: "Statická kvalita vzduchu", value: measurement.staticIaq ?? null },
				{ abbr: "eCO₂", label: "Ekvivalentný CO₂", value: measurement.eco2Ppm ?? null, unit: "ppm" },
				{ abbr: "bVOC", label: "Prchavé org. látky", value: measurement.bvocPpm ?? null, unit: "ppm" },
				{ abbr: "Gas", label: "Percento plynu", value: measurement.gasPercentage ?? null, unit: "%" },
				{ abbr: "Acc", label: "Presnosť merania", value: measurement.iaqAccuracy ?? null },
			]}
			onClose={onClose}
		/>
	);
}
