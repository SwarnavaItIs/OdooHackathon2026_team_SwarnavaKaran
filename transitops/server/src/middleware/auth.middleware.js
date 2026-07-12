import jwt from "jsonwebtoken";

import prisma from "../config/prisma.js";

export async function authenticate(req, res, next) {
  try {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const bearerMatch = authorizationHeader.match(
      /^Bearer\s+(\S+)$/i
    );

    if (!bearerMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization header",
      });
    }

    const token = bearerMatch[1];

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ["HS256"],
      }
    );

    const userId =
      typeof decoded === "object" && decoded !== null
        ? decoded.sub
        : undefined;

    if (!userId || typeof userId !== "string") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account has been disabled",
      });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: {
        id: user.role.id,
        code: user.role.code,
        name: user.role.name,
      },
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Authentication token has expired",
      });
    }

    if (error.name === "NotBeforeError") {
      return res.status(401).json({
        success: false,
        message: "Authentication token is not active",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    next(error);
  }
}

/**
 * Usage:
 *
 * authorize("FLEET_MANAGER")
 *
 * authorize(
 *   "FLEET_MANAGER",
 *   "SAFETY_OFFICER"
 * )
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const currentRole = req.user.role.code;

    if (!allowedRoles.includes(currentRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied for role ${currentRole}`,
      });
    }

    next();
  };
}
