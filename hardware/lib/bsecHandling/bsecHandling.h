#pragma once
#include <bsec2.h>

extern Bsec2 bsec;
extern bool bsecWarmup;
extern bool bsecInitFailed;

// Last values from BSEC (updated by newBSECCallback)
struct EnvReadings {
	float temperature = NAN;
	float humidity    = NAN;
	float pressure    = NAN;
	float iaq         = NAN;
	int   iaqAccuracy = 0;
	float staticIaq   = NAN; // unscaled IAQ
	float eco2        = NAN; // ppm
	float bvoc        = NAN; // ppm
	float compensatedGas = NAN; // ohm, log-linearized, compensated signal
	float gasPercentage  = NAN; // percentage of min/max filtered gas value
};

// TODO: BSEC_OUTPUT_STABILIZATION_STATUS & BSEC_OUTPUT_RUN_IN_STATUS
extern EnvReadings bsecEnv;

void loadBsecState();
void saveBsecState();
void newBSECCallback(const bme68xData data, const bsecOutputs outputs, Bsec2 bsecInstance);
void setupBSEC();
