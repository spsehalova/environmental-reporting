#include "bleWorks.h"
#include <Arduino.h>
#include <BLEAdvertisedDevice.h>
#include <BLEDevice.h>
#include <BLEScan.h>
#include <set>
#include <string>

constexpr int BLE_RSSI_THRESHOLD = -70; // approx. one room
constexpr int BLE_SCAN_SECONDS = 3;
constexpr unsigned long BLE_SCAN_INTERVAL_MS = 60 * 1000; // 1min

BLEScan *bleScanner = nullptr;
std::set<std::string> nearbyDevices;

bool scanInProgress = false;
int lastNearbyDeviceCount = 0;

class NearbyDeviceCallback : public BLEAdvertisedDeviceCallbacks {
	void onResult(BLEAdvertisedDevice advertisedDevice) override {
		if (advertisedDevice.getRSSI() > BLE_RSSI_THRESHOLD) {
			nearbyDevices.insert(advertisedDevice.getAddress().toString());
		}
	}
};

/**
 * BLE Stack Callback. must match `void(BLEScanResults)`
 */
void onScanComplete(BLEScanResults results) {
	lastNearbyDeviceCount = static_cast<int>(nearbyDevices.size());
	bleScanner->clearResults();
	scanInProgress = false;
}

void setupBLE() {
	BLEDevice::init("");
	bleScanner = BLEDevice::getScan();
	bleScanner->setAdvertisedDeviceCallbacks(new NearbyDeviceCallback());
	bleScanner->setActiveScan(true);
}

void updateBLEScan() {
	static unsigned long lastScanStartMs = 0;

	if (scanInProgress)
		return;

	unsigned long now = millis();
	if (lastScanStartMs != 0 && now - lastScanStartMs < BLE_SCAN_INTERVAL_MS)
		return;
	lastScanStartMs = now;

	nearbyDevices.clear();
	scanInProgress = true;
	bleScanner->start(BLE_SCAN_SECONDS, onScanComplete, false);
}

int getNearbyDeviceCount() { return lastNearbyDeviceCount; }
