import "dotenv/config";

import app from "./app.js";
import prisma from "./config/prisma.js";

const PORT = Number(
    process.env.PORT || 5000
);

const server = app.listen(
    PORT,
    () => {
        console.log(
            `TransitOps API running on port ${PORT}`
        );
    }
);

async function shutdown(signal) {
    console.log(
        `\nReceived ${signal}. Shutting down...`
    );

    server.close(async () => {
        try {
            await prisma.$disconnect();

            console.log(
                "Database connection closed"
            );

            process.exit(0);
        } catch (error) {
            console.error(
                "Shutdown failed:",
                error
            );

            process.exit(1);
        }
    });

    /*
     * Prevent a permanently hanging process.
     */
    setTimeout(() => {
        console.error(
            "Forced shutdown after timeout"
        );

        process.exit(1);
    }, 10000).unref();
}

process.on("SIGINT", () =>
    shutdown("SIGINT")
);

process.on("SIGTERM", () =>
    shutdown("SIGTERM")
);

process.on(
    "unhandledRejection",
    (error) => {
        console.error(
            "Unhandled promise rejection:",
            error
        );
    }
);

process.on(
    "uncaughtException",
    (error) => {
        console.error(
            "Uncaught exception:",
            error
        );

        process.exit(1);
    }
);