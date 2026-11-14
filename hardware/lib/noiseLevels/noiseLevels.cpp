#include "noiseLevels.h"
#include "pins.h"
#include <driver/i2s.h>
#include <cmath>

namespace {
	constexpr i2s_port_t MIC_I2S_PORT = I2S_NUM_0;
	constexpr int SAMPLE_RATE = 16000;
	constexpr int SAMPLES_PER_READ = 1600; // ~100ms at 16kHz, matches the old sampling window
}

void initNoiseLevel() {
	i2s_config_t i2sConfig = {
		.mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_RX),
		.sample_rate = SAMPLE_RATE,
		.bits_per_sample = I2S_BITS_PER_SAMPLE_32BIT, // INMP441 sends 24-bit data left-justified in a 32-bit frame
		.channel_format = I2S_CHANNEL_FMT_ONLY_LEFT, // INMP441 L/R pin tied to GND -> left channel
		.communication_format = I2S_COMM_FORMAT_STAND_I2S,
		.intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
		.dma_buf_count = 4,
		.dma_buf_len = 400,
		.use_apll = false,
	};

	i2s_pin_config_t pinConfig = {
		.bck_io_num = PIN_MIC_SCK,
		.ws_io_num = PIN_MIC_WS,
		.data_out_num = I2S_PIN_NO_CHANGE,
		.data_in_num = PIN_MIC_SD,
	};

	i2s_driver_install(MIC_I2S_PORT, &i2sConfig, 0, nullptr);
	i2s_set_pin(MIC_I2S_PORT, &pinConfig);
}

/*
 * @return {float} `rel dB`
 */
float readNoiseLevel() {
	static int32_t samples[SAMPLES_PER_READ];
	size_t bytesRead = 0;
	i2s_read(MIC_I2S_PORT, samples, sizeof(samples), &bytesRead, portMAX_DELAY);
	int count = bytesRead / sizeof(int32_t);
	if (count <= 0)
		return 0.0f;

	long sum = 0;
	double sumSquares = 0;
	for (int i = 0; i < count; i++) {
		long v = samples[i] >> 8; // drop the 8 zero/padding low bits, keep the 24-bit sample sign-extended
		sum += v;
		sumSquares += (double)v * v;
	}

	double mean = (double)sum / count;
	double variance = sumSquares / count - mean * mean; // subtract DC offset before RMS
	if (variance < 0)
		variance = 0; // guard against fp rounding

	float rms = sqrt(variance);
	if (rms < 1)
		rms = 1; // avoid log(0)
	float dbRelative = 20.0f * log10(rms);
	return dbRelative; // relative value, not calibrated dB SPL
}
