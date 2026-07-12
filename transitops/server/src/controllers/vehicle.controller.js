import prisma from "../config/prisma.js";
import { httpError } from "../utils/httpError.js";

function serializeVehicle(vehicle) {
    return {
        ...vehicle,
        maxLoadKg: Number(vehicle.maxLoadKg),
        odometerKm: Number(vehicle.odometerKm),
        acquisitionCost: Number(vehicle.acquisitionCost),
    };
}

export async function createVehicle(req, res, next) {
    try {
        const {
            registrationNumber,
            name,
            model,
            type,
            region,
            maxLoadKg,
            odometerKm,
            acquisitionCost,
        } = req.body;

        const vehicle = await prisma.vehicle.create({
            data: {
                registrationNumber,
                name,
                model,
                type,
                region,
                maxLoadKg,
                odometerKm,
                acquisitionCost,

                /*
                 * New operational vehicles always begin as AVAILABLE.
                 */
                status: "AVAILABLE",
            },
        });

        res.status(201).json({
            success: true,
            message: "Vehicle registered successfully",
            vehicle: serializeVehicle(vehicle),
        });
    } catch (error) {
        next(error);
    }
}

export async function getVehicles(req, res, next) {
    try {
        const {
            search,
            type,
            region,
            status,
            sortBy,
            sortOrder,
        } = req.validated.query;

        const where = {};

        if (status) {
            where.status = status;
        }

        if (type) {
            where.type = {
                equals: type,
                mode: "insensitive",
            };
        }

        if (region) {
            where.region = {
                equals: region,
                mode: "insensitive",
            };
        }

        if (search) {
            where.OR = [
                {
                    registrationNumber: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    name: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    model: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    type: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    region: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
            ];
        }

        const vehicles = await prisma.vehicle.findMany({
            where,
            orderBy: {
                [sortBy]: sortOrder,
            },
        });

        res.status(200).json({
            success: true,
            count: vehicles.length,
            vehicles: vehicles.map(serializeVehicle),
        });
    } catch (error) {
        next(error);
    }
}

export async function getVehicleById(req, res, next) {
    try {
        const { id } = req.validated.params;

        const vehicle = await prisma.vehicle.findUnique({
            where: {
                id,
            },
            include: {
                _count: {
                    select: {
                        trips: true,
                        maintenanceLogs: true,
                        fuelLogs: true,
                        expenses: true,
                    },
                },
            },
        });

        if (!vehicle) {
            throw httpError(404, "Vehicle not found");
        }

        res.status(200).json({
            success: true,
            vehicle: serializeVehicle(vehicle),
        });
    } catch (error) {
        next(error);
    }
}

export async function updateVehicle(req, res, next) {
    try {
        const { id } = req.validated.params;

        const existingVehicle = await prisma.vehicle.findUnique({
            where: {
                id,
            },
        });

        if (!existingVehicle) {
            throw httpError(404, "Vehicle not found");
        }

        /*
         * Avoid changing important vehicle details while the vehicle
         * is actively travelling.
         */
        if (existingVehicle.status === "ON_TRIP") {
            throw httpError(
                409,
                "A vehicle currently On Trip cannot be edited"
            );
        }

        if (
            req.body.odometerKm !== undefined &&
            Number(req.body.odometerKm) <
                Number(existingVehicle.odometerKm)
        ) {
            throw httpError(
                400,
                `Odometer cannot be below the current value of ${existingVehicle.odometerKm} km`
            );
        }

        const updated = await prisma.vehicle.updateMany({
            where: {
                id,
                status: existingVehicle.status,
            },
            data: req.body,
        });

        if (updated.count !== 1) {
            throw httpError(
                409,
                "Vehicle status changed before the update could be applied"
            );
        }

        const vehicle = await prisma.vehicle.findUnique({
            where: {
                id,
            },
        });

        if (!vehicle) {
            throw httpError(
                409,
                "Vehicle was removed before the update completed"
            );
        }

        res.status(200).json({
            success: true,
            message: "Vehicle updated successfully",
            vehicle: serializeVehicle(vehicle),
        });
    } catch (error) {
        next(error);
    }
}

export async function retireVehicle(req, res, next) {
    try {
        const { id } = req.validated.params;

        const vehicle = await prisma.vehicle.findUnique({
            where: {
                id,
            },
        });

        if (!vehicle) {
            throw httpError(404, "Vehicle not found");
        }

        if (vehicle.status === "RETIRED") {
            throw httpError(409, "Vehicle is already retired");
        }

        if (vehicle.status === "ON_TRIP") {
            throw httpError(
                409,
                "A vehicle currently On Trip cannot be retired"
            );
        }

        if (vehicle.status === "IN_SHOP") {
            throw httpError(
                409,
                "Close active maintenance before retiring this vehicle"
            );
        }

        const retired = await prisma.vehicle.updateMany({
            where: {
                id,
                status: "AVAILABLE",
            },
            data: {
                status: "RETIRED",
            },
        });

        if (retired.count !== 1) {
            throw httpError(
                409,
                "Vehicle status changed before it could be retired"
            );
        }

        const retiredVehicle = await prisma.vehicle.findUnique({
            where: {
                id,
            },
        });

        if (!retiredVehicle) {
            throw httpError(
                409,
                "Vehicle was removed before retirement completed"
            );
        }

        res.status(200).json({
            success: true,
            message: "Vehicle retired successfully",
            vehicle: serializeVehicle(retiredVehicle),
        });
    } catch (error) {
        next(error);
    }
}

export async function deleteVehicle(req, res, next) {
    try {
        const { id } = req.validated.params;

        const vehicle = await prisma.vehicle.findUnique({
            where: {
                id,
            },
            include: {
                _count: {
                    select: {
                        trips: true,
                        maintenanceLogs: true,
                        fuelLogs: true,
                        expenses: true,
                    },
                },
            },
        });

        if (!vehicle) {
            throw httpError(404, "Vehicle not found");
        }

        if (
            vehicle.status === "ON_TRIP" ||
            vehicle.status === "IN_SHOP"
        ) {
            throw httpError(
                409,
                `Vehicle cannot be deleted while status is ${vehicle.status}`
            );
        }

        const hasOperationalHistory =
            vehicle._count.trips > 0 ||
            vehicle._count.maintenanceLogs > 0 ||
            vehicle._count.fuelLogs > 0 ||
            vehicle._count.expenses > 0;

        if (hasOperationalHistory) {
            throw httpError(
                409,
                "Vehicle has operational history. Retire it instead of deleting it"
            );
        }

        await prisma.vehicle.delete({
            where: {
                id,
            },
        });

        res.status(200).json({
            success: true,
            message: "Vehicle deleted successfully",
        });
    } catch (error) {
        next(error);
    }
}

export async function getDispatchableVehicles(req, res, next) {
    try {
        /*
         * Retired, In Shop and On Trip vehicles are automatically
         * excluded because only AVAILABLE vehicles are selected.
         */
        const vehicles = await prisma.vehicle.findMany({
            where: {
                status: "AVAILABLE",
            },
            orderBy: [
                {
                    registrationNumber: "asc",
                },
            ],
        });

        res.status(200).json({
            success: true,
            count: vehicles.length,
            vehicles: vehicles.map(serializeVehicle),
        });
    } catch (error) {
        next(error);
    }
}

export async function getVehicleFilterOptions(req, res, next) {
    try {
        const vehicles = await prisma.vehicle.findMany({
            select: {
                type: true,
                region: true,
            },
        });

        const types = [
            ...new Set(vehicles.map((vehicle) => vehicle.type)),
        ].sort();

        const regions = [
            ...new Set(vehicles.map((vehicle) => vehicle.region)),
        ].sort();

        res.status(200).json({
            success: true,
            filters: {
                types,
                regions,
                statuses: [
                    "AVAILABLE",
                    "ON_TRIP",
                    "IN_SHOP",
                    "RETIRED",
                ],
            },
        });
    } catch (error) {
        next(error);
    }
}
