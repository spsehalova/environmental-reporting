#include "noiseLevels.h"
#include "pins.h"
#include <Wire.h>

/*
 * @return {float} `rel dB`
 */
float readNoiseLevel() {
	const int samples = 500;
	const int sampleIntervalUs = 200; // ~5kHz sampling rate (200us interval) -> 500 samples = 100ms
	long sumSquares = 0;
	int bias = 2048; // midpoint for a 12-bit ADC at 3.3V (mic biased around Vcc/2)

	for (int i = 0; i < samples; i++) {
		int sample = analogRead(PIN_MIC_ADC) - bias;
		sumSquares += (long)sample * sample;
		delayMicroseconds(sampleIntervalUs);
	}

	float rms = sqrt((float)sumSquares / samples);
	if (rms < 1)
		rms = 1; // avoid log(0)
	float dbRelative = 20.0f * log10(rms);
	return dbRelative; // relative value, not calibrated dB SPL
}
