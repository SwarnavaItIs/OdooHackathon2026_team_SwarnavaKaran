import {
    useEffect,
    useMemo,
    useState,
} from "react";

import api from "../api/api";

function getTodayForInput() {
    const today = new Date();
    const offset = today.getTimezoneOffset();

    return new Date(
        today.getTime() - offset * 60 * 1000
    )
        .toISOString()
        .slice(0, 10);
}

const emptyForm = {
    vehicleId: "",
    tripId: "",
    liters: "",
    totalCost: "",
    odometerKm: "",
    loggedAt: getTodayForInput(),
};

export default function FuelLogFormModal({
    open,
    onClose,
    onSaved,
}) {
    const [form, setForm] =
        useState(emptyForm);

    const [vehicles, setVehicles] =
        useState([]);

    const [trips, setTrips] =
        useState([]);

    const [loadingVehicles, setLoadingVehicles] =
        useState(false);

    const [loadingTrips, setLoadingTrips] =
        useState(false);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    useEffect(() => {
        if (!open) {
            return;
        }

        setForm({
            ...emptyForm,
            loggedAt: getTodayForInput(),
        });

        setTrips([]);
        setError("");

        async function loadVehicles() {
            try {
                setLoadingVehicles(true);

                const response = await api.get(
                    "/vehicles",
                    {
                        params: {
                            sortBy: "registrationNumber",
                            sortOrder: "asc",
                        },
                    }
                );

                setVehicles(
                    response.data.vehicles || []
                );
            } catch (requestError) {
                setError(
                    requestError.response?.data
                        ?.message ||
                    "Unable to load vehicles."
                );
            } finally {
                setLoadingVehicles(false);
            }
        }

        loadVehicles();
    }, [open]);

    useEffect(() => {
        if (!open || !form.vehicleId) {
            setTrips([]);
            return;
        }

        async function loadCompletedTrips() {
            try {
                setLoadingTrips(true);

                const response = await api.get(
                    "/trips",
                    {
                        params: {
                            vehicleId: form.vehicleId,
                            status: "COMPLETED",
                            sortBy: "completedAt",
                            sortOrder: "desc",
                        },
                    }
                );

                setTrips(
                    response.data.trips || []
                );
            } catch (requestError) {
                setError(
                    requestError.response?.data
                        ?.message ||
                    "Unable to load vehicle trips."
                );
            } finally {
                setLoadingTrips(false);
            }
        }

        loadCompletedTrips();
    }, [open, form.vehicleId]);

    const selectedTrip = useMemo(
        () =>
            trips.find(
                (trip) => trip.id === form.tripId
            ),
        [trips, form.tripId]
    );

    if (!open) {
        return null;
    }

    function handleChange(event) {
        const {
            name,
            value,
        } = event.target;

        if (name === "vehicleId") {
            setForm((current) => ({
                ...current,
                vehicleId: value,
                tripId: "",
                odometerKm: "",
            }));
        } else if (name === "tripId") {
            const trip = trips.find(
                (item) => item.id === value
            );

            setForm((current) => ({
                ...current,
                tripId: value,
                odometerKm:
                    trip?.finalOdometerKm?.toString() ||
                    current.odometerKm,
            }));
        } else {
            setForm((current) => ({
                ...current,
                [name]: value,
            }));
        }

        setError("");
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setSubmitting(true);
        setError("");

        const payload = {
            vehicleId: form.vehicleId,
            tripId: form.tripId || null,
            liters: Number(form.liters),
            totalCost: Number(form.totalCost),
            odometerKm:
                form.odometerKm === ""
                    ? null
                    : Number(form.odometerKm),
            loggedAt: form.loggedAt,
        };

        try {
            const response = await api.post(
                "/costs/fuel",
                payload
            );

            onSaved(
                response.data.fuelLog,
                response.data.message
            );
        } catch (requestError) {
            const responseData =
                requestError.response?.data;

            if (
                Array.isArray(responseData?.errors)
            ) {
                setError(
                    responseData.errors
                        .map((item) => item.message)
                        .join(". ")
                );
            } else {
                setError(
                    responseData?.message ||
                    "Unable to create fuel log."
                );
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4">
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="fuel-log-title"
                className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                        <h2
                            id="fuel-log-title"
                            className="text-xl font-bold text-slate-900"
                        >
                            Add Fuel Log
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Record fuel consumption and cost
                            for a fleet vehicle.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        aria-label="Close modal"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-500 hover:bg-slate-100"
                    >
                        ×
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="p-6"
                >
                    {error && (
                        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="space-y-5">
                        <div>
                            <label
                                htmlFor="fuel-vehicle"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Vehicle
                            </label>

                            <select
                                id="fuel-vehicle"
                                name="vehicleId"
                                value={form.vehicleId}
                                onChange={handleChange}
                                disabled={loadingVehicles}
                                required
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                            >
                                <option value="">
                                    {loadingVehicles
                                        ? "Loading vehicles..."
                                        : "Select vehicle"}
                                </option>

                                {vehicles.map((vehicle) => (
                                    <option
                                        key={vehicle.id}
                                        value={vehicle.id}
                                    >
                                        {vehicle.registrationNumber}
                                        {" — "}
                                        {vehicle.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="fuel-trip"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Related Completed Trip
                            </label>

                            <select
                                id="fuel-trip"
                                name="tripId"
                                value={form.tripId}
                                onChange={handleChange}
                                disabled={
                                    !form.vehicleId ||
                                    loadingTrips
                                }
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                            >
                                <option value="">
                                    {loadingTrips
                                        ? "Loading trips..."
                                        : "No trip linkage"}
                                </option>

                                {trips.map((trip) => (
                                    <option
                                        key={trip.id}
                                        value={trip.id}
                                    >
                                        {trip.source}
                                        {" → "}
                                        {trip.destination}
                                        {" — "}
                                        {trip.id.slice(0, 8)}
                                    </option>
                                ))}
                            </select>

                            <p className="mt-2 text-xs text-slate-500">
                                Leave this empty for a general
                                vehicle refuelling record.
                            </p>
                        </div>

                        {selectedTrip && (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                                Ensure fuel was not already entered
                                while completing this trip, otherwise
                                the cost and litres will be counted twice.
                            </div>
                        )}

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="fuel-liters-log"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Fuel Quantity (L)
                                </label>

                                <input
                                    id="fuel-liters-log"
                                    name="liters"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={form.liters}
                                    onChange={handleChange}
                                    required
                                    placeholder="35"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="fuel-total-cost"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Total Cost
                                </label>

                                <input
                                    id="fuel-total-cost"
                                    name="totalCost"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.totalCost}
                                    onChange={handleChange}
                                    required
                                    placeholder="3400"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="fuel-odometer"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Odometer (km)
                                </label>

                                <input
                                    id="fuel-odometer"
                                    name="odometerKm"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.odometerKm}
                                    onChange={handleChange}
                                    placeholder="12780"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="fuel-date"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Fuel Date
                                </label>

                                <input
                                    id="fuel-date"
                                    name="loggedAt"
                                    type="date"
                                    value={form.loggedAt}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-7 flex justify-end gap-3 border-t border-slate-200 pt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                submitting ||
                                loadingVehicles
                            }
                            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                            {submitting
                                ? "Saving..."
                                : "Add Fuel Log"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}