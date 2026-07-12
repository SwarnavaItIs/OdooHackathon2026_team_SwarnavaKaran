import { z } from "zod";

const vehicleIdSchema = z.object({
    id: z.string().uuid("Invalid vehicle ID"),
});

const registrationNumberSchema = z
    .string()
    .trim()
    .min(3, "Registration number must contain at least 3 characters")
    .max(30, "Registration number cannot exceed 30 characters")
    .transform((value) => value.toUpperCase());

const optionalText = (maximumLength) =>
    z
        .string()
        .trim()
        .max(maximumLength)
        .optional()
        .nullable()
        .transform((value) => {
            if (value === undefined) return undefined;
            if (value === null || value === "") return null;
            return value;
        });

export const createVehicleSchema = z.object({
    body: z.object({
        registrationNumber: registrationNumberSchema,

        name: z
            .string()
            .trim()
            .min(2, "Vehicle name is required")
            .max(100),

        model: optionalText(100),

        type: z
            .string()
            .trim()
            .min(2, "Vehicle type is required")
            .max(50),

        region: z
            .string()
            .trim()
            .min(2, "Region is required")
            .max(100),

        maxLoadKg: z.coerce
            .number()
            .positive("Maximum load capacity must be greater than zero"),

        odometerKm: z.coerce
            .number()
            .min(0, "Odometer cannot be negative")
            .default(0),

        acquisitionCost: z.coerce
            .number()
            .min(0, "Acquisition cost cannot be negative")
            .default(0),
    }),
});

export const updateVehicleSchema = z.object({
    params: vehicleIdSchema,

    body: z
        .object({
            registrationNumber: registrationNumberSchema.optional(),

            name: z
                .string()
                .trim()
                .min(2)
                .max(100)
                .optional(),

            model: optionalText(100),

            type: z
                .string()
                .trim()
                .min(2)
                .max(50)
                .optional(),

            region: z
                .string()
                .trim()
                .min(2)
                .max(100)
                .optional(),

            maxLoadKg: z.coerce
                .number()
                .positive("Maximum load capacity must be greater than zero")
                .optional(),

            odometerKm: z.coerce
                .number()
                .min(0, "Odometer cannot be negative")
                .optional(),

            acquisitionCost: z.coerce
                .number()
                .min(0, "Acquisition cost cannot be negative")
                .optional(),
        })
        .refine(
            (body) => Object.keys(body).length > 0,
            "Provide at least one field to update"
        ),
});

export const vehicleIdParamSchema = z.object({
    params: vehicleIdSchema,
});

export const vehicleListSchema = z.object({
    query: z.object({
        search: z
            .string()
            .trim()
            .max(100)
            .optional(),

        type: z
            .string()
            .trim()
            .max(50)
            .optional(),

        region: z
            .string()
            .trim()
            .max(100)
            .optional(),

        status: z
            .enum([
                "AVAILABLE",
                "ON_TRIP",
                "IN_SHOP",
                "RETIRED",
            ])
            .optional(),

        sortBy: z
            .enum([
                "createdAt",
                "registrationNumber",
                "name",
                "odometerKm",
                "acquisitionCost",
            ])
            .default("createdAt"),

        sortOrder: z
            .enum(["asc", "desc"])
            .default("desc"),
    }),
});