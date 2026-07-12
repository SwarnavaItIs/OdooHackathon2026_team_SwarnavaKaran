import { z } from "zod";

import {
  dateInput,
  decimalLimits,
  numberInput,
} from "./common.schema.js";

const vehicleIdParams = z.object({
  id: z.string().uuid("Invalid vehicle ID"),
});

const nullableTripId = z
  .string()
  .uuid("Invalid trip ID")
  .optional()
  .nullable();

export const createFuelLogSchema = z.object({
  body: z.object({
    vehicleId: z
      .string()
      .uuid("Invalid vehicle ID"),

    tripId: nullableTripId,

    liters: numberInput(
      z
        .number()
        .positive("Fuel quantity must be greater than zero")
        .max(
          decimalLimits.decimal10Scale2,
          "Fuel quantity is too large"
        )
    ),

    totalCost: numberInput(
      z
        .number()
        .min(0, "Fuel cost cannot be negative")
        .max(
          decimalLimits.decimal14Scale2,
          "Fuel cost is too large"
        )
    ),

    odometerKm: numberInput(
      z
        .number()
        .min(0, "Odometer cannot be negative")
        .max(
          decimalLimits.decimal12Scale2,
          "Odometer value is too large"
        )
    )
      .optional()
      .nullable(),

    loggedAt: dateInput("Enter a valid fuel log date")
      .optional(),
  }),
});

export const fuelLogListSchema = z.object({
  query: z.object({
    vehicleId: z
      .string()
      .uuid("Invalid vehicle ID")
      .optional(),

    tripId: z
      .string()
      .uuid("Invalid trip ID")
      .optional(),

    dateFrom: dateInput("Enter a valid start date")
      .optional(),

    dateTo: dateInput("Enter a valid end date")
      .optional(),

    sortOrder: z
      .enum(["asc", "desc"])
      .default("desc"),
  }).refine(
    (query) =>
      !query.dateFrom ||
      !query.dateTo ||
      query.dateFrom <= query.dateTo,
    {
      path: ["dateTo"],
      message: "End date cannot be before start date",
    }
  ),
});

export const createExpenseSchema = z.object({
  body: z.object({
    vehicleId: z
      .string()
      .uuid("Invalid vehicle ID"),

    tripId: nullableTripId,

    category: z.enum([
      "TOLL",
      "PARKING",
      "INSURANCE",
      "PENALTY",
      "REPAIR",
      "OTHER",
    ]),

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

    amount: numberInput(
      z
        .number()
        .positive("Expense amount must be greater than zero")
        .max(
          decimalLimits.decimal14Scale2,
          "Expense amount is too large"
        )
    ),

    expenseDate: dateInput("Enter a valid expense date")
      .optional(),
  }),
});

export const expenseListSchema = z.object({
  query: z.object({
    vehicleId: z
      .string()
      .uuid("Invalid vehicle ID")
      .optional(),

    tripId: z
      .string()
      .uuid("Invalid trip ID")
      .optional(),

    category: z
      .enum([
        "TOLL",
        "PARKING",
        "INSURANCE",
        "PENALTY",
        "REPAIR",
        "OTHER",
      ])
      .optional(),

    dateFrom: dateInput("Enter a valid start date")
      .optional(),

    dateTo: dateInput("Enter a valid end date")
      .optional(),

    sortOrder: z
      .enum(["asc", "desc"])
      .default("desc"),
  }).refine(
    (query) =>
      !query.dateFrom ||
      !query.dateTo ||
      query.dateFrom <= query.dateTo,
    {
      path: ["dateTo"],
      message: "End date cannot be before start date",
    }
  ),
});

export const vehicleCostListSchema = z.object({
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

    status: z
      .enum([
        "AVAILABLE",
        "ON_TRIP",
        "IN_SHOP",
        "RETIRED",
      ])
      .optional(),
  }),
});

export const vehicleCostIdSchema = z.object({
  params: vehicleIdParams,
});
