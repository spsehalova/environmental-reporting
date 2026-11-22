import z from "zod";
import { DeviceManager, devicePropertySchema, type DeviceProperty } from "../../../deviceManagement";
import { baseElysiaApp } from "../../index";

baseElysiaApp
	.get("/api", () => {
		let returning: { [roomName: string]: DeviceProperty } = {}
		for (const [roomName, device] of DeviceManager.devices.entries()) {
			returning[roomName] = device;
		}
		return returning;
	}, {
		detail: {
			summary: "List devices",
			description: "Returns a list of all devices and their properties.",
			tags: ["Devices"],
		},
		response: {
			200: z.record(z.string(), devicePropertySchema),
		},
	})