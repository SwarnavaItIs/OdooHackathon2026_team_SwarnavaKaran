import {
  useEffect,
  useState,
} from "react";

import api from "../api/api";

const emptyForm = {
  registrationNumber: "",
  name: "",
  model: "",
  type: "",
  region: "",
  maxLoadKg: "",
  odometerKm: "0",
  acquisitionCost: "0",
};

function getInitialForm(vehicle) {
  if (!vehicle) {
    return emptyForm;
  }

  return {
    registrationNumber:
      vehicle.registrationNumber || "",

    name: vehicle.name || "",
    model: vehicle.model || "",
    type: vehicle.type || "",
    region: vehicle.region || "",

    maxLoadKg:
      vehicle.maxLoadKg?.toString() || "",

    odometerKm:
      vehicle.odometerKm?.toString() || "0",

    acquisitionCost:
      vehicle.acquisitionCost?.toString() ||
      "0",
  };
}

export default function VehicleFormModal({
  open,
  vehicle,
  onClose,
  onSaved,
}) {
  const isEditing = Boolean(vehicle);

  const [form, setForm] =
    useState(emptyForm);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (open) {
      setForm(getInitialForm(vehicle));
      setError("");
    }
  }, [open, vehicle]);

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
      registrationNumber:
        form.registrationNumber,

      name: form.name,
      model: form.model || null,
      type: form.type,
      region: form.region,

      maxLoadKg: Number(
        form.maxLoadKg
      ),

      odometerKm: Number(
        form.odometerKm
      ),

      acquisitionCost: Number(
        form.acquisitionCost
      ),
    };

    try {
      let response;

      if (isEditing) {
        response = await api.patch(
          `/vehicles/${vehicle.id}`,
          payload
        );
      } else {
        response = await api.post(
          "/vehicles",
          payload
        );
      }

      onSaved(
        response.data.vehicle,
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
            "Unable to save vehicle."
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
        aria-labelledby="vehicle-form-title"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2
              id="vehicle-form-title"
              className="text-xl font-bold text-slate-900"
            >
              {isEditing
                ? "Edit Vehicle"
                : "Register Vehicle"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isEditing
                ? "Update vehicle registry information."
                : "Add a new asset to the fleet registry."}
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

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="registrationNumber"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Registration Number
              </label>

              <input
                id="registrationNumber"
                name="registrationNumber"
                value={
                  form.registrationNumber
                }
                onChange={handleChange}
                required
                maxLength={30}
                placeholder="WB-01-VAN-05"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm uppercase outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Vehicle Name
              </label>

              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                maxLength={100}
                placeholder="Van-05"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="model"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Model
              </label>

              <input
                id="model"
                name="model"
                value={form.model}
                onChange={handleChange}
                maxLength={100}
                placeholder="Tata Ace"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="type"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Vehicle Type
              </label>

              <input
                id="type"
                name="type"
                value={form.type}
                onChange={handleChange}
                required
                maxLength={50}
                placeholder="Van"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="region"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Region
              </label>

              <input
                id="region"
                name="region"
                value={form.region}
                onChange={handleChange}
                required
                maxLength={100}
                placeholder="Kolkata"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="maxLoadKg"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Maximum Load (kg)
              </label>

              <input
                id="maxLoadKg"
                name="maxLoadKg"
                type="number"
                min="0.01"
                step="0.01"
                value={form.maxLoadKg}
                onChange={handleChange}
                required
                placeholder="500"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="odometerKm"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Odometer (km)
              </label>

              <input
                id="odometerKm"
                name="odometerKm"
                type="number"
                min="0"
                step="0.01"
                value={form.odometerKm}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="acquisitionCost"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Acquisition Cost
              </label>

              <input
                id="acquisitionCost"
                name="acquisitionCost"
                type="number"
                min="0"
                step="0.01"
                value={
                  form.acquisitionCost
                }
                onChange={handleChange}
                required
                placeholder="850000"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          {isEditing && (
            <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Vehicle status cannot be edited
              manually. It is controlled by trip,
              maintenance and retirement workflows.
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
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Register Vehicle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}