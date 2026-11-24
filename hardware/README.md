# environmental-reporting/hardware

PlatformIO firmware for the physical sensor station. Data publishing done by MQTT.

## Commands

| What									| Command						|
|---------------------------------------|-------------------------------|
| Build									| `pio run`						|
| Build + flash							| `pio run -t upload`			|
| Serial monitor						| `pio device monitor`			|
| Regenerate `compile_commands.json`	| `pio run --target compiledb`	|

## House keeping rules

- `secrets.h` is a gitignored .env-like paradigm

## LED signaling

built-in RGB Led WS2812 (`GPIO48`)

### Error / Warning signaling

| LED	| Pattern									| When | Meaning |
|-----------|-------------------------------------------|------|---------|
| <img src="data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2714%27%20height%3D%2714%27%3E%3Crect%20width%3D%2714%27%20height%3D%2714%27%20rx%3D%273%27%20fill%3D%27%23FF0000%27%2F%3E%3C%2Fsvg%3E" width="14" height="14" alt="#FF0000"> red	   | single 500ms blink (once)							   | `setup()`, right before `setupWifi()` | Connecting to WiFi |
| <img src="data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2714%27%20height%3D%2714%27%3E%3Crect%20width%3D%2714%27%20height%3D%2714%27%20rx%3D%273%27%20fill%3D%27%23FF0000%27%2F%3E%3C%2Fsvg%3E" width="14" height="14" alt="#FF0000"> red	   | repeating Morse `-` (one long dash, pause, repeat) | `setup()`, fatal infinite loop | WiFi connection failed permanently — station is stuck, manual reset required |
| <img src="data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2714%27%20height%3D%2714%27%3E%3Crect%20width%3D%2714%27%20height%3D%2714%27%20rx%3D%273%27%20fill%3D%27%23FF0000%27%2F%3E%3C%2Fsvg%3E" width="14" height="14" alt="#FF0000"> red	| repeating Morse `...` (three short dots) | continuously in `loop()` while `bsecInitFailed` | BME680/BSEC init failed (`bsec.begin()`) — check wiring/address |
| <img src="data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2714%27%20height%3D%2714%27%3E%3Crect%20width%3D%2714%27%20height%3D%2714%27%20rx%3D%273%27%20fill%3D%27%23FF0000%27%2F%3E%3C%2Fsvg%3E" width="14" height="14" alt="#FF0000"> red	| repeating Morse `-.-` | continuously in `loop()` while MQTT isn't connected | MQTT connection failed |
| <img src="data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2714%27%20height%3D%2714%27%3E%3Crect%20width%3D%2714%27%20height%3D%2714%27%20rx%3D%273%27%20fill%3D%27%23FFB400%27%2F%3E%3C%2Fsvg%3E" width="14" height="14" alt="#FFB400"> color of current IAQ reading (or default amber if none yet) | repeating Morse `---` (three long dashes) | continuously in `loop()` while `bsecWarmup` | BSEC doesn't have reliable calibration yet (accuracy ≤ 2) — values in MQTT are flagged `warming_up: true` |

### IAQ

| LED	| Pattern | When | Meaning |
|-----------|---------|------|---------|
| <img src="data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2714%27%20height%3D%2714%27%3E%3Cdefs%3E%3ClinearGradient%20id%3D%27g%27%20x1%3D%270%27%20y1%3D%270%27%20x2%3D%271%27%20y2%3D%270%27%3E%3Cstop%20offset%3D%270%25%27%20stop-color%3D%27%23ff0000%27%2F%3E%3Cstop%20offset%3D%2717%25%27%20stop-color%3D%27%23ff9900%27%2F%3E%3Cstop%20offset%3D%2734%25%27%20stop-color%3D%27%23ffee00%27%2F%3E%3Cstop%20offset%3D%2750%25%27%20stop-color%3D%27%2333ff00%27%2F%3E%3Cstop%20offset%3D%2767%25%27%20stop-color%3D%27%2300c8ff%27%2F%3E%3Cstop%20offset%3D%2784%25%27%20stop-color%3D%27%236a00ff%27%2F%3E%3Cstop%20offset%3D%27100%25%27%20stop-color%3D%27%23ff00c8%27%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%2714%27%20height%3D%2714%27%20rx%3D%273%27%20fill%3D%27url%28%23g%29%27%2F%3E%3C%2Fsvg%3E" width="14" height="14" alt="rainbow"> rainbow | smooth chroma cycle (~5s) | continuously in `loop()` | IAQ 0–50, Excellent — best possible air quality |
| <img src="data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2714%27%20height%3D%2714%27%3E%3Crect%20width%3D%2714%27%20height%3D%2714%27%20rx%3D%273%27%20fill%3D%27%2300C874%27%2F%3E%3C%2Fsvg%3E" width="14" height="14" alt="#00C874"> `#00C874` | solid | continuously in `loop()` | IAQ 51–100, Good |
| <img src="data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2714%27%20height%3D%2714%27%3E%3Crect%20width%3D%2714%27%20height%3D%2714%27%20rx%3D%273%27%20fill%3D%27%2356DF00%27%2F%3E%3C%2Fsvg%3E" width="14" height="14" alt="#56DF00"> `#56DF00` | solid | continuously in `loop()` | IAQ 101–150, Lightly polluted — ventilation recommended |
| <img src="data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2714%27%20height%3D%2714%27%3E%3Crect%20width%3D%2714%27%20height%3D%2714%27%20rx%3D%273%27%20fill%3D%27%23EAE400%27%2F%3E%3C%2Fsvg%3E" width="14" height="14" alt="#EAE400"> `#EAE400` | solid | continuously in `loop()` | IAQ 151–200, Moderately polluted — increase ventilation |
| <img src="data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2714%27%20height%3D%2714%27%3E%3Crect%20width%3D%2714%27%20height%3D%2714%27%20rx%3D%273%27%20fill%3D%27%23EF7900%27%2F%3E%3C%2Fsvg%3E" width="14" height="14" alt="#EF7900"> `#EF7900` | solid | continuously in `loop()` | IAQ 201–250, Heavily polluted — optimize ventilation |
| <img src="data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2714%27%20height%3D%2714%27%3E%3Crect%20width%3D%2714%27%20height%3D%2714%27%20rx%3D%273%27%20fill%3D%27%23E80000%27%2F%3E%3C%2Fsvg%3E" width="14" height="14" alt="#E80000"> `#E80000` | solid | continuously in `loop()` | IAQ 251–350, Severely polluted — identify source, max ventilation |
| <img src="data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2714%27%20height%3D%2714%27%3E%3Crect%20width%3D%2714%27%20height%3D%2714%27%20rx%3D%273%27%20fill%3D%27%23FF00C8%27%2F%3E%3C%2Fsvg%3E" width="14" height="14" alt="#FF00C8"> `#FF00C8` | solid | continuously in `loop()` | IAQ 351+, Extremely polluted — leave the room |

## Project Structure

```
src/
└── main.cpp              setup()/loop(), WiFi + MQTT orchestration

include/
├── secrets.h              WiFi/MQTT credentials, gitignored
└── secrets.example.h      template for secrets.h

lib/                       custom modules, each in its own subfolder
├── pins/                  pins as constexpr (header-only)
├── bleWorks/              BLE scan, nearby device count
├── bsecHandling/          BME680 + BSEC2 (temperature/humidity/pressure/IAQ/eCO2/bVOC)
├── computedReadings/      dew point, absolute humidity, mold risk index, heat index, VTT mold index
├── lux/                   BH1750 (lux)
├── mqttClient/            PubSubClient wrapper, JSON publish
├── noiseLevels/           MAX4466 (relative dB via RMS)
├── prefs/                 Preferences (NVS) load helper
├── sen63cHandling/        Sensirion SEN63C (PM1.0/2.5/4.0/10.0, CO2)
├── statusLed/             built-in WS2812 status LED + plain digital LEDs
└── wifiMng/               WiFiManager portal, station config, reset-button handling
```
