import PDFDocument from "pdfkit";

const PAGE_OPTIONS = {
  size: "A4",
  layout: "landscape",
  margins: {
    top: 34,
    right: 34,
    bottom: 46,
    left: 34,
  },
  bufferPages: true,
};

const COLORS = {
  navy: "#0f172a",
  blue: "#2563eb",
  slate: "#475569",
  muted: "#64748b",
  border: "#cbd5e1",
  header: "#e2e8f0",
  rowAlt: "#f8fafc",
  green: "#047857",
  red: "#b91c1c",
  amber: "#b45309",
  white: "#ffffff",
};

const TABLE_COLUMNS = [
  { key: "registrationNumber", label: "Registration", width: 58 },
  { key: "vehicleName", label: "Vehicle Name", width: 78 },
  { key: "type", label: "Type", width: 45 },
  { key: "region", label: "Region", width: 50 },
  { key: "status", label: "Status", width: 48 },
  { key: "completedTrips", label: "Trips", width: 32, align: "right" },
  { key: "completedDistanceKm", label: "Distance", width: 50, align: "right", format: formatNumber },
  { key: "fuelLiters", label: "Fuel", width: 42, align: "right", format: formatNumber },
  { key: "fuelEfficiencyKmPerLiter", label: "Eff.", width: 44, align: "right", format: formatNumber },
  { key: "fuelCost", label: "Fuel Cost", width: 55, align: "right", format: formatCurrency },
  { key: "maintenanceCost", label: "Maint.", width: 55, align: "right", format: formatCurrency },
  { key: "operationalCost", label: "Op. Cost", width: 55, align: "right", format: formatCurrency },
  { key: "otherExpenseCost", label: "Other", width: 50, align: "right", format: formatCurrency },
  { key: "revenue", label: "Revenue", width: 55, align: "right", format: formatCurrency },
  { key: "roiPercentage", label: "ROI %", width: 35, align: "right", format: formatNumber },
];

function sanitizeText(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
}

function formatLabel(value) {
  return sanitizeText(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatInteger(value) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatCurrency(value) {
  return `INR ${formatNumber(value)}`;
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function getSortLabel(filters) {
  const labels = {
    registrationNumber: "Registration",
    fuelEfficiency: "Fuel Efficiency",
    operationalCost: "Operational Cost",
    revenue: "Revenue",
    roi: "ROI",
  };

  const sortBy = filters.sortBy || "registrationNumber";
  const sortOrder = filters.sortOrder || "asc";

  return `${labels[sortBy] || "Registration"} - ${
    sortOrder === "desc" ? "Descending" : "Ascending"
  }`;
}

function getAppliedFilters(filters) {
  return [
    ["Type", filters.type || "All"],
    ["Region", filters.region || "All"],
    ["Status", filters.status ? formatLabel(filters.status) : "All"],
    ["Search", filters.search || "All"],
    ["Sort", getSortLabel(filters)],
  ];
}

function getSummary(report) {
  const totals = report.totals || {};
  const rows = report.rows || [];
  const acquisitionCost = rows.reduce(
    (sum, row) => sum + Number(row.acquisitionCost || 0),
    0
  );
  const operatingProfit =
    Number(totals.revenue || 0) - Number(totals.operationalCost || 0);
  const overallRoi =
    acquisitionCost > 0 ? (operatingProfit / acquisitionCost) * 100 : 0;

  return [
    ["Reported Vehicles", formatInteger(totals.vehicles || rows.length)],
    ["Completed Trips", formatInteger(totals.completedTrips)],
    ["Completed Distance", `${formatNumber(totals.completedDistanceKm)} km`],
    ["Fuel Consumed", `${formatNumber(totals.fuelLiters)} L`],
    ["Overall Fuel Efficiency", `${formatNumber(totals.overallFuelEfficiencyKmPerLiter)} km/L`],
    ["Fuel Cost", formatCurrency(totals.fuelCost)],
    ["Maintenance Cost", formatCurrency(totals.maintenanceCost)],
    ["Operational Cost", formatCurrency(totals.operationalCost)],
    ["Other Expenses", formatCurrency(totals.otherExpenseCost)],
    ["Total Tracked Cost", formatCurrency(totals.totalTrackedCost)],
    ["Revenue", formatCurrency(totals.revenue)],
    ["Operating Profit", formatCurrency(operatingProfit)],
    ["Total Acquisition Cost", formatCurrency(acquisitionCost)],
    ["Overall ROI", `${formatNumber(overallRoi)}%`],
  ];
}

function contentWidth(doc) {
  return doc.page.width - doc.page.margins.left - doc.page.margins.right;
}

function contentBottom(doc) {
  return doc.page.height - doc.page.margins.bottom;
}

function ensureSpace(doc, height) {
  if (doc.y + height > contentBottom(doc)) {
    doc.addPage();
  }
}

function textWidthFit(doc, text, width, font = "Helvetica", size = 6) {
  doc.font(font).fontSize(size);
  let output = sanitizeText(text);

  if (doc.widthOfString(output) <= width) {
    return output;
  }

  while (output.length > 1 && doc.widthOfString(`${output}...`) > width) {
    output = output.slice(0, -1);
  }

  return `${output}...`;
}

function drawHeader(doc, generatedAt, user, filters, rowCount) {
  const left = doc.page.margins.left;
  const width = contentWidth(doc);

  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(COLORS.navy)
    .text("TransitOps", left, doc.y);

  doc
    .fontSize(12)
    .fillColor(COLORS.blue)
    .text("Vehicle Performance Report", left, doc.y + 2);

  const metaX = left + width - 270;
  const metaY = 34;

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.slate)
    .text(`Generated: ${formatDateTime(generatedAt)}`, metaX, metaY, {
      width: 270,
      align: "right",
    })
    .text(`Generated by: ${sanitizeText(user?.name || "Unknown")}`, metaX, doc.y + 2, {
      width: 270,
      align: "right",
    })
    .text(`Role: ${sanitizeText(user?.role?.name || formatLabel(user?.role?.code || "Unknown"))}`, metaX, doc.y + 2, {
      width: 270,
      align: "right",
    })
    .text(`Matching vehicles: ${formatInteger(rowCount)}`, metaX, doc.y + 2, {
      width: 270,
      align: "right",
    });

  doc
    .moveTo(left, 94)
    .lineTo(left + width, 94)
    .strokeColor(COLORS.border)
    .lineWidth(0.75)
    .stroke();

  doc.y = 108;
  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.navy).text("Applied Filters", left, doc.y);

  const pairs = getAppliedFilters(filters);
  const colWidth = width / pairs.length;
  const y = doc.y + 8;

  pairs.forEach(([label, value], index) => {
    const x = left + index * colWidth;
    doc
      .font("Helvetica-Bold")
      .fontSize(6.8)
      .fillColor(COLORS.muted)
      .text(label.toUpperCase(), x, y, { width: colWidth - 8 });
    doc
      .font("Helvetica")
      .fontSize(7.4)
      .fillColor(COLORS.navy)
      .text(textWidthFit(doc, value, colWidth - 8, "Helvetica", 7.4), x, y + 10, {
        width: colWidth - 8,
      });
  });

  doc.y = y + 32;
}

function drawSummary(doc, report) {
  ensureSpace(doc, 128);
  const left = doc.page.margins.left;
  const width = contentWidth(doc);
  const summary = getSummary(report);
  const columns = 4;
  const gap = 8;
  const boxWidth = (width - gap * (columns - 1)) / columns;
  const boxHeight = 30;

  doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.navy).text("Executive Summary", left, doc.y);
  let y = doc.y + 12;

  summary.forEach(([label, value], index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = left + column * (boxWidth + gap);
    const boxY = y + row * (boxHeight + gap);

    doc
      .roundedRect(x, boxY, boxWidth, boxHeight, 4)
      .fillAndStroke(COLORS.white, COLORS.border);
    doc
      .font("Helvetica")
      .fontSize(6.8)
      .fillColor(COLORS.muted)
      .text(label, x + 7, boxY + 6, { width: boxWidth - 14 });
    doc
      .font("Helvetica-Bold")
      .fontSize(8.4)
      .fillColor(COLORS.navy)
      .text(textWidthFit(doc, value, boxWidth - 14, "Helvetica-Bold", 8.4), x + 7, boxY + 18, {
        width: boxWidth - 14,
      });
  });

  doc.y = y + Math.ceil(summary.length / columns) * (boxHeight + gap) + 8;
}

function drawBarChart(doc, title, rows, metric, formatter, color) {
  const left = doc.x;
  const top = doc.y;
  const chartWidth = (contentWidth(doc) - 18) / 2;
  const chartHeight = 132;

  doc
    .roundedRect(left, top, chartWidth, chartHeight, 4)
    .fillAndStroke(COLORS.white, COLORS.border);
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(COLORS.navy).text(title, left + 9, top + 9);

  const sortedRows = [...rows]
    .sort((first, second) => Number(second[metric] || 0) - Number(first[metric] || 0))
    .slice(0, 5);
  const maxValue = Math.max(...sortedRows.map((row) => Number(row[metric] || 0)), 0);
  const barLeft = left + 92;
  const barMaxWidth = chartWidth - 175;
  let y = top + 31;

  if (sortedRows.length === 0 || maxValue <= 0) {
    doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.muted).text("No chart data available.", left + 9, y);
    doc.y = top;
    return;
  }

  sortedRows.forEach((row) => {
    const value = Number(row[metric] || 0);
    const barWidth = maxValue > 0 ? Math.max(1, (value / maxValue) * barMaxWidth) : 0;
    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor(COLORS.slate)
      .text(textWidthFit(doc, row.registrationNumber, 74, "Helvetica", 7), left + 9, y, { width: 76 });
    doc.roundedRect(barLeft, y + 2, barMaxWidth, 7, 2).fill("#e2e8f0");
    doc.roundedRect(barLeft, y + 2, barWidth, 7, 2).fill(color);
    doc
      .font("Helvetica-Bold")
      .fontSize(6.8)
      .fillColor(COLORS.navy)
      .text(formatter(value), barLeft + barMaxWidth + 8, y - 1, {
        width: 66,
        align: "right",
      });
    y += 18;
  });

  doc.y = top;
}

function drawVisualAnalytics(doc, report) {
  ensureSpace(doc, 170);
  const left = doc.page.margins.left;
  const startY = doc.y;

  doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.navy).text("Visual Analytics", left, startY);
  doc.y = startY + 18;
  doc.x = left;
  drawBarChart(
    doc,
    "Top 5 Vehicles by Fuel Efficiency",
    report.rows || [],
    "fuelEfficiencyKmPerLiter",
    (value) => `${formatNumber(value)} km/L`,
    COLORS.blue
  );
  doc.x = left + (contentWidth(doc) + 18) / 2;
  drawBarChart(
    doc,
    "Top 5 Vehicles by Operational Cost",
    report.rows || [],
    "operationalCost",
    formatCurrency,
    COLORS.amber
  );

  doc.x = left;
  doc.y = startY + 160;
}

function drawTableHeader(doc, y) {
  const left = doc.page.margins.left;
  let x = left;

  doc.rect(left, y, contentWidth(doc), 21).fill(COLORS.header);
  TABLE_COLUMNS.forEach((column) => {
    doc
      .font("Helvetica-Bold")
      .fontSize(5.7)
      .fillColor(COLORS.navy)
      .text(column.label, x + 2, y + 6, {
        width: column.width - 4,
        align: column.align || "left",
      });
    x += column.width;
  });

  doc.y = y + 21;
}

function drawTableRow(doc, row, y, index) {
  const left = doc.page.margins.left;
  const rowHeight = 24;
  let x = left;

  if (index % 2 === 1) {
    doc.rect(left, y, contentWidth(doc), rowHeight).fill(COLORS.rowAlt);
  }

  TABLE_COLUMNS.forEach((column) => {
    const rawValue = column.format ? column.format(row[column.key]) : row[column.key];
    const value = column.key === "status" ? formatLabel(rawValue) : sanitizeText(rawValue);
    const color =
      column.key === "roiPercentage"
        ? Number(row.roiPercentage || 0) >= 0
          ? COLORS.green
          : COLORS.red
        : COLORS.navy;

    doc
      .font(column.key === "registrationNumber" ? "Helvetica-Bold" : "Helvetica")
      .fontSize(5.8)
      .fillColor(color)
      .text(textWidthFit(doc, value, column.width - 4, column.key === "registrationNumber" ? "Helvetica-Bold" : "Helvetica", 5.8), x + 2, y + 6, {
        width: column.width - 4,
        align: column.align || "left",
      });
    x += column.width;
  });

  doc
    .moveTo(left, y + rowHeight)
    .lineTo(left + contentWidth(doc), y + rowHeight)
    .strokeColor("#e2e8f0")
    .lineWidth(0.4)
    .stroke();

  doc.y = y + rowHeight;
}

function drawVehicleTable(doc, report) {
  ensureSpace(doc, 80);
  const left = doc.page.margins.left;
  const rows = report.rows || [];

  doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.navy).text("Detailed Vehicle Table", left, doc.y);
  doc.y += 10;

  if (rows.length === 0) {
    doc
      .roundedRect(left, doc.y, contentWidth(doc), 42, 4)
      .fillAndStroke(COLORS.rowAlt, COLORS.border);
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(COLORS.slate)
      .text("No matching vehicle records were found for the selected filters.", left + 12, doc.y + 15);
    doc.y += 54;
    return;
  }

  drawTableHeader(doc, doc.y);

  rows.forEach((row, index) => {
    if (doc.y + 26 > contentBottom(doc)) {
      doc.addPage();
      drawTableHeader(doc, doc.page.margins.top);
    }

    drawTableRow(doc, row, doc.y, index);
  });

  doc.y += 12;
}

function drawFormulaSection(doc, report) {
  ensureSpace(doc, 92);
  const left = doc.page.margins.left;
  const width = contentWidth(doc);
  const formulas = report.formulas || {};

  doc
    .roundedRect(left, doc.y, width, 82, 4)
    .fillAndStroke("#f8fafc", COLORS.border);
  const y = doc.y + 10;

  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.navy).text("Report formulas", left + 12, y);
  doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.slate);
  doc.text(`Fuel Efficiency = ${sanitizeText(formulas.fuelEfficiency || "Completed Distance / Fuel Consumed")}`, left + 12, y + 15);
  doc.text(`Operational Cost = ${sanitizeText(formulas.operationalCost || "Fuel Cost + Maintenance Cost")}`, left + 12, y + 27);
  doc.text(`ROI = ${sanitizeText(formulas.vehicleRoi || "(Revenue - Operational Cost) / Acquisition Cost")}`, left + 12, y + 39);

  doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.navy).text("Disclaimer", left + width / 2, y);
  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(COLORS.slate)
    .text(
      "This report is generated from the operational data currently stored in TransitOps. Accuracy depends on complete and correct trip, fuel, expense and maintenance entries.",
      left + width / 2,
      y + 15,
      { width: width / 2 - 14, lineGap: 2 }
    );

  doc.y += 94;
}

function drawFooters(doc, generatedAt) {
  const range = doc.bufferedPageRange();

  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    const pageNumber = i - range.start + 1;
    const left = doc.page.margins.left;
    const y = doc.page.height - 28;

    doc
      .moveTo(left, y - 8)
      .lineTo(doc.page.width - doc.page.margins.right, y - 8)
      .strokeColor(COLORS.border)
      .lineWidth(0.5)
      .stroke();
    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor(COLORS.muted)
      .text("TransitOps Vehicle Performance Report", left, y, {
        width: 230,
      })
      .text(`Generated ${formatDateTime(generatedAt)}`, left + 260, y, {
        width: 220,
        align: "center",
      })
      .text(`Page ${pageNumber}`, doc.page.width - doc.page.margins.right - 80, y, {
        width: 80,
        align: "right",
      });
  }
}

export function createVehicleReportPdfStream({ report, filters, user, generatedAt = new Date() }) {
  const doc = new PDFDocument(PAGE_OPTIONS);

  drawHeader(doc, generatedAt, user, filters, report.rows?.length || 0);
  drawSummary(doc, report);
  drawVisualAnalytics(doc, report);
  drawVehicleTable(doc, report);
  drawFormulaSection(doc, report);
  drawFooters(doc, generatedAt);

  return doc;
}