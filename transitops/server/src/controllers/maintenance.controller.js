import { Prisma } from "@prisma/client";

import prisma from "../config/prisma.js";
import { httpError } from "../utils/httpError.js";

function toNumber(value) {
    return value === null || value === undefined
        ? value
        : Number(value);
}

function serializeVehicle(vehicle) {
    if (!vehicle) return vehicle;

    return {
        ...vehicle,
        maxLoadKg: toNumber(vehicle.maxLoadKg),
        odometerKm: toNumber(vehicle.odometerKm),
        acquisitionCost: toNumber(vehicle.acquisitionCost),
    };
}

function serializeMaintenance(record) {
    if (!record) return record;

    return {
        ...record,
        cost: toNumber(record.cost),
        vehicle: serializeVehicle(record.vehicle),
    };
}

export async function createMaintenance(req, res, next) {
    try {
        const {
            vehicleId,
            maintenanceType,
            description,
            cost,
        } = req.body;

        const maintenance = await prisma.$transaction(
            async (tx) => {
                const vehicle = await tx.vehicle.findUnique({
                    where: {
                        id: vehicleId,
                    },
                });

                if (!vehicle) {
                    throw httpError(404, "Vehicle not found");
                }

                if (vehicle.status === "RETIRED") {
                    throw httpError(
                        409,
                        "A retired vehicle cannot enter active maintenance"
                    );
                }

                if (vehicle.status === "ON_TRIP") {
                    throw httpError(
                        409,
                        "A vehicle currently On Trip cannot enter maintenance"
                    );
                }

                if (vehicle.status === "IN_SHOP") {
                    throw httpError(
                        409,
                        "Vehicle is already in maintenance"
                    );
                }

                const existingActiveMaintenance =
                    await tx.maintenanceLog.findFirst({
                        where: {
                            vehicleId,
                            status: "ACTIVE",
                        },
                    });

                if (existingActiveMaintenance) {
                    throw httpError(
                        409,
                        "Vehicle already has an active maintenance record"
                    );
                }

                /*
                 * Atomically claim the vehicle for maintenance.
                 * If another operation changed its status first,
                 * this update affects zero rows.
                 */
                const vehicleClaim =
                    await tx.vehicle.updateMany({
                        where: {
                            id: vehicleId,
                            status: "AVAILABLE",
                        },

                        data: {
                            status: "IN_SHOP",
                        },
                    });

                if (vehicleClaim.count !== 1) {
                    throw httpError(
                        409,
                        "Vehicle is no longer available for maintenance"
                    );
                }

                /*
                 * Rule 9:
                 * Creating ACTIVE maintenance moves the vehicle
                 * to IN_SHOP in the same transaction.
                 */
                return tx.maintenanceLog.create({
                    data: {
                        vehicleId,
                        maintenanceType,
                        description,
                        cost,
                        status: "ACTIVE",
                        startedAt: new Date(),
                        createdById: req.user.id,
                    },

                    include: {
                        vehicle: true,

                        createdBy: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                });
            },

            {
                isolationLevel:
                    Prisma.TransactionIsolationLevel.Serializable,
            }
        );

        res.status(201).json({
            success: true,
            message:
                "Maintenance started; vehicle moved to In Shop",
            maintenance: serializeMaintenance(maintenance),
        });
    } catch (error) {
        next(error);
    }
}

export async function getMaintenanceRecords(
    req,
    res,
    next
) {
    try {
        const {
            search,
            status,
            vehicleId,
            sortBy,
            sortOrder,
        } = req.validated.query;

        const where = {};

        if (status) {
            where.status = status;
        }

        if (vehicleId) {
            where.vehicleId = vehicleId;
        }

        if (search) {
            where.OR = [
                {
                    maintenanceType: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    description: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    vehicle: {
                        is: {
                            registrationNumber: {
                                contains: search,
                                mode: "insensitive",
                            },
                        },
                    },
                },
                {
                    vehicle: {
                        is: {
                            name: {
                                contains: search,
                                mode: "insensitive",
                            },
                        },
                    },
                },
            ];
        }

        const records =
            await prisma.maintenanceLog.findMany({
                where,

                include: {
                    vehicle: true,

                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },

                orderBy: {
                    [sortBy]: sortOrder,
                },
            });

        res.status(200).json({
            success: true,
            count: records.length,
            maintenanceRecords: records.map(
                serializeMaintenance
            ),
        });
    } catch (error) {
        next(error);
    }
}

export async function getMaintenanceById(
    req,
    res,
    next
) {
    try {
        const { id } = req.validated.params;

        const maintenance =
            await prisma.maintenanceLog.findUnique({
                where: {
                    id,
                },

                include: {
                    vehicle: true,

                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

        if (!maintenance) {
            throw httpError(
                404,
                "Maintenance record not found"
            );
        }

        res.status(200).json({
            success: true,
            maintenance:
                serializeMaintenance(maintenance),
        });
    } catch (error) {
        next(error);
    }
}

export async function updateMaintenance(
    req,
    res,
    next
) {
    try {
        const { id } = req.validated.params;

        const existing =
            await prisma.maintenanceLog.findUnique({
                where: {
                    id,
                },
            });

        if (!existing) {
            throw httpError(
                404,
                "Maintenance record not found"
            );
        }

        if (existing.status !== "ACTIVE") {
            throw httpError(
                409,
                "A closed maintenance record cannot be edited"
            );
        }

        const maintenance =
            await prisma.maintenanceLog.update({
                where: {
                    id,
                },

                data: req.body,

                include: {
                    vehicle: true,

                    createdBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

        res.status(200).json({
            success: true,
            message:
                "Maintenance record updated successfully",
            maintenance:
                serializeMaintenance(maintenance),
        });
    } catch (error) {
        next(error);
    }
}

export async function closeMaintenance(
    req,
    res,
    next
) {
    try {
        const { id } = req.validated.params;

        const maintenance = await prisma.$transaction(
            async (tx) => {
                const existing =
                    await tx.maintenanceLog.findUnique({
                        where: {
                            id,
                        },

                        include: {
                            vehicle: true,
                        },
                    });

                if (!existing) {
                    throw httpError(
                        404,
                        "Maintenance record not found"
                    );
                }

                if (existing.status !== "ACTIVE") {
                    throw httpError(
                        409,
                        "Maintenance record is already closed"
                    );
                }

                const closedRecord =
                    await tx.maintenanceLog.updateMany({
                        where: {
                            id: existing.id,
                            status: "ACTIVE",
                        },

                        data: {
                            status: "CLOSED",
                            closedAt: new Date(),
                        },
                    });

                if (closedRecord.count !== 1) {
                    throw httpError(
                        409,
                        "Maintenance status changed before it could be closed"
                    );
                }

                /*
                 * Rule 10:
                 * Retired vehicles stay retired.
                 */
                if (existing.vehicle.status !== "RETIRED") {
                    const vehicleRelease =
                        await tx.vehicle.updateMany({
                            where: {
                                id: existing.vehicleId,
                                status: "IN_SHOP",
                            },

                            data: {
                                status: "AVAILABLE",
                            },
                        });

                    if (vehicleRelease.count !== 1) {
                        throw httpError(
                            409,
                            "Vehicle is not in the expected In Shop state"
                        );
                    }
                }

                return tx.maintenanceLog.findUnique({
                    where: {
                        id: existing.id,
                    },

                    include: {
                        vehicle: true,

                        createdBy: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                });
            },

            {
                isolationLevel:
                    Prisma.TransactionIsolationLevel.Serializable,
            }
        );

        res.status(200).json({
            success: true,
            message:
                maintenance.vehicle.status === "RETIRED"
                    ? "Maintenance closed; retired vehicle status preserved"
                    : "Maintenance closed; vehicle restored to Available",

            maintenance:
                serializeMaintenance(maintenance),
        });
    } catch (error) {
        next(error);
    }
}