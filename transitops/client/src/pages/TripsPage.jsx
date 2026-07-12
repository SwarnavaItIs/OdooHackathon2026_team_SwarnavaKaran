import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import api from "../api/api";

import CompleteTripModal from "../components/CompleteTripModal";
import ConfirmDialog from "../components/ConfirmDialog";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import TripFormModal from "../components/TripFormModal";

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

function formatNumber(value) {
    return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2,
    }).format(Number(value || 0));
}

function formatCurrency(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(value || 0));
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

function TripsTableSkeleton() {
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

export default function TripsPage() {
    const [trips, setTrips] =
        useState([]);

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

    const [createOpen, setCreateOpen] =
        useState(false);

    const [
        completionTrip,
        setCompletionTrip,
    ] = useState(null);

    const [
        confirmation,
        setConfirmation,
    ] = useState({
        open: false,
        type: null,
        trip: null,
    });

    const [
        actionLoading,
        setActionLoading,
    ] = useState(false);

    const loadTrips = useCallback(
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
                    "/trips",
                    {
                        params: buildQuery(filters),
                    }
                );

                setTrips(
                    response.data.trips || []
                );
            } catch (requestError) {
                setError(
                    requestError.response?.data
                        ?.message ||
                    "Unable to load trips."
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
                loadTrips({
                    fullLoader: true,
                });
            },
            filters.search ? 300 : 0
        );

        return () =>
            window.clearTimeout(timer);
    }, [filters, loadTrips]);

    const summary = useMemo(() => {
        const result = {
            total: trips.length,
            draft: 0,
            dispatched: 0,
            completed: 0,
            cancelled: 0,
        };

        for (const trip of trips) {
            const key =
                trip.status.toLowerCase();

            if (
                Object.prototype.hasOwnProperty.call(
                    result,
                    key
                )
            ) {
                result[key] += 1;
            }
        }

        return result;
    }, [trips]);

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

    async function handleTripCreated(
        trip,
        message
    ) {
        setCreateOpen(false);
        setNotice(message);
        await loadTrips();
    }

    function requestDispatch(trip) {
        setConfirmation({
            open: true,
            type: "dispatch",
            trip,
        });
    }

    function requestCancel(trip) {
        setConfirmation({
            open: true,
            type: "cancel",
            trip,
        });
    }

    function closeConfirmation() {
        if (actionLoading) {
            return;
        }

        setConfirmation({
            open: false,
            type: null,
            trip: null,
        });
    }

    async function executeConfirmedAction() {
        const {
            type,
            trip,
        } = confirmation;

        if (!type || !trip) {
            return;
        }

        setActionLoading(true);
        setError("");
        setNotice("");

        try {
            const response = await api.post(
                `/trips/${trip.id}/${type}`
            );

            setNotice(response.data.message);

            setConfirmation({
                open: false,
                type: null,
                trip: null,
            });

            await loadTrips();
        } catch (requestError) {
            setError(
                requestError.response?.data
                    ?.message ||
                `Unable to ${type} trip.`
            );

            setConfirmation({
                open: false,
                type: null,
                trip: null,
            });
        } finally {
            setActionLoading(false);
        }
    }

    async function handleTripCompleted(
        trip,
        message
    ) {
        setCompletionTrip(null);
        setNotice(message);
        await loadTrips();
    }

    const confirmationTitle =
        confirmation.type === "dispatch"
            ? "Dispatch trip?"
            : "Cancel trip?";

    const confirmationMessage =
        confirmation.type === "dispatch"
            ? `Dispatch ${confirmation.trip?.source} → ${confirmation.trip?.destination}? The selected vehicle and driver will both become On Trip.`
            : `Cancel ${confirmation.trip?.source} → ${confirmation.trip?.destination}? If already dispatched, the vehicle and driver will be restored to Available.`;

    return (
        <div>
            <PageHeader
                eyebrow="Dispatch Operations"
                title="Trip Management"
                description="Create transport assignments and control the complete dispatch lifecycle."
                action={
                    <button
                        type="button"
                        onClick={() =>
                            setCreateOpen(true)
                        }
                        className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                    >
                        + Create Trip
                    </button>
                }
            />

            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                {[
                    {
                        label: "Filtered Trips",
                        value: summary.total,
                    },
                    {
                        label: "Draft",
                        value: summary.draft,
                    },
                    {
                        label: "Dispatched",
                        value: summary.dispatched,
                    },
                    {
                        label: "Completed",
                        value: summary.completed,
                    },
                    {
                        label: "Cancelled",
                        value: summary.cancelled,
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
                            htmlFor="trip-search"
                            className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                        >
                            Search
                        </label>

                        <input
                            id="trip-search"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            placeholder="Route, vehicle or driver..."
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="trip-status"
                            className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                        >
                            Status
                        </label>

                        <select
                            id="trip-status"
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                        >
                            <option value="">
                                All statuses
                            </option>
                            <option value="DRAFT">
                                Draft
                            </option>
                            <option value="DISPATCHED">
                                Dispatched
                            </option>
                            <option value="COMPLETED">
                                Completed
                            </option>
                            <option value="CANCELLED">
                                Cancelled
                            </option>
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="trip-sort"
                            className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                        >
                            Sort By
                        </label>

                        <select
                            id="trip-sort"
                            name="sortBy"
                            value={filters.sortBy}
                            onChange={handleFilterChange}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                        >
                            <option value="createdAt">
                                Created Date
                            </option>
                            <option value="dispatchedAt">
                                Dispatch Date
                            </option>
                            <option value="completedAt">
                                Completion Date
                            </option>
                            <option value="cargoWeightKg">
                                Cargo Weight
                            </option>
                            <option value="plannedDistanceKm">
                                Planned Distance
                            </option>
                        </select>
                    </div>

                    <div>
                        <label
                            htmlFor="trip-sort-order"
                            className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                        >
                            Order
                        </label>

                        <select
                            id="trip-sort-order"
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
                                loadTrips()
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

            <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-5 py-4">
                    <h3 className="font-bold text-slate-900">
                        Transport Assignments
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                        {trips.length} matching trip
                        {trips.length === 1 ? "" : "s"}
                    </p>
                </div>

                {loading ? (
                    <TripsTableSkeleton />
                ) : trips.length === 0 ? (
                    <div className="px-6 py-14 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-500">
                            T
                        </div>

                        <h3 className="mt-4 font-bold text-slate-800">
                            No trips found
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                            Create a transport assignment or
                            change the current filters.
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                setCreateOpen(true)
                            }
                            className="mt-5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            Create Trip
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    {[
                                        "Route",
                                        "Vehicle",
                                        "Driver",
                                        "Cargo / Distance",
                                        "Revenue",
                                        "Status",
                                        "Timeline",
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
                                {trips.map((trip) => (
                                    <tr
                                        key={trip.id}
                                        className="hover:bg-slate-50"
                                    >
                                        <td className="whitespace-nowrap px-5 py-4">
                                            <p className="text-sm font-bold text-slate-900">
                                                {trip.source}
                                            </p>

                                            <p className="my-1 text-xs font-bold text-blue-500">
                                                ↓
                                            </p>

                                            <p className="text-sm font-semibold text-slate-700">
                                                {trip.destination}
                                            </p>

                                            <p className="mt-2 text-xs text-slate-400">
                                                {trip.id.slice(0, 8)}
                                            </p>
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4">
                                            <p className="text-sm font-bold text-slate-800">
                                                {trip.vehicle
                                                    ?.registrationNumber ||
                                                    "—"}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                {trip.vehicle?.name}
                                            </p>
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4">
                                            <p className="text-sm font-semibold text-slate-800">
                                                {trip.driver?.name ||
                                                    "—"}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                {trip.driver
                                                    ?.licenseCategory}
                                            </p>
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4">
                                            <p className="text-sm font-semibold text-slate-700">
                                                {formatNumber(
                                                    trip.cargoWeightKg
                                                )}{" "}
                                                kg
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                Planned:{" "}
                                                {formatNumber(
                                                    trip.plannedDistanceKm
                                                )}{" "}
                                                km
                                            </p>

                                            {trip.actualDistanceKm !==
                                                null &&
                                                trip.actualDistanceKm !==
                                                undefined && (
                                                    <p className="mt-1 text-xs font-semibold text-emerald-600">
                                                        Actual:{" "}
                                                        {formatNumber(
                                                            trip.actualDistanceKm
                                                        )}{" "}
                                                        km
                                                    </p>
                                                )}
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-700">
                                            {formatCurrency(
                                                trip.revenue
                                            )}
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4">
                                            <StatusBadge
                                                status={trip.status}
                                            />
                                        </td>

                                        <td className="min-w-48 px-5 py-4">
                                            <p className="text-xs text-slate-500">
                                                Created
                                            </p>

                                            <p className="mt-1 text-xs font-semibold text-slate-700">
                                                {formatDate(
                                                    trip.createdAt
                                                )}
                                            </p>

                                            {trip.dispatchedAt && (
                                                <>
                                                    <p className="mt-2 text-xs text-slate-500">
                                                        Dispatched
                                                    </p>

                                                    <p className="mt-1 text-xs font-semibold text-slate-700">
                                                        {formatDate(
                                                            trip.dispatchedAt
                                                        )}
                                                    </p>
                                                </>
                                            )}
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {trip.status ===
                                                    "DRAFT" && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    requestDispatch(
                                                                        trip
                                                                    )
                                                                }
                                                                className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                                                            >
                                                                Dispatch
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    requestCancel(
                                                                        trip
                                                                    )
                                                                }
                                                                className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </>
                                                    )}

                                                {trip.status ===
                                                    "DISPATCHED" && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setCompletionTrip(
                                                                        trip
                                                                    )
                                                                }
                                                                className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                                                            >
                                                                Complete
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    requestCancel(
                                                                        trip
                                                                    )
                                                                }
                                                                className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </>
                                                    )}

                                                {(trip.status ===
                                                    "COMPLETED" ||
                                                    trip.status ===
                                                    "CANCELLED") && (
                                                        <span className="text-xs font-medium text-slate-400">
                                                            No actions available
                                                        </span>
                                                    )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <TripFormModal
                open={createOpen}
                onClose={() =>
                    setCreateOpen(false)
                }
                onSaved={handleTripCreated}
            />

            <CompleteTripModal
                open={Boolean(completionTrip)}
                trip={completionTrip}
                onClose={() =>
                    setCompletionTrip(null)
                }
                onCompleted={
                    handleTripCompleted
                }
            />

            <ConfirmDialog
                open={confirmation.open}
                title={confirmationTitle}
                message={confirmationMessage}
                confirmLabel={
                    confirmation.type ===
                        "dispatch"
                        ? "Dispatch Trip"
                        : "Cancel Trip"
                }
                danger={
                    confirmation.type === "cancel"
                }
                loading={actionLoading}
                onCancel={closeConfirmation}
                onConfirm={
                    executeConfirmedAction
                }
            />
        </div>
    );
}