import {
    useEffect,
    useMemo,
    useState,
} from "react";

import api from "../api/api";

function getStartingOdometer(trip) {
    return Number(
        trip?.startOdometerKm ??
        trip?.vehicle?.odometerKm ??
        0
    );
}

export default function CompleteTripModal({
    open,
    trip,
    onClose,
    onCompleted,
}) {
    const [form, setForm] = useState({
        finalOdometerKm: "",
        fuelLiters: "0",
        fuelCost: "0",
        revenue: "0",
    });

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    const startingOdometer =
        getStartingOdometer(trip);

    useEffect(() => {
        if (!open || !trip) {
            return;
        }

        setForm({
            finalOdometerKm:
                startingOdometer.toString(),
            fuelLiters: "0",
            fuelCost: "0",
            revenue: Number(
                trip.revenue || 0
            ).toString(),
        });

        setError("");
    }, [
        open,
        trip,
        startingOdometer,
    ]);

    const calculatedDistance = useMemo(() => {
        const finalValue = Number(
            form.finalOdometerKm
        );

        if (
            !Number.isFinite(finalValue) ||
            finalValue < startingOdometer
        ) {
            return null;
        }

        return finalValue - startingOdometer;
    }, [
        form.finalOdometerKm,
        startingOdometer,
    ]);

    const invalidOdometer =
        form.finalOdometerKm !== "" &&
        Number(form.finalOdometerKm) <
        startingOdometer;

    if (!open || !trip) {
        return null;
    }

    function handleChange(event) {
        const {
            name,
            value,
        } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));

        setError("");
    }

    async function handleSubmit(event) {
        event.preventDefault();

        setSubmitting(true);
        setError("");

        try {
            const response = await api.post(
                `/trips/${trip.id}/complete`,
                {
                    finalOdometerKm: Number(
                        form.finalOdometerKm
                    ),
                    fuelLiters: Number(
                        form.fuelLiters
                    ),
                    fuelCost: Number(
                        form.fuelCost
                    ),
                    revenue: Number(
                        form.revenue
                    ),
                }
            );

            onCompleted(
                response.data.trip,
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
                    "Unable to complete trip."
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
                aria-labelledby="complete-trip-title"
                className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                        <h2
                            id="complete-trip-title"
                            className="text-xl font-bold text-slate-900"
                        >
                            Complete Trip
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            {trip.source}
                            {" → "}
                            {trip.destination}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-500 hover:bg-slate-100"
                        aria-label="Close modal"
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

                    <div className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Vehicle
                            </p>

                            <p className="mt-2 text-sm font-bold text-slate-900">
                                {
                                    trip.vehicle
                                        ?.registrationNumber
                                }
                            </p>
                        </div>

                        <div>
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Starting Odometer
                            </p>

                            <p className="mt-2 text-sm font-bold text-slate-900">
                                {startingOdometer.toFixed(2)} km
                            </p>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <label
                                htmlFor="final-odometer"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Final Odometer (km)
                            </label>

                            <input
                                id="final-odometer"
                                name="finalOdometerKm"
                                type="number"
                                min={startingOdometer}
                                step="0.01"
                                value={
                                    form.finalOdometerKm
                                }
                                onChange={handleChange}
                                aria-invalid={
                                    invalidOdometer
                                }
                                required
                                className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-4 ${invalidOdometer
                                        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                                        : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                                    }`}
                            />

                            {invalidOdometer ? (
                                <p className="mt-2 text-xs font-semibold text-red-600">
                                    Final odometer cannot be below{" "}
                                    {startingOdometer.toFixed(2)} km.
                                </p>
                            ) : calculatedDistance !==
                                null ? (
                                <p className="mt-2 text-xs text-slate-500">
                                    Actual distance:{" "}
                                    {calculatedDistance.toFixed(2)} km
                                </p>
                            ) : null}
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="fuel-liters"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Fuel Consumed (L)
                                </label>

                                <input
                                    id="fuel-liters"
                                    name="fuelLiters"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={
                                        form.fuelLiters
                                    }
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="fuel-cost"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Fuel Cost
                                </label>

                                <input
                                    id="fuel-cost"
                                    name="fuelCost"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.fuelCost}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="actual-revenue"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Trip Revenue
                            </label>

                            <input
                                id="actual-revenue"
                                name="revenue"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.revenue}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />
                        </div>
                    </div>

                    <div className="mt-6 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        Completing this trip will return
                        both the vehicle and driver to
                        Available and update the vehicle
                        odometer.
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
                                invalidOdometer
                            }
                            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {submitting
                                ? "Completing..."
                                : "Complete Trip"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
