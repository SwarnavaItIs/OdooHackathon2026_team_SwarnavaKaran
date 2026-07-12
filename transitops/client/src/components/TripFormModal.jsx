import {
    useEffect,
    useMemo,
    useState,
} from "react";

import api from "../api/api";

const emptyForm = {
    source: "",
    destination: "",
    vehicleId: "",
    driverId: "",
    cargoWeightKg: "",
    plannedDistanceKm: "",
    revenue: "0",
};

function formatNumber(value) {
    return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2,
    }).format(Number(value || 0));
}

export default function TripFormModal({
    open,
    onClose,
    onSaved,
}) {
    const [form, setForm] =
        useState(emptyForm);

    const [vehicles, setVehicles] =
        useState([]);

    const [drivers, setDrivers] =
        useState([]);

    const [loadingOptions, setLoadingOptions] =
        useState(false);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    useEffect(() => {
        if (!open) {
            return;
        }

        setForm(emptyForm);
        setError("");

        async function loadDispatchOptions() {
            try {
                setLoadingOptions(true);

                const response = await api.get(
                    "/trips/dispatch-options"
                );

                setVehicles(
                    response.data.vehicles || []
                );

                setDrivers(
                    response.data.drivers || []
                );
            } catch (requestError) {
                setError(
                    requestError.response?.data?.message ||
                    "Unable to load eligible vehicles and drivers."
                );
            } finally {
                setLoadingOptions(false);
            }
        }

        loadDispatchOptions();
    }, [open]);

    const selectedVehicle = useMemo(
        () =>
            vehicles.find(
                (vehicle) =>
                    vehicle.id === form.vehicleId
            ),
        [vehicles, form.vehicleId]
    );

    const selectedDriver = useMemo(
        () =>
            drivers.find(
                (driver) =>
                    driver.id === form.driverId
            ),
        [drivers, form.driverId]
    );

    const cargoExceedsCapacity =
        selectedVehicle &&
        Number(form.cargoWeightKg || 0) >
        Number(selectedVehicle.maxLoadKg);

    if (!open) {
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

        const payload = {
            source: form.source,
            destination: form.destination,
            vehicleId: form.vehicleId,
            driverId: form.driverId,
            cargoWeightKg: Number(
                form.cargoWeightKg
            ),
            plannedDistanceKm: Number(
                form.plannedDistanceKm
            ),
            revenue: Number(form.revenue),
        };

        try {
            const response = await api.post(
                "/trips",
                payload
            );

            onSaved(
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
                    "Unable to create trip."
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
                aria-labelledby="trip-form-title"
                className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                        <h2
                            id="trip-form-title"
                            className="text-xl font-bold text-slate-900"
                        >
                            Create Draft Trip
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Only currently eligible vehicles
                            and drivers are shown.
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

                    {loadingOptions ? (
                        <div className="py-16 text-center">
                            <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                            <p className="mt-4 text-sm text-slate-500">
                                Loading dispatch options...
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <div>
                                    <label
                                        htmlFor="trip-source"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Source
                                    </label>

                                    <input
                                        id="trip-source"
                                        name="source"
                                        value={form.source}
                                        onChange={handleChange}
                                        required
                                        maxLength={200}
                                        placeholder="Kolkata"
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="trip-destination"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Destination
                                    </label>

                                    <input
                                        id="trip-destination"
                                        name="destination"
                                        value={form.destination}
                                        onChange={handleChange}
                                        required
                                        maxLength={200}
                                        placeholder="Howrah"
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="trip-vehicle"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Vehicle
                                    </label>

                                    <select
                                        id="trip-vehicle"
                                        name="vehicleId"
                                        value={form.vehicleId}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    >
                                        <option value="">
                                            Select available vehicle
                                        </option>

                                        {vehicles.map((vehicle) => (
                                            <option
                                                key={vehicle.id}
                                                value={vehicle.id}
                                            >
                                                {vehicle.registrationNumber}
                                                {" — "}
                                                {vehicle.name}
                                                {" — "}
                                                {formatNumber(
                                                    vehicle.maxLoadKg
                                                )}
                                                {" kg"}
                                            </option>
                                        ))}
                                    </select>

                                    {vehicles.length === 0 && (
                                        <p className="mt-2 text-xs font-medium text-red-600">
                                            No available vehicles. Complete
                                            trips or close maintenance first.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="trip-driver"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Driver
                                    </label>

                                    <select
                                        id="trip-driver"
                                        name="driverId"
                                        value={form.driverId}
                                        onChange={handleChange}
                                        required
                                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    >
                                        <option value="">
                                            Select eligible driver
                                        </option>

                                        {drivers.map((driver) => (
                                            <option
                                                key={driver.id}
                                                value={driver.id}
                                            >
                                                {driver.name}
                                                {" — "}
                                                {driver.licenseCategory}
                                                {" — Safety "}
                                                {Number(
                                                    driver.safetyScore
                                                ).toFixed(0)}
                                            </option>
                                        ))}
                                    </select>

                                    {drivers.length === 0 && (
                                        <p className="mt-2 text-xs font-medium text-red-600">
                                            No eligible drivers with valid
                                            licences are available.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="cargo-weight"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Cargo Weight (kg)
                                    </label>

                                    <input
                                        id="cargo-weight"
                                        name="cargoWeightKg"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={form.cargoWeightKg}
                                        onChange={handleChange}
                                        aria-invalid={
                                            Boolean(
                                                cargoExceedsCapacity
                                            )
                                        }
                                        required
                                        placeholder="450"
                                        className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:ring-4 ${cargoExceedsCapacity
                                                ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                                                : "border-slate-300 focus:border-blue-500 focus:ring-blue-100"
                                            }`}
                                    />

                                    {selectedVehicle && (
                                        <p
                                            className={`mt-2 text-xs ${cargoExceedsCapacity
                                                    ? "font-semibold text-red-600"
                                                    : "text-slate-500"
                                                }`}
                                        >
                                            Capacity:{" "}
                                            {formatNumber(
                                                selectedVehicle.maxLoadKg
                                            )}{" "}
                                            kg
                                            {cargoExceedsCapacity
                                                ? " — cargo exceeds capacity"
                                                : ""}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label
                                        htmlFor="planned-distance"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Planned Distance (km)
                                    </label>

                                    <input
                                        id="planned-distance"
                                        name="plannedDistanceKm"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={
                                            form.plannedDistanceKm
                                        }
                                        onChange={handleChange}
                                        required
                                        placeholder="25"
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="trip-revenue"
                                        className="mb-2 block text-sm font-semibold text-slate-700"
                                    >
                                        Expected Revenue
                                    </label>

                                    <input
                                        id="trip-revenue"
                                        name="revenue"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.revenue}
                                        onChange={handleChange}
                                        required
                                        placeholder="12000"
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            {(selectedVehicle ||
                                selectedDriver) && (
                                    <div className="mt-6 grid gap-4 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:grid-cols-2">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wide text-blue-500">
                                                Selected Vehicle
                                            </p>

                                            <p className="mt-2 text-sm font-bold text-blue-900">
                                                {selectedVehicle
                                                    ? selectedVehicle.registrationNumber
                                                    : "Not selected"}
                                            </p>

                                            {selectedVehicle && (
                                                <p className="mt-1 text-xs text-blue-700">
                                                    {selectedVehicle.type}
                                                    {" · "}
                                                    {selectedVehicle.region}
                                                    {" · "}
                                                    {formatNumber(
                                                        selectedVehicle.maxLoadKg
                                                    )}
                                                    {" kg capacity"}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wide text-blue-500">
                                                Selected Driver
                                            </p>

                                            <p className="mt-2 text-sm font-bold text-blue-900">
                                                {selectedDriver
                                                    ? selectedDriver.name
                                                    : "Not selected"}
                                            </p>

                                            {selectedDriver && (
                                                <p className="mt-1 text-xs text-blue-700">
                                                    {
                                                        selectedDriver.licenseCategory
                                                    }
                                                    {" licence · Safety "}
                                                    {Number(
                                                        selectedDriver.safetyScore
                                                    ).toFixed(0)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                        </>
                    )}

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
                                loadingOptions ||
                                vehicles.length === 0 ||
                                drivers.length === 0 ||
                                cargoExceedsCapacity
                            }
                            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {submitting
                                ? "Creating..."
                                : "Create Draft Trip"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
