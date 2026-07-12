import { Router } from "express";

import {
    createDriver,
    deleteDriver,
    getDriverById,
    getDriverFilterOptions,
    getDrivers,
    getEligibleDrivers,
    updateDriver,
    updateDriverStatus,
} from "../controllers/driver.controller.js";

import {
    authenticate,
    authorize,
} from "../middleware/auth.middleware.js";

import { validate } from "../middleware/validate.middleware.js";

import {
    createDriverSchema,
    driverIdParamSchema,
    driverListSchema,
    eligibleDriverListSchema,
    updateDriverSchema,
    updateDriverStatusSchema,
} from "../schemas/driver.schema.js";

const router = Router();

router.use(authenticate);

/*
 * Static endpoints must appear before "/:id".
 */
router.get(
    "/eligible",
    validate(eligibleDriverListSchema),
    getEligibleDrivers
);

router.get(
    "/filter-options",
    getDriverFilterOptions
);

/*
 * All authenticated roles can view drivers.
 */
router.get(
    "/",
    validate(driverListSchema),
    getDrivers
);

router.get(
    "/:id",
    validate(driverIdParamSchema),
    getDriverById
);

/*
 * Fleet Managers and Safety Officers manage driver records.
 */
router.post(
    "/",
    authorize(
        "FLEET_MANAGER",
        "SAFETY_OFFICER"
    ),
    validate(createDriverSchema),
    createDriver
);

router.patch(
    "/:id",
    authorize(
        "FLEET_MANAGER",
        "SAFETY_OFFICER"
    ),
    validate(updateDriverSchema),
    updateDriver
);

router.patch(
    "/:id/status",
    authorize(
        "FLEET_MANAGER",
        "SAFETY_OFFICER"
    ),
    validate(updateDriverStatusSchema),
    updateDriverStatus
);

router.delete(
    "/:id",
    authorize(
        "FLEET_MANAGER",
        "SAFETY_OFFICER"
    ),
    validate(driverIdParamSchema),
    deleteDriver
);

export default router;