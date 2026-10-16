PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_measurements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room` text NOT NULL,
	`timestamp` text NOT NULL,
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
	`heat_index_c` real
);
--> statement-breakpoint
INSERT INTO `__new_measurements`("id", "room", "timestamp", "temperature", "humidity", "pressure_hpa", "iaq", "iaq_accuracy", "eco2_ppm", "bvoc_ppm", "warming_up", "lux", "noise_db_rel", "dust_mgm3", "nearby_devices", "dew_point_c", "abs_humidity_gm3", "mold_risk_index", "heat_index_c") SELECT "id", "room", "timestamp", "temperature", "humidity", "pressure_hpa", "iaq", "iaq_accuracy", "eco2_ppm", "bvoc_ppm", "warming_up", "lux", "noise_db_rel", "dust_mgm3", "nearby_devices", "dew_point_c", "abs_humidity_gm3", "mold_risk_index", "heat_index_c" FROM `measurements`;--> statement-breakpoint
DROP TABLE `measurements`;--> statement-breakpoint
ALTER TABLE `__new_measurements` RENAME TO `measurements`;--> statement-breakpoint
PRAGMA foreign_keys=ON;