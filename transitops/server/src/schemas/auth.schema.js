import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Enter a valid email address")
      .max(255, "Email address is too long"),

    password: z
      .string()
      .min(8, "Password must contain at least 8 characters")
      .refine(
        (value) => Buffer.byteLength(value, "utf8") <= 72,
        "Password cannot exceed 72 UTF-8 bytes"
      ),
  }),
});
