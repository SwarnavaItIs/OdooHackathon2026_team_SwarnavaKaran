import prisma from "../config/prisma.js";

function createStatusBreakdown(values, statuses) {
  const result = {};

  for (const status of statuses) {
    result[status] = 0;
  }

  for (const value of values) {
    result[value.status] =
      (result[value.status] || 0) + 1;
  }

  return result;
}

function startOfTodayUtc() {
  const now = new Date();

  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate()
    )
  );
}

function toNumber(value) {
  return value === null || value === undefined
    ? value
    : Number(value);
}

function serializeRecentTrip(trip) {
  return {
    ...trip,
    cargoWeightKg: toNumber(trip.cargoWeightKg),
    plannedDistanceKm: toNumber(
      trip.plannedDistanceKm
    ),
    actualDistanceKm: toNumber(
      trip.actualDistanceKm
    ),
    startOdometerKm: toNumber(
      trip.startOdometerKm
    ),
    finalOdometerKm: toNumber(
      trip.finalOdometerKm
    ),
    revenue: toNumber(trip.revenue),
  };
}

export async function getDashboard(
  req,
  res,
  next
) {
  try {
    const {
      type,
      status,
      region,
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

      select: {
        id: true,
        registrationNumber: true,
        name: true,
        type: true,
        region: true,
        status: true,
      },
    });

    const vehicleIds = vehicles.map(
      (vehicle) => vehicle.id
    );

    const tripWhere =
      vehicleIds.length > 0
        ? {
            vehicleId: {
              in: vehicleIds,
            },
          }
        : {
            /*
             * No matching vehicle means no matching trip.
             */
            id: {
              in: [],
            },
          };

    const driverWhere = {
      OR: [
        {
          status: "ON_TRIP",
        },
        {
          status: "AVAILABLE",
          licenseExpiry: {
            gte: startOfTodayUtc(),
          },
        },
      ],
    };

    if (region) {
      driverWhere.region = {
        equals: region,
        mode: "insensitive",
      };
    }

    const [
      tripGroups,
      driversOnDuty,
      recentTrips,
      filterVehicles,
    ] = await Promise.all([
      prisma.trip.groupBy({
        by: ["status"],
        where: tripWhere,
        _count: {
          id: true,
        },
      }),

      prisma.driver.count({
        where: driverWhere,
      }),

      prisma.trip.findMany({
        where: tripWhere,

        include: {
          vehicle: {
            select: {
              id: true,
              registrationNumber: true,
              name: true,
            },
          },

          driver: {
            select: {
              id: true,
              name: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 5,
      }),

      /*
       * This unfiltered list is only used to build
       * dropdown options.
       */
      prisma.vehicle.findMany({
        select: {
          type: true,
          region: true,
        },
      }),
    ]);

    const tripStatusBreakdown = {
      DRAFT: 0,
      DISPATCHED: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    for (const group of tripGroups) {
      tripStatusBreakdown[group.status] =
        group._count.id;
    }

    const activeVehicles = vehicles.filter(
      (vehicle) =>
        vehicle.status !== "RETIRED"
    ).length;

    const availableVehicles = vehicles.filter(
      (vehicle) =>
        vehicle.status === "AVAILABLE"
    ).length;

    const vehiclesInMaintenance =
      vehicles.filter(
        (vehicle) =>
          vehicle.status === "IN_SHOP"
      ).length;

    const vehiclesOnTrip = vehicles.filter(
      (vehicle) =>
        vehicle.status === "ON_TRIP"
    ).length;

    const fleetUtilization =
      activeVehicles > 0
        ? (
            vehiclesOnTrip /
            activeVehicles
          ) * 100
        : 0;

    const vehicleStatusBreakdown =
      createStatusBreakdown(
        vehicles,
        [
          "AVAILABLE",
          "ON_TRIP",
          "IN_SHOP",
          "RETIRED",
        ]
      );

    const filterOptions = {
      types: [
        ...new Set(
          filterVehicles.map(
            (vehicle) => vehicle.type
          )
        ),
      ].sort(),

      regions: [
        ...new Set(
          filterVehicles.map(
            (vehicle) => vehicle.region
          )
        ),
      ].sort(),

      statuses: [
        "AVAILABLE",
        "ON_TRIP",
        "IN_SHOP",
        "RETIRED",
      ],
    };

    res.status(200).json({
      success: true,

      appliedFilters: {
        type: type || null,
        status: status || null,
        region: region || null,
      },

      kpis: {
        activeVehicles,
        availableVehicles,
        vehiclesInMaintenance,
        vehiclesOnTrip,

        activeTrips:
          tripStatusBreakdown.DISPATCHED,

        pendingTrips:
          tripStatusBreakdown.DRAFT,

        driversOnDuty,

        fleetUtilizationPercentage:
          Number(
            fleetUtilization.toFixed(2)
          ),
      },

      charts: {
        vehicleStatusBreakdown,
        tripStatusBreakdown,
      },

      recentTrips: recentTrips.map(
        serializeRecentTrip
      ),

      filterOptions,
    });
  } catch (error) {
    next(error);
  }
}
