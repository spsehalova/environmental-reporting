#include "computedReadings.h"
#include <Arduino.h>
#include <algorithm>
#include <cmath>
#include "bsecHandling.h"
#include "prefs.h"

double VTTMoldRiskValue = NAN;

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
 * and relative humidity in `percentage`.
 * @return {float} `deg C`
 * @see https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml
 * @see https://www.noaa.gov/sites/default/files/2022-05/heatindex_chart_rh.pdf
 */
float computeHeatIndexC(float tempC, float relHumidity) {
	if (isnan(tempC) || isnan(relHumidity))
		return NAN;

	double tempF = (tempC * 1.8) + 32.0; // Convert to Fahrenheit
	double rh = relHumidity;

	// easy Steadman formula (valid for 80°F < T < 112°F and 40% < RH < 100%)
	double hi = 0.5 * (tempF + 61.0 + ((tempF - 68.0) * 1.2) + (rh * 0.094));

	if ((hi + tempF) / 2.0 >= 80.0) {
		hi = -42.379 + (2.04901523 * tempF) + (10.14333127 * rh) -
			 (.22475541 * tempF * rh) - (.00683783 * tempF * tempF) -
			 (.05481717 * rh * rh) + (.00122874 * tempF * tempF * rh) +
			 (.00085282 * tempF * rh * rh) -
			 (.00000199 * tempF * tempF * rh * rh);

		if (rh < 13.0 && tempF >= 80.0 && tempF <= 112.0)
			hi -=
				((13.0 - rh) / 4.0) * sqrt((17.0 - fabs(tempF - 95.0)) / 17.0);
		else if (rh > 85.0 && tempF >= 80.0 && tempF <= 87.0)
			hi += ((rh - 85.0) / 10.0) * ((87.0 - tempF) / 5.0);
	}

	return (float)((hi - 32.0) / 1.8); // Convert back to Celsius
}

/**
 * @brief Advances the VTT mould growth index by one time step.
 *
 * Port of ConSciR `calcMould_VTT` (Hukka & Viitanen mathematical model of mould
 * growth), using the `sensitive` material class (glued wooden boards, PUR with
 * paper surface, spruce) with wood = 0 and surface = 0.
 *
 * The function adds one increment `dM/dt` per call, so the call interval defines
 * the time step. The caller is responsible for the step length (see @note).
 *
 * @param tempC        Air temperature in `deg C`. Values <= 0 leave the index unchanged.
 * @param relHumidity  Relative humidity in `percentage`; values above 100 are clamped to 100.
 * @param M_prev       Previous mould index (0 for a new surface). Must be a floating point type.
 * @return Updated mould index (0 = no growth, 1-2 = microscopic growth,
 *         3+ = visible mould, 6 = heavy growth). Returns `M_prev` for NaN or
 *         out-of-range input.
 *
 * @note The rate `dM/dt` is not scaled by a step length in this port. If the rate
 *       is per day, call hourly and divide the increment by 24 (verify in the paper).
 * @note `k1` follows the R source exactly (`2 / (t_v / (t_m - 1))`); the expression
 *       should be checked against the original article.
 *
 * @see https://rdrr.io/cran/ConSciR/src/R/calcMould_VTT.R
 * @see https://doi.org/10.1007/s002260050131
 * @copyright Derived from ConSciR (GPL-3.0).
 */
double computeVTTMoldIndex(float tempC, float relHumidity, double M_prev) {
	// sensitivity "sensitive"
	const double A = 0.3, B = 6.0, C = 1.0;
	// Using default wood type: 0 for pine and 1 for spruce.
	// Using default surface type: for resawn kiln dried timber and 1 for timber dried under normal kiln
	// drying process. Default is 0 (worst case)
	const int wood = 0, surface = 0;

	if (isnan(tempC) || isnan(relHumidity)) return M_prev;
	if (tempC <= 0.0f || relHumidity <= 0.0f) return M_prev; // un-log()-able
	double T = tempC;
	double RH = relHumidity > 100.0f ? 100.0 : relHumidity;

	double RH_crit = T > 20.0 ? 80.0
		: (-0.00267 * pow(T, 3) + 0.160 * pow(T, 2) + 3.13 * T + 100.0);
	double x = (RH_crit - RH) / (RH_crit - 100.0);
	double M_max = A + B * x - C * x * x;

	double lt = log(T), lr = log(RH);
	double t_m = exp(-0.68 * lt - 13.9 * lr + 0.14 * wood + 66.02);
	double t_v = exp(-0.74 * lt - 12.72 * lr + 0.06 * wood + 61.50);

	double k1 = M_max < 1 ? 1.0 : 2.0 / (t_v / (t_m - 1.0));
	double k2 = fmax(0.0, 1.0 - exp(2.3 * (M_prev - M_max)));

	double dM_dt = k1 * k2 * (1.0 / (7.0 * exp(-0.68 * lt - 13.9 * lr
		+ 0.14 * wood - 0.33 * surface + 66.02)));
	return M_prev + dM_dt;
}

void saveVTTCompute() {
	double moldState = (isnan(VTTMoldRiskValue) || VTTMoldRiskValue < 0.0f || VTTMoldRiskValue > 6.0f) ? 0.0 : VTTMoldRiskValue;
	VTTMoldRiskValue = computeVTTMoldIndex(bsecEnv.temperature, bsecEnv.humidity, moldState);
	if (!isnan(VTTMoldRiskValue)) {
		prefs.begin("vtt_mold", false);
		prefs.putFloat("value", (float)VTTMoldRiskValue);
		prefs.end();
	}
}

void loadVTTCompute() {
	prefs.begin("vtt_mold", false);
		bool had = prefs.isKey("value");
		float v = prefs.getFloat("value", 0.0f);
		prefs.end();
	
		double moldState = (isnan(v) || v < 0.0f || v > 6.0f) ? 0.0 : v;
		VTTMoldRiskValue = had ? moldState : NAN;
}