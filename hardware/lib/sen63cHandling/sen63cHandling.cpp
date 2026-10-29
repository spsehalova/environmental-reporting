#include "sen63cHandling.h"

// Sensor Interface
SensirionI2cSen63c sen63c;

SEN63CReadings sen63cReadings;

void setupSEN63C() {
	sen63c.begin(Wire, SEN63C_I2C_ADDR_6B);

	if (sen63c.deviceReset() != 0) {
		Serial.println("SEN63C deviceReset failed!");
	}
	delay(1200);

	if (sen63c.startContinuousMeasurement() != 0) {
		Serial.println("SEN63C startContinuousMeasurement failed!");
	}
	delay(1100); // first measurement isn't ready until ~1.1s after start
}

void readSEN63C() {
	float humidity = 0.0;
	float temperature = 0.0;
	int16_t co2 = 0;
	sen63c.readMeasuredValues(sen63cReadings.pm1_0, sen63cReadings.pm2_5,
							   sen63cReadings.pm4_0, sen63cReadings.pm10_0,
							   humidity, temperature, co2);
	sen63cReadings.co2 = co2;
}
