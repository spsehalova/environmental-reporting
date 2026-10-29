# environmental-reporting
Enviromentalne merania

## Mesured parameters

| Parameter					| Unit			| Description							| Module									| Range			|
|---------------------------|---------------|---------------------------------------|-------------------------------------------|---------------|
| Temperature				| °C			| Ambient temperature					| BME680 									|				|
| Humidity					| %				| Relative humidity						| BME680 									|				|
| Pressure					| hPa			| Atmospheric pressure					| BME680 									|				|
| IAQ						| adaptive IAQ	| Indoor air quality index				| BME680 									| 0 - 500   	|
| sIAQ						| unscaled IAQ	| static indoor air quality index		| BME680 									| 0 - 10171		|
| eCO₂						| ppm			| Equivalent CO₂ concentration			| BME680 									| 0.5 - 1000	|
| bVOC						| ppm			| breath volatile organic compounds		| BME680 									| 400 - ...		|
| Compensated Gas Resistace	| Ohm			| Compensated gas resistance			| BME680 									|				|
| Gas Percentage			| %				| Gas percentage						| BME680 									|				|
| Light						| lux			| Ambient light intensity				| BH1750									|				|
| Noise						| rel dB		| Ambient noise level					| MAX4466									|				|
| PM2.5						| mg/m³			| Particulate matter 2.5 concentration	| GP2Y1010AU0F								|				|
| Nearby Device Count		| count			| Number of nearby BLE devices			| ESP32										|				|
| Dew Point					| °C			| Dew point temperature					| Calculated from Temperature and Humidity	|				| 
| Absolute Humidity			| g/m³			| Absolute humidity						| Calculated from Temperature and Humidity	|				|
| Mold Risk 				| MR Index		| Mold risk index						| Calculated from Temperature and Humidity	| 1 - 3			|
| Heat Index				| °C			| Heat index temperature				| Calculated from Temperature and Humidity	|				|


maybe https://www.soselectronic.com/sk-sk/products/sensirion/sen69c-sin-t-506264

- https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bme680-ds001.pdf
- https://cdn.soselectronic.com/productdata/91/1d/f677fd87/sen65-sin-t.pdf
- https://siov.sk/wp-content/uploads/2026/08/Metodika-CEOVP-aktualizacia-4-2026-i.pdf (s. 67)
- http://siov.sk/wp-content/uploads/2026/05/Strategia-kvality-1.zip - halova s. 84
- https://www.sos.sk/a_info/resource/c/sensirion/Sensirion_Humidity_at_a_Glance_V1.pdf
- https://github.com/Sensirion/arduino-i2c-sen63c