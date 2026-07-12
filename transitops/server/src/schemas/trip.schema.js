import { z } from "zod";

const tripIdParams = z.object({
    id: z.string().uuid("Invalid trip ID"),
});

export const createTripSchema = z.object({
    body: z.object({
        source: z
            .string()
            .trim()
            .min(2, "Source is required")
            .max(200),

        destination: z
            .string()
            .trim()
            .min(2, "Destination is required")
            .max(200),

        vehicleId: z
            .string()
            .uuid("Invalid vehicle ID"),

        driverId: z
            .string()
            .uuid("Invalid driver ID"),

        cargoWeightKg: z.coerce
            .number()
            .positive("Cargo weight must be greater than zero"),

        plannedDistanceKm: z.coerce
            .number()
            .positive("Planned distance must be greater than zero"),

        revenue: z.coerce
            .number()
            .min(0, "Revenue cannot be negative")
            .default(0),
    }),
});

export const completeTripSchema = z.object({
    params: tripIdParams,

    body: z.object({
        finalOdometerKm: z.coerce
            .number()
            .min(0, "Final odometer cannot be negative"),

        fuelLiters: z.coerce
            .number()
            .min(0, "Fuel consumed cannot be negative")
            .default(0),

        fuelCost: z.coerce
            .number()
            .min(0, "Fuel cost cannot be negative")
            .default(0),

        revenue: z.coerce
            .number()
            .min(0, "Revenue cannot be negative")
            .optional(),
    }),
});

export const tripIdParamSchema = z.object({
    params: tripIdParams,
});

export const tripListSchema = z.object({
    query: z.object({
        search: z
            .string()
            .trim()
            .max(100)
            .optional(),

        status: z
            .enum([
                "DRAFT",
                "DISPATCHED",
                "COMPLETED",
                "CANCELLED",
            ])
            .optional(),

        vehicleId: z
            .string()
            .uuid("Invalid vehicle ID")
            .optional(),

        driverId: z
            .string()
            .uuid("Invalid driver ID")
            .optional(),

        sortBy: z
            .enum([
                "createdAt",
                "dispatchedAt",
                "completedAt",
                "cargoWeightKg",
                "plannedDistanceKm",
            ])
            .default("createdAt"),

        sortOrder: z
            .enum(["asc", "desc"])
            .default("desc"),
    }),
});

export const dispatchOptionsSchema = z.object({
    query: z.object({
        region: z
            .string()
            .trim()
            .max(100)
            .optional(),

        vehicleType: z
            .string()
            .trim()
            .max(50)
            .optional(),

        licenseCategory: z
            .string()
            .trim()
            .max(30)
            .optional(),
    }),
});