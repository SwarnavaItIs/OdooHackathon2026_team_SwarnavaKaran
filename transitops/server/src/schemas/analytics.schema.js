import { z } from "zod";

const vehicleStatusEnum = z.enum([
  "AVAILABLE",
  "ON_TRIP",
  "IN_SHOP",
  "RETIRED",
]);

export const dashboardFilterSchema = z.object({
  query: z.object({
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

    status: vehicleStatusEnum.optional(),
  }),
});

export const vehicleReportSchema = z.object({
  query: z.object({
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

    status: vehicleStatusEnum.optional(),

    search: z
      .string()
      .trim()
      .max(100)
      .optional(),

    sortBy: z
      .enum([
        "registrationNumber",
        "fuelEfficiency",
        "operationalCost",
        "revenue",
        "roi",
      ])
      .default("registrationNumber"),

    sortOrder: z
      .enum(["asc", "desc"])
      .default("asc"),
  }),
});