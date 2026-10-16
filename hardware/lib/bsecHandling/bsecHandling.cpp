#include "bsecHandling.h"
#include "prefs.h"
#include <bsec2.h>

// Sensor Interface
Bsec2 bsec;
bool bsecWarmup = false;
bool bsecInitFailed = false;
EnvReadings bsecEnv;

void loadBsecState() {
	prefs.begin("bsec", true);
	size_t stateSize = prefs.getBytesLength("state");
	if (stateSize > 0) {
		uint8_t *stateBuf = new uint8_t[stateSize];
		prefs.getBytes("state", stateBuf, stateSize);
		bsec.setState(stateBuf);
		delete[] stateBuf;
		Serial.println("BSEC state loaded from NVS.");
	}
	prefs.end();
}

void saveBsecState() {
	uint8_t stateBuf[BSEC_MAX_STATE_BLOB_SIZE];
	if (bsec.getState(stateBuf)) {
		prefs.begin("bsec", false);
		prefs.putBytes("state", stateBuf, BSEC_MAX_STATE_BLOB_SIZE);
		prefs.end();
	}
}

void newBSECCallback(const bme68xData data, const bsecOutputs outputs,
					  Bsec2 bsecInstance) {
	if (!outputs.nOutputs)
		return;

	for (uint8_t i = 0; i < outputs.nOutputs; i++) {
		const bsecData output = outputs.output[i];
		switch (output.sensor_id) {
		case BSEC_OUTPUT_SENSOR_HEAT_COMPENSATED_TEMPERATURE:
			bsecEnv.temperature = output.signal;
			break;
		case BSEC_OUTPUT_RAW_PRESSURE:
			bsecEnv.pressure = output.signal;
			break;
		case BSEC_OUTPUT_SENSOR_HEAT_COMPENSATED_HUMIDITY:
			bsecEnv.humidity = output.signal;
			break;
		case BSEC_OUTPUT_IAQ:
			bsecEnv.iaq = (output.accuracy > 0) ? output.signal : NAN;
			bsecEnv.iaqAccuracy = output.accuracy;
			break;
		case BSEC_OUTPUT_STATIC_IAQ:
			bsecEnv.staticIaq = (output.accuracy > 0) ? output.signal : NAN;
			break;
		case BSEC_OUTPUT_CO2_EQUIVALENT:
			bsecEnv.eco2 = (output.accuracy > 0) ? output.signal : NAN;
			break;
		case BSEC_OUTPUT_BREATH_VOC_EQUIVALENT:
			bsecEnv.bvoc = (output.accuracy > 0) ? output.signal : NAN;
			break;
		case BSEC_OUTPUT_COMPENSATED_GAS:
			bsecEnv.compensatedGas = (output.accuracy > 0) ? output.signal : NAN;
			break;
		case BSEC_OUTPUT_GAS_PERCENTAGE:
			bsecEnv.gasPercentage = (output.accuracy > 0) ? output.signal : NAN;
			break;
		default:
			break;
		}
	}

	// accuracy 0 = Stabilizing		The sensor has just been powered on. The data is not yet reliable.
	// accuracy 1 = Uncertain		The air has been very stable, and the algorithm cannot yet establish a clear baseline.
	// accuracy 2 = Calibrating		The algorithm is actively learning and adjusting its baseline. The IAQ value is becoming more reliable.
	// accuracy 3 = Calibrated		The algorithm has established a reliable baseline. The IAQ value is considered accurate.
	bsecWarmup = (bsecEnv.iaqAccuracy <= 2);
}

void setupBSEC() {
	bsecSensor sensorList[] = {
		BSEC_OUTPUT_IAQ,
		BSEC_OUTPUT_STATIC_IAQ,
		BSEC_OUTPUT_RAW_PRESSURE,
		BSEC_OUTPUT_SENSOR_HEAT_COMPENSATED_TEMPERATURE,
		BSEC_OUTPUT_SENSOR_HEAT_COMPENSATED_HUMIDITY,
		BSEC_OUTPUT_CO2_EQUIVALENT,
		BSEC_OUTPUT_BREATH_VOC_EQUIVALENT,
		BSEC_OUTPUT_COMPENSATED_GAS,
		BSEC_OUTPUT_GAS_PERCENTAGE,
	};
	// I2C addrs: 0x77 (HIGH), 0x76 (LOW)
	if (!bsec.begin(BME68X_I2C_ADDR_HIGH, Wire)) {
		Serial.println("BME680/BSEC init failed!");
		bsecInitFailed = true;
		return;
	}
	// must come after begin() - bsecInstance is nullptr until beginCommon()
	// allocates it inside begin(); calling setState() before that dereferences
	// a null pointer deep inside bsec_set_state_m() (LoadProhibited crash)
	loadBsecState();
	bsec.updateSubscription(sensorList, ARRAY_LEN(sensorList),
							 BSEC_SAMPLE_RATE_LP);
	bsec.attachCallback(newBSECCallback);
}
