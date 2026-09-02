-- Stackline WMS·3D — database schema (MySQL/TiDB)
-- Auto-generated from db/migration-sql.ts (idempotent bootstrap DDL)
-- Apply in order; all statements are safe to re-run.

CREATE TABLE `bins` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`rackId` bigint unsigned NOT NULL,
	`bay` int NOT NULL,
	`level` int NOT NULL,
	`code` varchar(64) NOT NULL,
	`widthM` double NOT NULL,
	`depthM` double NOT NULL,
	`heightM` double NOT NULL,
	`maxWeightKg` double NOT NULL DEFAULT 0,
	`status` varchar(16) NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bins_id` PRIMARY KEY(`id`),
	CONSTRAINT `bins_rack_code_unique` UNIQUE(`rackId`,`code`)
);

CREATE TABLE `compliance_docs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`docType` varchar(8) NOT NULL,
	`docNo` varchar(64) NOT NULL,
	`movementId` bigint unsigned,
	`invoiceId` bigint unsigned,
	`payloadJson` text,
	`validFrom` timestamp,
	`validUntil` timestamp,
	`status` varchar(16) NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `compliance_docs_id` PRIMARY KEY(`id`),
	CONSTRAINT `compliance_docs_docNo_unique` UNIQUE(`docNo`)
);

CREATE TABLE `customers` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(255) NOT NULL,
	`brandColor` varchar(32) NOT NULL DEFAULT '#f97316',
	`contactEmail` varchar(320),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_code_unique` UNIQUE(`code`)
);

CREATE TABLE `docks` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`warehouseId` bigint unsigned NOT NULL,
	`code` varchar(32) NOT NULL,
	`type` varchar(16) NOT NULL DEFAULT 'both',
	CONSTRAINT `docks_id` PRIMARY KEY(`id`),
	CONSTRAINT `docks_warehouse_code_unique` UNIQUE(`warehouseId`,`code`)
);

CREATE TABLE `erpnext_configs` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`baseUrl` varchar(512) NOT NULL DEFAULT '',
	`apiKey` varchar(255) NOT NULL DEFAULT '',
	`apiSecret` varchar(255) NOT NULL DEFAULT '',
	`enabled` int NOT NULL DEFAULT 0,
	`lastSyncAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `erpnext_configs_id` PRIMARY KEY(`id`)
);

CREATE TABLE `gate_passes` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`passNo` varchar(32) NOT NULL,
	`warehouseId` bigint unsigned NOT NULL,
	`vehicleId` bigint unsigned NOT NULL,
	`direction` varchar(8) NOT NULL,
	`driverName` varchar(255) NOT NULL,
	`purpose` varchar(255) NOT NULL DEFAULT '',
	`status` varchar(16) NOT NULL DEFAULT 'scheduled',
	`docRef` varchar(255),
	`scheduledAt` timestamp,
	`inAt` timestamp,
	`outAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gate_passes_id` PRIMARY KEY(`id`),
	CONSTRAINT `gate_passes_passNo_unique` UNIQUE(`passNo`)
);

CREATE TABLE `invoices` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`invoiceNo` varchar(64) NOT NULL,
	`customerId` bigint unsigned,
	`warehouseId` bigint unsigned NOT NULL,
	`movementId` bigint unsigned,
	`amountPaise` bigint unsigned NOT NULL DEFAULT 0,
	`taxPaise` bigint unsigned NOT NULL DEFAULT 0,
	`currency` varchar(8) NOT NULL DEFAULT 'INR',
	`shippingMethod` varchar(16) NOT NULL DEFAULT 'road',
	`status` varchar(16) NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNo_unique` UNIQUE(`invoiceNo`)
);

CREATE TABLE `items` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`sku` varchar(128) NOT NULL,
	`name` varchar(255) NOT NULL,
	`cartonLengthM` double NOT NULL,
	`cartonWidthM` double NOT NULL,
	`cartonHeightM` double NOT NULL,
	`cartonWeightKg` double NOT NULL,
	`erpnextItemCode` varchar(255),
	`groupCode` varchar(64) NOT NULL DEFAULT 'GEN',
	`variant` varchar(64),
	`standardRate` double,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `items_id` PRIMARY KEY(`id`),
	CONSTRAINT `items_sku_unique` UNIQUE(`sku`)
);

CREATE TABLE `load_plans` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`planNo` varchar(32) NOT NULL,
	`vehicleId` bigint unsigned NOT NULL,
	`warehouseId` bigint unsigned NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'draft',
	`utilizationPct` double NOT NULL DEFAULT 0,
	`totalWeightKg` double NOT NULL DEFAULT 0,
	`sequenceJson` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `load_plans_id` PRIMARY KEY(`id`),
	CONSTRAINT `load_plans_planNo_unique` UNIQUE(`planNo`)
);

CREATE TABLE `locations` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(255) NOT NULL,
	`city` varchar(128) NOT NULL,
	`region` varchar(128) NOT NULL,
	`lat` double NOT NULL,
	`lng` double NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `locations_id` PRIMARY KEY(`id`),
	CONSTRAINT `locations_code_unique` UNIQUE(`code`)
);

CREATE TABLE `movements` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`type` varchar(16) NOT NULL,
	`itemId` bigint unsigned NOT NULL,
	`qty` int NOT NULL,
	`fromBinId` bigint unsigned,
	`toBinId` bigint unsigned,
	`status` varchar(16) NOT NULL DEFAULT 'pending',
	`reference` varchar(255),
	`erpnextStockEntry` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `movements_id` PRIMARY KEY(`id`)
);

CREATE TABLE `placements` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`binId` bigint unsigned NOT NULL,
	`itemId` bigint unsigned NOT NULL,
	`qty` int NOT NULL,
	`batchNo` varchar(128),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `placements_id` PRIMARY KEY(`id`),
	CONSTRAINT `placements_bin_item_batch_unique` UNIQUE(`binId`,`itemId`,`batchNo`)
);

CREATE TABLE `racks` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`warehouseId` bigint unsigned NOT NULL,
	`name` varchar(64) NOT NULL,
	`positionX` double NOT NULL DEFAULT 0,
	`positionY` double NOT NULL DEFAULT 0,
	`rotationDeg` int NOT NULL DEFAULT 0,
	`bays` int NOT NULL,
	`levels` int NOT NULL,
	`bayWidthM` double NOT NULL,
	`bayDepthM` double NOT NULL,
	`levelHeightM` double NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `racks_id` PRIMARY KEY(`id`),
	CONSTRAINT `racks_warehouse_name_unique` UNIQUE(`warehouseId`,`name`)
);

CREATE TABLE `routes` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`routeNo` varchar(32) NOT NULL,
	`vehicleId` bigint unsigned NOT NULL,
	`direction` varchar(16) NOT NULL DEFAULT 'outward',
	`status` varchar(16) NOT NULL DEFAULT 'planned',
	`optimizedStopsJson` text,
	`totalKm` double NOT NULL DEFAULT 0,
	`etaMinutes` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `routes_id` PRIMARY KEY(`id`),
	CONSTRAINT `routes_routeNo_unique` UNIQUE(`routeNo`)
);

CREATE TABLE `scan_records` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`parcelId` varchar(64) NOT NULL,
	`warehouseId` bigint unsigned NOT NULL,
	`dockId` bigint unsigned,
	`lengthM` double NOT NULL,
	`widthM` double NOT NULL,
	`heightM` double NOT NULL,
	`actualWeightKg` double NOT NULL,
	`volumetricWeightKg` double NOT NULL,
	`xrayFlag` varchar(16) NOT NULL DEFAULT 'clear',
	`contentsGuess` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `scan_records_id` PRIMARY KEY(`id`)
);

CREATE TABLE `users` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`unionId` varchar(255) NOT NULL,
	`name` varchar(255),
	`email` varchar(320),
	`avatar` text,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	`lastSignInAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_unionId_unique` UNIQUE(`unionId`)
);

CREATE TABLE `vehicles` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`regNo` varchar(32) NOT NULL,
	`type` varchar(32) NOT NULL,
	`lengthM` double NOT NULL,
	`widthM` double NOT NULL,
	`heightM` double NOT NULL,
	`maxWeightKg` double NOT NULL,
	`gpsLat` double,
	`gpsLng` double,
	`status` varchar(16) NOT NULL DEFAULT 'idle',
	`driverName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vehicles_id` PRIMARY KEY(`id`),
	CONSTRAINT `vehicles_regNo_unique` UNIQUE(`regNo`)
);

CREATE TABLE `warehouses` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`code` varchar(64) NOT NULL,
	`lengthM` double NOT NULL,
	`widthM` double NOT NULL,
	`heightM` double NOT NULL,
	`aisleWidthM` double NOT NULL DEFAULT 3,
	`erpnextWarehouse` varchar(255),
	`locationId` bigint unsigned,
	`categoryMode` varchar(32) NOT NULL DEFAULT 'multi-category',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `warehouses_id` PRIMARY KEY(`id`),
	CONSTRAINT `warehouses_code_unique` UNIQUE(`code`)
);

ALTER TABLE `bins` ADD CONSTRAINT `bins_rackId_racks_id_fk` FOREIGN KEY (`rackId`) REFERENCES `racks`(`id`) ON DELETE cascade ON UPDATE no action;

ALTER TABLE `compliance_docs` ADD CONSTRAINT `compliance_docs_movementId_movements_id_fk` FOREIGN KEY (`movementId`) REFERENCES `movements`(`id`) ON DELETE no action ON UPDATE no action;

ALTER TABLE `compliance_docs` ADD CONSTRAINT `compliance_docs_invoiceId_invoices_id_fk` FOREIGN KEY (`invoiceId`) REFERENCES `invoices`(`id`) ON DELETE no action ON UPDATE no action;

ALTER TABLE `docks` ADD CONSTRAINT `docks_warehouseId_warehouses_id_fk` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE cascade ON UPDATE no action;

ALTER TABLE `gate_passes` ADD CONSTRAINT `gate_passes_warehouseId_warehouses_id_fk` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE no action ON UPDATE no action;

ALTER TABLE `gate_passes` ADD CONSTRAINT `gate_passes_vehicleId_vehicles_id_fk` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`) ON DELETE no action ON UPDATE no action;

ALTER TABLE `invoices` ADD CONSTRAINT `invoices_customerId_customers_id_fk` FOREIGN KEY (`customerId`) REFERENCES `customers`(`id`) ON DELETE no action ON UPDATE no action;

ALTER TABLE `invoices` ADD CONSTRAINT `invoices_warehouseId_warehouses_id_fk` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE no action ON UPDATE no action;

ALTER TABLE `invoices` ADD CONSTRAINT `invoices_movementId_movements_id_fk` FOREIGN KEY (`movementId`) REFERENCES `movements`(`id`) ON DELETE no action ON UPDATE no action;

ALTER TABLE `load_plans` ADD CONSTRAINT `load_plans_vehicleId_vehicles_id_fk` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`) ON DELETE no action ON UPDATE no action;

ALTER TABLE `load_plans` ADD CONSTRAINT `load_plans_warehouseId_warehouses_id_fk` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE no action ON UPDATE no action;

ALTER TABLE `movements` ADD CONSTRAINT `movements_itemId_items_id_fk` FOREIGN KEY (`itemId`) REFERENCES `items`(`id`) ON DELETE no action ON UPDATE no action;

ALTER TABLE `movements` ADD CONSTRAINT `movements_fromBinId_bins_id_fk` FOREIGN KEY (`fromBinId`) REFERENCES `bins`(`id`) ON DELETE no action ON UPDATE no action;

ALTER TABLE `movements` ADD CONSTRAINT `movements_toBinId_bins_id_fk` FOREIGN KEY (`toBinId`) REFERENCES `bins`(`id`) ON DELETE no action ON UPDATE no action;

ALTER TABLE `placements` ADD CONSTRAINT `placements_binId_bins_id_fk` FOREIGN KEY (`binId`) REFERENCES `bins`(`id`) ON DELETE cascade ON UPDATE no action;

ALTER TABLE `placements` ADD CONSTRAINT `placements_itemId_items_id_fk` FOREIGN KEY (`itemId`) REFERENCES `items`(`id`) ON DELETE no action ON UPDATE no action;

ALTER TABLE `racks` ADD CONSTRAINT `racks_warehouseId_warehouses_id_fk` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE cascade ON UPDATE no action;

ALTER TABLE `routes` ADD CONSTRAINT `routes_vehicleId_vehicles_id_fk` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`) ON DELETE no action ON UPDATE no action;

ALTER TABLE `scan_records` ADD CONSTRAINT `scan_records_warehouseId_warehouses_id_fk` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE no action ON UPDATE no action;

ALTER TABLE `scan_records` ADD CONSTRAINT `scan_records_dockId_docks_id_fk` FOREIGN KEY (`dockId`) REFERENCES `docks`(`id`) ON DELETE no action ON UPDATE no action;

ALTER TABLE `warehouses` ADD CONSTRAINT `warehouses_locationId_locations_id_fk` FOREIGN KEY (`locationId`) REFERENCES `locations`(`id`) ON DELETE no action ON UPDATE no action;

CREATE INDEX `bins_rack_idx` ON `bins` (`rackId`);

CREATE INDEX `compliance_docs_movement_idx` ON `compliance_docs` (`movementId`);

CREATE INDEX `compliance_docs_status_idx` ON `compliance_docs` (`status`);

CREATE INDEX `docks_warehouse_idx` ON `docks` (`warehouseId`);

CREATE INDEX `gate_passes_warehouse_idx` ON `gate_passes` (`warehouseId`);

CREATE INDEX `gate_passes_status_idx` ON `gate_passes` (`status`);

CREATE INDEX `invoices_customer_idx` ON `invoices` (`customerId`);

CREATE INDEX `invoices_movement_idx` ON `invoices` (`movementId`);

CREATE INDEX `load_plans_vehicle_idx` ON `load_plans` (`vehicleId`);

CREATE INDEX `movements_item_idx` ON `movements` (`itemId`);

CREATE INDEX `movements_from_bin_idx` ON `movements` (`fromBinId`);

CREATE INDEX `movements_to_bin_idx` ON `movements` (`toBinId`);

CREATE INDEX `movements_status_idx` ON `movements` (`status`);

CREATE INDEX `placements_bin_idx` ON `placements` (`binId`);

CREATE INDEX `placements_item_idx` ON `placements` (`itemId`);

CREATE INDEX `racks_warehouse_idx` ON `racks` (`warehouseId`);

CREATE INDEX `routes_vehicle_idx` ON `routes` (`vehicleId`);

CREATE INDEX `scan_records_warehouse_idx` ON `scan_records` (`warehouseId`);

ALTER TABLE `users` ADD `passwordHash` varchar(255);

