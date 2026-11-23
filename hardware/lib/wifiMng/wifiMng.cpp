#include <prefs.h>
#include <WiFi.h>
#include <wifiMng.h>
#if __has_include(<esp_mac.h>)
#include <esp_mac.h>
#endif
#include "pins.h"
#include "secrets.h"

WiFiManager wifiManager;

static const char *PREFS_NAMESPACE = "wifimng";
static WifiMngConfig cachedConfig;

const WifiMngConfig &getWifiConfig() { return cachedConfig; }

// last 6 hex chars of the station's own MAC, used so each of the 4 stations
// gets a distinct hostname/room-name default without any manual config
static String macSuffix() {
	String mac = WiFi.macAddress();
	mac.replace(":", "");
	return mac.substring(mac.length() - 6);
}

void setupWifi() {
	pinMode(PIN_BOOT_BUTTON, INPUT_PULLUP);

	cachedConfig.roomName = loadPref(PREFS_NAMESPACE, "roomName", "");
	cachedConfig.mqttServer = loadPref(PREFS_NAMESPACE, "mqttServer", MQTT_HOST);
	cachedConfig.mqttPort = loadPref(PREFS_NAMESPACE, "mqttPort", String(MQTT_PORT)).toInt();
	cachedConfig.mqttUser = loadPref(PREFS_NAMESPACE, "mqttUser", "");
	cachedConfig.mqttPass = loadPref(PREFS_NAMESPACE, "mqttPass", "");

	String suffix = macSuffix();
	if (cachedConfig.roomName.length() == 0) {
		cachedConfig.roomName = "env-" + suffix;
	}
	wifiManager.setHostname(("envmeasure-" + suffix).c_str());

	WiFiManagerParameter driver_room_name("roomName", "room name", cachedConfig.roomName.c_str(), 16);
	wifiManager.addParameter(&driver_room_name);
	WiFiManagerParameter driver_mqtt_server("mqttServer", "mqtt server", cachedConfig.mqttServer.c_str(), 40);
	wifiManager.addParameter(&driver_mqtt_server);
	WiFiManagerParameter driver_mqtt_port("mqttPort", "mqtt port", String(cachedConfig.mqttPort).c_str(), 6);
	wifiManager.addParameter(&driver_mqtt_port);
	WiFiManagerParameter driver_mqtt_user("mqttUser", "mqtt user", cachedConfig.mqttUser.c_str(), 64);
	wifiManager.addParameter(&driver_mqtt_user);
	WiFiManagerParameter driver_mqtt_pass("mqttPass", "mqtt password", cachedConfig.mqttPass.c_str(), 64);
	wifiManager.addParameter(&driver_mqtt_pass);

	// Who I'am
	String macInfo = "<p>MAC Addr: " + WiFi.macAddress() + "</p>";
	WiFiManagerParameter custom_text(macInfo.c_str());
	wifiManager.addParameter(&custom_text);

	// Saving Setup Preferences
	wifiManager.setSaveParamsCallback([&]() {
		cachedConfig.roomName = driver_room_name.getValue();
		cachedConfig.mqttServer = driver_mqtt_server.getValue();
		cachedConfig.mqttPort = String(driver_mqtt_port.getValue()).toInt();
		cachedConfig.mqttUser = driver_mqtt_user.getValue();
		cachedConfig.mqttPass = driver_mqtt_pass.getValue();

		prefs.begin(PREFS_NAMESPACE, false);
		prefs.putString("roomName", cachedConfig.roomName);
		prefs.putString("mqttServer", cachedConfig.mqttServer);
		prefs.putString("mqttPort", driver_mqtt_port.getValue());
		prefs.putString("mqttUser", cachedConfig.mqttUser);
		prefs.putString("mqttPass", cachedConfig.mqttPass);
		prefs.end();
	});

	wifiManager.autoConnect();
}

static void wipeConfigAndRestart() {
	Serial.println("Triple click: wiping WiFi + station config, restarting into setup portal...");
	wifiManager.resetSettings();
	prefs.begin(PREFS_NAMESPACE, false);
	prefs.clear();
	prefs.end();
	delay(200);
	ESP.restart();
}

void handleResetButton() {
	static const unsigned long DEBOUNCE_MS = 50;
	static const unsigned long CLICK_WINDOW_MS = 600; // max gap between clicks of the same gesture
	static const int RESET_CLICK_COUNT = 3;

	static bool lastPressed = false;
	static unsigned long lastClickMs = 0;
	static int clickCount = 0;

	bool pressed = digitalRead(PIN_BOOT_BUTTON) == LOW;
	unsigned long now = millis();

	if (pressed && !lastPressed && (now - lastClickMs > DEBOUNCE_MS)) {
		if (now - lastClickMs > CLICK_WINDOW_MS) {
			clickCount = 0;
		}
		clickCount++;
		lastClickMs = now;
		if (clickCount >= RESET_CLICK_COUNT) {
			wipeConfigAndRestart();
		}
	}
	lastPressed = pressed;
}
