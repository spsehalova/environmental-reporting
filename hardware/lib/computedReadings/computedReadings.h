#pragma once

float computeDewPoint(float tempC, float relHumidity);
float computeAbsoluteHumidity(float tempC, float relHumidity);
int computeMoldRiskIndex(float tempC, float dewPointC);
float computeHeatIndexC(float tempC, float relHumidity);