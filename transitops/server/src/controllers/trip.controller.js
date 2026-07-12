import { Prisma } from "@prisma/client";

import prisma from "../config/prisma.js";
import { httpError } from "../utils/httpError.js";

function startOfTodayUtc() {
    const now = new Date();

    return new Date(
        Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate()
        )
    );
}

function isLicenseExpired(expiryDate) {
    return new Date(expiryDate) < startOfTodayUtc();
}

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

function serializeDriver(driver) {
    if (!driver) return driver;

    return {
        ...driver,
        safetyScore: toNumber(driver.safetyScore),
        licenseExpired: isLicenseExpired(driver.licenseExpiry),
    };
}

function serializeFuelLog(fuelLog) {
    if (!fuelLog) return fuelLog;

    return {
        ...fuelLog,
        liters: toNumber(fuelLog.liters),
        totalCost: toNumber(fuelLog.totalCost),
        odometerKm: toNumber(fuelLog.odometerKm),
    };
}

function serializeExpense(expense) {
    if (!expense) return expense;

    return {
        ...expense,
        amount: toNumber(expense.amount),
    };
}

function serializeTrip(trip) {
    if (!trip) return trip;

    return {
        ...trip,

        cargoWeightKg: toNumber(trip.cargoWeightKg),
        plannedDistanceKm: toNumber(trip.plannedDistanceKm),
        actualDistanceKm: toNumber(trip.actualDistanceKm),
        startOdometerKm: toNumber(trip.startOdometerKm),
        finalOdometerKm: toNumber(trip.finalOdometerKm),
        revenue: toNumber(trip.revenue),

        vehicle: serializeVehicle(trip.vehicle),
        driver: serializeDriver(trip.driver),

        fuelLogs: trip.fuelLogs
            ? trip.fuelLogs.map(serializeFuelLog)
            : undefined,

        expenses: trip.expenses
            ? trip.expenses.map(serializeExpense)
            : undefined,
    };
}

export async function getDispatchOptions(req, res, next) {
    try {
        const {
            region,
            vehicleType,
            licenseCategory,
        } = req.validated.query;

        const vehicleWhere = {
            status: "AVAILABLE",
        };

        const driverWhere = {
            status: "AVAILABLE",
            licenseExpiry: {
                gte: startOfTodayUtc(),
            },
        };

        if (region) {
            vehicleWhere.region = {
                equals: region,
                mode: "insensitive",
            };

            driverWhere.region = {
                equals: region,
                mode: "insensitive",
            };
        }

        if (vehicleType) {
            vehicleWhere.type = {
                equals: vehicleType,
                mode: "insensitive",
            };
        }

        if (licenseCategory) {
            driverWhere.licenseCategory = {
                equals: licenseCategory,
                mode: "insensitive",
            };
        }

        const [vehicles, drivers] = await Promise.all([
            prisma.vehicle.findMany({
                where: vehicleWhere,
                orderBy: {
                    registrationNumber: "asc",
                },
            }),

            prisma.driver.findMany({
                where: driverWhere,
                orderBy: [
                    {
                        safetyScore: "desc",
                    },
                    {
                        name: "asc",
                    },
                ],
            }),
        ]);

        res.status(200).json({
            success: true,

            vehicles: vehicles.map(serializeVehicle),
            drivers: drivers.map(serializeDriver),
        });
    } catch (error) {
        next(error);
    }
}

export async function createTrip(req, res, next) {
    try {
        const {
            source,
            destination,
            vehicleId,
            driverId,
            cargoWeightKg,
            plannedDistanceKm,
            revenue,
        } = req.body;

        const [vehicle, driver] = await Promise.all([
            prisma.vehicle.findUnique({
                where: {
                    id: vehicleId,
                },
            }),

            prisma.driver.findUnique({
                where: {
                    id: driverId,
                },
            }),
        ]);

        if (!vehicle) {
            throw httpError(404, "Vehicle not found");
        }

        if (!driver) {
            throw httpError(404, "Driver not found");
        }

        /*
         * Drafts use currently eligible resources.
         * Dispatch repeats all checks because availability may
         * change after the draft is created.
         */
        if (vehicle.status !== "AVAILABLE") {
            throw httpError(
                409,
                `Vehicle cannot be selected because its status is ${vehicle.status}`
            );
        }

        if (driver.status !== "AVAILABLE") {
            throw httpError(
                409,
                `Driver cannot be selected because their status is ${driver.status}`
            );
        }

        if (isLicenseExpired(driver.licenseExpiry)) {
            throw httpError(
                409,
                "Driver cannot be selected because the licence has expired"
            );
        }

        if (
            Number(cargoWeightKg) >
            Number(vehicle.maxLoadKg)
        ) {
            throw httpError(
                400,
                `Cargo weight exceeds the vehicle capacity of ${vehicle.maxLoadKg} kg`
            );
        }

        const activeMaintenance =
            await prisma.maintenanceLog.findFirst({
                where: {
                    vehicleId,
                    status: "ACTIVE",
                },
            });

        if (activeMaintenance) {
            throw httpError(
                409,
                "Vehicle has an active maintenance record"
            );
        }

        const trip = await prisma.trip.create({
            data: {
                source,
                destination,
                vehicleId,
                driverId,
                cargoWeightKg,
                plannedDistanceKm,
                revenue,
                status: "DRAFT",
                createdById: req.user.id,
            },

            include: {
                vehicle: true,
                driver: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            message: "Draft trip created successfully",
            trip: serializeTrip(trip),
        });
    } catch (error) {
        next(error);
    }
}

export async function getTrips(req, res, next) {
    try {
        const {
            search,
            status,
            vehicleId,
            driverId,
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

        if (driverId) {
            where.driverId = driverId;
        }

        if (search) {
            where.OR = [
                {
                    source: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    destination: {
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
                    driver: {
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

        const trips = await prisma.trip.findMany({
            where,

            include: {
                vehicle: true,
                driver: true,
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
            count: trips.length,
            trips: trips.map(serializeTrip),
        });
    } catch (error) {
        next(error);
    }
}

export async function getTripById(req, res, next) {
    try {
        const { id } = req.validated.params;

        const trip = await prisma.trip.findUnique({
            where: {
                id,
            },

            include: {
                vehicle: true,
                driver: true,

                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },

                fuelLogs: {
                    orderBy: {
                        loggedAt: "desc",
                    },
                },

                expenses: {
                    orderBy: {
                        expenseDate: "desc",
                    },
                },
            },
        });

        if (!trip) {
            throw httpError(404, "Trip not found");
        }

        res.status(200).json({
            success: true,
            trip: serializeTrip(trip),
        });
    } catch (error) {
        next(error);
    }
}

export async function dispatchTrip(req, res, next) {
    try {
        const { id } = req.validated.params;

        const trip = await prisma.$transaction(
            async (tx) => {
                const existingTrip = await tx.trip.findUnique({
                    where: {
                        id,
                    },

                    include: {
                        vehicle: true,
                        driver: true,
                    },
                });

                if (!existingTrip) {
                    throw httpError(404, "Trip not found");
                }

                if (existingTrip.status !== "DRAFT") {
                    throw httpError(
                        409,
                        "Only a Draft trip can be dispatched"
                    );
                }

                const {
                    vehicle,
                    driver,
                } = existingTrip;

                /*
                 * Rules 2 and 4:
                 * In Shop, Retired and On Trip vehicles cannot dispatch.
                 */
                if (vehicle.status !== "AVAILABLE") {
                    throw httpError(
                        409,
                        `Vehicle is not dispatchable. Current status: ${vehicle.status}`
                    );
                }

                /*
                 * Rules 3 and 4:
                 * Suspended, Off Duty and On Trip drivers cannot dispatch.
                 */
                if (driver.status !== "AVAILABLE") {
                    throw httpError(
                        409,
                        `Driver is not assignable. Current status: ${driver.status}`
                    );
                }

                if (isLicenseExpired(driver.licenseExpiry)) {
                    throw httpError(
                        409,
                        "Driver cannot be assigned because the licence has expired"
                    );
                }

                /*
                 * Rule 5:
                 * Cargo must fit the selected vehicle.
                 */
                if (
                    Number(existingTrip.cargoWeightKg) >
                    Number(vehicle.maxLoadKg)
                ) {
                    throw httpError(
                        400,
                        `Cargo exceeds the vehicle capacity of ${vehicle.maxLoadKg} kg`
                    );
                }

                const activeMaintenance =
                    await tx.maintenanceLog.findFirst({
                        where: {
                            vehicleId: vehicle.id,
                            status: "ACTIVE",
                        },
                    });

                if (activeMaintenance) {
                    throw httpError(
                        409,
                        "Vehicle has active maintenance and cannot be dispatched"
                    );
                }

                /*
                 * Helpful explicit double-booking check.
                 * The PostgreSQL partial indexes provide final protection.
                 */
                const conflictingTrip = await tx.trip.findFirst({
                    where: {
                        status: "DISPATCHED",
                        NOT: {
                            id: existingTrip.id,
                        },
                        OR: [
                            {
                                vehicleId: existingTrip.vehicleId,
                            },
                            {
                                driverId: existingTrip.driverId,
                            },
                        ],
                    },
                });

                if (conflictingTrip) {
                    throw httpError(
                        409,
                        "Vehicle or driver is already assigned to an active trip"
                    );
                }

                /*
                 * Atomically claim the vehicle.
                 * If another transaction changed its status first,
                 * count will be zero and the transaction rolls back.
                 */
                const vehicleClaim = await tx.vehicle.updateMany({
                    where: {
                        id: vehicle.id,
                        status: "AVAILABLE",
                    },

                    data: {
                        status: "ON_TRIP",
                    },
                });

                if (vehicleClaim.count !== 1) {
                    throw httpError(
                        409,
                        "Vehicle was assigned to another trip"
                    );
                }

                /*
                 * Atomically claim the driver and recheck licence validity.
                 */
                const driverClaim = await tx.driver.updateMany({
                    where: {
                        id: driver.id,
                        status: "AVAILABLE",
                        licenseExpiry: {
                            gte: startOfTodayUtc(),
                        },
                    },

                    data: {
                        status: "ON_TRIP",
                    },
                });

                if (driverClaim.count !== 1) {
                    throw httpError(
                        409,
                        "Driver is no longer available or their licence has expired"
                    );
                }

                /*
                 * Rule 6:
                 * Dispatch trip and store starting odometer.
                 */
                const tripClaim = await tx.trip.updateMany({
                    where: {
                        id: existingTrip.id,
                        status: "DRAFT",
                    },

                    data: {
                        status: "DISPATCHED",
                        dispatchedAt: new Date(),
                        startOdometerKm: vehicle.odometerKm,
                    },
                });

                if (tripClaim.count !== 1) {
                    throw httpError(
                        409,
                        "Trip status changed before dispatch completed"
                    );
                }

                return tx.trip.findUnique({
                    where: {
                        id: existingTrip.id,
                    },

                    include: {
                        vehicle: true,
                        driver: true,
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
                "Trip dispatched; vehicle and driver are now On Trip",
            trip: serializeTrip(trip),
        });
    } catch (error) {
        next(error);
    }
}

export async function completeTrip(req, res, next) {
    try {
        const { id } = req.validated.params;

        const {
            finalOdometerKm,
            fuelLiters,
            fuelCost,
            revenue,
        } = req.body;

        const trip = await prisma.$transaction(
            async (tx) => {
                const existingTrip = await tx.trip.findUnique({
                    where: {
                        id,
                    },

                    include: {
                        vehicle: true,
                        driver: true,
                    },
                });

                if (!existingTrip) {
                    throw httpError(404, "Trip not found");
                }

                if (existingTrip.status !== "DISPATCHED") {
                    throw httpError(
                        409,
                        "Only a Dispatched trip can be completed"
                    );
                }

                const startingOdometer = Number(
                    existingTrip.startOdometerKm ??
                    existingTrip.vehicle.odometerKm
                );

                const endingOdometer = Number(finalOdometerKm);

                if (endingOdometer < startingOdometer) {
                    throw httpError(
                        400,
                        `Final odometer cannot be below the starting odometer of ${startingOdometer} km`
                    );
                }

                const actualDistance =
                    endingOdometer - startingOdometer;

                /*
                 * Lock the transition by updating only if the trip
                 * is still DISPATCHED.
                 */
                const completedTrip = await tx.trip.updateMany({
                    where: {
                        id: existingTrip.id,
                        status: "DISPATCHED",
                    },

                    data: {
                        status: "COMPLETED",
                        completedAt: new Date(),
                        finalOdometerKm: endingOdometer,
                        actualDistanceKm: actualDistance,

                        ...(revenue !== undefined
                            ? { revenue }
                            : {}),
                    },
                });

                if (completedTrip.count !== 1) {
                    throw httpError(
                        409,
                        "Trip status changed before completion"
                    );
                }

                /*
                 * Rule 7:
                 * Vehicle returns to Available and receives
                 * the final odometer.
                 */
                const vehicleRelease =
                    await tx.vehicle.updateMany({
                        where: {
                            id: existingTrip.vehicleId,
                            status: "ON_TRIP",
                        },

                        data: {
                            status: "AVAILABLE",
                            odometerKm: endingOdometer,
                        },
                    });

                if (vehicleRelease.count !== 1) {
                    throw httpError(
                        409,
                        "Vehicle is not in the expected On Trip state"
                    );
                }

                /*
                 * Rule 7:
                 * The driver returns to Available unless the licence
                 * expired while the trip was active.
                 */
                const returnDriverStatus = isLicenseExpired(
                    existingTrip.driver.licenseExpiry
                )
                    ? "OFF_DUTY"
                    : "AVAILABLE";

                const driverRelease =
                    await tx.driver.updateMany({
                        where: {
                            id: existingTrip.driverId,
                            status: "ON_TRIP",
                        },

                        data: {
                            status: returnDriverStatus,
                        },
                    });

                if (driverRelease.count !== 1) {
                    throw httpError(
                        409,
                        "Driver is not in the expected On Trip state"
                    );
                }

                /*
                 * Create a fuel log when fuel was entered.
                 */
                if (Number(fuelLiters) > 0) {
                    await tx.fuelLog.create({
                        data: {
                            vehicleId: existingTrip.vehicleId,
                            tripId: existingTrip.id,
                            liters: fuelLiters,
                            totalCost: fuelCost,
                            odometerKm: endingOdometer,
                            loggedAt: new Date(),
                            createdById: req.user.id,
                        },
                    });
                }

                return tx.trip.findUnique({
                    where: {
                        id: existingTrip.id,
                    },

                    include: {
                        vehicle: true,
                        driver: true,
                        fuelLogs: true,
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
                trip.driver.status === "OFF_DUTY"
                    ? "Trip completed; vehicle is Available and the driver moved Off Duty because the licence expired"
                    : "Trip completed; vehicle and driver are now Available",
            trip: serializeTrip(trip),
        });
    } catch (error) {
        next(error);
    }
}

export async function cancelTrip(req, res, next) {
    try {
        const { id } = req.validated.params;

        const trip = await prisma.$transaction(
            async (tx) => {
                const existingTrip = await tx.trip.findUnique({
                    where: {
                        id,
                    },

                    include: {
                        vehicle: true,
                        driver: true,
                    },
                });

                if (!existingTrip) {
                    throw httpError(404, "Trip not found");
                }

                if (existingTrip.status === "COMPLETED") {
                    throw httpError(
                        409,
                        "A completed trip cannot be cancelled"
                    );
                }

                if (existingTrip.status === "CANCELLED") {
                    throw httpError(
                        409,
                        "Trip is already cancelled"
                    );
                }

                /*
                 * Rule 8:
                 * Cancelling a dispatched trip releases both resources.
                 */
                if (existingTrip.status === "DISPATCHED") {
                    const vehicleRelease =
                        await tx.vehicle.updateMany({
                            where: {
                                id: existingTrip.vehicleId,
                                status: "ON_TRIP",
                            },

                            data: {
                                status: "AVAILABLE",
                            },
                        });

                    if (vehicleRelease.count !== 1) {
                        throw httpError(
                            409,
                            "Vehicle is not in the expected On Trip state"
                        );
                    }

                    const returnDriverStatus = isLicenseExpired(
                        existingTrip.driver.licenseExpiry
                    )
                        ? "OFF_DUTY"
                        : "AVAILABLE";

                    const driverRelease =
                        await tx.driver.updateMany({
                            where: {
                                id: existingTrip.driverId,
                                status: "ON_TRIP",
                            },

                            data: {
                                status: returnDriverStatus,
                            },
                        });

                    if (driverRelease.count !== 1) {
                        throw httpError(
                            409,
                            "Driver is not in the expected On Trip state"
                        );
                    }
                }

                const cancellation =
                    await tx.trip.updateMany({
                        where: {
                            id: existingTrip.id,
                            status: existingTrip.status,
                        },

                        data: {
                            status: "CANCELLED",
                            cancelledAt: new Date(),
                        },
                    });

                if (cancellation.count !== 1) {
                    throw httpError(
                        409,
                        "Trip status changed before cancellation"
                    );
                }

                return tx.trip.findUnique({
                    where: {
                        id: existingTrip.id,
                    },

                    include: {
                        vehicle: true,
                        driver: true,
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
                !trip.dispatchedAt
                    ? "Draft trip cancelled"
                    : trip.driver.status === "OFF_DUTY"
                      ? "Trip cancelled; vehicle is Available and the driver moved Off Duty because the licence expired"
                      : "Trip cancelled and assigned resources restored",
            trip: serializeTrip(trip),
        });
    } catch (error) {
        next(error);
    }
}
