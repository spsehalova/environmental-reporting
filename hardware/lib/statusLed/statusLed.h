#pragma once
#include <cstdint>

enum class StationStatus {
	WIFI_CONNECTING, // red, blinking
	WIFI_FAILED,	 // red, solid (fatal, needs manual reset)
	WARMING_UP,		 // yellow, blinking (BSEC still calibrating baseline)
	OK,				 // green, solid
	SENSOR_ERROR,	 // red, fast blink
};

// --- Built-in RGB (WS2812) status LED, GPIO48 ---
void statusLedInit();
void setColor(uint8_t r, uint8_t g, uint8_t b);
void blinkStatusLed(uint8_t r, uint8_t g, uint8_t b, int durationMs = 150);

// Blanks the LED (forces output to off) while suppressed=true, regardless
// of what setColor() is asked to show, without needing to save/restore the
// color anywhere else - setColor() keeps tracking the real intended color
// underneath, so un-suppressing just re-applies it. For sensors physically
// close to the LED (e.g. the lux meter) that need it dark during a reading.
void setLedSuppressed(bool suppressed);

// Sets the LED according to the station's semantic status. For "blinking"
// statuses (WIFI_CONNECTING, WARMING_UP, SENSOR_ERROR) does a single
// BLOCKING pulse (delay()) -> only suitable for setup()-time blocking loops
// (WiFi connect, fatal WIFI_FAILED halt). Use updateStatus() for loop().
void setStatus(StationStatus status);

// Sets the LED color according to the official Bosch IAQ scale (0-500+,
// see CLAUDE.md). NaN (BSEC has no data yet) leaves the LED unchanged.
void setIAQColor(float iaq);

// --- Non-blocking variants for loop() (no delay(), uses millis()) ---
// Call on every loop() tick. Blinking statuses toggle on/off according to
// their interval without blocking; the LED is only rewritten when the
// status/color actually changes (not on every tick).
void updateStatus(StationStatus status);
void updateIAQColor(float iaq);

// BSEC warmup indicator: blinks the "- - -" pattern in the color matching
// the current (possibly still-calibrating) IAQ reading, instead of a flat
// yellow blink, so the LED previews what the final color will be. Falls
// back to the default WARMING_UP yellow if iaq is NaN (no real reading
// yet, e.g. BSEC accuracy 0). Call on every loop() tick.
void updateWarmupPattern(float iaq);

// Rainbow chroma effect — smoothly cycles through the full color spectrum
// (HSV hue 0-65535). Call on every loop() tick. speed = how much the hue
// advances per step, higher = faster color cycling (default ~5s per full
// cycle).
void updateRainbow(uint16_t speed = 256);

// --- Morse-style error patterns, non-blocking ---
// Define any error code as a string of '.' (short pulse) and '-' (long
// pulse), e.g. "..." or "-.-". Call on every loop() tick with the SAME
// pattern string (same literal/pointer) while the error is active -> the
// function tracks its own timing internally and loops the pattern with a
// pause in between. Passing a different pattern (different pointer)
// restarts playback from the beginning.
//
// Example:
//   constexpr const char *ERR_SENSOR  = "...";   // 3 short blinks
//   constexpr const char *ERR_WIFI    = "-.-.";  // long-short-long-short
//   constexpr const char *ERR_MQTT    = "--";    // 2 long blinks
//   ...
//   updatePattern(ERR_SENSOR, 255, 0, 0);
//
// unitMs = duration of one "dot"; a dash is 3x that, the gap between
// symbols is 1x, and the pause before the pattern repeats is 3x.
void updatePattern(const char *pattern, uint8_t r, uint8_t g, uint8_t b,
					unsigned long unitMs = 200);

// Station error codes, pass directly to updatePattern(). Red.
constexpr const char *ERR_SENSOR_INIT = "..."; // BME680/BSEC init failed
constexpr const char *ERR_WIFI_FAILED = "-";	// WiFi connection failed
constexpr const char *ERR_MQTT_FAILED = "-.-"; // MQTT connection failed

// Pattern for updateWarmupPattern() - exported so it stays the SAME pointer
// across calls (updatePattern() restarts playback on a pointer change).
constexpr const char *WARMUP_PATTERN = "---";

// --- Plain digital LEDs (not addressable, just on/off via GPIO) ---
// Call digitalLedInit() once before first using a given pin.
void digitalLedInit(uint8_t pin);
void digitalLedOn(uint8_t pin);
void digitalLedOff(uint8_t pin);
void digitalLedBlink(uint8_t pin, int durationMs = 150);
