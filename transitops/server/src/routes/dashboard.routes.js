import { Router } from "express";

import {
  getDashboard,
} from "../controllers/dashboard.controller.js";

import {
  authenticate,
} from "../middleware/auth.middleware.js";

import {
  validate,
} from "../middleware/validate.middleware.js";

import {
  dashboardFilterSchema,
} from "../schemas/analytics.schema.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  validate(dashboardFilterSchema),
  getDashboard
);

export default router;