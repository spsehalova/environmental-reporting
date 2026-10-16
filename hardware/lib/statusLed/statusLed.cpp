#include "statusLed.h"
#include "pins.h"
#include <Adafruit_NeoPixel.h>
#include <Arduino.h>
#include <cstring>

Adafruit_NeoPixel statusLed(1, PIN_STATUS_LED, NEO_GRB + NEO_KHZ800);

void statusLedInit() {
	statusLed.begin();
	statusLed.setBrightness(10); // dim - sits close to the lux sensor on the breadboard
	statusLed.show();
}

namespace {
bool ledSuppressed = false;
uint8_t pendingR = 0, pendingG = 0, pendingB = 0;
} // namespace

void setColor(uint8_t r, uint8_t g, uint8_t b) {
	pendingR = r;
	pendingG = g;
	pendingB = b;
	if (ledSuppressed) {
		statusLed.setPixelColor(0, statusLed.Color(0, 0, 0));
	} else {
		statusLed.setPixelColor(0, statusLed.Color(r, g, b));
	}
	statusLed.show();
}

/**
 * Allows another sensor to supress the status LED (e.g. Lux Readings)
 */
void setLedSuppressed(bool suppressed) {
	if (suppressed == ledSuppressed)
		return;
	ledSuppressed = suppressed;
	if (ledSuppressed) {
		statusLed.setPixelColor(0, statusLed.Color(0, 0, 0));
	} else {
		statusLed.setPixelColor(0, statusLed.Color(pendingR, pendingG, pendingB));
	}
	statusLed.show();
}

void blinkStatusLed(uint8_t r, uint8_t g, uint8_t b, int durationMs) {
	setColor(r, g, b);
	delay(durationMs);
	setColor(0, 0, 0);
	statusLed.show();
}

namespace {
struct Rgb {
	uint8_t r, g, b;
};

Rgb colorFor(StationStatus status) {
	switch (status) {
	case StationStatus::WIFI_CONNECTING:
		return {255, 0, 0};
	case StationStatus::WIFI_FAILED:
		return {255, 0, 0};
	case StationStatus::WARMING_UP:
		return {255, 180, 0};
	case StationStatus::OK:
		return {0, 255, 0};
	case StationStatus::SENSOR_ERROR:
		return {255, 0, 0};
	}
	return {0, 0, 0};
}

bool isBlinking(StationStatus status) {
	return status == StationStatus::WIFI_CONNECTING ||
		   status == StationStatus::WARMING_UP ||
		   status == StationStatus::SENSOR_ERROR;
}

unsigned long blinkIntervalFor(StationStatus status) {
	return (status == StationStatus::SENSOR_ERROR) ? 100 : 500;
}

Rgb colorForIAQ(float iaq) {
	if (iaq <= 50)
		return {0, 176, 80}; // Excellent
	if (iaq <= 100)
		return {146, 208, 80}; // Good
	if (iaq <= 150)
		return {255, 255, 0}; // Lightly polluted
	if (iaq <= 200)
		return {255, 140, 0}; // Moderately polluted
	if (iaq <= 250)
		return {255, 0, 0}; // Heavily polluted
	if (iaq <= 350)
		return {166, 7, 90}; // Severely polluted
	return {132, 60, 12};	  // Extremely polluted
}
} // namespace

void setStatus(StationStatus status) {
	Rgb c = colorFor(status);
	if (isBlinking(status)) {
		blinkStatusLed(c.r, c.g, c.b, blinkIntervalFor(status));
	} else {
		setColor(c.r, c.g, c.b);
	}
}

void setIAQColor(float iaq) {
	if (isnan(iaq))
		return; // BSEC has no data yet, leave the LED as-is
	Rgb c = colorForIAQ(iaq);
	setColor(c.r, c.g, c.b);
}

void updateStatus(StationStatus status) {
	static bool initialized = false;
	static StationStatus lastStatus = StationStatus::OK;
	static unsigned long lastToggleMs = 0;
	static bool ledOn = false;

	bool statusChanged = !initialized || status != lastStatus;
	initialized = true;
	lastStatus = status;

	Rgb c = colorFor(status);

	if (!isBlinking(status)) {
		if (statusChanged)
			setColor(c.r, c.g, c.b);
		return;
	}

	unsigned long interval = blinkIntervalFor(status);
	unsigned long now = millis();
	if (statusChanged || now - lastToggleMs >= interval) {
		ledOn = !ledOn || statusChanged;
		lastToggleMs = now;
		if (ledOn) {
			setColor(c.r, c.g, c.b);
		} else {
			setColor(0, 0, 0);
		}
	}
}

void updateWarmupPattern(float iaq) {
	Rgb c = isnan(iaq) ? colorFor(StationStatus::WARMING_UP) : colorForIAQ(iaq);
	updatePattern(WARMUP_PATTERN, c.r, c.g, c.b);
}

void updateIAQColor(float iaq) {
	static bool hasLast = false;
	static Rgb lastColor{0, 0, 0};

	if (isnan(iaq))
		return;

	Rgb c = colorForIAQ(iaq);
	if (hasLast && c.r == lastColor.r && c.g == lastColor.g &&
		c.b == lastColor.b)
		return;

	hasLast = true;
	lastColor = c;
	setColor(c.r, c.g, c.b);
}

void updateRainbow(uint16_t speed) {
	static uint16_t hue = 0;
	static unsigned long lastStepMs = 0;
	const unsigned long stepIntervalMs = 20; // ~50 FPS

	unsigned long now = millis();
	if (now - lastStepMs < stepIntervalMs)
		return;
	lastStepMs = now;

	hue += speed; // uint16_t overflow naturally wraps hue back to 0, fine
	statusLed.setPixelColor(0, statusLed.gamma32(statusLed.ColorHSV(hue)));
	statusLed.show();
}

void updatePattern(const char *pattern, uint8_t r, uint8_t g, uint8_t b,
					unsigned long unitMs) {
	static const char *currentPattern = nullptr;
	static size_t index = 0;
	static unsigned long phaseStartMs = 0;
	static bool symbolOn = false;
	static bool inRepeatGap = false;

	size_t len = strlen(pattern);
	if (len == 0)
		return;

	unsigned long now = millis();

	if (pattern != currentPattern) {
		// different pattern (or first call) -> restart from the beginning
		currentPattern = pattern;
		index = 0;
		symbolOn = true;
		inRepeatGap = false;
		phaseStartMs = now;
		setColor(r, g, b);
		return;
	}

	if (inRepeatGap) {
		unsigned long gapDuration = unitMs * 3;
		if (now - phaseStartMs >= gapDuration) {
			inRepeatGap = false;
			index = 0;
			symbolOn = true;
			phaseStartMs = now;
			setColor(r, g, b);
		}
		return;
	}

	unsigned long onDuration = (pattern[index] == '-') ? unitMs * 3 : unitMs;
	unsigned long offDuration = unitMs; // gap between symbols

	if (symbolOn) {
		if (now - phaseStartMs >= onDuration) {
			symbolOn = false;
			phaseStartMs = now;
			setColor(0, 0, 0);
		}
	} else if (now - phaseStartMs >= offDuration) {
		index++;
		phaseStartMs = now;
		if (index >= len) {
			inRepeatGap = true;
		} else {
			symbolOn = true;
			setColor(r, g, b);
		}
	}
}

void digitalLedInit(uint8_t pin) {
	pinMode(pin, OUTPUT);
	digitalWrite(pin, LOW);
}

void digitalLedOn(uint8_t pin) {
	digitalWrite(pin, HIGH);
}

void digitalLedOff(uint8_t pin) {
	digitalWrite(pin, LOW);
}

void digitalLedBlink(uint8_t pin, int durationMs) {
	digitalWrite(pin, HIGH);
	delay(durationMs);
	digitalWrite(pin, LOW);
}
