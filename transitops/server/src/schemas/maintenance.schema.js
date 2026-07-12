import { z } from "zod";

import {
    decimalLimits,
    numberInput,
} from "./common.schema.js";

const maintenanceIdParams = z.object({
    id: z.string().uuid("Invalid maintenance record ID"),
});

export const createMaintenanceSchema = z.object({
    body: z.object({
        vehicleId: z
            .string()
            .uuid("Invalid vehicle ID"),

        maintenanceType: z
            .string()
            .trim()
            .min(2, "Maintenance type is required")
            .max(100),

        description: z
            .string()
            .trim()
            .max(1000)
            .optional()
            .nullable()
            .transform((value) => {
                if (value === undefined) return undefined;
                if (value === null || value === "") return null;
                return value;
            }),

        cost: numberInput(
            z
                .number()
                .min(0, "Maintenance cost cannot be negative")
                .max(
                    decimalLimits.decimal14Scale2,
                    "Maintenance cost is too large"
                )
        ).default(0),
    }),
});

export const updateMaintenanceSchema = z.object({
    params: maintenanceIdParams,

    body: z
        .object({
            maintenanceType: z
                .string()
                .trim()
                .min(2)
                .max(100)
                .optional(),

            description: z
                .string()
                .trim()
                .max(1000)
                .optional()
                .nullable()
                .transform((value) => {
                    if (value === undefined) return undefined;
                    if (value === null || value === "") return null;
                    return value;
                }),

            cost: numberInput(
                z
                    .number()
                    .min(0, "Maintenance cost cannot be negative")
                    .max(
                        decimalLimits.decimal14Scale2,
                        "Maintenance cost is too large"
                    )
            ).optional(),
        })
        .refine(
            (body) => Object.keys(body).length > 0,
            "Provide at least one field to update"
        ),
});

export const maintenanceIdParamSchema = z.object({
    params: maintenanceIdParams,
});

export const maintenanceListSchema = z.object({
    query: z.object({
        search: z
            .string()
            .trim()
            .max(100)
            .optional(),

        status: z
            .enum(["ACTIVE", "CLOSED"])
            .optional(),

        vehicleId: z
            .string()
            .uuid("Invalid vehicle ID")
            .optional(),

        sortBy: z
            .enum([
                "createdAt",
                "startedAt",
                "closedAt",
                "cost",
            ])
            .default("createdAt"),

        sortOrder: z
            .enum(["asc", "desc"])
            .default("desc"),
    }),
});
