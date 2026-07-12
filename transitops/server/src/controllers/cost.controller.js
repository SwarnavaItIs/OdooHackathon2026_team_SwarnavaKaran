import prisma from "../config/prisma.js";
import { httpError } from "../utils/httpError.js";

function toNumber(value) {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}

function roundTwo(value) {
  return Number(value.toFixed(2));
}

function serializeFuelLog(log) {
  return {
    ...log,
    liters: toNumber(log.liters),
    totalCost: toNumber(log.totalCost),
    odometerKm:
      log.odometerKm === null
        ? null
        : toNumber(log.odometerKm),
  };
}

function serializeExpense(expense) {
  return {
    ...expense,
    amount: toNumber(expense.amount),
  };
}

async function validateVehicleAndTrip(
  vehicleId,
  tripId
) {
  const vehicle = await prisma.vehicle.findUnique({
    where: {
      id: vehicleId,
    },
  });

  if (!vehicle) {
    throw httpError(404, "Vehicle not found");
  }

  if (!tripId) {
    return {
      vehicle,
      trip: null,
    };
  }

  const trip = await prisma.trip.findUnique({
    where: {
      id: tripId,
    },
  });

  if (!trip) {
    throw httpError(404, "Trip not found");
  }

  if (trip.vehicleId !== vehicleId) {
    throw httpError(
      400,
      "Selected trip does not belong to the selected vehicle"
    );
  }

  return {
    vehicle,
    trip,
  };
}

export async function createFuelLog(
  req,
  res,
  next
) {
  try {
    const {
      vehicleId,
      tripId,
      liters,
      totalCost,
      odometerKm,
      loggedAt,
    } = req.body;

    await validateVehicleAndTrip(
      vehicleId,
      tripId
    );

    const fuelLog = await prisma.fuelLog.create({
      data: {
        vehicleId,
        tripId: tripId || null,
        liters,
        totalCost,
        odometerKm:
          odometerKm === undefined
            ? null
            : odometerKm,
        loggedAt: loggedAt || new Date(),
        createdById: req.user.id,
      },

      include: {
        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            name: true,
          },
        },

        trip: {
          select: {
            id: true,
            source: true,
            destination: true,
            status: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Fuel log created successfully",
      fuelLog: serializeFuelLog(fuelLog),
    });
  } catch (error) {
    next(error);
  }
}

export async function getFuelLogs(
  req,
  res,
  next
) {
  try {
    const {
      vehicleId,
      tripId,
      dateFrom,
      dateTo,
      sortOrder,
    } = req.validated.query;

    const where = {};

    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    if (tripId) {
      where.tripId = tripId;
    }

    if (dateFrom || dateTo) {
      where.loggedAt = {};

      if (dateFrom) {
        where.loggedAt.gte = dateFrom;
      }

      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setUTCHours(23, 59, 59, 999);

        where.loggedAt.lte = endOfDay;
      }
    }

    const fuelLogs = await prisma.fuelLog.findMany({
      where,

      include: {
        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            name: true,
          },
        },

        trip: {
          select: {
            id: true,
            source: true,
            destination: true,
            status: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },

      orderBy: {
        loggedAt: sortOrder,
      },
    });

    res.status(200).json({
      success: true,
      count: fuelLogs.length,
      fuelLogs: fuelLogs.map(serializeFuelLog),
    });
  } catch (error) {
    next(error);
  }
}

export async function createExpense(
  req,
  res,
  next
) {
  try {
    const {
      vehicleId,
      tripId,
      category,
      description,
      amount,
      expenseDate,
    } = req.body;

    await validateVehicleAndTrip(
      vehicleId,
      tripId
    );

    const expense = await prisma.expense.create({
      data: {
        vehicleId,
        tripId: tripId || null,
        category,
        description,
        amount,
        expenseDate: expenseDate || new Date(),
        createdById: req.user.id,
      },

      include: {
        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            name: true,
          },
        },

        trip: {
          select: {
            id: true,
            source: true,
            destination: true,
            status: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      expense: serializeExpense(expense),
    });
  } catch (error) {
    next(error);
  }
}

export async function getExpenses(
  req,
  res,
  next
) {
  try {
    const {
      vehicleId,
      tripId,
      category,
      dateFrom,
      dateTo,
      sortOrder,
    } = req.validated.query;

    const where = {};

    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    if (tripId) {
      where.tripId = tripId;
    }

    if (category) {
      where.category = category;
    }

    if (dateFrom || dateTo) {
      where.expenseDate = {};

      if (dateFrom) {
        where.expenseDate.gte = dateFrom;
      }

      if (dateTo) {
        where.expenseDate.lte = dateTo;
      }
    }

    const expenses = await prisma.expense.findMany({
      where,

      include: {
        vehicle: {
          select: {
            id: true,
            registrationNumber: true,
            name: true,
          },
        },

        trip: {
          select: {
            id: true,
            source: true,
            destination: true,
            status: true,
          },
        },

        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },

      orderBy: {
        expenseDate: sortOrder,
      },
    });

    res.status(200).json({
      success: true,
      count: expenses.length,
      expenses: expenses.map(serializeExpense),
    });
  } catch (error) {
    next(error);
  }
}

function mapGroupTotals(records, valueSelector) {
  return new Map(
    records.map((record) => [
      record.vehicleId,
      valueSelector(record),
    ])
  );
}

export async function getVehicleCostSummary(
  req,
  res,
  next
) {
  try {
    const {
      type,
      region,
      status,
    } = req.validated.query;

    const vehicleWhere = {};

    if (type) {
      vehicleWhere.type = {
        equals: type,
        mode: "insensitive",
      };
    }

    if (region) {
      vehicleWhere.region = {
        equals: region,
        mode: "insensitive",
      };
    }

    if (status) {
      vehicleWhere.status = status;
    }

    const vehicles = await prisma.vehicle.findMany({
      where: vehicleWhere,

      orderBy: {
        registrationNumber: "asc",
      },
    });

    const vehicleIds = vehicles.map(
      (vehicle) => vehicle.id
    );

    if (vehicleIds.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        summaries: [],
      });
    }

    const [
      fuelTotals,
      maintenanceTotals,
      expenseTotals,
      tripTotals,
    ] = await Promise.all([
      prisma.fuelLog.groupBy({
        by: ["vehicleId"],

        where: {
          vehicleId: {
            in: vehicleIds,
          },
        },

        _sum: {
          liters: true,
          totalCost: true,
        },
      }),

      prisma.maintenanceLog.groupBy({
        by: ["vehicleId"],

        where: {
          vehicleId: {
            in: vehicleIds,
          },
        },

        _sum: {
          cost: true,
        },
      }),

      prisma.expense.groupBy({
        by: ["vehicleId"],

        where: {
          vehicleId: {
            in: vehicleIds,
          },
        },

        _sum: {
          amount: true,
        },
      }),

      prisma.trip.groupBy({
        by: ["vehicleId"],

        where: {
          vehicleId: {
            in: vehicleIds,
          },

          status: "COMPLETED",
        },

        _sum: {
          revenue: true,
          actualDistanceKm: true,
        },

        _count: {
          id: true,
        },
      }),
    ]);

    const fuelMap = mapGroupTotals(
      fuelTotals,
      (record) => ({
        liters: toNumber(record._sum.liters),
        cost: toNumber(record._sum.totalCost),
      })
    );

    const maintenanceMap = mapGroupTotals(
      maintenanceTotals,
      (record) =>
        toNumber(record._sum.cost)
    );

    const expenseMap = mapGroupTotals(
      expenseTotals,
      (record) =>
        toNumber(record._sum.amount)
    );

    const tripMap = mapGroupTotals(
      tripTotals,
      (record) => ({
        revenue: toNumber(record._sum.revenue),
        distance: toNumber(
          record._sum.actualDistanceKm
        ),
        completedTrips: record._count.id,
      })
    );

    const summaries = vehicles.map((vehicle) => {
      const fuel = fuelMap.get(vehicle.id) || {
        liters: 0,
        cost: 0,
      };

      const maintenanceCost =
        maintenanceMap.get(vehicle.id) || 0;

      const otherExpenseCost =
        expenseMap.get(vehicle.id) || 0;

      const trips = tripMap.get(vehicle.id) || {
        revenue: 0,
        distance: 0,
        completedTrips: 0,
      };

      const operationalCost =
        fuel.cost + maintenanceCost;

      const totalTrackedCost =
        operationalCost + otherExpenseCost;

      const acquisitionCost = toNumber(
        vehicle.acquisitionCost
      );

      const fuelEfficiency =
        fuel.liters > 0
          ? trips.distance / fuel.liters
          : 0;

      const roi =
        acquisitionCost > 0
          ? (
              trips.revenue -
              operationalCost
            ) / acquisitionCost
          : 0;

      return {
        vehicle: {
          id: vehicle.id,
          registrationNumber:
            vehicle.registrationNumber,
          name: vehicle.name,
          type: vehicle.type,
          region: vehicle.region,
          status: vehicle.status,
          acquisitionCost,
        },

        completedTrips: trips.completedTrips,
        completedDistanceKm: Number(
          trips.distance.toFixed(2)
        ),

        fuelLiters: Number(
          fuel.liters.toFixed(2)
        ),

        fuelEfficiencyKmPerLiter: Number(
          fuelEfficiency.toFixed(2)
        ),

        revenue: Number(
          trips.revenue.toFixed(2)
        ),

        fuelCost: Number(
          fuel.cost.toFixed(2)
        ),

        maintenanceCost: Number(
          maintenanceCost.toFixed(2)
        ),

        otherExpenseCost: Number(
          otherExpenseCost.toFixed(2)
        ),

        operationalCost: Number(
          operationalCost.toFixed(2)
        ),

        totalTrackedCost: Number(
          totalTrackedCost.toFixed(2)
        ),

        roi: Number(roi.toFixed(4)),
        roiPercentage: Number(
          (roi * 100).toFixed(2)
        ),
      };
    });

    res.status(200).json({
      success: true,
      count: summaries.length,
      formulas: {
        fuelEfficiency:
          "Completed Distance / Fuel Liters",
        operationalCost:
          "Fuel Cost + Maintenance Cost",
        totalTrackedCost:
          "Fuel + Maintenance + Other Expenses",
        roi:
          "(Revenue - Operational Cost) / Acquisition Cost",
      },
      summaries,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSingleVehicleCostSummary(
  req,
  res,
  next
) {
  try {
    const { id } = req.validated.params;

    const vehicle = await prisma.vehicle.findUnique({
      where: {
        id,
      },

      include: {
        fuelLogs: true,
        maintenanceLogs: true,
        expenses: true,

        trips: {
          where: {
            status: "COMPLETED",
          },
        },
      },
    });

    if (!vehicle) {
      throw httpError(404, "Vehicle not found");
    }

    const fuelLiters = vehicle.fuelLogs.reduce(
      (sum, log) => sum + toNumber(log.liters),
      0
    );

    const fuelCost = vehicle.fuelLogs.reduce(
      (sum, log) =>
        sum + toNumber(log.totalCost),
      0
    );

    const maintenanceCost =
      vehicle.maintenanceLogs.reduce(
        (sum, record) =>
          sum + toNumber(record.cost),
        0
      );

    const otherExpenseCost =
      vehicle.expenses.reduce(
        (sum, expense) =>
          sum + toNumber(expense.amount),
        0
      );

    const revenue = vehicle.trips.reduce(
      (sum, trip) =>
        sum + toNumber(trip.revenue),
      0
    );

    const completedDistanceKm =
      vehicle.trips.reduce(
        (sum, trip) =>
          sum +
          toNumber(trip.actualDistanceKm),
        0
      );

    const operationalCost =
      fuelCost + maintenanceCost;

    const totalTrackedCost =
      operationalCost + otherExpenseCost;

    const acquisitionCost = toNumber(
      vehicle.acquisitionCost
    );

    const fuelEfficiency =
      fuelLiters > 0
        ? completedDistanceKm / fuelLiters
        : 0;

    const roi =
      acquisitionCost > 0
        ? (
            revenue -
            operationalCost
          ) / acquisitionCost
        : 0;

    res.status(200).json({
      success: true,

      summary: {
        vehicle: {
          id: vehicle.id,
          registrationNumber:
            vehicle.registrationNumber,
          name: vehicle.name,
          type: vehicle.type,
          region: vehicle.region,
          status: vehicle.status,
          acquisitionCost,
        },

        completedTrips: vehicle.trips.length,
        completedDistanceKm: roundTwo(
          completedDistanceKm
        ),
        fuelLiters: roundTwo(fuelLiters),
        fuelEfficiencyKmPerLiter: Number(
          fuelEfficiency.toFixed(2)
        ),

        revenue: roundTwo(revenue),
        fuelCost: roundTwo(fuelCost),
        maintenanceCost: roundTwo(
          maintenanceCost
        ),
        otherExpenseCost: roundTwo(
          otherExpenseCost
        ),
        operationalCost: roundTwo(
          operationalCost
        ),
        totalTrackedCost: roundTwo(
          totalTrackedCost
        ),

        roi: Number(roi.toFixed(4)),
        roiPercentage: Number(
          (roi * 100).toFixed(2)
        ),
      },
    });
  } catch (error) {
    next(error);
  }
}
