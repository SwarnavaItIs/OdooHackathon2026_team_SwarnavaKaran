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
         * Body is writable, so normalized body values can replace it.
         */
        if (result.data.body !== undefined) {
            req.body = result.data.body;
        }

        /*
         * Keep normalized params/query values separately.
         * This avoids assigning directly to req.query.
         */
        req.validated = result.data;

        next();
    };
}