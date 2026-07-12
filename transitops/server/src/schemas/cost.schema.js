import { z } from "zod";

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

    liters: z.coerce
      .number()
      .positive("Fuel quantity must be greater than zero"),

    totalCost: z.coerce
      .number()
      .min(0, "Fuel cost cannot be negative"),

    odometerKm: z.coerce
      .number()
      .min(0, "Odometer cannot be negative")
      .optional()
      .nullable(),

    loggedAt: z.coerce
      .date()
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

    dateFrom: z.coerce
      .date()
      .optional(),

    dateTo: z.coerce
      .date()
      .optional(),

    sortOrder: z
      .enum(["asc", "desc"])
      .default("desc"),
  }),
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

    amount: z.coerce
      .number()
      .positive("Expense amount must be greater than zero"),

    expenseDate: z.coerce
      .date()
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

    dateFrom: z.coerce
      .date()
      .optional(),

    dateTo: z.coerce
      .date()
      .optional(),

    sortOrder: z
      .enum(["asc", "desc"])
      .default("desc"),
  }),
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