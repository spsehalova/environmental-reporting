import z from "zod";
import { DeviceManager, devicePropertySchema } from "../../../deviceManagement";
import { baseElysiaApp } from "../../index";

baseElysiaApp
	.get(
		"/api/device/:roomName",
		({ params, set }) => {
			const device = DeviceManager.getDeviceProperty(params.roomName);
			if (!device) {
				set.status = 404;
				return { error: "Device not found" };
			}
			return device;
		},
		{
			params: z.object({
				roomName: z.string().meta({
					description: "The name of the room to retrieve the device for.",
					examples: ["jedalen", "a"],
				}),
			}),
			detail: {
				summary: "Get a device",
				description: "Returns a single device and its properties.",
				tags: ["Devices"],
			},
			response: {
				200: devicePropertySchema,
				404: z.object({
					error: z.string(),
				}),
			},
		},
	)