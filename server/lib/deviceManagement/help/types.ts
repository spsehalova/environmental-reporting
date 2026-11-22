import z from "zod";

export enum ResetReason {
	Unknown = 0,
	PowerOn = 1,
	External = 2,
	Software = 3,
	Panic = 4,
	IntWatchdog = 5,
	TaskWatchdog = 6,
	Watchdog = 7,
	DeepSleep = 8,
	Brownout = 9,
	Sdio = 10,
	Usb = 11,
	Jtag = 12,
	Efuse = 13,
	PowerGlitch = 14,
	CpuLockup = 15,
}

export const heartbeatDataSchema = z.object({
	station_id: z.string(),
	mac: z.string(), // STA MAC, e.g. "AA:BB:CC:A1:B2:C3"
	uptime_s: z.number(), // seconds since boot
	free_heap: z.number(), // bytes
	wifi_rssi: z.number(), // dBm, negative
	reset_reason: z.enum(ResetReason), // esp_reset_reason_t, see enum above
});