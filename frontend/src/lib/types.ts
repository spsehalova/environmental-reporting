export interface LatestMeasurement {
	temperature?: number | null;
	humidity?: number | null;
	pressureHpa?: number | null;
	iaq?: number | null;
	staticIaq?: number | null;
	iaqAccuracy?: number | null;
	eco2Ppm?: number | null;
	bvocPpm?: number | null;
	compensatedGasOhm?: number | null;
	gasPercentage?: number | null;
	warmingUp?: boolean | null;
	lux?: number | null;
	noiseDbRel?: number | null;
	dustMgm3?: number | null;
	nearbyDevices?: number | null;
	dewPointC?: number | null;
	absHumidityGm3?: number | null;
	moldRiskIndex?: number | null;
	heatIndexC?: number | null;
}

export interface DeviceProperty {
	roomName: string;
	macAddress: string;
	state: "ok" | "errored" | "offline";
	lastReportedAt: string;
	latestMeasurement?: LatestMeasurement;
}
