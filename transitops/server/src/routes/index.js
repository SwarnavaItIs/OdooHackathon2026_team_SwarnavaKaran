import { Router } from "express";

import prisma from "../config/prisma.js";

import authRoutes from "./auth.routes.js";
import vehicleRoutes from "./vehicle.routes.js";
import driverRoutes from "./driver.routes.js";
import tripRoutes from "./trip.routes.js";

const router = Router();

router.get("/health", async (req, res, next) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.status(200).json({
            success: true,
            message: "TransitOps API is running",
            database: "connected",
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        next(error);
    }
});

router.use("/auth", authRoutes);
router.use("/vehicles", vehicleRoutes);
router.use("/drivers", driverRoutes);
router.use("/trips", tripRoutes);

export default router;