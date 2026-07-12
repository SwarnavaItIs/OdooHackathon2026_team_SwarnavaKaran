import { Router } from "express";

import {
    cancelTrip,
    completeTrip,
    createTrip,
    dispatchTrip,
    getDispatchOptions,
    getTripById,
    getTrips,
} from "../controllers/trip.controller.js";

import {
    authenticate,
    authorize,
} from "../middleware/auth.middleware.js";

import { validate } from "../middleware/validate.middleware.js";

import {
    completeTripSchema,
    createTripSchema,
    dispatchOptionsSchema,
    tripIdParamSchema,
    tripListSchema,
} from "../schemas/trip.schema.js";

const router = Router();

router.use(authenticate);
router.use(
    authorize(
        "FLEET_MANAGER",
        "DRIVER"
    )
);

/*
 * Static routes must come before "/:id".
 */
router.get(
    "/dispatch-options",
    validate(dispatchOptionsSchema),
    getDispatchOptions
);

/*
 * Fleet Managers and operational Drivers can view trip information.
 */
router.get(
    "/",
    validate(tripListSchema),
    getTrips
);

router.get(
    "/:id",
    validate(tripIdParamSchema),
    getTripById
);

/*
 * Fleet Managers and operational Drivers can manage trips.
 */
router.post(
    "/",
    authorize(
        "FLEET_MANAGER",
        "DRIVER"
    ),
    validate(createTripSchema),
    createTrip
);

router.post(
    "/:id/dispatch",
    authorize(
        "FLEET_MANAGER",
        "DRIVER"
    ),
    validate(tripIdParamSchema),
    dispatchTrip
);

router.post(
    "/:id/complete",
    authorize(
        "FLEET_MANAGER",
        "DRIVER"
    ),
    validate(completeTripSchema),
    completeTrip
);

router.post(
    "/:id/cancel",
    authorize(
        "FLEET_MANAGER",
        "DRIVER"
    ),
    validate(tripIdParamSchema),
    cancelTrip
);

export default router;
