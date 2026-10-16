#include "pins.h"
#include <Arduino.h>
#include <Wire.h>
#include "pm25.h"

constexpr int DUST_SAMPLE_COUNT = 12;

void setupDustSensor() {
	pinMode(PIN_DUST_LED, OUTPUT);
	digitalWrite(PIN_DUST_LED, HIGH); // LED off (active LOW)
}

/*
 * @see https://www.howmuchsnow.com/arduino/airquality/
 *
 * The Chris Nafis approximation (0.17 * V - 0.1) is calibrated by Sharp for
 * a sensor running on 5V Vcc with V measured on a 0-5V scale. Our sensor
 * runs on 3.3V (ESP32-S3 can't source a clean 5V, see hardware notes), so
 * the slope is rescaled assuming the sensor's output swing scales
 * proportionally with Vcc (V5_equivalent = V3V3 * 5/3.3 -> slope ~0.2576).
 * The original baseline offset (-0.1) is dropped: at 3.3V Vcc the sensor's
 * real-world signal sits well below that offset, so keeping it clipped
 * every observed reading (including real dust spikes) to zero. This is NOT
 * an official Sharp calibration -> report as ePM2.5 (estimated), not a
 * calibrated instrument reading. Orientational/comparable only.
 *
 * @return `~mg/m3`
 */
float readDustDensity() {
	uint32_t rawSum = 0;
	for (int i = 0; i < DUST_SAMPLE_COUNT; i++) {
		digitalWrite(PIN_DUST_LED, LOW); // LED ON
		delayMicroseconds(280);			 // data sheet reference: 280us wait
		rawSum += analogRead(PIN_DUST_ADC);
		delayMicroseconds(40);			  // data sheet reference: 40us wait
		digitalWrite(PIN_DUST_LED, HIGH); // LED OFF
		delayMicroseconds(9680);		  // left out of 10ms cycle
	}
	float raw = (float)rawSum / DUST_SAMPLE_COUNT;

	float voltage = raw * (3.3f / 4095.0f); // ESP32-S3 ADC: 12-bit, 3.3V ref
	float epm25 = 0.2576f * voltage;		 // PM2.5 estimate
	if (epm25 < 0)
		epm25 = 0;
	return epm25;
}
