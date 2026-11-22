#include <WiFiManager.h>          //https://github.com/tzapu/WiFiManager WiFi Configuration Magic

extern WiFiManager wifiManager;

struct WifiMngConfig {
	String roomName;
	String mqttServer;
	uint16_t mqttPort;
	String mqttUser;
	String mqttPass;
};

void setupWifi();

const WifiMngConfig &getWifiConfig();
