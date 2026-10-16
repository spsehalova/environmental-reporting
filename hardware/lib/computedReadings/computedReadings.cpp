#include "computedReadings.h"
#include <Arduino.h>
#include <cmath>

/**
 * Computes the dew point temperature in `deg C` given the current temperature
 * in `deg C` and relative humidity in percentage. Uses the August-Roche-Magnus
 * approximation of the Clausius-Clapeyron relation.
 * @see
 * https://en.wikipedia.org/wiki/Clausius–Clapeyron_relation#August–Roche–Magnus_approximation
 * @return {float} `deg C`
 */
float computeDewPoint(float tempC, float relHumidity) {
	if (isnan(tempC) || isnan(relHumidity) || relHumidity <= 0)
		return NAN;
	const float a = 17.62f;
	const float b = 243.12f;
	float gamma = (a * tempC) / (b + tempC) + log(relHumidity / 100.0f);
	return (b * gamma) / (a - gamma);
}

/**
 * Computes the absolute humidity in `g/m^3` given the current temperature in
 * `deg C` and relative humidity in `percentage`.
 * @param {float} tempC - temperature in `deg C`
 * @param {float} relHumidity - relative humidity in `percentage`
 * @return {float} `g/m^3`
 */
float computeAbsoluteHumidity(float tempC, float relHumidity) {
	if (isnan(tempC) || isnan(relHumidity) || relHumidity <= 0)
		return NAN;
	float satVaporPressure = 6.112f * exp((17.67f * tempC) / (tempC + 243.5f));
	float absHumidity =
		(satVaporPressure * relHumidity * 2.1674f) / (273.15f + tempC);
	return absHumidity;
}

/**
 * Computes a simple mold risk index based on the difference between the
 * temperature and dew point. The smaller the difference, the higher the risk.
 * @param {float} tempC - temperature in `deg C`
 * @param {float} dewPointC - dew point in `deg C`
 * @return {0|1|2|3|NAN} `0` = low risk, `1` = moderate risk, `2` = high risk, `3` = very high risk, `NAN` = invalid input
 * @see ...
 */
int computeMoldRiskIndex(float tempC, float dewPointC) {
	if (isnan(tempC) || isnan(dewPointC))
		return NAN;
	float diff = tempC - dewPointC;
	if (diff >= 5.0f)
		return 0;
	if (diff >= 3.0f)
		return 1;
	if (diff >= 1.0f)
		return 2;
	return 3;
}

/**
 * Computes the heat index in `deg C` given the current temperature in `deg C`
 * and relative humidity in `percentage`. zjednodušená Rothfusz regresia
 * @return {float} `deg C`
 */
float computeHeatIndexC(float tempC, float relHumidity) {
	if (isnan(tempC) || isnan(relHumidity))
		return NAN;
	if (tempC < 26.0f)
		return NAN; // Heat index is only defined for temperatures >= 26 `deg C`

	float tempF = tempC * 9.0f / 5.0f + 32.0f;
	float rh = relHumidity;

	float hiF = -42.379f + 2.04901523f * tempF + 10.14333127f * rh -
				0.22475541f * tempF * rh - 0.00683783f * tempF * tempF -
				0.05481717f * rh * rh + 0.00122874f * tempF * tempF * rh +
				0.00085282f * tempF * rh * rh -
				0.00000199f * tempF * tempF * rh * rh;

	return (hiF - 32.0f) * 5.0f / 9.0f;
}
