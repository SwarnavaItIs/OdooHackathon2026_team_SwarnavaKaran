import { Router } from "express";

import {
    createVehicle,
    deleteVehicle,
    getDispatchableVehicles,
    getVehicleById,
    getVehicleFilterOptions,
    getVehicles,
    retireVehicle,
    updateVehicle,
} from "../controllers/vehicle.controller.js";

import {
    authenticate,
    authorize,
} from "../middleware/auth.middleware.js";

import { validate } from "../middleware/validate.middleware.js";

import {
    createVehicleSchema,
    updateVehicleSchema,
    vehicleIdParamSchema,
    vehicleListSchema,
} from "../schemas/vehicle.schema.js";

const router = Router();

/*
 * Every vehicle endpoint requires authentication.
 */
router.use(authenticate);

/*
 * Static routes must come before "/:id".
 */
router.get(
    "/dispatchable",
    getDispatchableVehicles
);

router.get(
    "/filter-options",
    getVehicleFilterOptions
);

/*
 * All authenticated roles may view vehicles.
 */
router.get(
    "/",
    validate(vehicleListSchema),
    getVehicles
);

router.get(
    "/:id",
    validate(vehicleIdParamSchema),
    getVehicleById
);

/*
 * Only Fleet Managers can modify the vehicle registry.
 */
router.post(
    "/",
    authorize("FLEET_MANAGER"),
    validate(createVehicleSchema),
    createVehicle
);

router.patch(
    "/:id",
    authorize("FLEET_MANAGER"),
    validate(updateVehicleSchema),
    updateVehicle
);

router.post(
    "/:id/retire",
    authorize("FLEET_MANAGER"),
    validate(vehicleIdParamSchema),
    retireVehicle
);

router.delete(
    "/:id",
    authorize("FLEET_MANAGER"),
    validate(vehicleIdParamSchema),
    deleteVehicle
);

export default router;