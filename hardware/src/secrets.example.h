#pragma once

// Copy this file to src/secrets.h and fill in your own WiFi credentials.
// src/secrets.h is in .gitignore, not committed.
#define WIFI_SSID "your-wifi-ssid"
#define WIFI_PASS "your-wifi-password"
#define MQTT_HOST "192.168.1.100"
#define MQTT_PORT 1883
#define MQTT_TOPIC_PREFIX "sensors"
#define STATION_ID "a" // becomes the topic's room segment, e.g. sensors/a/measurements
// optional, if the broker has allow_anonymous false:
// #define MQTT_USER "mqtt_user"
// #define MQTT_PASS "mqtt_pass"
