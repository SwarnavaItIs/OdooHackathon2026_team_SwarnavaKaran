import { Router } from "express";

import {
  getCurrentUser,
  login,
} from "../controllers/auth.controller.js";

import {
  authenticate,
  authorize,
} from "../middleware/auth.middleware.js";

import { validate } from "../middleware/validate.middleware.js";
import { loginSchema } from "../schemas/auth.schema.js";

const router = Router();

/*
 * Public route
 */
router.post(
  "/login",
  validate(loginSchema),
  login
);

/*
 * Any authenticated user
 */
router.get(
  "/me",
  authenticate,
  getCurrentUser
);

/*
 * Temporary RBAC test routes.
 * Remove these after actual modules use RBAC.
 */
router.get(
  "/test/fleet-manager",
  authenticate,
  authorize("FLEET_MANAGER"),
  (req, res) => {
    res.json({
      success: true,
      message: "Fleet Manager access granted",
      user: req.user,
    });
  }
);

router.get(
  "/test/finance",
  authenticate,
  authorize("FINANCIAL_ANALYST"),
  (req, res) => {
    res.json({
      success: true,
      message: "Financial Analyst access granted",
      user: req.user,
    });
  }
);

export default router;