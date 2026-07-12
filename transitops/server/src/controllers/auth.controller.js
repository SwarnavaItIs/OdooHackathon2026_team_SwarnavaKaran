import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import prisma from "../config/prisma.js";
import { httpError } from "../utils/httpError.js";

function generateToken(userId) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      sub: userId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: {
      id: user.role.id,
      code: user.role.code,
      name: user.role.name,
    },
  };
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
      include: {
        role: true,
      },
    });

    /*
     * Use the same error for unknown email and incorrect password.
     * This avoids revealing whether an account exists.
     */
    if (!user) {
      throw httpError(401, "Invalid email or password");
    }

    if (!user.isActive) {
      throw httpError(403, "This account has been disabled");
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      throw httpError(401, "Invalid email or password");
    }

    const token = generateToken(user.id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
}

export async function getCurrentUser(req, res, next) {
  try {
    /*
     * The authentication middleware has already fetched
     * the current active user and attached it to req.user.
     */
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
}