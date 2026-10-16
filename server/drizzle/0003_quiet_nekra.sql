PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_measurements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room` text NOT NULL,
	`timestamp` integer NOT NULL,
	`temperature` real,
	`humidity` real,
	`pressure_hpa` real,
	`iaq` real,
	`iaq_accuracy` integer,
	`eco2_ppm` real,
	`bvoc_ppm` real,
	`warming_up` integer,
	`lux` real,
	`noise_db_rel` real,
	`dust_mgm3` real,
	`nearby_devices` integer,
	`dew_point_c` real,
	`abs_humidity_gm3` real,
	`mold_risk_index` integer,
	`heat_index_c` real,
	CONSTRAINT "temperature_range" CHECK(temperature IS NULL OR temperature >= 0),
	CONSTRAINT "humidity_range" CHECK(humidity IS NULL OR humidity >= 0),
	CONSTRAINT "pressure_hpa_range" CHECK(pressure_hpa IS NULL OR pressure_hpa >= 0),
	CONSTRAINT "iaq_range" CHECK(iaq IS NULL OR (iaq BETWEEN 0 AND 500)),
	CONSTRAINT "iaq_accuracy_range" CHECK(iaq_accuracy IS NULL OR (iaq_accuracy BETWEEN 0 AND 3)),
	CONSTRAINT "eco2_ppm_range" CHECK(eco2_ppm IS NULL OR eco2_ppm >= 0),
	CONSTRAINT "bvoc_ppm_range" CHECK(bvoc_ppm IS NULL OR bvoc_ppm >= 0),
	CONSTRAINT "lux_range" CHECK(lux IS NULL OR lux >= 0),
	CONSTRAINT "noise_db_rel_range" CHECK(noise_db_rel IS NULL OR noise_db_rel >= 0),
	CONSTRAINT "dust_mgm3_range" CHECK(dust_mgm3 IS NULL OR dust_mgm3 >= 0),
	CONSTRAINT "nearby_devices_range" CHECK(nearby_devices IS NULL OR nearby_devices >= 0),
	CONSTRAINT "dew_point_c_range" CHECK(dew_point_c IS NULL OR dew_point_c >= 0),
	CONSTRAINT "abs_humidity_gm3_range" CHECK(abs_humidity_gm3 IS NULL OR abs_humidity_gm3 >= 0),
	CONSTRAINT "mold_risk_index_range" CHECK(mold_risk_index IS NULL OR (mold_risk_index BETWEEN -1 AND 3)),
	CONSTRAINT "heat_index_c_range" CHECK(heat_index_c IS NULL OR heat_index_c >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_measurements`("id", "room", "timestamp", "temperature", "humidity", "pressure_hpa", "iaq", "iaq_accuracy", "eco2_ppm", "bvoc_ppm", "warming_up", "lux", "noise_db_rel", "dust_mgm3", "nearby_devices", "dew_point_c", "abs_humidity_gm3", "mold_risk_index", "heat_index_c") SELECT "id", "room", "timestamp", "temperature", "humidity", "pressure_hpa", "iaq", "iaq_accuracy", "eco2_ppm", "bvoc_ppm", "warming_up", "lux", "noise_db_rel", "dust_mgm3", "nearby_devices", "dew_point_c", "abs_humidity_gm3", "mold_risk_index", "heat_index_c" FROM `measurements`;--> statement-breakpoint
DROP TABLE `measurements`;--> statement-breakpoint
ALTER TABLE `__new_measurements` RENAME TO `measurements`;--> statement-breakpoint
PRAGMA foreign_keys=ON;