import {
  useEffect,
  useState,
} from "react";

import api from "../api/api";

const emptyForm = {
  name: "",
  licenseNumber: "",
  licenseCategory: "",
  licenseExpiry: "",
  contactNumber: "",
  safetyScore: "100",
  region: "",
  status: "",
};

function formatDateForInput(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function getInitialForm(driver) {
  if (!driver) {
    return emptyForm;
  }

  return {
    name: driver.name || "",
    licenseNumber:
      driver.licenseNumber || "",
    licenseCategory:
      driver.licenseCategory || "",
    licenseExpiry:
      formatDateForInput(
        driver.licenseExpiry
      ),
    contactNumber:
      driver.contactNumber || "",
    safetyScore:
      driver.safetyScore?.toString() ||
      "100",
    region: driver.region || "",
    status: "",
  };
}

export default function DriverFormModal({
  open,
  driver,
  onClose,
  onSaved,
}) {
  const isEditing = Boolean(driver);

  const [form, setForm] =
    useState(emptyForm);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (open) {
      setForm(getInitialForm(driver));
      setError("");
    }
  }, [open, driver]);

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
      name: form.name,
      licenseNumber:
        form.licenseNumber,
      licenseCategory:
        form.licenseCategory,
      licenseExpiry:
        form.licenseExpiry,
      contactNumber:
        form.contactNumber,
      safetyScore: Number(
        form.safetyScore
      ),
      region: form.region,
    };

    /*
     * Status is only accepted during creation.
     * Later status changes use the dedicated
     * /drivers/:id/status endpoint.
     */
    if (
      !isEditing &&
      form.status
    ) {
      payload.status = form.status;
    }

    try {
      let response;

      if (isEditing) {
        response = await api.patch(
          `/drivers/${driver.id}`,
          payload
        );
      } else {
        response = await api.post(
          "/drivers",
          payload
        );
      }

      onSaved(
        response.data.driver,
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
            "Unable to save driver."
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
        aria-labelledby="driver-form-title"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2
              id="driver-form-title"
              className="text-xl font-bold text-slate-900"
            >
              {isEditing
                ? "Edit Driver"
                : "Register Driver"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {isEditing
                ? "Update licence, safety and contact information."
                : "Add a driver to the transport operations registry."}
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
                htmlFor="driver-name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Driver Name
              </label>

              <input
                id="driver-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                maxLength={100}
                placeholder="Alex Roy"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="license-number"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Licence Number
              </label>

              <input
                id="license-number"
                name="licenseNumber"
                value={
                  form.licenseNumber
                }
                onChange={handleChange}
                required
                maxLength={50}
                placeholder="WB-DL-1001"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm uppercase outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="license-category"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Licence Category
              </label>

              <input
                id="license-category"
                name="licenseCategory"
                value={
                  form.licenseCategory
                }
                onChange={handleChange}
                required
                maxLength={30}
                placeholder="LMV"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm uppercase outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="license-expiry"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Licence Expiry
              </label>

              <input
                id="license-expiry"
                name="licenseExpiry"
                type="date"
                value={
                  form.licenseExpiry
                }
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="contact-number"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Contact Number
              </label>

              <input
                id="contact-number"
                name="contactNumber"
                value={
                  form.contactNumber
                }
                onChange={handleChange}
                required
                minLength={7}
                maxLength={20}
                placeholder="9876543210"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="safety-score"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Safety Score
              </label>

              <input
                id="safety-score"
                name="safetyScore"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={
                  form.safetyScore
                }
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="driver-region"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Region
              </label>

              <input
                id="driver-region"
                name="region"
                value={form.region}
                onChange={handleChange}
                required
                maxLength={100}
                placeholder="Kolkata"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {!isEditing && (
              <div>
                <label
                  htmlFor="initial-status"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Initial Status
                </label>

                <select
                  id="initial-status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">
                    Automatic
                  </option>

                  <option value="AVAILABLE">
                    Available
                  </option>

                  <option value="OFF_DUTY">
                    Off Duty
                  </option>

                  <option value="SUSPENDED">
                    Suspended
                  </option>
                </select>

                <p className="mt-1 text-xs text-slate-500">
                  Automatic uses Available for a
                  valid licence and Off Duty for
                  an expired licence.
                </p>
              </div>
            )}
          </div>

          {isEditing && (
            <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Driver status is managed through
              the status actions in the driver
              table. On Trip status is controlled
              only by trip dispatch and completion.
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
                  : "Register Driver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}