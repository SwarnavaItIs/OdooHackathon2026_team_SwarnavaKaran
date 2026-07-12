import {
  buildVehicleReport,
} from "../services/report.service.js";

function escapeCsvValue(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  let text = String(value);

  /*
   * Prevent user-controlled text fields from being interpreted as
   * spreadsheet formulas when the CSV is opened. Numeric values remain
   * numeric because this only applies to original string values.
   */
  if (
    typeof value === "string" &&
    /^[=+\-@\t\r]/.test(text)
  ) {
    text = `'${text}`;
  }

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n") ||
    text.includes("\r")
  ) {
    return `"${text.replaceAll('"', '""')}"`;
  }

  return text;
}

function convertRowsToCsv(rows) {
  const columns = [
    {
      header: "Registration Number",
      value: (row) =>
        row.registrationNumber,
    },
    {
      header: "Vehicle Name",
      value: (row) => row.vehicleName,
    },
    {
      header: "Model",
      value: (row) => row.model || "",
    },
    {
      header: "Type",
      value: (row) => row.type,
    },
    {
      header: "Region",
      value: (row) => row.region,
    },
    {
      header: "Status",
      value: (row) => row.status,
    },
    {
      header: "Completed Trips",
      value: (row) => row.completedTrips,
    },
    {
      header: "Completed Distance (km)",
      value: (row) =>
        row.completedDistanceKm,
    },
    {
      header: "Fuel Used (L)",
      value: (row) => row.fuelLiters,
    },
    {
      header: "Fuel Efficiency (km/L)",
      value: (row) =>
        row.fuelEfficiencyKmPerLiter,
    },
    {
      header: "Fuel Cost",
      value: (row) => row.fuelCost,
    },
    {
      header: "Maintenance Cost",
      value: (row) =>
        row.maintenanceCost,
    },
    {
      header: "Other Expenses",
      value: (row) =>
        row.otherExpenseCost,
    },
    {
      header: "Operational Cost",
      value: (row) =>
        row.operationalCost,
    },
    {
      header: "Total Tracked Cost",
      value: (row) =>
        row.totalTrackedCost,
    },
    {
      header: "Revenue",
      value: (row) => row.revenue,
    },
    {
      header: "Acquisition Cost",
      value: (row) =>
        row.acquisitionCost,
    },
    {
      header: "ROI (%)",
      value: (row) =>
        row.roiPercentage,
    },
  ];

  const headerLine = columns
    .map((column) =>
      escapeCsvValue(column.header)
    )
    .join(",");

  const dataLines = rows.map((row) =>
    columns
      .map((column) =>
        escapeCsvValue(
          column.value(row)
        )
      )
      .join(",")
  );

  return [
    headerLine,
    ...dataLines,
  ].join("\n");
}

export async function getVehicleReport(
  req,
  res,
  next
) {
  try {
    const result = await buildVehicleReport(
      req.validated.query
    );

    res.status(200).json({
      success: true,

      formulas: {
        fuelEfficiency:
          "Completed Distance / Fuel Consumed",

        operationalCost:
          "Fuel Cost + Maintenance Cost",

        vehicleRoi:
          "(Revenue - (Maintenance Cost + Fuel Cost)) / Acquisition Cost",
      },

      count: result.rows.length,
      totals: result.totals,
      vehicles: result.rows,
    });
  } catch (error) {
    next(error);
  }
}

export async function exportVehicleReportCsv(
  req,
  res,
  next
) {
  try {
    const result = await buildVehicleReport(
      req.validated.query
    );

    const csv = convertRowsToCsv(
      result.rows
    );

    const date = new Date()
      .toISOString()
      .slice(0, 10);

    res.setHeader(
      "Content-Type",
      "text/csv; charset=utf-8"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="transitops-vehicle-report-${date}.csv"`
    );

    /*
     * UTF-8 BOM helps spreadsheet applications
     * display text correctly.
     */
    res.status(200).send(`\uFEFF${csv}`);
  } catch (error) {
    next(error);
  }
}
