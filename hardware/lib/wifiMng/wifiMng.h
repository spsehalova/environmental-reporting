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

// Call every loop() iteration. On a triple click of the BOOT button within
// a short window, wipes WiFi credentials + saved station config and
// restarts into the setup portal.
void handleResetButton();
