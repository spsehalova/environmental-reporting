#pragma once
#include <Arduino.h>
#include <PubSubClient.h>

extern PubSubClient mqttClient;

void setupMQTT(const char *broker, uint16_t port);

/**
 * Builds "<prefix>/<stationId>/<type>",
 * e.g. buildMqttTopic("sensors", "a", "measurements") -> "sensors/a/measurements".
 */
String buildMqttTopic(const char *prefix, const char *stationId, const char *type);

bool mqttEnsureConnected(const char *clientId, const char *user = nullptr,
						  const char *pass = nullptr);

void publishSensorData(const char *topic);

void publishHeartbeat(const char *topic, const char *stationId);
