export function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
}

export function errorHandler(error, req, res, next) {
    console.error(error);

    if (res.headersSent) {
        return next(error);
    }

    /*
     * Prisma unique constraint violation.
     */
    if (error.code === "P2002") {
        const target = error.meta?.target;

        const fieldText = Array.isArray(target)
            ? target.join(", ")
            : String(target || "unique field");

        if (
            fieldText.includes("registration_number") ||
            fieldText.includes("registrationNumber")
        ) {
            return res.status(409).json({
                success: false,
                message: "Vehicle registration number already exists",
            });
        }

        if (
            fieldText.includes("license_number") ||
            fieldText.includes("licenseNumber")
        ) {
            return res.status(409).json({
                success: false,
                message: "Driver licence number already exists",
            });
        }

        if (
            fieldText.includes("vehicle_id") ||
            fieldText.includes("driver_id") ||
            fieldText.includes("dispatched")
        ) {
            return res.status(409).json({
                success: false,
                message:
                    "Vehicle or driver is already assigned to an active trip",
            });
        }

        return res.status(409).json({
            success: false,
            message: `A record with the same ${fieldText} already exists`,
        });
    }

    /*
     * Foreign key violation.
     */
    if (error.code === "P2003") {
        return res.status(409).json({
            success: false,
            message:
                "This record is referenced by operational data and cannot be deleted",
        });
    }

    /*
 * Serializable transaction conflict or database deadlock.
 */
    if (error.code === "P2034") {
        return res.status(409).json({
            success: false,
            message:
                "The operation conflicted with another request. Please try again",
        });
    }
    /*
     * Prisma record not found.
     */
    if (error.code === "P2025") {
        return res.status(404).json({
            success: false,
            message: "Requested record was not found",
        });
    }

    const statusCode =
        error.statusCode ||
        error.status ||
        500;

    res.status(statusCode).json({
        success: false,
        message:
            statusCode === 500
                ? "Internal server error"
                : error.message,
    });
}