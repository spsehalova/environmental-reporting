import { getNiceBackgroundFilter, getNightTintOpacity } from "../lib/niceBackgroundFilter";
import type { DeviceProperty } from "../lib/types";
import { IaqCard } from "./IaqCard";
import { CO2Card } from "./CO2Card";
import { PM25Card } from "./PM25Card";
import { HumidityCard } from "./HumidityCard";
import { LuxCard } from "./LuxCard";
import { VOCCard } from "./VOCCard";
import { NoiseCard } from "./NoiseCard";
import { DevicesCard } from "./DevicesCard";
import { PressureCard } from "./PressureCard";
import { MoldRiskCard } from "./MoldRiskCard";
import { HeatIndexCard } from "./HeatIndexCard";

const CARDS = [
	IaqCard,
	CO2Card,
	PM25Card,
	HumidityCard,
	LuxCard,
	VOCCard,
	NoiseCard,
	DevicesCard,
	PressureCard,
	MoldRiskCard,
	HeatIndexCard,
];

interface DevicePanelProps {
	device: DeviceProperty;
}

export function DevicePanel({ device }: DevicePanelProps) {
	const measurement = device.latestMeasurement ?? {};

	return (
		<div className="w-full h-full shrink-0 snap-center overflow-y-auto flex items-start lg:items-center justify-center">
			<div className="lg:w-[95%] lg:min-h-[90%] lg:h-[90%] w-full min-h-full mx-auto relative lg:rounded-4xl overflow-hidden grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-1">
				<div
					className="absolute inset-0 -z-10 nice-backgound"
					style={{ filter: getNiceBackgroundFilter(measurement.lux) }}
				/>
				<div
					className="absolute inset-0 -z-10 transition-opacity duration-1000"
					style={{
						backgroundColor: "#1c3a66",
						mixBlendMode: "overlay",
						opacity: getNightTintOpacity(measurement.lux),
					}}
				/>
				<div className="progressive-blur-container">
					<div className="blur-filter"></div>
					<div className="blur-filter"></div>
					<div className="blur-filter"></div>
					<div className="blur-filter"></div>
					<div className="blur-filter"></div>
					<div className="blur-filter"></div>
					<div className="blur-filter"></div>
					<div className="gradient"></div>
				</div>

				<div className="absolute inset-0 z-50">
					<span>swjhdswhwfdwf</span>
				</div>

				<div className="flex flex-col justify-center content-center p-6 sm:p-8 text-center gap-2 sm:gap-3 z-100 text-shadow-lg tempback">
					<p className="text-2xl sm:text-3xl">{device.roomName}</p>
					<p className="text-7xl sm:text-8xl lg:text-9xl">{measurement.temperature?.toFixed(0)}°</p>
					<p className="text-lg sm:text-xl">abcd</p>
				</div>
				<div className="lg:col-span-2 lg:row-span-2 flex items-center justify-center content-center p-4 pt-0 lg:p-0 z-100">
					<div className="w-full max-w-[734px] gap-2.5 grid grid-cols-[repeat(auto-fit,minmax(140px,176px))] justify-center">
						{CARDS.map((Card, i) => (
							<Card key={i} measurement={measurement} roomName={device.roomName} />
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
