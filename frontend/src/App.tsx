import { useEffect, useState } from "react";
import "./index.css";
import type { DeviceProperty } from "./lib/types";
import { DevicePanel } from "./components/DevicePanel";
import { CsvExportModal } from "./components/CsvExportModal";
import { SAMPLE_DEVICES } from "./lib/sampleData";

const DEVICES_ENDPOINT = "/api"; // todo: env
const DEVICES_POLL_INTERVAL_MS = 60 * 1000;

export function App() {
	const [devices, setDevices] = useState<Record<string, DeviceProperty>>({});
	const [zoomFactor, setZoomFactor] = useState(1);
	const [csvModalOpen, setCsvModalOpen] = useState(false);

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

	// No real device reachable (sensor offline, or still loading) — fall back
	// to a sample device so the dashboard stays demoable without hardware.
	const usingSample = Object.keys(devices).length === 0 && window.localStorage.getItem("allowSampleData") === "yes";
	const displayDevices = usingSample ? SAMPLE_DEVICES : devices;

	return (
		<div
			id="app-root"
			className="no-scrollbar fixed top-0 left-0 flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory"
			style={{
				width: `${100 / zoomFactor}vw`,
				height: `${100 / zoomFactor}vh`,
				transform: `scale(${zoomFactor})`,
				transformOrigin: "top left",
			}}
		>
			{Object.entries(displayDevices).map(([slug, device]) => (
				<DevicePanel key={slug} device={device} />
			))}

			{usingSample && (
				<span className="fixed top-4 left-1/2 z-100 -translate-x-1/2 rounded-full bg-amber-500/90 px-3 py-1 text-xs font-semibold text-black shadow-lg">
					Sample dáta
				</span>
			)}

			<button
				type="button"
				onClick={() => setCsvModalOpen(true)}
				className="fixed bottom-4 left-1/2 z-100 -translate-x-1/2 rounded-full bg-mist-900/60 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur-xl hover:bg-mist-900/80"
			>
				Stiahnuť CSV
			</button>

			{csvModalOpen && (
				<CsvExportModal roomNames={Object.keys(displayDevices)} onClose={() => setCsvModalOpen(false)} />
			)}
		</div>
	);
}

export default App;
