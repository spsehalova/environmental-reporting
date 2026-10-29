#pragma once
#include <SensirionI2cSen63c.h>

extern SensirionI2cSen63c sen63c;

struct SEN63CReadings {
	float pm1_0  = NAN;
	float pm2_5  = NAN;
	float pm4_0  = NAN;
	float pm10_0 = NAN;
	float co2    = NAN;
};

extern SEN63CReadings sen63cReadings;

void setupSEN63C();
void readSEN63C();
