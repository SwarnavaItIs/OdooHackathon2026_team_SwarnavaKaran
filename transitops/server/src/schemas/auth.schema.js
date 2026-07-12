import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z
      .email("Enter a valid email address")
      .transform((value) => value.trim().toLowerCase()),

    password: z
      .string()
      .min(8, "Password must contain at least 8 characters"),
  }),
});