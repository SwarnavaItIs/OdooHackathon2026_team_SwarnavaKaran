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
   * Prisma unique-constraint violation.
   */
  if (error.code === "P2002") {
    const fields = Array.isArray(error.meta?.target)
      ? error.meta.target.join(", ")
      : "unique field";

    return res.status(409).json({
      success: false,
      message: `A record with the same ${fields} already exists`,
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