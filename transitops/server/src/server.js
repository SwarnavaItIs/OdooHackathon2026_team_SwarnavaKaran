import "dotenv/config";

import app from "./app.js";
import prisma from "./config/prisma.js";

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, () => {
    console.log(`TransitOps API running on port ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
});

async function shutdown(signal) {
    console.log(`\n${signal} received. Shutting down...`);

    server.close(async () => {
        await prisma.$disconnect();
        console.log("Database disconnected");
        process.exit(0);
    });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));