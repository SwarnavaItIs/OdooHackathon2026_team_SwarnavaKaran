import { Router } from "express";

import {
  exportVehicleReportCsv,
  getVehicleReport,
} from "../controllers/report.controller.js";

import {
  authenticate,
  authorize,
} from "../middleware/auth.middleware.js";

import {
  validate,
} from "../middleware/validate.middleware.js";

import {
  vehicleReportSchema,
} from "../schemas/analytics.schema.js";

const router = Router();

router.use(authenticate);

router.get(
  "/vehicles",
  authorize(
    "FLEET_MANAGER",
    "FINANCIAL_ANALYST"
  ),
  validate(vehicleReportSchema),
  getVehicleReport
);

router.get(
  "/vehicles/csv",
  authorize(
    "FLEET_MANAGER",
    "FINANCIAL_ANALYST"
  ),
  validate(vehicleReportSchema),
  exportVehicleReportCsv
);

export default router;