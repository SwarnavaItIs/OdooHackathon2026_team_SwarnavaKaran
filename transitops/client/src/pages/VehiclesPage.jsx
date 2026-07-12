import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../api/api";

import ConfirmDialog from "../components/ConfirmDialog";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import VehicleFormModal from "../components/VehicleFormModal";

import { useAuth } from "../context/AuthContext";

const initialFilters = {
  search: "",
  type: "",
  status: "",
  region: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

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

function formatNumber(value) {
  return new Intl.NumberFormat(
    "en-IN",
    {
      maximumFractionDigits: 2,
    }
  ).format(Number(value || 0));
}

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

function VehicleTableSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-5">
      {Array.from({
        length: 5,
      }).map((_, index) => (
        <div
          key={index}
          className="h-16 rounded-lg bg-slate-100"
        />
      ))}
    </div>
  );
}

export default function VehiclesPage() {
  const { user } = useAuth();

  const isFleetManager =
    user.role.code === "FLEET_MANAGER";

  const [vehicles, setVehicles] =
    useState([]);

  const [
    filterOptions,
    setFilterOptions,
  ] = useState({
    types: [],
    regions: [],
    statuses: [],
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
      vehicle: null,
    });

  const [
    confirmation,
    setConfirmation,
  ] = useState({
    open: false,
    type: null,
    vehicle: null,
  });

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const loadFilterOptions =
    useCallback(async () => {
      try {
        const response = await api.get(
          "/vehicles/filter-options"
        );

        setFilterOptions(
          response.data.filters
        );
      } catch {
        // The table remains usable if filter
        // metadata cannot be loaded.
      }
    }, []);

  const loadVehicles = useCallback(
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
          "/vehicles",
          {
            params: buildQuery(filters),
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
        loadVehicles({
          fullLoader: true,
        });
      },
      filters.search ? 300 : 0
    );

    return () =>
      window.clearTimeout(timer);
  }, [filters, loadVehicles]);

  const summary = useMemo(() => {
    const result = {
      total: vehicles.length,
      available: 0,
      onTrip: 0,
      inShop: 0,
      retired: 0,
    };

    for (const vehicle of vehicles) {
      if (
        vehicle.status === "AVAILABLE"
      ) {
        result.available += 1;
      }

      if (
        vehicle.status === "ON_TRIP"
      ) {
        result.onTrip += 1;
      }

      if (
        vehicle.status === "IN_SHOP"
      ) {
        result.inShop += 1;
      }

      if (
        vehicle.status === "RETIRED"
      ) {
        result.retired += 1;
      }
    }

    return result;
  }, [vehicles]);

  const hasFilters = useMemo(
    () =>
      filters.search !== "" ||
      filters.type !== "" ||
      filters.status !== "" ||
      filters.region !== "",
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
      vehicle: null,
    });
  }

  function openEditModal(vehicle) {
    setFormState({
      open: true,
      vehicle,
    });
  }

  function closeFormModal() {
    setFormState({
      open: false,
      vehicle: null,
    });
  }

  async function handleVehicleSaved(
    savedVehicle,
    message
  ) {
    closeFormModal();
    setNotice(message);

    await Promise.all([
      loadVehicles(),
      loadFilterOptions(),
    ]);
  }

  function askToRetire(vehicle) {
    setConfirmation({
      open: true,
      type: "retire",
      vehicle,
    });
  }

  function askToDelete(vehicle) {
    setConfirmation({
      open: true,
      type: "delete",
      vehicle,
    });
  }

  function closeConfirmation() {
    if (actionLoading) {
      return;
    }

    setConfirmation({
      open: false,
      type: null,
      vehicle: null,
    });
  }

  async function executeConfirmedAction() {
    const {
      type,
      vehicle,
    } = confirmation;

    if (!type || !vehicle) {
      return;
    }

    setActionLoading(true);
    setError("");
    setNotice("");

    try {
      let response;

      if (type === "retire") {
        response = await api.post(
          `/vehicles/${vehicle.id}/retire`
        );
      } else {
        response = await api.delete(
          `/vehicles/${vehicle.id}`
        );
      }

      setNotice(response.data.message);
      closeConfirmation();

      await Promise.all([
        loadVehicles(),
        loadFilterOptions(),
      ]);
    } catch (requestError) {
      setError(
        requestError.response?.data
          ?.message ||
          `Unable to ${type} vehicle.`
      );

      setConfirmation({
        open: false,
        type: null,
        vehicle: null,
      });
    } finally {
      setActionLoading(false);
    }
  }

  const confirmationTitle =
    confirmation.type === "delete"
      ? "Delete vehicle?"
      : "Retire vehicle?";

  const confirmationMessage =
    confirmation.type === "delete"
      ? `Delete ${confirmation.vehicle?.registrationNumber}? Vehicles with operational history cannot be deleted.`
      : `Retire ${confirmation.vehicle?.registrationNumber}? Retired vehicles will no longer be available for dispatch.`;

  return (
    <div>
      <PageHeader
        eyebrow="Fleet Management"
        title="Vehicle Registry"
        description="Manage registration details, capacity, status and the operational lifecycle of every fleet asset."
        action={
          isFleetManager ? (
            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              + Register Vehicle
            </button>
          ) : null
        }
      />

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "Filtered Vehicles",
            value: summary.total,
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
            label: "In Shop",
            value: summary.inShop,
          },
          {
            label: "Retired",
            value: summary.retired,
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
              htmlFor="vehicle-search"
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
            >
              Search
            </label>

            <input
              id="vehicle-search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Registration, name, model..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="vehicle-type"
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
            >
              Type
            </label>

            <select
              id="vehicle-type"
              name="type"
              value={filters.type}
              onChange={handleFilterChange}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="">
                All types
              </option>

              {filterOptions.types.map(
                (type) => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="vehicle-status"
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
            >
              Status
            </label>

            <select
              id="vehicle-status"
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
                    {status.replaceAll(
                      "_",
                      " "
                    )}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="vehicle-region"
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
            >
              Region
            </label>

            <select
              id="vehicle-region"
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

          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasFilters}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="createdAt">
                Date Created
              </option>
              <option value="registrationNumber">
                Registration
              </option>
              <option value="name">
                Vehicle Name
              </option>
              <option value="odometerKm">
                Odometer
              </option>
              <option value="acquisitionCost">
                Acquisition Cost
              </option>
            </select>

            <select
              name="sortOrder"
              value={filters.sortOrder}
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

          <button
            type="button"
            onClick={() =>
              loadVehicles()
            }
            disabled={refreshing}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
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
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="font-bold text-slate-900">
              Fleet Assets
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {vehicles.length} matching
              vehicle
              {vehicles.length === 1
                ? ""
                : "s"}
            </p>
          </div>
        </div>

        {loading ? (
          <VehicleTableSkeleton />
        ) : vehicles.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-500">
              V
            </div>

            <h3 className="mt-4 font-bold text-slate-800">
              No vehicles found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Change the filters or register
              the first fleet vehicle.
            </p>

            {isFleetManager && (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Register Vehicle
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Vehicle",
                    "Type / Region",
                    "Capacity",
                    "Odometer",
                    "Acquisition Cost",
                    "Status",
                    ...(isFleetManager
                      ? ["Actions"]
                      : []),
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
                {vehicles.map((vehicle) => {
                  const operationallyLocked =
                    vehicle.status ===
                      "ON_TRIP" ||
                    vehicle.status ===
                      "IN_SHOP";

                  return (
                    <tr
                      key={vehicle.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4">
                        <p className="text-sm font-bold text-slate-900">
                          {
                            vehicle.registrationNumber
                          }
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          {vehicle.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {vehicle.model ||
                            "No model"}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <p className="text-sm font-semibold text-slate-700">
                          {vehicle.type}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {vehicle.region}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                        {formatNumber(
                          vehicle.maxLoadKg
                        )}{" "}
                        kg
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                        {formatNumber(
                          vehicle.odometerKm
                        )}{" "}
                        km
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-700">
                        {formatCurrency(
                          vehicle.acquisitionCost
                        )}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        <StatusBadge
                          status={vehicle.status}
                        />
                      </td>

                      {isFleetManager && (
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  vehicle
                                )
                              }
                              disabled={
                                vehicle.status ===
                                "ON_TRIP"
                              }
                              title={
                                vehicle.status ===
                                "ON_TRIP"
                                  ? "On Trip vehicles cannot be edited"
                                  : "Edit vehicle"
                              }
                              className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Edit
                            </button>

                            {vehicle.status !==
                              "RETIRED" && (
                              <button
                                type="button"
                                onClick={() =>
                                  askToRetire(
                                    vehicle
                                  )
                                }
                                disabled={
                                  operationallyLocked
                                }
                                title={
                                  operationallyLocked
                                    ? "Complete the trip or close maintenance first"
                                    : "Retire vehicle"
                                }
                                className="rounded-md border border-amber-300 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                Retire
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                askToDelete(
                                  vehicle
                                )
                              }
                              disabled={
                                operationallyLocked
                              }
                              title={
                                operationallyLocked
                                  ? "Active vehicles cannot be deleted"
                                  : "Delete vehicle"
                              }
                              className="rounded-md border border-red-300 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <VehicleFormModal
        open={formState.open}
        vehicle={formState.vehicle}
        onClose={closeFormModal}
        onSaved={handleVehicleSaved}
      />

      <ConfirmDialog
        open={confirmation.open}
        title={confirmationTitle}
        message={confirmationMessage}
        confirmLabel={
          confirmation.type === "delete"
            ? "Delete Vehicle"
            : "Retire Vehicle"
        }
        danger={
          confirmation.type === "delete"
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