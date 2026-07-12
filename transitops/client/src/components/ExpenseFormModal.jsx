import {
    useEffect,
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

const expenseCategories = [
    "TOLL",
    "PARKING",
    "INSURANCE",
    "PENALTY",
    "REPAIR",
    "OTHER",
];

const emptyForm = {
    vehicleId: "",
    tripId: "",
    category: "TOLL",
    description: "",
    amount: "",
    expenseDate: getTodayForInput(),
};

function formatCategory(category) {
    return category
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (character) =>
            character.toUpperCase()
        );
}

export default function ExpenseFormModal({
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
            expenseDate: getTodayForInput(),
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

        async function loadTrips() {
            try {
                setLoadingTrips(true);

                const response = await api.get(
                    "/trips",
                    {
                        params: {
                            vehicleId: form.vehicleId,
                            sortBy: "createdAt",
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

        loadTrips();
    }, [open, form.vehicleId]);

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

        try {
            const response = await api.post(
                "/costs/expenses",
                {
                    vehicleId: form.vehicleId,
                    tripId: form.tripId || null,
                    category: form.category,
                    description:
                        form.description || null,
                    amount: Number(form.amount),
                    expenseDate: form.expenseDate,
                }
            );

            onSaved(
                response.data.expense,
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
                    "Unable to create expense."
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
                aria-labelledby="expense-form-title"
                className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                        <h2
                            id="expense-form-title"
                            className="text-xl font-bold text-slate-900"
                        >
                            Add Expense
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Record tolls and other
                            vehicle-related expenses.
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
                                htmlFor="expense-vehicle"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Vehicle
                            </label>

                            <select
                                id="expense-vehicle"
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
                                htmlFor="expense-trip"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Related Trip
                            </label>

                            <select
                                id="expense-trip"
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
                                        {trip.status}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="expense-category"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Category
                                </label>

                                <select
                                    id="expense-category"
                                    name="category"
                                    value={form.category}
                                    onChange={handleChange}
                                    required
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                >
                                    {expenseCategories.map(
                                        (category) => (
                                            <option
                                                key={category}
                                                value={category}
                                            >
                                                {formatCategory(
                                                    category
                                                )}
                                            </option>
                                        )
                                    )}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="expense-amount"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Amount
                                </label>

                                <input
                                    id="expense-amount"
                                    name="amount"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={form.amount}
                                    onChange={handleChange}
                                    required
                                    placeholder="180"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="expense-description"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Description
                            </label>

                            <textarea
                                id="expense-description"
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows={4}
                                maxLength={1000}
                                placeholder="Howrah bridge toll"
                                className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="expense-date"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Expense Date
                            </label>

                            <input
                                id="expense-date"
                                name="expenseDate"
                                type="date"
                                value={form.expenseDate}
                                onChange={handleChange}
                                required
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />
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
                                : "Add Expense"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}