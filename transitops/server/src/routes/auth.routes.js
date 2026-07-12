import { Router } from "express";

import {
  getCurrentUser,
  login,
} from "../controllers/auth.controller.js";

import {
  authenticate,
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

export default router;
