import cors from "cors";
import express from "express";

import routes from "./routes/index.js";
import {
    errorHandler,
    notFoundHandler,
} from "./middleware/error.middleware.js";
import { httpError } from "./utils/httpError.js";

const app = express();

const allowedOrigins = (
    process.env.CLIENT_URL ||
    "http://localhost:5173"
)
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const devOriginPattern =
    /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/;

function isAllowedOrigin(origin) {
    if (!origin) {
        return true;
    }

    if (allowedOrigins.includes(origin)) {
        return true;
    }

    return (
        process.env.NODE_ENV !== "production" &&
        devOriginPattern.test(origin)
    );
}

app.disable("x-powered-by");

app.use(
    cors({
        origin(origin, callback) {
            /*
             * Requests without an Origin include
             * server-to-server calls and API clients.
             */
            if (isAllowedOrigin(origin)) {
                return callback(null, true);
            }

            return callback(
                httpError(
                    403,
                    "Origin is not allowed by CORS"
                )
            );
        },

        methods: [
            "GET",
            "POST",
            "PATCH",
            "DELETE",
            "OPTIONS",
        ],

        allowedHeaders: [
            "Content-Type",
            "Authorization",
        ],

        exposedHeaders: [
            "Content-Disposition",
        ],
    })
);

app.use(
    express.json({
        limit: "1mb",
    })
);

app.use(
    express.urlencoded({
        extended: true,
        limit: "1mb",
    })
);

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
