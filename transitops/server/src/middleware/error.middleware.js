export function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
}

export function errorHandler(error, req, res, next) {
    if (res.headersSent) {
        return next(error);
    }

    if (error?.type === "entity.parse.failed") {
        return res.status(400).json({
            success: false,
            message: "Request body contains invalid JSON",
        });
    }

    if (error?.type === "entity.too.large") {
        return res.status(413).json({
            success: false,
            message: "Request body is too large",
        });
    }

    const prismaErrorCode =
        error?.code ?? error?.errorCode;

    /*
     * Prisma unique constraint violation.
     */
    if (prismaErrorCode === "P2002") {
        const target = error.meta?.target;

        const fieldText = Array.isArray(target)
            ? target.join(", ")
            : String(target || "unique field");

        const modelName = String(
            error.meta?.modelName || ""
        );

        if (
            fieldText.includes("registration_number") ||
            fieldText.includes("registrationNumber")
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Vehicle registration number already exists",
            });
        }

        if (
            fieldText.includes("license_number") ||
            fieldText.includes("licenseNumber")
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Driver licence number already exists",
            });
        }

        if (
            modelName.includes("Maintenance") ||
            fieldText.includes(
                "one_active_maintenance_per_vehicle"
            )
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Vehicle already has an active maintenance record",
            });
        }

        if (
            modelName.includes("Trip") ||
            fieldText.includes(
                "one_dispatched_trip_per_vehicle"
            ) ||
            fieldText.includes(
                "one_dispatched_trip_per_driver"
            )
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Vehicle or driver is already assigned to an active trip",
            });
        }

        return res.status(409).json({
            success: false,
            message:
                "A record with the same unique value already exists",
        });
    }

    /*
     * Foreign key violation.
     */
    if (prismaErrorCode === "P2003") {
        return res.status(409).json({
            success: false,
            message:
                "This record is referenced by operational data and cannot be deleted",
        });
    }

    /*
     * Serializable transaction conflict or database deadlock.
     */
    if (prismaErrorCode === "P2034") {
        return res.status(409).json({
            success: false,
            message:
                "The operation conflicted with another request. Please try again",
        });
    }

    /*
     * Prisma record not found.
     */
    if (prismaErrorCode === "P2025") {
        return res.status(404).json({
            success: false,
            message: "Requested record was not found",
        });
    }

    if (
        [
            "P1000",
            "P1001",
            "P1002",
            "P1008",
            "P1017",
            "P2024",
        ].includes(prismaErrorCode)
    ) {
        console.error(
            "Database request failed:",
            prismaErrorCode
        );

        return res.status(503).json({
            success: false,
            message: "Database service is unavailable",
        });
    }

    const requestedStatus = Number(
        error?.statusCode ?? error?.status
    );

    const statusCode =
        Number.isInteger(requestedStatus) &&
        requestedStatus >= 400 &&
        requestedStatus <= 599
            ? requestedStatus
            : 500;

    if (statusCode >= 500) {
        console.error(error);
    }

    res.status(statusCode).json({
        success: false,
        message:
            statusCode === 500
                ? "Internal server error"
                : error?.message || "Request failed",
    });
}
