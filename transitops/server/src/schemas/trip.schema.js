import { z } from "zod";

import {
    decimalLimits,
    numberInput,
} from "./common.schema.js";

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

        cargoWeightKg: numberInput(
            z
                .number()
                .positive("Cargo weight must be greater than zero")
                .max(
                    decimalLimits.decimal10Scale2,
                    "Cargo weight is too large"
                )
        ),

        plannedDistanceKm: numberInput(
            z
                .number()
                .positive("Planned distance must be greater than zero")
                .max(
                    decimalLimits.decimal12Scale2,
                    "Planned distance is too large"
                )
        ),

        revenue: numberInput(
            z
                .number()
                .min(0, "Revenue cannot be negative")
                .max(
                    decimalLimits.decimal14Scale2,
                    "Revenue is too large"
                )
        ).default(0),
    }),
});

export const completeTripSchema = z.object({
    params: tripIdParams,

    body: z.object({
        finalOdometerKm: numberInput(
            z
                .number()
                .min(0, "Final odometer cannot be negative")
                .max(
                    decimalLimits.decimal12Scale2,
                    "Final odometer value is too large"
                )
        ),

        fuelLiters: numberInput(
            z
                .number()
                .min(0, "Fuel consumed cannot be negative")
                .max(
                    decimalLimits.decimal10Scale2,
                    "Fuel quantity is too large"
                )
        ).default(0),

        fuelCost: numberInput(
            z
                .number()
                .min(0, "Fuel cost cannot be negative")
                .max(
                    decimalLimits.decimal14Scale2,
                    "Fuel cost is too large"
                )
        ).default(0),

        revenue: numberInput(
            z
                .number()
                .min(0, "Revenue cannot be negative")
                .max(
                    decimalLimits.decimal14Scale2,
                    "Revenue is too large"
                )
        ).optional(),
    }).refine(
        (body) =>
            body.fuelLiters > 0 || body.fuelCost === 0,
        {
            path: ["fuelCost"],
            message:
                "Fuel cost must be zero when no fuel was consumed",
        }
    ),
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
