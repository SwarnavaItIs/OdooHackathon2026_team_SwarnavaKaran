import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import api from "../api/api";

import {
    downloadBlobResponse,
    getBlobErrorMessage,
} from "../utils/downloadBlob";

import KpiCard from "../components/KpiCard";
import PageHeader from "../components/PageHeader";
import ReportBarList from "../components/ReportBarList";
import StatusBadge from "../components/StatusBadge";

const initialFilters = {
    search: "",
    type: "",
    region: "",
    status: "",
    sortBy: "registrationNumber",
    sortOrder: "asc",
};

function buildQuery(filters) {
    const query = {};

    for (const [key, value] of Object.entries(
        filters
    )) {
        if (value !== "") {
            query[key] = value;
        }
    }

    return query;
}

function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
}

function formatNumber(value) {
    return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2,
    }).format(Number(value || 0));
}

function ReportTableSkeleton() {
    return (
        <div className="animate-pulse space-y-3 p-5">
            {Array.from({
                length: 6,
            }).map((_, index) => (
                <div
                    key={index}
                    className="h-20 rounded-lg bg-slate-100"
                />
            ))}
        </div>
    );
}

export default function ReportsPage() {
    const [report, setReport] = useState({
        vehicles: [],
        totals: {},
        formulas: {},
    });

    const [
        filterOptions,
        setFilterOptions,
    ] = useState({
        types: [],
        regions: [],
        statuses: [
            "AVAILABLE",
            "ON_TRIP",
            "IN_SHOP",
            "RETIRED",
        ],
    });

    const [filters, setFilters] =
        useState(initialFilters);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [
        downloadingCsv,
        setDownloadingCsv,
    ] = useState(false);
    const [
        downloadingPdf,
        setDownloadingPdf,
    ] = useState(false);

    const [error, setError] =
        useState("");

    const [notice, setNotice] =
        useState("");

    const loadFilterOptions =
        useCallback(async () => {
            try {
                const response = await api.get(
                    "/vehicles/filter-options"
                );

                setFilterOptions(
                    response.data.filters
                );
            } catch {
                // Default status options remain usable.
            }
        }, []);

    const loadReport = useCallback(
        async ({
            fullLoader = false,
        } = {}) => {
            try {
                setError("");

                if (fullLoader) {
                    setLoading(true);
                } else {
                    setRefreshing(true);
                }

                const response = await api.get(
                    "/reports/vehicles",
                    {
                        params: buildQuery(filters),
                    }
                );

                setReport({
                    vehicles:
                        response.data.vehicles || [],

                    totals:
                        response.data.totals || {},

                    formulas:
                        response.data.formulas || {},
                });
            } catch (requestError) {
                setError(
                    requestError.response?.data
                        ?.message ||
                    "Unable to load vehicle report."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [filters]
    );

    useEffect(() => {
        loadFilterOptions();
    }, [loadFilterOptions]);

    useEffect(() => {
        const timer = window.setTimeout(
            () => {
                loadReport({
                    fullLoader: true,
                });
            },
            filters.search ? 300 : 0
        );

        return () =>
            window.clearTimeout(timer);
    }, [filters, loadReport]);

    const rows = report.vehicles;
    const totals = report.totals;

    const calculatedMetrics = useMemo(() => {
        const acquisitionCost = rows.reduce(
            (sum, row) =>
                sum +
                Number(row.acquisitionCost || 0),
            0
        );

        const overallRoi =
            acquisitionCost > 0
                ? (
                    Number(totals.revenue || 0) -
                    Number(
                        totals.operationalCost || 0
                    )
                ) / acquisitionCost
                : 0;

        const operatingProfit =
            Number(totals.revenue || 0) -
            Number(
                totals.operationalCost || 0
            );

        const netTrackedPosition =
            Number(totals.revenue || 0) -
            Number(
                totals.totalTrackedCost || 0
            );

        return {
            acquisitionCost,
            overallRoiPercentage:
                overallRoi * 100,
            operatingProfit,
            netTrackedPosition,
        };
    }, [rows, totals]);

    const hasFilters = useMemo(
        () =>
            filters.search !== "" ||
            filters.type !== "" ||
            filters.region !== "" ||
            filters.status !== "",
        [filters]
    );

    function handleFilterChange(event) {
        const {
            name,
            value,
        } = event.target;

        setFilters((current) => ({
            ...current,
            [name]: value,
        }));
    }

    function resetFilters() {
        setFilters(initialFilters);
    }

    async function downloadCsv() {
        try {
            setDownloadingCsv(true);
            setError("");
            setNotice("");

            const response = await api.get(
                "/reports/vehicles/csv",
                {
                    params: buildQuery(filters),
                    responseType: "blob",
                }
            );

            downloadBlobResponse({
                response,
                fallbackType:
                    "text/csv;charset=utf-8",
                extension: "csv",
            });

            setNotice(
                "Vehicle report downloaded successfully"
            );
        } catch (requestError) {
            setError(
                await getBlobErrorMessage(
                    requestError,
                    "Unable to download CSV report."
                )
            );
        } finally {
            setDownloadingCsv(false);
        }
    }

    async function downloadPdf() {
        try {
            setDownloadingPdf(true);
            setError("");
            setNotice("");

            const response = await api.get(
                "/reports/vehicles/pdf",
                {
                    params: buildQuery(filters),
                    responseType: "blob",
                }
            );

            downloadBlobResponse({
                response,
                fallbackType: "application/pdf",
                extension: "pdf",
            });

            setNotice(
                "Vehicle PDF report downloaded successfully"
            );
        } catch (requestError) {
            setError(
                await getBlobErrorMessage(
                    requestError,
                    "Unable to download PDF report."
                )
            );
        } finally {
            setDownloadingPdf(false);
        }
    }
    return (
        <div>
            <PageHeader
                eyebrow="Analytics & Reporting"
                title="Vehicle Performance Reports"
                description="Compare fleet efficiency, operational cost, revenue and return on investment."
                action={
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() =>
                                loadReport()
                            }
                            disabled={refreshing}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
                        >
                            {refreshing
                                ? "Refreshing..."
                                : "Refresh"}
                        </button>

                        <button
                            type="button"
                            onClick={downloadCsv}
                            disabled={
                                downloadingCsv ||
                                rows.length === 0
                            }
                            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {downloadingCsv
                                ? "Downloading..."
                                : "Download CSV"}
                        </button>

                        <button
                            type="button"
                            onClick={downloadPdf}
                            disabled={
                                downloadingPdf ||
                                rows.length === 0
                            }
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                            {downloadingPdf
                                ? "Generating PDF..."
                                : "Download PDF"}
                        </button>
                    </div>
                }
            />

            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
                    <div className="md:col-span-2">
                        <label
                            htmlFor="report-search"
                            className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                        >
                            Search
                        </label>

                        <input
                            id="report-search"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Registration, name, model..."
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="report-type"
                            className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                        >
                            Type
                        </label>

                        <select
                            id="report-type"
                            name="type"
                            value={filters.type}
                            onChange={handleFilterChange}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                        >
                            <option value="">
                                All types
                            </option>

                            {filterOptions.types.map(
                                (type) => (
                                    <option
                                        key={type}
                                        value={type}
                                    >
                                        {type}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="report-region"
                            className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                        >
                            Region
                        </label>

                        <select
                            id="report-region"
                            name="region"
                            value={filters.region}
                            onChange={handleFilterChange}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                        >
                            <option value="">
                                All regions
                            </option>

                            {filterOptions.regions.map(
                                (region) => (
                                    <option
                                        key={region}
                                        value={region}
                                    >
                                        {region}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="report-status"
                            className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                        >
                            Status
                        </label>

                        <select
                            id="report-status"
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                        >
                            <option value="">
                                All statuses
                            </option>

                            {filterOptions.statuses.map(
                                (status) => (
                                    <option
                                        key={status}
                                        value={status}
                                    >
                                        {status
                                            .replaceAll("_", " ")
                                            .toLowerCase()
                                            .replace(
                                                /\b\w/g,
                                                (character) =>
                                                    character.toUpperCase()
                                            )}
                                    </option>
                                )
                            )}
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="report-sort"
                            className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                        >
                            Sort By
                        </label>

                        <select
                            id="report-sort"
                            name="sortBy"
                            value={filters.sortBy}
                            onChange={handleFilterChange}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                        >
                            <option value="registrationNumber">
                                Registration
                            </option>

                            <option value="fuelEfficiency">
                                Fuel Efficiency
                            </option>

                            <option value="operationalCost">
                                Operational Cost
                            </option>

                            <option value="revenue">
                                Revenue
                            </option>

                            <option value="roi">
                                ROI
                            </option>
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="report-order"
                            className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                        >
                            Order
                        </label>

                        <div className="flex gap-2">
                            <select
                                id="report-order"
                                name="sortOrder"
                                value={filters.sortOrder}
                                onChange={handleFilterChange}
                                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                            >
                                <option value="asc">
                                    Ascending
                                </option>

                                <option value="desc">
                                    Descending
                                </option>
                            </select>

                            <button
                                type="button"
                                onClick={resetFilters}
                                disabled={!hasFilters}
                                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {notice && (
                <div className="mt-5 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    <span>{notice}</span>

                    <button
                        type="button"
                        onClick={() =>
                            setNotice("")
                        }
                        className="text-lg"
                    >
                        ×
                    </button>
                </div>
            )}

            {error && (
                <div className="mt-5 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    <span>{error}</span>

                    <button
                        type="button"
                        onClick={() =>
                            setError("")
                        }
                        className="text-lg"
                    >
                        ×
                    </button>
                </div>
            )}

            {!loading && (
                <>
                    <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <KpiCard
                            title="Reported Vehicles"
                            value={totals.vehicles || 0}
                            symbol="V"
                            variant="blue"
                            helper="Vehicles matching current filters"
                        />

                        <KpiCard
                            title="Completed Trips"
                            value={
                                totals.completedTrips || 0
                            }
                            symbol="T"
                            variant="emerald"
                            helper={`${formatNumber(
                                totals.completedDistanceKm
                            )} completed kilometres`}
                        />

                        <KpiCard
                            title="Fuel Consumed"
                            value={formatNumber(
                                totals.fuelLiters
                            )}
                            suffix="L"
                            symbol="F"
                            variant="amber"
                            helper={`${formatNumber(
                                totals.overallFuelEfficiencyKmPerLiter
                            )} km/L overall efficiency`}
                        />

                        <KpiCard
                            title="Total Revenue"
                            value={formatCurrency(
                                totals.revenue
                            )}
                            symbol="₹"
                            variant="emerald"
                            helper="Revenue from completed trips"
                        />

                        <KpiCard
                            title="Operational Cost"
                            value={formatCurrency(
                                totals.operationalCost
                            )}
                            symbol="OC"
                            variant="rose"
                            helper="Fuel plus maintenance cost"
                        />

                        <KpiCard
                            title="Other Expenses"
                            value={formatCurrency(
                                totals.otherExpenseCost
                            )}
                            symbol="E"
                            variant="amber"
                            helper="Tolls, insurance and other costs"
                        />

                        <KpiCard
                            title="Operating Profit"
                            value={formatCurrency(
                                calculatedMetrics.operatingProfit
                            )}
                            symbol="P"
                            variant={
                                calculatedMetrics.operatingProfit >=
                                    0
                                    ? "emerald"
                                    : "rose"
                            }
                            helper="Revenue minus operational cost"
                        />

                        <KpiCard
                            title="Overall Vehicle ROI"
                            value={formatNumber(
                                calculatedMetrics.overallRoiPercentage
                            )}
                            suffix="%"
                            symbol="%"
                            variant={
                                calculatedMetrics.overallRoiPercentage >=
                                    0
                                    ? "blue"
                                    : "rose"
                            }
                            helper="Based on total acquisition cost"
                        />
                    </section>

                    <section className="mt-6 grid gap-6 xl:grid-cols-2">
                        <ReportBarList
                            title="Best Fuel Efficiency"
                            description="Top vehicles by completed distance per litre."
                            rows={rows}
                            metric="fuelEfficiencyKmPerLiter"
                            suffix=" km/L"
                        />

                        <ReportBarList
                            title="Highest Operational Cost"
                            description="Vehicles with the highest fuel and maintenance spending."
                            rows={rows}
                            metric="operationalCost"
                            currency
                        />
                    </section>

                    <section className="mt-6 grid gap-4 rounded-xl border border-blue-100 bg-blue-50 p-5 md:grid-cols-3">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-blue-500">
                                Fuel Efficiency
                            </p>

                            <p className="mt-2 text-sm font-semibold text-blue-900">
                                {report.formulas
                                    .fuelEfficiency ||
                                    "Completed Distance / Fuel Consumed"}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-blue-500">
                                Operational Cost
                            </p>

                            <p className="mt-2 text-sm font-semibold text-blue-900">
                                {report.formulas
                                    .operationalCost ||
                                    "Fuel Cost + Maintenance Cost"}
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-blue-500">
                                Vehicle ROI
                            </p>

                            <p className="mt-2 text-sm font-semibold text-blue-900">
                                {report.formulas
                                    .vehicleRoi ||
                                    "(Revenue - Operational Cost) / Acquisition Cost"}
                            </p>
                        </div>
                    </section>
                </>
            )}

            <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="font-bold text-slate-900">
                            Vehicle Performance
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                            {rows.length} matching vehicle
                            {rows.length === 1 ? "" : "s"}
                        </p>
                    </div>

                    <p className="text-xs text-slate-400">
                        Total tracked cost:{" "}
                        <span className="font-bold text-slate-700">
                            {formatCurrency(
                                totals.totalTrackedCost
                            )}
                        </span>
                    </p>
                </div>

                {loading ? (
                    <ReportTableSkeleton />
                ) : rows.length === 0 ? (
                    <div className="px-6 py-14 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-500">
                            R
                        </div>

                        <h3 className="mt-4 font-bold text-slate-800">
                            No report data found
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                            Change the filters or complete
                            trips to generate performance data.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    {[
                                        "Vehicle",
                                        "Trips / Distance",
                                        "Fuel Efficiency",
                                        "Fuel Cost",
                                        "Maintenance",
                                        "Operational Cost",
                                        "Other Expenses",
                                        "Revenue",
                                        "ROI",
                                        "Status",
                                    ].map((heading) => (
                                        <th
                                            key={heading}
                                            className="whitespace-nowrap px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-500"
                                        >
                                            {heading}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {rows.map((row) => {
                                    const profitable =
                                        Number(row.roiPercentage) >= 0;

                                    return (
                                        <tr
                                            key={row.vehicleId}
                                            className="hover:bg-slate-50"
                                        >
                                            <td className="whitespace-nowrap px-5 py-4">
                                                <p className="text-sm font-bold text-slate-900">
                                                    {row.registrationNumber}
                                                </p>

                                                <p className="mt-1 text-sm text-slate-600">
                                                    {row.vehicleName}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    {row.type}
                                                    {" · "}
                                                    {row.region}
                                                    {row.model
                                                        ? ` · ${row.model}`
                                                        : ""}
                                                </p>
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4">
                                                <p className="text-sm font-bold text-slate-800">
                                                    {row.completedTrips} trips
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    {formatNumber(
                                                        row.completedDistanceKm
                                                    )}{" "}
                                                    km
                                                </p>
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4">
                                                <p className="text-sm font-bold text-blue-700">
                                                    {formatNumber(
                                                        row.fuelEfficiencyKmPerLiter
                                                    )}{" "}
                                                    km/L
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    {formatNumber(
                                                        row.fuelLiters
                                                    )}{" "}
                                                    L consumed
                                                </p>
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-700">
                                                {formatCurrency(
                                                    row.fuelCost
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-700">
                                                {formatCurrency(
                                                    row.maintenanceCost
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-slate-900">
                                                {formatCurrency(
                                                    row.operationalCost
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                                                {formatCurrency(
                                                    row.otherExpenseCost
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-emerald-700">
                                                {formatCurrency(
                                                    row.revenue
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${profitable
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : "bg-red-100 text-red-700"
                                                        }`}
                                                >
                                                    {formatNumber(
                                                        row.roiPercentage
                                                    )}
                                                    %
                                                </span>

                                                <p className="mt-2 text-xs text-slate-500">
                                                    Asset:{" "}
                                                    {formatCurrency(
                                                        row.acquisitionCost
                                                    )}
                                                </p>
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4">
                                                <StatusBadge
                                                    status={row.status}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}