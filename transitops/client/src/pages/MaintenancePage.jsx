import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import api from "../api/api";

import ConfirmDialog from "../components/ConfirmDialog";
import MaintenanceFormModal from "../components/MaintenanceFormModal";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

const initialFilters = {
    search: "",
    status: "",
    sortBy: "createdAt",
    sortOrder: "desc",
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
    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }
    ).format(Number(value || 0));
}

function formatDate(value) {
    if (!value) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        "en-IN",
        {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }
    ).format(new Date(value));
}

function calculateDuration(startedAt, closedAt) {
    if (!startedAt) {
        return "—";
    }

    const start = new Date(startedAt);
    const end = closedAt
        ? new Date(closedAt)
        : new Date();

    const difference =
        end.getTime() - start.getTime();

    const days = Math.max(
        0,
        Math.ceil(
            difference /
            (1000 * 60 * 60 * 24)
        )
    );

    if (days === 0) {
        return "Less than 1 day";
    }

    return `${days} day${days === 1 ? "" : "s"
        }`;
}

function MaintenanceTableSkeleton() {
    return (
        <div className="animate-pulse space-y-3 p-5">
            {Array.from({
                length: 5,
            }).map((_, index) => (
                <div
                    key={index}
                    className="h-24 rounded-lg bg-slate-100"
                />
            ))}
        </div>
    );
}

export default function MaintenancePage() {
    const [
        maintenanceRecords,
        setMaintenanceRecords,
    ] = useState([]);

    const [filters, setFilters] =
        useState(initialFilters);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [notice, setNotice] =
        useState("");

    const [formState, setFormState] =
        useState({
            open: false,
            record: null,
        });

    const [
        closingRecord,
        setClosingRecord,
    ] = useState(null);

    const [
        actionLoading,
        setActionLoading,
    ] = useState(false);

    const loadMaintenance =
        useCallback(
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
                        "/maintenance",
                        {
                            params: buildQuery(filters),
                        }
                    );

                    setMaintenanceRecords(
                        response.data
                            .maintenanceRecords || []
                    );
                } catch (requestError) {
                    setError(
                        requestError.response?.data
                            ?.message ||
                        "Unable to load maintenance records."
                    );
                } finally {
                    setLoading(false);
                    setRefreshing(false);
                }
            },
            [filters]
        );

    useEffect(() => {
        const timer = window.setTimeout(
            () => {
                loadMaintenance({
                    fullLoader: true,
                });
            },
            filters.search ? 300 : 0
        );

        return () =>
            window.clearTimeout(timer);
    }, [
        filters,
        loadMaintenance,
    ]);

    const summary = useMemo(() => {
        const result = {
            total: maintenanceRecords.length,
            active: 0,
            closed: 0,
            totalCost: 0,
        };

        for (const record of maintenanceRecords) {
            if (record.status === "ACTIVE") {
                result.active += 1;
            }

            if (record.status === "CLOSED") {
                result.closed += 1;
            }

            result.totalCost += Number(
                record.cost || 0
            );
        }

        return result;
    }, [maintenanceRecords]);

    const hasFilters =
        filters.search !== "" ||
        filters.status !== "";

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

    function openCreateModal() {
        setFormState({
            open: true,
            record: null,
        });
    }

    function openEditModal(record) {
        setFormState({
            open: true,
            record,
        });
    }

    function closeFormModal() {
        setFormState({
            open: false,
            record: null,
        });
    }

    async function handleMaintenanceSaved(
        record,
        message
    ) {
        closeFormModal();
        setNotice(message);

        await loadMaintenance();
    }

    async function confirmCloseMaintenance() {
        if (!closingRecord) {
            return;
        }

        setActionLoading(true);
        setError("");
        setNotice("");

        try {
            const response = await api.post(
                `/maintenance/${closingRecord.id}/close`
            );

            setNotice(response.data.message);
            setClosingRecord(null);

            await loadMaintenance();
        } catch (requestError) {
            setError(
                requestError.response?.data
                    ?.message ||
                "Unable to close maintenance."
            );

            setClosingRecord(null);
        } finally {
            setActionLoading(false);
        }
    }

    return (
        <div>
            <PageHeader
                eyebrow="Fleet Maintenance"
                title="Maintenance Management"
                description="Track active repairs, maintenance costs and vehicle shop availability."
                action={
                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                    >
                        + Start Maintenance
                    </button>
                }
            />

            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    {
                        label: "Filtered Records",
                        value: summary.total,
                    },
                    {
                        label: "Active Maintenance",
                        value: summary.active,
                    },
                    {
                        label: "Closed Records",
                        value: summary.closed,
                    },
                    {
                        label: "Total Maintenance Cost",
                        value: formatCurrency(
                            summary.totalCost
                        ),
                    },
                ].map((item) => (
                    <article
                        key={item.label}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                    >
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                            {item.label}
                        </p>

                        <p className="mt-2 text-2xl font-bold text-slate-900">
                            {item.value}
                        </p>
                    </article>
                ))}
            </section>

            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
                    <div>
                        <label
                            htmlFor="maintenance-search"
                            className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                        >
                            Search
                        </label>

                        <input
                            id="maintenance-search"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Type, description or vehicle..."
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="maintenance-status"
                            className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                        >
                            Status
                        </label>

                        <select
                            id="maintenance-status"
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                        >
                            <option value="">
                                All statuses
                            </option>

                            <option value="ACTIVE">
                                Active
                            </option>

                            <option value="CLOSED">
                                Closed
                            </option>
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="maintenance-sort"
                            className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                        >
                            Sort By
                        </label>

                        <select
                            id="maintenance-sort"
                            name="sortBy"
                            value={filters.sortBy}
                            onChange={handleFilterChange}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                        >
                            <option value="createdAt">
                                Date Created
                            </option>

                            <option value="startedAt">
                                Start Date
                            </option>

                            <option value="closedAt">
                                Close Date
                            </option>

                            <option value="cost">
                                Cost
                            </option>
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="maintenance-order"
                            className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                        >
                            Order
                        </label>

                        <select
                            id="maintenance-order"
                            name="sortOrder"
                            value={filters.sortOrder}
                            onChange={handleFilterChange}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                        >
                            <option value="desc">
                                Descending
                            </option>

                            <option value="asc">
                                Ascending
                            </option>
                        </select>
                    </div>

                    <div className="flex items-end gap-2">
                        <button
                            type="button"
                            onClick={resetFilters}
                            disabled={!hasFilters}
                            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                        >
                            Reset
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                loadMaintenance()
                            }
                            disabled={refreshing}
                            className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            {refreshing
                                ? "..."
                                : "Refresh"}
                        </button>
                    </div>
                </div>
            </section>

            {notice && (
                <div className="mt-5 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    <span>{notice}</span>

                    <button
                        type="button"
                        onClick={() => setNotice("")}
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
                        onClick={() => setError("")}
                        className="text-lg"
                    >
                        ×
                    </button>
                </div>
            )}

            <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                    <h3 className="font-bold text-slate-900">
                        Maintenance Logs
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                        {maintenanceRecords.length} matching
                        record
                        {maintenanceRecords.length === 1
                            ? ""
                            : "s"}
                    </p>
                </div>

                {loading ? (
                    <MaintenanceTableSkeleton />
                ) : maintenanceRecords.length === 0 ? (
                    <div className="px-6 py-14 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-500">
                            M
                        </div>

                        <h3 className="mt-4 font-bold text-slate-800">
                            No maintenance records found
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                            Start maintenance or change the current
                            filters.
                        </p>

                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="mt-5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            Start Maintenance
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    {[
                                        "Vehicle",
                                        "Maintenance",
                                        "Cost",
                                        "Status",
                                        "Started",
                                        "Closed",
                                        "Duration",
                                        "Actions",
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
                                {maintenanceRecords.map(
                                    (record) => (
                                        <tr
                                            key={record.id}
                                            className="hover:bg-slate-50"
                                        >
                                            <td className="whitespace-nowrap px-5 py-4">
                                                <p className="text-sm font-bold text-slate-900">
                                                    {
                                                        record.vehicle
                                                            ?.registrationNumber
                                                    }
                                                </p>

                                                <p className="mt-1 text-sm text-slate-600">
                                                    {record.vehicle?.name}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    {record.vehicle?.region}
                                                </p>
                                            </td>

                                            <td className="min-w-64 px-5 py-4">
                                                <p className="text-sm font-bold text-slate-800">
                                                    {
                                                        record.maintenanceType
                                                    }
                                                </p>

                                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                                    {record.description ||
                                                        "No description provided"}
                                                </p>
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-700">
                                                {formatCurrency(
                                                    record.cost
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4">
                                                <StatusBadge
                                                    status={record.status}
                                                />
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                                {formatDate(
                                                    record.startedAt
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                                {formatDate(
                                                    record.closedAt
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-700">
                                                {calculateDuration(
                                                    record.startedAt,
                                                    record.closedAt
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4">
                                                {record.status ===
                                                    "ACTIVE" ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openEditModal(
                                                                    record
                                                                )
                                                            }
                                                            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                                        >
                                                            Edit
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setClosingRecord(
                                                                    record
                                                                )
                                                            }
                                                            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                                                        >
                                                            Close
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs font-medium text-slate-400">
                                                        Closed
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <MaintenanceFormModal
                open={formState.open}
                record={formState.record}
                onClose={closeFormModal}
                onSaved={
                    handleMaintenanceSaved
                }
            />

            <ConfirmDialog
                open={Boolean(closingRecord)}
                title="Close maintenance?"
                message={
                    closingRecord
                        ? `Close ${closingRecord.maintenanceType} for ${closingRecord.vehicle?.registrationNumber}? The vehicle will return to Available unless it has been retired.`
                        : ""
                }
                confirmLabel="Close Maintenance"
                loading={actionLoading}
                onCancel={() => {
                    if (!actionLoading) {
                        setClosingRecord(null);
                    }
                }}
                onConfirm={
                    confirmCloseMaintenance
                }
            />
        </div>
    );
}