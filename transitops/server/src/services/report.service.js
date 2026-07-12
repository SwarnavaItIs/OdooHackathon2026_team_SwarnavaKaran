import prisma from "../config/prisma.js";

function toNumber(value) {
  if (value === null || value === undefined) {
    return 0;
  }

  return Number(value);
}

function buildVehicleWhere(filters) {
  const where = {};

  if (filters.type) {
    where.type = {
      equals: filters.type,
      mode: "insensitive",
    };
  }

  if (filters.region) {
    where.region = {
      equals: filters.region,
      mode: "insensitive",
    };
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.search) {
    where.OR = [
      {
        registrationNumber: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        name: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        model: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        type: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
      {
        region: {
          contains: filters.search,
          mode: "insensitive",
        },
      },
    ];
  }

  return where;
}

function createGroupMap(records, mapper) {
  return new Map(
    records.map((record) => [
      record.vehicleId,
      mapper(record),
    ])
  );
}

function sortRows(rows, sortBy, sortOrder) {
  const direction = sortOrder === "desc" ? -1 : 1;

  const fieldMap = {
    registrationNumber: (row) =>
      row.registrationNumber.toLowerCase(),

    fuelEfficiency: (row) =>
      row.fuelEfficiencyKmPerLiter,

    operationalCost: (row) =>
      row.operationalCost,

    revenue: (row) =>
      row.revenue,

    roi: (row) =>
      row.roiPercentage,
  };

  const selector =
    fieldMap[sortBy] ||
    fieldMap.registrationNumber;

  return rows.sort((first, second) => {
    const a = selector(first);
    const b = selector(second);

    if (typeof a === "string") {
      return a.localeCompare(b) * direction;
    }

    return (a - b) * direction;
  });
}

export async function buildVehicleReport(filters = {}) {
  const vehicles = await prisma.vehicle.findMany({
    where: buildVehicleWhere(filters),
  });

  const vehicleIds = vehicles.map(
    (vehicle) => vehicle.id
  );

  if (vehicleIds.length === 0) {
    return {
      rows: [],
      totals: {
        vehicles: 0,
        completedTrips: 0,
        completedDistanceKm: 0,
        fuelLiters: 0,
        fuelCost: 0,
        maintenanceCost: 0,
        otherExpenseCost: 0,
        operationalCost: 0,
        totalTrackedCost: 0,
        revenue: 0,
      },
    };
  }

  const [
    fuelGroups,
    maintenanceGroups,
    expenseGroups,
    tripGroups,
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

  const fuelMap = createGroupMap(
    fuelGroups,
    (record) => ({
      liters: toNumber(record._sum.liters),
      cost: toNumber(record._sum.totalCost),
    })
  );

  const maintenanceMap = createGroupMap(
    maintenanceGroups,
    (record) => toNumber(record._sum.cost)
  );

  const expenseMap = createGroupMap(
    expenseGroups,
    (record) => toNumber(record._sum.amount)
  );

  const tripMap = createGroupMap(
    tripGroups,
    (record) => ({
      completedTrips: record._count.id,
      distance: toNumber(
        record._sum.actualDistanceKm
      ),
      revenue: toNumber(record._sum.revenue),
    })
  );

  const rows = vehicles.map((vehicle) => {
    const fuel = fuelMap.get(vehicle.id) || {
      liters: 0,
      cost: 0,
    };

    const maintenanceCost =
      maintenanceMap.get(vehicle.id) || 0;

    const otherExpenseCost =
      expenseMap.get(vehicle.id) || 0;

    const trip = tripMap.get(vehicle.id) || {
      completedTrips: 0,
      distance: 0,
      revenue: 0,
    };

    const acquisitionCost = toNumber(
      vehicle.acquisitionCost
    );

    const operationalCost =
      fuel.cost + maintenanceCost;

    const totalTrackedCost =
      operationalCost + otherExpenseCost;

    const fuelEfficiency =
      fuel.liters > 0
        ? trip.distance / fuel.liters
        : 0;

    /*
     * Required formula:
     *
     * Revenue - (Maintenance + Fuel)
     * --------------------------------
     *         Acquisition Cost
     */
    const roi =
      acquisitionCost > 0
        ? (
            trip.revenue -
            operationalCost
          ) / acquisitionCost
        : 0;

    return {
      vehicleId: vehicle.id,
      registrationNumber:
        vehicle.registrationNumber,
      vehicleName: vehicle.name,
      model: vehicle.model,
      type: vehicle.type,
      region: vehicle.region,
      status: vehicle.status,

      acquisitionCost: Number(
        acquisitionCost.toFixed(2)
      ),

      completedTrips: trip.completedTrips,

      completedDistanceKm: Number(
        trip.distance.toFixed(2)
      ),

      fuelLiters: Number(
        fuel.liters.toFixed(2)
      ),

      fuelEfficiencyKmPerLiter: Number(
        fuelEfficiency.toFixed(2)
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

      revenue: Number(
        trip.revenue.toFixed(2)
      ),

      roi: Number(roi.toFixed(4)),

      roiPercentage: Number(
        (roi * 100).toFixed(2)
      ),
    };
  });

  sortRows(
    rows,
    filters.sortBy,
    filters.sortOrder
  );

  const totals = rows.reduce(
    (summary, row) => {
      summary.completedTrips +=
        row.completedTrips;

      summary.completedDistanceKm +=
        row.completedDistanceKm;

      summary.fuelLiters += row.fuelLiters;
      summary.fuelCost += row.fuelCost;

      summary.maintenanceCost +=
        row.maintenanceCost;

      summary.otherExpenseCost +=
        row.otherExpenseCost;

      summary.operationalCost +=
        row.operationalCost;

      summary.totalTrackedCost +=
        row.totalTrackedCost;

      summary.revenue += row.revenue;

      return summary;
    },
    {
      vehicles: rows.length,
      completedTrips: 0,
      completedDistanceKm: 0,
      fuelLiters: 0,
      fuelCost: 0,
      maintenanceCost: 0,
      otherExpenseCost: 0,
      operationalCost: 0,
      totalTrackedCost: 0,
      revenue: 0,
    }
  );

  for (const key of Object.keys(totals)) {
    if (typeof totals[key] === "number") {
      totals[key] = Number(
        totals[key].toFixed(2)
      );
    }
  }

  totals.overallFuelEfficiencyKmPerLiter =
    totals.fuelLiters > 0
      ? Number(
          (
            totals.completedDistanceKm /
            totals.fuelLiters
          ).toFixed(2)
        )
      : 0;

  return {
    rows,
    totals,
  };
}