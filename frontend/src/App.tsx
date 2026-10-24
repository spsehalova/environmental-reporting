import { useEffect, useState } from "react";
import "./index.css";
import { getNiceBackgroundFilter, getNightTintOpacity } from "./lib/niceBackgroundFilter";
import type { DeviceProperty, LatestMeasurement } from "./lib/types";
import { useStatefulObject } from "./lib/useStatefulObject";
import { IaqCard } from "./components/IaqCard";
import { CO2Card } from "./components/CO2Card";
import { PM25Card } from "./components/PM25Card";
import { HumidityCard } from "./components/HumidityCard";
import { LuxCard } from "./components/LuxCard";
import { VOCCard } from "./components/VOCCard";
import { NoiseCard } from "./components/NoiseCard";
import { DevicesCard } from "./components/DevicesCard";
import { PressureCard } from "./components/PressureCard";
import { MoldRiskCard } from "./components/MoldRiskCard";
import { HeatIndexCard } from "./components/HeatIndexCard";

const LUX_ENDPOINT = "http://localhost:8080/device/a";
const LUX_POLL_INTERVAL_MS = 60 * 1000;

export function App() {
	const [latestMeasurement, , setLatestMeasurement] = useStatefulObject<LatestMeasurement>({});
	const [device, setDevice] = useState<DeviceProperty | null>(null);

	useEffect(() => {
		let cancelled = false;

		async function fetchLux() {
			try {
				const res = await fetch(LUX_ENDPOINT);
				const device: DeviceProperty = await res.json();
				if (!cancelled) {
					setLatestMeasurement(device.latestMeasurement ?? {})
					setDevice(device);
				}
			} catch {
				// server unreachable; keep showing the last known lux
			}
		}

		fetchLux();
		const interval = setInterval(fetchLux, LUX_POLL_INTERVAL_MS);
		return () => {
			cancelled = true;
			clearInterval(interval);
		};
	}, []);

	return (
		<div className="w-[95svw] h-[90svh] mx-auto relative rounded-4xl overflow-hidden grid grid-cols-3 grid-rows-1">
			<div
				className="absolute inset-0 -z-10 nice-backgound"
				style={{ filter: getNiceBackgroundFilter(latestMeasurement.lux) }}
			/>
			<div
				className="absolute inset-0 -z-10 transition-opacity duration-1000"
				style={{
					backgroundColor: "#1c3a66",
					mixBlendMode: "overlay",
					opacity: getNightTintOpacity(latestMeasurement.lux),
				}}
			/>
			<div className="col-span-1 flex flex-col justify-center content-center p-8 text-center gap-3">
				<p className="text-3xl">{device?.roomName}</p>
				<p className="text-9xl">{latestMeasurement.temperature?.toFixed(0)}°</p>
				<p className="text-xl">abcd</p>
			</div>
			<div className="col-span-2 row-span-2 flex items-center justify-center content-center">
				<div className="h-fit gap-2.5 grid grid-cols-4 grid-rows-3">
					<IaqCard measurement={latestMeasurement} />
					<CO2Card measurement={latestMeasurement} />
					<PM25Card measurement={latestMeasurement} />
					<HumidityCard measurement={latestMeasurement} />
					<LuxCard measurement={latestMeasurement} />
					<VOCCard measurement={latestMeasurement} />
					<NoiseCard measurement={latestMeasurement} />
					<DevicesCard measurement={latestMeasurement} />
					<PressureCard measurement={latestMeasurement} />
					<MoldRiskCard measurement={latestMeasurement} />
					<HeatIndexCard measurement={latestMeasurement} />
				</div>
			</div>
		</div>
	);
}

export default App;
