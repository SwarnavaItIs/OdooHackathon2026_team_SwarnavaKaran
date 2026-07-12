import { Router } from "express";

import {
  createExpense,
  createFuelLog,
  getExpenses,
  getFuelLogs,
  getSingleVehicleCostSummary,
  getVehicleCostSummary,
} from "../controllers/cost.controller.js";

import {
  authenticate,
  authorize,
} from "../middleware/auth.middleware.js";

import { validate } from "../middleware/validate.middleware.js";

import {
  createExpenseSchema,
  createFuelLogSchema,
  expenseListSchema,
  fuelLogListSchema,
  vehicleCostIdSchema,
  vehicleCostListSchema,
} from "../schemas/cost.schema.js";

const router = Router();

router.use(authenticate);

/*
 * Reading fuel, expense and cost data is available
 * to every authenticated role.
 */
router.get(
  "/fuel",
  validate(fuelLogListSchema),
  getFuelLogs
);

router.get(
  "/expenses",
  validate(expenseListSchema),
  getExpenses
);

router.get(
  "/vehicles",
  validate(vehicleCostListSchema),
  getVehicleCostSummary
);

router.get(
  "/vehicles/:id",
  validate(vehicleCostIdSchema),
  getSingleVehicleCostSummary
);

/*
 * Drivers may record fuel used during operations.
 */
router.post(
  "/fuel",
  authorize(
    "FLEET_MANAGER",
    "DRIVER",
    "FINANCIAL_ANALYST"
  ),
  validate(createFuelLogSchema),
  createFuelLog
);

/*
 * General financial expenses are controlled by
 * Fleet Managers and Financial Analysts.
 */
router.post(
  "/expenses",
  authorize(
    "FLEET_MANAGER",
    "FINANCIAL_ANALYST"
  ),
  validate(createExpenseSchema),
  createExpense
);

export default router;