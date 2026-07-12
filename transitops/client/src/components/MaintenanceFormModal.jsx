import {
    useEffect,
    useState,
} from "react";

import api from "../api/api";

const emptyForm = {
    vehicleId: "",
    maintenanceType: "",
    description: "",
    cost: "0",
};

function getInitialForm(record) {
    if (!record) {
        return emptyForm;
    }

    return {
        vehicleId: record.vehicleId || "",
        maintenanceType:
            record.maintenanceType || "",
        description:
            record.description || "",
        cost: Number(
            record.cost || 0
        ).toString(),
    };
}

export default function MaintenanceFormModal({
    open,
    record,
    onClose,
    onSaved,
}) {
    const isEditing = Boolean(record);

    const [form, setForm] =
        useState(emptyForm);

    const [vehicles, setVehicles] =
        useState([]);

    const [loadingVehicles, setLoadingVehicles] =
        useState(false);

    const [submitting, setSubmitting] =
        useState(false);

    const [error, setError] =
        useState("");

    useEffect(() => {
        if (!open) {
            return;
        }

        setForm(getInitialForm(record));
        setError("");

        /*
         * Vehicle selection is required only
         * when creating a maintenance record.
         */
        if (!record) {
            async function loadAvailableVehicles() {
                try {
                    setLoadingVehicles(true);

                    const response = await api.get(
                        "/vehicles/dispatchable"
                    );

                    setVehicles(
                        response.data.vehicles || []
                    );
                } catch (requestError) {
                    setError(
                        requestError.response?.data
                            ?.message ||
                        "Unable to load available vehicles."
                    );
                } finally {
                    setLoadingVehicles(false);
                }
            }

            loadAvailableVehicles();
        }
    }, [open, record]);

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

        try {
            let response;

            if (isEditing) {
                response = await api.patch(
                    `/maintenance/${record.id}`,
                    {
                        maintenanceType:
                            form.maintenanceType,

                        description:
                            form.description || null,

                        cost: Number(form.cost),
                    }
                );
            } else {
                response = await api.post(
                    "/maintenance",
                    {
                        vehicleId: form.vehicleId,

                        maintenanceType:
                            form.maintenanceType,

                        description:
                            form.description || null,

                        cost: Number(form.cost),
                    }
                );
            }

            onSaved(
                response.data.maintenance,
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
                    "Unable to save maintenance record."
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
                aria-labelledby="maintenance-form-title"
                className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
                <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
                    <div>
                        <h2
                            id="maintenance-form-title"
                            className="text-xl font-bold text-slate-900"
                        >
                            {isEditing
                                ? "Edit Maintenance"
                                : "Start Maintenance"}
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            {isEditing
                                ? "Update the active maintenance details and cost."
                                : "The selected vehicle will automatically move to In Shop."}
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

                    <div className="space-y-5">
                        {!isEditing ? (
                            <div>
                                <label
                                    htmlFor="maintenance-vehicle"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Vehicle
                                </label>

                                <select
                                    id="maintenance-vehicle"
                                    name="vehicleId"
                                    value={form.vehicleId}
                                    onChange={handleChange}
                                    required
                                    disabled={loadingVehicles}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
                                >
                                    <option value="">
                                        {loadingVehicles
                                            ? "Loading vehicles..."
                                            : "Select available vehicle"}
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
                                            {vehicle.region}
                                        </option>
                                    ))}
                                </select>

                                {!loadingVehicles &&
                                    vehicles.length === 0 && (
                                        <p className="mt-2 text-xs font-semibold text-red-600">
                                            No available vehicles can enter
                                            maintenance. Complete active trips
                                            or close existing maintenance first.
                                        </p>
                                    )}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                    Vehicle
                                </p>

                                <p className="mt-2 text-sm font-bold text-slate-900">
                                    {
                                        record.vehicle
                                            ?.registrationNumber
                                    }
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                    {record.vehicle?.name}
                                    {" · "}
                                    {record.vehicle?.region}
                                </p>
                            </div>
                        )}

                        <div>
                            <label
                                htmlFor="maintenance-type"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Maintenance Type
                            </label>

                            <input
                                id="maintenance-type"
                                name="maintenanceType"
                                value={form.maintenanceType}
                                onChange={handleChange}
                                required
                                maxLength={100}
                                placeholder="Oil Change"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="maintenance-description"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Description
                            </label>

                            <textarea
                                id="maintenance-description"
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows={4}
                                maxLength={1000}
                                placeholder="Describe the required work..."
                                className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="maintenance-cost"
                                className="mb-2 block text-sm font-semibold text-slate-700"
                            >
                                Maintenance Cost
                            </label>

                            <input
                                id="maintenance-cost"
                                name="cost"
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.cost}
                                onChange={handleChange}
                                required
                                placeholder="3500"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                            />
                        </div>
                    </div>

                    {!isEditing && (
                        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                            Starting maintenance immediately changes
                            the vehicle status to In Shop and removes
                            it from all dispatch selections.
                        </div>
                    )}

                    {isEditing && (
                        <div className="mt-6 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                            Only active maintenance records can be
                            edited. Closing is handled separately.
                        </div>
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
                                loadingVehicles ||
                                (!isEditing &&
                                    vehicles.length === 0)
                            }
                            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {submitting
                                ? "Saving..."
                                : isEditing
                                    ? "Save Changes"
                                    : "Start Maintenance"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}