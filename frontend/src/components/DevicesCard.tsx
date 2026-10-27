import { useId } from "react";
import devicesIcon from "../icons/devices.svg";
import type { LatestMeasurement } from "../lib/types";
import { Icon } from "./Icon";

interface DevicesCardProps {
	measurement: LatestMeasurement;
}

function RadarGradient({ id }: { id: string }) {
	return (
		<radialGradient
			id={id}
			cx="0"
			cy="0"
			r="1"
			gradientUnits="userSpaceOnUse"
			gradientTransform="translate(76 30.5) rotate(28.0725) scale(68 142.387)"
		>
			<animateTransform
				attributeName="gradientTransform"
				type="rotate"
				additive="sum"
				from="0 0 0"
				to="360 0 0"
				dur="14s"
				repeatCount="indefinite"
			/>
			<stop stopColor="white" stopOpacity="0">
				<animate attributeName="offset" values="0.25;0.4;0.25" dur="3.5s" repeatCount="indefinite" />
			</stop>
			<stop offset="0.622754" stopColor="white" />
			<stop stopColor="white" stopOpacity="0">
				<animate attributeName="offset" values="1;0.88;1" dur="3.5s" repeatCount="indefinite" />
			</stop>
		</radialGradient>
	);
}

export function DevicesCard({ measurement }: DevicesCardProps) {
	const deviceCount = measurement.nearbyDevices ?? null;
	const id = useId();

	return (
		<div className="relative w-full aspect-square rounded-3xl p-4 flex flex-col overflow-hidden bg-mist-900/20 backdrop-blur-3xl text-white">
			<div className="flex items-center gap-1.5 text-white/60">
				<Icon src={devicesIcon} className="size-4" />
				<span className="text-xs font-semibold uppercase tracking-wide">Zariadenia</span>
			</div>

			<svg
				viewBox="0 0 151 111"
				fill="none"
				className="absolute inset-x-0 bottom-0 w-full pointer-events-none opacity-70"
				xmlns="http://www.w3.org/2000/svg"
			>
				<defs>
					<RadarGradient id={`${id}-0`} />
					<RadarGradient id={`${id}-1`} />
					<RadarGradient id={`${id}-2`} />
					<clipPath id={`${id}-clip`}>
						<rect width="151" height="111" fill="white" />
					</clipPath>
				</defs>
				<g clipPath={`url(#${id}-clip)`}>
					<g opacity="0.7">
						<animate attributeName="opacity" values="0.45;0.85;0.45" dur="3s" repeatCount="indefinite" />
						<animateTransform
							attributeName="transform"
							type="rotate"
							values="-4 76 75;4 76 75;-4 76 75"
							dur="6s"
							repeatCount="indefinite"
						/>
						<path
							d="M149 75.5C149 34.9071 116.093 2 75.5 2C34.9071 2 2 34.9071 2 75.5C2 116.093 34.9071 149 75.5 149V151C33.8025 151 0 117.197 0 75.5C0 33.8025 33.8025 0 75.5 0C117.197 0 151 33.8025 151 75.5C151 117.197 117.197 151 75.5 151V149C116.093 149 149 116.093 149 75.5Z"
							fill={`url(#${id}-0)`}
						/>
						<path
							d="M129 75C129 45.7289 105.271 22 76 22C46.7289 22 23 45.7289 23 75C23 104.271 46.7289 128 76 128V130C45.6243 130 21 105.376 21 75C21 44.6243 45.6243 20 76 20C106.376 20 131 44.6243 131 75C131 105.376 106.376 130 76 130V128C105.271 128 129 104.271 129 75Z"
							fill={`url(#${id}-1)`}
						/>
						<path
							d="M108 74.5C108 56.5507 93.4492 42 75.5 42C57.5507 42 43 56.5507 43 74.5C43 92.4492 57.5507 107 75.5 107V109C56.4462 109 41 93.5538 41 74.5C41 55.4462 56.4462 40 75.5 40C94.5538 40 110 55.4462 110 74.5C110 93.5538 94.5538 109 75.5 109V107C93.4492 107 108 92.4492 108 74.5Z"
							fill={`url(#${id}-2)`}
						/>
					</g>
				</g>
			</svg>

			<div className="relative flex-1 flex items-center justify-center">
				<p className="text-6xl font-medium font-mono leading-none">{deviceCount != null ? deviceCount : "--"}</p>
			</div>
		</div>
	);
}
