CREATE UNIQUE INDEX "one_active_maintenance_per_vehicle"
ON "maintenance_logs" ("vehicle_id")
WHERE "status" = 'ACTIVE';