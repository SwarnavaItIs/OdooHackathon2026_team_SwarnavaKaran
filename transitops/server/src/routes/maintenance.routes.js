import { Router } from "express";

import {
    closeMaintenance,
    createMaintenance,
    getMaintenanceById,
    getMaintenanceRecords,
    updateMaintenance,
} from "../controllers/maintenance.controller.js";

import {
    authenticate,
    authorize,
} from "../middleware/auth.middleware.js";

import { validate } from "../middleware/validate.middleware.js";

import {
    createMaintenanceSchema,
    maintenanceIdParamSchema,
    maintenanceListSchema,
    updateMaintenanceSchema,
} from "../schemas/maintenance.schema.js";

const router = Router();

router.use(authenticate);

/*
 * All authenticated users may view maintenance history.
 */
router.get(
    "/",
    validate(maintenanceListSchema),
    getMaintenanceRecords
);

router.get(
    "/:id",
    validate(maintenanceIdParamSchema),
    getMaintenanceById
);

/*
 * Fleet Managers control maintenance operations.
 */
router.post(
    "/",
    authorize("FLEET_MANAGER"),
    validate(createMaintenanceSchema),
    createMaintenance
);

router.patch(
    "/:id",
    authorize("FLEET_MANAGER"),
    validate(updateMaintenanceSchema),
    updateMaintenance
);

router.post(
    "/:id/close",
    authorize("FLEET_MANAGER"),
    validate(maintenanceIdParamSchema),
    closeMaintenance
);

export default router;