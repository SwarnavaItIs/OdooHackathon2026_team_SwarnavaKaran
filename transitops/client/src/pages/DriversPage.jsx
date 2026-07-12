import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../api/api";

import ConfirmDialog from "../components/ConfirmDialog";
import DriverFormModal from "../components/DriverFormModal";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

const initialFilters = {
  search: "",
  status: "",
  licenseCategory: "",
  region: "",
  licenseState: "",
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
    }
  ).format(new Date(value));
}

function getDaysUntilExpiry(value) {
  if (!value) {
    return null;
  }

  const expiry = new Date(value);
  expiry.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Math.ceil(
    (expiry.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
  );
}

function getSafetyScoreStyle(score) {
  const numericScore = Number(score);

  if (numericScore >= 80) {
    return {
      bar: "bg-emerald-500",
      text: "text-emerald-700",
    };
  }

  if (numericScore >= 60) {
    return {
      bar: "bg-amber-500",
      text: "text-amber-700",
    };
  }

  return {
    bar: "bg-red-500",
    text: "text-red-700",
  };
}

function DriversTableSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-5">
      {Array.from({
        length: 5,
      }).map((_, index) => (
        <div
          key={index}
          className="h-20 rounded-lg bg-slate-100"
        />
      ))}
    </div>
  );
}

export default function DriversPage() {
  const [drivers, setDrivers] =
    useState([]);

  const [
    filterOptions,
    setFilterOptions,
  ] = useState({
    licenseCategories: [],
    regions: [],
    statuses: [],
    licenseStates: [],
  });

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
      driver: null,
    });

  const [
    confirmation,
    setConfirmation,
  ] = useState({
    open: false,
    type: null,
    driver: null,
    nextStatus: null,
  });

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const loadFilterOptions =
    useCallback(async () => {
      try {
        const response = await api.get(
          "/drivers/filter-options"
        );

        setFilterOptions(
          response.data.filters
        );
      } catch {
        // Keep the page usable even if
        // dropdown metadata fails.
      }
    }, []);

  const loadDrivers = useCallback(
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
          "/drivers",
          {
            params: buildQuery(filters),
          }
        );

        setDrivers(
          response.data.drivers || []
        );
      } catch (requestError) {
        setError(
          requestError.response?.data
            ?.message ||
            "Unable to load drivers."
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
        loadDrivers({
          fullLoader: true,
        });
      },
      filters.search ? 300 : 0
    );

    return () =>
      window.clearTimeout(timer);
  }, [filters, loadDrivers]);

  const summary = useMemo(() => {
    const result = {
      total: drivers.length,
      available: 0,
      onTrip: 0,
      suspended: 0,
      expired: 0,
      eligible: 0,
    };

    for (const driver of drivers) {
      if (
        driver.status === "AVAILABLE"
      ) {
        result.available += 1;
      }

      if (
        driver.status === "ON_TRIP"
      ) {
        result.onTrip += 1;
      }

      if (
        driver.status === "SUSPENDED"
      ) {
        result.suspended += 1;
      }

      if (driver.licenseExpired) {
        result.expired += 1;
      }

      if (
        driver.status === "AVAILABLE" &&
        !driver.licenseExpired
      ) {
        result.eligible += 1;
      }
    }

    return result;
  }, [drivers]);

  const hasFilters = useMemo(
    () =>
      filters.search !== "" ||
      filters.status !== "" ||
      filters.licenseCategory !== "" ||
      filters.region !== "" ||
      filters.licenseState !== "",
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

  function openCreateModal() {
    setFormState({
      open: true,
      driver: null,
    });
  }

  function openEditModal(driver) {
    setFormState({
      open: true,
      driver,
    });
  }

  function closeFormModal() {
    setFormState({
      open: false,
      driver: null,
    });
  }

  async function handleDriverSaved(
    savedDriver,
    message
  ) {
    closeFormModal();
    setNotice(message);

    await Promise.all([
      loadDrivers(),
      loadFilterOptions(),
    ]);
  }

  function requestStatusChange(
    driver,
    nextStatus
  ) {
    setConfirmation({
      open: true,
      type: "status",
      driver,
      nextStatus,
    });
  }

  function requestDelete(driver) {
    setConfirmation({
      open: true,
      type: "delete",
      driver,
      nextStatus: null,
    });
  }

  function closeConfirmation() {
    if (actionLoading) {
      return;
    }

    setConfirmation({
      open: false,
      type: null,
      driver: null,
      nextStatus: null,
    });
  }

  async function executeConfirmedAction() {
    const {
      type,
      driver,
      nextStatus,
    } = confirmation;

    if (!driver || !type) {
      return;
    }

    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      let response;

      if (type === "delete") {
        response = await api.delete(
          `/drivers/${driver.id}`
        );
      } else {
        response = await api.patch(
          `/drivers/${driver.id}/status`,
          {
            status: nextStatus,
          }
        );
      }

      setNotice(response.data.message);

      setConfirmation({
        open: false,
        type: null,
        driver: null,
        nextStatus: null,
      });

      await loadDrivers();
    } catch (requestError) {
      setError(
        requestError.response?.data
          ?.message ||
          "Unable to update driver."
      );

      setConfirmation({
        open: false,
        type: null,
        driver: null,
        nextStatus: null,
      });
    } finally {
      setActionLoading(false);
    }
  }

  function formatStatusLabel(status) {
    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (character) =>
        character.toUpperCase()
      );
  }

  const confirmationTitle =
    confirmation.type === "delete"
      ? "Delete driver?"
      : `Mark driver ${formatStatusLabel(
          confirmation.nextStatus || ""
        )}?`;

  const confirmationMessage =
    confirmation.type === "delete"
      ? `Delete ${confirmation.driver?.name}? Drivers with trip history cannot be deleted.`
      : `Change ${confirmation.driver?.name}'s status from ${formatStatusLabel(
          confirmation.driver?.status || ""
        )} to ${formatStatusLabel(
          confirmation.nextStatus || ""
        )}?`;

  return (
    <div>
      <PageHeader
        eyebrow="Safety & Workforce"
        title="Driver Management"
        description="Manage driver availability, licence compliance, categories and safety performance."
        action={
          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            + Register Driver
          </button>
        }
      />

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {[
          {
            label: "Filtered Drivers",
            value: summary.total,
          },
          {
            label: "Eligible",
            value: summary.eligible,
          },
          {
            label: "Available",
            value: summary.available,
          },
          {
            label: "On Trip",
            value: summary.onTrip,
          },
          {
            label: "Suspended",
            value: summary.suspended,
          },
          {
            label: "Expired Licences",
            value: summary.expired,
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="md:col-span-2">
            <label
              htmlFor="driver-search"
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
            >
              Search
            </label>

            <input
              id="driver-search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Name, licence or contact..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="driver-status-filter"
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
            >
              Status
            </label>

            <select
              id="driver-status-filter"
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
                    {formatStatusLabel(
                      status
                    )}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="category-filter"
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
            >
              Category
            </label>

            <select
              id="category-filter"
              name="licenseCategory"
              value={
                filters.licenseCategory
              }
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="">
                All categories
              </option>

              {filterOptions.licenseCategories.map(
                (category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="driver-region-filter"
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
            >
              Region
            </label>

            <select
              id="driver-region-filter"
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
              htmlFor="license-state-filter"
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
            >
              Licence
            </label>

            <select
              id="license-state-filter"
              name="licenseState"
              value={
                filters.licenseState
              }
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="">
                All licences
              </option>

              <option value="VALID">
                Valid
              </option>

              <option value="EXPIRED">
                Expired
              </option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="createdAt">
                Date Created
              </option>

              <option value="name">
                Driver Name
              </option>

              <option value="licenseExpiry">
                Licence Expiry
              </option>

              <option value="safetyScore">
                Safety Score
              </option>
            </select>

            <select
              name="sortOrder"
              value={
                filters.sortOrder
              }
              onChange={handleFilterChange}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="desc">
                Descending
              </option>

              <option value="asc">
                Ascending
              </option>
            </select>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasFilters}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Reset Filters
            </button>

            <button
              type="button"
              onClick={() =>
                loadDrivers()
              }
              disabled={refreshing}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {refreshing
                ? "Refreshing..."
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
            Driver Registry
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {drivers.length} matching
            driver
            {drivers.length === 1
              ? ""
              : "s"}
          </p>
        </div>

        {loading ? (
          <DriversTableSkeleton />
        ) : drivers.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-500">
              DR
            </div>

            <h3 className="mt-4 font-bold text-slate-800">
              No drivers found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Change the filters or register
              the first driver.
            </p>

            <button
              type="button"
              onClick={openCreateModal}
              className="mt-5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Register Driver
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Driver",
                    "Licence",
                    "Expiry",
                    "Safety Score",
                    "Status",
                    "Dispatch",
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
                {drivers.map((driver) => {
                  const daysUntilExpiry =
                    getDaysUntilExpiry(
                      driver.licenseExpiry
                    );

                  const safetyStyle =
                    getSafetyScoreStyle(
                      driver.safetyScore
                    );

                  const eligible =
                    driver.status ===
                      "AVAILABLE" &&
                    !driver.licenseExpired;

                  const onTrip =
                    driver.status ===
                    "ON_TRIP";

                  return (
                    <tr
                      key={driver.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4">
                        <p className="text-sm font-bold text-slate-900">
                          {driver.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {driver.contactNumber}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {driver.region}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <p className="text-sm font-semibold text-slate-800">
                          {
                            driver.licenseNumber
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Category{" "}
                          {
                            driver.licenseCategory
                          }
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <p
                          className={`text-sm font-semibold ${
                            driver.licenseExpired
                              ? "text-red-700"
                              : daysUntilExpiry !==
                                    null &&
                                  daysUntilExpiry <=
                                    30
                                ? "text-amber-700"
                                : "text-slate-700"
                          }`}
                        >
                          {formatDate(
                            driver.licenseExpiry
                          )}
                        </p>

                        <p className="mt-1 text-xs">
                          {driver.licenseExpired ? (
                            <span className="font-semibold text-red-600">
                              Expired
                            </span>
                          ) : daysUntilExpiry !==
                              null ? (
                            <span className="text-slate-500">
                              {daysUntilExpiry} days
                              remaining
                            </span>
                          ) : null}
                        </p>
                      </td>

                      <td className="min-w-40 px-5 py-4">
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className={`text-sm font-bold ${safetyStyle.text}`}
                          >
                            {Number(
                              driver.safetyScore
                            ).toFixed(0)}
                          </span>

                          <span className="text-xs text-slate-400">
                            /100
                          </span>
                        </div>

                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${safetyStyle.bar}`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  0,
                                  Number(
                                    driver.safetyScore
                                  )
                                )
                              )}%`,
                            }}
                          />
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <StatusBadge
                          status={driver.status}
                        />
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        {eligible ? (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            Eligible
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                            Not Eligible
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                driver
                              )
                            }
                            disabled={onTrip}
                            title={
                              onTrip
                                ? "On Trip drivers cannot be edited"
                                : "Edit driver"
                            }
                            className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Edit
                          </button>

                          {driver.status !==
                            "SUSPENDED" && (
                            <button
                              type="button"
                              onClick={() =>
                                requestStatusChange(
                                  driver,
                                  "SUSPENDED"
                                )
                              }
                              disabled={onTrip}
                              className="rounded-md border border-red-300 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Suspend
                            </button>
                          )}

                          {driver.status !==
                            "OFF_DUTY" && (
                            <button
                              type="button"
                              onClick={() =>
                                requestStatusChange(
                                  driver,
                                  "OFF_DUTY"
                                )
                              }
                              disabled={onTrip}
                              className="rounded-md border border-amber-300 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Off Duty
                            </button>
                          )}

                          {driver.status !==
                            "AVAILABLE" &&
                            !onTrip && (
                              <button
                                type="button"
                                onClick={() =>
                                  requestStatusChange(
                                    driver,
                                    "AVAILABLE"
                                  )
                                }
                                className="rounded-md border border-emerald-300 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                              >
                                Available
                              </button>
                            )}

                          <button
                            type="button"
                            onClick={() =>
                              requestDelete(
                                driver
                              )
                            }
                            disabled={onTrip}
                            className="rounded-md border border-red-300 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <DriverFormModal
        open={formState.open}
        driver={formState.driver}
        onClose={closeFormModal}
        onSaved={handleDriverSaved}
      />

      <ConfirmDialog
        open={confirmation.open}
        title={confirmationTitle}
        message={confirmationMessage}
        confirmLabel={
          confirmation.type === "delete"
            ? "Delete Driver"
            : "Change Status"
        }
        danger={
          confirmation.type === "delete" ||
          confirmation.nextStatus ===
            "SUSPENDED"
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