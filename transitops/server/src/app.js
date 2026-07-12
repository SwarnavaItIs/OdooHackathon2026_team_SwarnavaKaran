import express from "express";
import cors from "cors";

import apiRoutes from "./routes/index.js";
import {
    errorHandler,
    notFoundHandler,
} from "./middleware/error.middleware.js";

const app = express();

const allowedOrigins = [
    process.env.CLIENT_URL || "http://localhost:5173",
];

app.use(
    cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error("Origin not allowed by CORS"));
        },
        credentials: true,
    })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Welcome to TransitOps API",
    });
});

app.use("/api", apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;