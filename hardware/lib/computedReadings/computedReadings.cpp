#include "computedReadings.h"
#include <Arduino.h>
#include <cmath>

/**
 * Computes the dew point temperature in `deg C` given the current temperature
 * in `deg C` and relative humidity in percentage. Uses the August-Roche-Magnus
 * approximation of the Clausius-Clapeyron relation.
 *
 * Valid for: 0C < T < 60C; 1% < RH < 100%; 0C < DP < 50C
 *
 * @see
 * https://en.wikipedia.org/wiki/Clausius–Clapeyron_relation#August–Roche–Magnus_approximation
 * @return {float} `deg C`
 */
float computeDewPoint(float tempC, float relHumidity) {
	if (isnan(tempC) || isnan(relHumidity) || relHumidity <= 0)
		return NAN;
	if ((tempC < 0.0f || tempC > 60.0f) ||
		(relHumidity < 0.0f || relHumidity > 100.0f))
		return NAN; // outside the valid range for the approximation
	const float a = 17.62f;
	const float b = 243.04f;
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
	// float satVaporPressure = 6.112f * exp((17.67f * tempC) / (tempC +
	// 243.5f)); float absHumidity = 	(satVaporPressure * relHumidity
	// * 2.1674f) / (273.15f + tempC);
	float absHumidity =
		216.7 * (relHumidity / 100.0 * 6.112 *
				 exp(17.62 * tempC / (243.12 + tempC)) / (273.15 + tempC));
	
	return absHumidity;
}

/**
 * Computes a simple mold risk index based on the difference between the
 * temperature and dew point. The smaller the difference, the higher the risk.
 * @param {float} tempC - temperature in `deg C`
 * @param {float} dewPointC - dew point in `deg C`
 * @return {0|1|2|3|NAN} `0` = low risk, `1` = moderate risk, `2` = high risk,
 * `3` = very high risk, `NAN` = invalid input
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
 * @see https://www.weather.gov/ama/heatindex
 * @see https://www.noaa.gov/sites/default/files/2022-05/heatindex_chart_rh.pdf
 */
float computeHeatIndexC(float tempC, float relHumidity) {
	if (isnan(tempC) || isnan(relHumidity))
		return NAN;
	if (tempC < 26.7f)
		return NAN; // Heat index is only defined for temperatures >= 26.7 `deg C`

	float tempF = (tempC * 1.8f) + 32.0f; // Convert to Fahrenheit
	auto heatIndexF =
		-42.379 + (2.04901523 * tempF) + 
		(10.14333127 * relHumidity) -
		(.22475541 * tempF * relHumidity) - 
		(.00683783 * tempF * tempF) -
		(.05481717 * relHumidity * relHumidity) +
		(.00122874 * tempF * tempF * relHumidity) +
		(.00085282 * tempF * relHumidity * relHumidity) -
		(.00000199 * tempF * tempF * relHumidity * relHumidity);

	return (heatIndexF - 32.0f) / 1.8f; // Convert back to Celsius
}
