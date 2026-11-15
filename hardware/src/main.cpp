/*
 * spsehalova/enviromental-mesurements
 */

#include <ArduinoJson.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <Wire.h>
#include <cmath>
#include <cstdint>
#include <set>
// #include <WiFiManager.h>
#include <bsec2.h>
#include <Preferences.h>
#include <sys/_types.h>
#if __has_include(<esp_mac.h>)
#include <esp_mac.h>
#endif
#include "bleWorks.h"
#include "bsecHandling.h"
#include "computedReadings.h"
#include "lux.h"
#include "mqttClient.h"
#include "noiseLevels.h"
#include "pins.h"
#include "secrets.h"
#include "sen63cHandling.h"
#include "statusLed.h"
#include <esp_system.h>

// WiFi
const char *ssid = WIFI_SSID;
const char *password = WIFI_PASS;

const unsigned long PUBLISH_INTERVAL_MS = 60000; // 60s
const unsigned long HEARTBEAT_INTERVAL_MS = 10UL * 60UL * 1000UL; // 10min
const unsigned int BSEC_SAVE_STATE_PERIOD_MS = 60UL * 60UL * 1000UL; // 1h
const unsigned int VTT_MOLD_RISK_COMPUTE_PERIOD_MS = 60UL * 60UL * 1000UL; // 1h
const unsigned long WIFI_RETRY_INTERVAL_MS = 5000; // 5s
const unsigned long DEBUG_PRINT_INTERVAL_MS = 1000; // 1s
const unsigned int RESTART_PERIOD_MS = 14 * 24 * 60UL * 60UL  * 1000UL; // 14 days

// NOTE: setup
void setup() {
	Serial.begin(115200);

	statusLedInit();
	Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);

	setupLuxSensor();
	initNoiseLevel();
	setupBSEC();
	setupBLE();
	setupSEN63C();
	loadVTTCompute();

	// Connecting to a Wi-Fi network
	WiFi.setHostname("envmeasure");
	WiFi.begin(ssid, password);
	while (WiFi.status() != WL_CONNECTED) {
		setStatus(StationStatus::WIFI_CONNECTING);
		Serial.println("Connecting to WiFi..");
	}

	if (WiFi.status() == WL_CONNECT_FAILED) {
		// fatal failure, doesn't retry, needs a manual reset
		while (true) {
			updatePattern(ERR_WIFI_FAILED, 255, 0, 0);
		}
	}

	setupMQTT(MQTT_HOST, MQTT_PORT);
}

void loop() {
	bool wifiConnected = WiFi.status() == WL_CONNECTED;
	if (!wifiConnected) {
		static unsigned long lastWifiAttemptMs = 0;
		unsigned long nowWifi = millis();
		if (lastWifiAttemptMs == 0 || nowWifi - lastWifiAttemptMs >= WIFI_RETRY_INTERVAL_MS) {
			lastWifiAttemptMs = nowWifi;
			Serial.println("WiFi disconnected, reconnecting...");
			WiFi.reconnect();
		}
	}

	mqttClient.loop();
	if (!bsecInitFailed) {
		bsec.run();
	}
	readSEN63C();
	updateBLEScan();

	String clientId = "env-" + WiFi.macAddress();
	bool mqttReady = false;
	if (wifiConnected) {
#if defined(MQTT_USER) && defined(MQTT_PASS)
		mqttReady = mqttEnsureConnected(clientId.c_str(), MQTT_USER, MQTT_PASS);
#else
		mqttReady = mqttEnsureConnected(clientId.c_str());
#endif
	}
	if (bsecInitFailed) {
		updatePattern(ERR_SENSOR_INIT, 255, 0, 0);
	} else if (!mqttReady) {
		updatePattern(ERR_MQTT_FAILED, 255, 0, 0);
	} else if (bsecWarmup) {
		updateWarmupPattern(bsecEnv.iaq);
	} else if (!isnan(bsecEnv.iaq) && bsecEnv.iaq <= 50) {
		// IAQ "Excellent" -> rainbow celebration instead of solid green
		updateRainbow();
	} else {
		updateIAQColor(bsecEnv.iaq);
	}

	unsigned long now = millis();
	static unsigned long lastDebugPrintMs = 0;
	if ((lastDebugPrintMs == 0 || now - lastDebugPrintMs >= DEBUG_PRINT_INTERVAL_MS) && Serial) {
		lastDebugPrintMs = now;
		Serial.printf("Temp: %.2f °C, Humidity: %.2f %%, Pressure: %.2f hPa, IAQ: %.2f (accr %d), eCO2: %.2f ppm, BVOC: %.2f ppm, Lux: %.2f, Noise: %.2f ~dB SPL, PM1.0: %.2f, PM2.5: %.2f, PM4.0: %.2f, PM10.0: %.2f ug/m3, CO2: %.0f ppm, Nearby devices: %d\n",
					  bsecEnv.temperature, bsecEnv.humidity, bsecEnv.pressure,
					  bsecEnv.iaq, bsecEnv.iaqAccuracy, bsecEnv.eco2, bsecEnv.bvoc, getLuxReading(),
					  readNoiseLevel(),
					  sen63cReadings.pm1_0, sen63cReadings.pm2_5, sen63cReadings.pm4_0, sen63cReadings.pm10_0,
					  sen63cReadings.co2, getNearbyDeviceCount());
	}

	if (!mqttReady)
		return;

	static unsigned long lastVTTCompute = 0;
	if ((lastVTTCompute == 0 || now - lastVTTCompute >= VTT_MOLD_RISK_COMPUTE_PERIOD_MS) &&
		(!isnan(bsecEnv.temperature) && !isnan(bsecEnv.humidity))) {
		lastVTTCompute = now;
		saveVTTCompute();
	}
	
	static unsigned long lastPublish = 0;
	if (lastPublish == 0 || now - lastPublish >= PUBLISH_INTERVAL_MS) {
		lastPublish = now;
		publishSensorData(buildMqttTopic(MQTT_TOPIC_PREFIX, STATION_ID, "measurements").c_str());
	}

	static unsigned long lastHeartbeat = 0;
	if (lastHeartbeat == 0 || now - lastHeartbeat >= HEARTBEAT_INTERVAL_MS) {
		lastHeartbeat = now;
		publishHeartbeat(buildMqttTopic(MQTT_TOPIC_PREFIX, STATION_ID, "heartbeat").c_str(), STATION_ID);
	}

	static unsigned long lastBsecSave = 0;
	if ((lastBsecSave == 0 || now - lastBsecSave >= BSEC_SAVE_STATE_PERIOD_MS) &&
		bsecEnv.iaqAccuracy == 3) {
		lastBsecSave = now;
		saveBsecState();
	}

	if (now >= RESTART_PERIOD_MS) {
		Serial.println("Restarting after 14 days...");
		ESP.restart();
	}
}
