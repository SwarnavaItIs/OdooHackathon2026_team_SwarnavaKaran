CREATE UNIQUE INDEX "one_dispatched_trip_per_vehicle"
ON "trips" ("vehicle_id")
WHERE "status" = 'DISPATCHED';

CREATE UNIQUE INDEX "one_dispatched_trip_per_driver"
ON "trips" ("driver_id")
WHERE "status" = 'DISPATCHED';