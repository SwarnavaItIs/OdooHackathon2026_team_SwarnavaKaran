import { z } from "zod";

const driverIdSchema = z.object({
    id: z.string().uuid("Invalid driver ID"),
});

const licenseNumberSchema = z
    .string()
    .trim()
    .min(3, "Licence number must contain at least 3 characters")
    .max(50, "Licence number cannot exceed 50 characters")
    .transform((value) => value.toUpperCase());

const phoneSchema = z
    .string()
    .trim()
    .min(7, "Contact number is too short")
    .max(20, "Contact number cannot exceed 20 characters");

const dateSchema = z.coerce.date({
    message: "Enter a valid licence expiry date",
});

const editableDriverStatus = z.enum([
    "AVAILABLE",
    "OFF_DUTY",
    "SUSPENDED",
]);

export const createDriverSchema = z.object({
    body: z.object({
        name: z
            .string()
            .trim()
            .min(2, "Driver name is required")
            .max(100),

        licenseNumber: licenseNumberSchema,

        licenseCategory: z
            .string()
            .trim()
            .min(1, "Licence category is required")
            .max(30),

        licenseExpiry: dateSchema,

        contactNumber: phoneSchema,

        safetyScore: z.coerce
            .number()
            .min(0, "Safety score cannot be below 0")
            .max(100, "Safety score cannot exceed 100")
            .default(100),

        region: z
            .string()
            .trim()
            .min(2, "Region is required")
            .max(100),

        status: editableDriverStatus.optional(),
    }),
});

export const updateDriverSchema = z.object({
    params: driverIdSchema,

    body: z
        .object({
            name: z
                .string()
                .trim()
                .min(2)
                .max(100)
                .optional(),

            licenseNumber: licenseNumberSchema.optional(),

            licenseCategory: z
                .string()
                .trim()
                .min(1)
                .max(30)
                .optional(),

            licenseExpiry: dateSchema.optional(),

            contactNumber: phoneSchema.optional(),

            safetyScore: z.coerce
                .number()
                .min(0)
                .max(100)
                .optional(),

            region: z
                .string()
                .trim()
                .min(2)
                .max(100)
                .optional(),
        })
        .refine(
            (body) => Object.keys(body).length > 0,
            "Provide at least one field to update"
        ),
});

export const updateDriverStatusSchema = z.object({
    params: driverIdSchema,

    body: z.object({
        status: editableDriverStatus,
    }),
});

export const driverIdParamSchema = z.object({
    params: driverIdSchema,
});

export const driverListSchema = z.object({
    query: z.object({
        search: z
            .string()
            .trim()
            .max(100)
            .optional(),

        status: z
            .enum([
                "AVAILABLE",
                "ON_TRIP",
                "OFF_DUTY",
                "SUSPENDED",
            ])
            .optional(),

        licenseCategory: z
            .string()
            .trim()
            .max(30)
            .optional(),

        region: z
            .string()
            .trim()
            .max(100)
            .optional(),

        licenseState: z
            .enum(["VALID", "EXPIRED"])
            .optional(),

        sortBy: z
            .enum([
                "createdAt",
                "name",
                "licenseExpiry",
                "safetyScore",
            ])
            .default("createdAt"),

        sortOrder: z
            .enum(["asc", "desc"])
            .default("desc"),
    }),
});

export const eligibleDriverListSchema = z.object({
    query: z.object({
        region: z
            .string()
            .trim()
            .max(100)
            .optional(),

        licenseCategory: z
            .string()
            .trim()
            .max(30)
            .optional(),
    }),
});