#include <hp_BH1750.h>
#include "lux.h"
#include "statusLed.h"

// Sensor Interface
hp_BH1750 bh1750;

void setupLuxSensor() {
	bh1750.begin(BH1750_TO_GROUND); // address accoring to the ADDR pin
	bh1750.start();
}

/*
 * @return {float} `lux` reading
 * 
 * **this function is blocking** takes ~120ms to complete
 */
float getLuxReading() {
	setLedSuppressed(true);
	bh1750.start();
	float lux = bh1750.getLux();
	setLedSuppressed(false);
	return lux;
}