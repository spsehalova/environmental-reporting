# enrinmental-reporting/hardware

PlatformIO firmware for the physical sensor station. Data publishing done by MQTT.

## Commands

| Čo									| Príkaz						|
|---------------------------------------|-------------------------------|
| Build									| `pio run`						|
| Build + flash							| `pio run -t upload`			|
| Serial monitor						| `pio device monitor`			|
| Regenerate `compile_commands.json`	| `pio run --target compiledb`	|

## House keeping rules

- `secrets.h` is a gitignored .env like paradime

## LED signaling

built-in RGB Led WS2812 (`GPIO48`)

### Error / Warning signaling

| Colour	| Pattern | When | Meaning |
| 🔴 red	| bliká (500ms) | počas `setup()` | Pripája sa na WiFi |
| 🔴 red	| trvalo, navždy | `setup()`, fatálne | WiFi pripojenie definitívne zlyhalo — stanica je zaseknutá, treba ručný reset |
| 🔴 red	| rýchlo bliká (100ms), jednorazovo pri štarte | `setupBSEC()` | BME680 neodpovedá na I2C (`bsec.begin()` zlyhal) — skontroluj zapojenie/adresu |
| 🟡 yellow	| bliká (500ms) | priebežne v `loop()` | BSEC ešte nemá spoľahlivú kalibráciu (accuracy ≤ 2) — hodnoty v MQTT sú označené `warming_up: true` |

### IAQ

| Colour	| Pattern | When | Meaning |
| 🌈 dúha | plynulý chroma cyklus (~5s) | priebežne v `loop()` | IAQ 0–50, Excellent — najlepšia možná kvalita vzduchu |
| 🟢 svetlozelená | trvalo | priebežne v `loop()` | IAQ 51–100, Good |
| 🟡 žltá (sýta, `255,255,0`) | trvalo | priebežne v `loop()` | IAQ 101–150, Lightly polluted — odporúčané vetranie |
| 🟠 oranžová | trvalo | priebežne v `loop()` | IAQ 151–200, Moderately polluted — zvýšiť vetranie |
| 🔴 červená | trvalo | priebežne v `loop()` | IAQ 201–250, Heavily polluted — optimalizovať vetranie |
| 🟣 tmavá bordová | trvalo | priebežne v `loop()` | IAQ 251–350, Severely polluted — identifikovať zdroj, max. vetranie |
| 🟤 hnedá | trvalo | priebežne v `loop()` | IAQ 351+, Extremely polluted — opustiť miestnosť |

## Project Structure

```
src/
├── main.cpp              setup()/loop(), WiFi + MQTT orchestrácia
├── secrets.h              WiFi/MQTT credentials, gitignored
└── secrets.example.h      šablóna pre secrets.h

lib/                       vlastné moduly, každý v samostatnom podpriečinku
├── pins/                  piny ako constexpr (header-only)
├── bsecHandling/          BME680 + BSEC2 (teplota/vlhkosť/tlak/IAQ/eCO2/VOC)
├── lux/                   BH1750 (lux)
├── noiseLevels/           MAX4466 (relatívne dB cez RMS)
├── statusLed/             vstavaná WS2812 status LED + obyčajné digitálne LEDky
└── mqttClient/            PubSubClient wrapper, JSON publish
```