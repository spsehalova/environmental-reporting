#pragma once

extern double VTTMoldRiskValue;

float computeDewPoint(float tempC, float relHumidity);
float computeAbsoluteHumidity(float tempC, float relHumidity);
int computeMoldRiskIndex(float tempC, float dewPointC);
float computeHeatIndexC(float tempC, float relHumidity);
double computeVTTMoldIndex(float tempC, float relHumidity, double M_prev);
void saveVTTCompute();
void loadVTTCompute();