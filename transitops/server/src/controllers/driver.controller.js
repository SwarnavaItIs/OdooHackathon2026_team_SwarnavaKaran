import prisma from "../config/prisma.js";
import { httpError } from "../utils/httpError.js";

function startOfToday() {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
}

function isLicenseExpired(expiryDate) {
    return new Date(expiryDate) < startOfToday();
}

function serializeDriver(driver) {
    return {
        ...driver,
        safetyScore: Number(driver.safetyScore),
        licenseExpired: isLicenseExpired(driver.licenseExpiry),
    };
}

export async function createDriver(req, res, next) {
    try {
        const {
            name,
            licenseNumber,
            licenseCategory,
            licenseExpiry,
            contactNumber,
            safetyScore,
            region,
            status,
        } = req.body;

        const expired = isLicenseExpired(licenseExpiry);

        /*
         * An expired driver may be stored in the registry,
         * but cannot begin as AVAILABLE.
         */
        if (expired && status === "AVAILABLE") {
            throw httpError(
                400,
                "A driver with an expired licence cannot be marked Available"
            );
        }

        /*
         * If no status is supplied:
         * valid licence   → AVAILABLE
         * expired licence → OFF_DUTY
         */
        const initialStatus =
            status || (expired ? "OFF_DUTY" : "AVAILABLE");

        const driver = await prisma.driver.create({
            data: {
                name,
                licenseNumber,
                licenseCategory,
                licenseExpiry,
                contactNumber,
                safetyScore,
                region,
                status: initialStatus,
            },
        });

        res.status(201).json({
            success: true,
            message: "Driver registered successfully",
            driver: serializeDriver(driver),
        });
    } catch (error) {
        next(error);
    }
}

export async function getDrivers(req, res, next) {
    try {
        const {
            search,
            status,
            licenseCategory,
            region,
            licenseState,
            sortBy,
            sortOrder,
        } = req.validated.query;

        const where = {};

        if (status) {
            where.status = status;
        }

        if (licenseCategory) {
            where.licenseCategory = {
                equals: licenseCategory,
                mode: "insensitive",
            };
        }

        if (region) {
            where.region = {
                equals: region,
                mode: "insensitive",
            };
        }

        if (licenseState === "VALID") {
            where.licenseExpiry = {
                gte: startOfToday(),
            };
        }

        if (licenseState === "EXPIRED") {
            where.licenseExpiry = {
                lt: startOfToday(),
            };
        }

        if (search) {
            where.OR = [
                {
                    name: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    licenseNumber: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    licenseCategory: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    contactNumber: {
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

        const drivers = await prisma.driver.findMany({
            where,
            orderBy: {
                [sortBy]: sortOrder,
            },
        });

        res.status(200).json({
            success: true,
            count: drivers.length,
            drivers: drivers.map(serializeDriver),
        });
    } catch (error) {
        next(error);
    }
}

export async function getDriverById(req, res, next) {
    try {
        const { id } = req.validated.params;

        const driver = await prisma.driver.findUnique({
            where: {
                id,
            },
            include: {
                _count: {
                    select: {
                        trips: true,
                    },
                },
            },
        });

        if (!driver) {
            throw httpError(404, "Driver not found");
        }

        res.status(200).json({
            success: true,
            driver: serializeDriver(driver),
        });
    } catch (error) {
        next(error);
    }
}

export async function updateDriver(req, res, next) {
    try {
        const { id } = req.validated.params;

        const existingDriver = await prisma.driver.findUnique({
            where: {
                id,
            },
        });

        if (!existingDriver) {
            throw httpError(404, "Driver not found");
        }

        /*
         * Avoid changing licence or identity data during
         * an active trip.
         */
        if (existingDriver.status === "ON_TRIP") {
            throw httpError(
                409,
                "A driver currently On Trip cannot be edited"
            );
        }

        const data = {
            ...req.body,
        };

        /*
         * If a licence is changed to an expired date while the
         * driver is Available, automatically move them Off Duty.
         */
        if (
            data.licenseExpiry &&
            isLicenseExpired(data.licenseExpiry) &&
            existingDriver.status === "AVAILABLE"
        ) {
            data.status = "OFF_DUTY";
        }

        const driver = await prisma.driver.update({
            where: {
                id,
            },
            data,
        });

        res.status(200).json({
            success: true,
            message:
                data.status === "OFF_DUTY"
                    ? "Driver updated and moved Off Duty because the licence is expired"
                    : "Driver updated successfully",
            driver: serializeDriver(driver),
        });
    } catch (error) {
        next(error);
    }
}

export async function updateDriverStatus(req, res, next) {
    try {
        const { id } = req.validated.params;
        const { status } = req.body;

        const existingDriver = await prisma.driver.findUnique({
            where: {
                id,
            },
        });

        if (!existingDriver) {
            throw httpError(404, "Driver not found");
        }

        if (existingDriver.status === "ON_TRIP") {
            throw httpError(
                409,
                "A driver currently On Trip cannot have their status changed manually"
            );
        }

        if (existingDriver.status === status) {
            throw httpError(
                409,
                `Driver is already ${status}`
            );
        }

        /*
         * Suspended and Off Duty drivers can return to Available
         * only with a valid licence.
         */
        if (
            status === "AVAILABLE" &&
            isLicenseExpired(existingDriver.licenseExpiry)
        ) {
            throw httpError(
                409,
                "Driver cannot be marked Available because the licence has expired"
            );
        }

        const driver = await prisma.driver.update({
            where: {
                id,
            },
            data: {
                status,
            },
        });

        res.status(200).json({
            success: true,
            message: `Driver status changed to ${status}`,
            driver: serializeDriver(driver),
        });
    } catch (error) {
        next(error);
    }
}

export async function deleteDriver(req, res, next) {
    try {
        const { id } = req.validated.params;

        const driver = await prisma.driver.findUnique({
            where: {
                id,
            },
            include: {
                _count: {
                    select: {
                        trips: true,
                    },
                },
            },
        });

        if (!driver) {
            throw httpError(404, "Driver not found");
        }

        if (driver.status === "ON_TRIP") {
            throw httpError(
                409,
                "A driver currently On Trip cannot be deleted"
            );
        }

        if (driver._count.trips > 0) {
            throw httpError(
                409,
                "Driver has trip history and cannot be deleted. Suspend the driver instead"
            );
        }

        await prisma.driver.delete({
            where: {
                id,
            },
        });

        res.status(200).json({
            success: true,
            message: "Driver deleted successfully",
        });
    } catch (error) {
        next(error);
    }
}

export async function getEligibleDrivers(req, res, next) {
    try {
        const {
            region,
            licenseCategory,
        } = req.validated.query;

        const where = {
            status: "AVAILABLE",

            /*
             * Expired drivers are removed from dispatch selection.
             */
            licenseExpiry: {
                gte: startOfToday(),
            },
        };

        if (region) {
            where.region = {
                equals: region,
                mode: "insensitive",
            };
        }

        if (licenseCategory) {
            where.licenseCategory = {
                equals: licenseCategory,
                mode: "insensitive",
            };
        }

        const drivers = await prisma.driver.findMany({
            where,
            orderBy: [
                {
                    safetyScore: "desc",
                },
                {
                    name: "asc",
                },
            ],
        });

        res.status(200).json({
            success: true,
            count: drivers.length,
            drivers: drivers.map(serializeDriver),
        });
    } catch (error) {
        next(error);
    }
}

export async function getDriverFilterOptions(req, res, next) {
    try {
        const drivers = await prisma.driver.findMany({
            select: {
                licenseCategory: true,
                region: true,
            },
        });

        const licenseCategories = [
            ...new Set(
                drivers.map((driver) => driver.licenseCategory)
            ),
        ].sort();

        const regions = [
            ...new Set(
                drivers.map((driver) => driver.region)
            ),
        ].sort();

        res.status(200).json({
            success: true,
            filters: {
                licenseCategories,
                regions,
                statuses: [
                    "AVAILABLE",
                    "ON_TRIP",
                    "OFF_DUTY",
                    "SUSPENDED",
                ],
                licenseStates: [
                    "VALID",
                    "EXPIRED",
                ],
            },
        });
    } catch (error) {
        next(error);
    }
}