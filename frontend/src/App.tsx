import { useEffect, useState } from "react";
import "./index.css";
import type { DeviceProperty } from "./lib/types";
import { DevicePanel } from "./components/DevicePanel";

const DEVICES_ENDPOINT = "http://localhost:8080/";
const DEVICES_POLL_INTERVAL_MS = 60 * 1000;

export function App() {
	const [devices, setDevices] = useState<Record<string, DeviceProperty>>({});
	const [zoomFactor, setZoomFactor] = useState(1);

	useEffect(() => {
		const zoom = Number(new URLSearchParams(window.location.search).get("zoom"));
		if (Number.isFinite(zoom) && zoom > 0) {
			setZoomFactor(zoom / 100);
		}
	}, []);

	useEffect(() => {
		let cancelled = false;

		async function fetchDevices() {
			try {
				const res = await fetch(DEVICES_ENDPOINT);
				const data: Record<string, DeviceProperty> = await res.json();
				if (!cancelled) {
					setDevices(data);
				}
			} catch {
				// server unreachable; keep showing the last known devices
			}
		}

		fetchDevices();
		const interval = setInterval(fetchDevices, DEVICES_POLL_INTERVAL_MS);
		return () => {
			cancelled = true;
			clearInterval(interval);
		};
	}, []);

	return (
		<div
			className="no-scrollbar fixed top-0 left-0 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory"
			style={{
				width: `${100 / zoomFactor}vw`,
				height: `${100 / zoomFactor}vh`,
				transform: `scale(${zoomFactor})`,
				transformOrigin: "top left",
			}}
		>
			{Object.entries(devices).map(([slug, device]) => (
				<DevicePanel key={slug} device={device} />
			))}
		</div>
	);
}

export default App;
