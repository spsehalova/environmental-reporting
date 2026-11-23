#include "mqttClient.h"
#include "bleWorks.h"
#include "bsecHandling.h"
#include "lux.h"
#include "noiseLevels.h"
#include <ArduinoJson.h>
#include <WiFi.h>
#include <esp_system.h>
#include "computedReadings.h"
#include "sen63cHandling.h"

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

void setupMQTT(const char *broker, uint16_t port) {
	mqttClient.setServer(broker, port);
	mqttClient.setBufferSize(768); // our payload is bigger than the default size
}

String buildMqttTopic(const char *prefix, const char *stationId, const char *type) {
	return String(prefix) + "/" + stationId + "/" + type;
}

bool mqttEnsureConnected(const char *clientId, const char *user, const char *pass) {
	if (mqttClient.connected())
		return true;

	// throttling for the client
	// we dont want to spam the broaker
	static unsigned long lastAttemptMs = 0;
	const unsigned long retryIntervalMs = 5000;
	unsigned long now = millis();
	if (lastAttemptMs != 0 && now - lastAttemptMs < retryIntervalMs)
		return false;
	lastAttemptMs = now;

	Serial.print("Looking for the MQTT broker...");
	bool connected = (user && pass && user[0] != '\0')
						  ? mqttClient.connect(clientId, user, pass)
						  : mqttClient.connect(clientId);
	if (connected) {
		Serial.println(" connected.");
	} else {
		Serial.print(" failed, rc=");
		Serial.println(mqttClient.state());
	}
	return connected;
}

void publishSensorData(const char *topic) {
	Serial.printf("Publishing sensor data to MQTT topic '%s'...\n", topic);
	StaticJsonDocument<768> doc;
	doc["temperature"] = bsecEnv.temperature;
	doc["humidity"] = bsecEnv.humidity;
	doc["pressure_hpa"] = bsecEnv.pressure;
	doc["iaq"] = bsecEnv.iaq;
	doc["iaq_accuracy"] = bsecEnv.iaqAccuracy;
	doc["static_iaq"] = bsecEnv.staticIaq;
	doc["eco2_ppm"] = bsecEnv.eco2;
	doc["bvoc_ppm"] = bsecEnv.bvoc;
	doc["compensated_gas_ohm"] = bsecEnv.compensatedGas;
	doc["gas_percentage"] = bsecEnv.gasPercentage;
	doc["warming_up"] = bsecWarmup;
	doc["lux"] = getLuxReading();
	doc["noise_db_rel"] = readNoiseLevel();
	doc["pm1_0_ugm3"] = sen63cReadings.pm1_0;
	doc["pm2_5_ugm3"] = sen63cReadings.pm2_5;
	doc["pm4_0_ugm3"] = sen63cReadings.pm4_0;
	doc["pm10_0_ugm3"] = sen63cReadings.pm10_0;
	doc["co2_ppm"] = sen63cReadings.co2;
	doc["nearby_devices"] = getNearbyDeviceCount();
	doc["dew_point_c"] = computeDewPoint(bsecEnv.temperature, bsecEnv.humidity);
	doc["abs_humidity_gm3"] =
		computeAbsoluteHumidity(bsecEnv.temperature, bsecEnv.humidity);
	doc["mold_risk_index"] = VTTMoldRiskValue;
	doc["heat_index_c"] = computeHeatIndexC(bsecEnv.temperature, bsecEnv.humidity);

	char payload[768];
	size_t len = serializeJson(doc, payload);

	bool sent = mqttClient.publish(topic, payload, len);
	Serial.print(sent ? "MQTT published: " : "MQTT publish failed: ");
	Serial.println(payload);
}

void publishHeartbeat(const char *topic, const char *stationId) {
	StaticJsonDocument<256> doc;
	doc["station_id"] = stationId;
	doc["mac"] = WiFi.macAddress();
	doc["uptime_s"] = millis() / 1000UL;
	doc["free_heap"] = ESP.getFreeHeap();
	doc["wifi_rssi"] = WiFi.RSSI();
	/** esp_reset_reason_t values line up 1:1 with the server's ResetReason enum */
	doc["reset_reason"] = (int)esp_reset_reason();

	char payload[256];
	size_t len = serializeJson(doc, payload);

	bool sent = mqttClient.publish(topic, payload, len);
	Serial.print(sent ? "MQTT heartbeat published: " : "MQTT heartbeat publish failed: ");
	Serial.println(payload);
}
