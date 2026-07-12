export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    /*
     * Replace the original request values with normalized
     * and validated values returned by Zod.
     */
    if (result.data.body !== undefined) {
      req.body = result.data.body;
    }

    if (result.data.params !== undefined) {
      req.params = result.data.params;
    }

    if (result.data.query !== undefined) {
      req.query = result.data.query;
    }

    next();
  };
}