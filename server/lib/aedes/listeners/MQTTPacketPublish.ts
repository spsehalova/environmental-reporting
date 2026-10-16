import type { AedesPublishPacket, Client } from "aedes";
import { db } from "../../../db";
import { measurements } from "../../../db/schema";
import { DeviceManager } from "../../deviceManagement";

export async function onMQTTPacketPublish(packet: AedesPublishPacket, client: Client | null) {
	let category = categorizeTopic(packet.topic);
	if (!category) return;

	let json: unknown;
	try {
		json = JSON.parse(packet.payload.toString());
	} catch (error) {
		console.error(`Invalid JSON payload from room [${category.roomName}]:`, error);
		return;
	}

	switch (category.type) {
		case "mesuraments": {
			let snapshot = DeviceManager.pushMeasurementData(category.roomName, json);
			if (!snapshot) break;

			await db.insert(measurements).values(snapshot);
			break;
		}
		case "heartbeat":
			DeviceManager.pushDeviceData(category.roomName, json);
			break;
		default:
			console.log(`Unknown message type received on topic [${packet.topic}]: ${packet.payload.toString()}`);
	}
}

function categorizeTopic(topic: string) {
	let type: "mesuraments" | "heartbeat" | "unknown" = "unknown";
	let [_, roomName, typeReported] = /^sensors\/(.*)\/(.*)$/.exec(topic) || [];

	if (!roomName || !type) {
		return null;
	}

	switch (typeReported) {
		case "heartbeat":
			type = "heartbeat";
			break;
		case "measurements":
			type = "mesuraments";
			break;
		default:
			type = "unknown";
	}

	return { roomName, type };
}