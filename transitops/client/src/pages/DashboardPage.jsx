import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../api/api";

import BreakdownCard from "../components/BreakdownCard";
import KpiCard from "../components/KpiCard";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

import { useAuth } from "../context/AuthContext";

const initialFilters = {
  type: "",
  status: "",
  region: "",
};

function buildDashboardParams(filters) {
  const params = {};

  if (filters.type) {
    params.type = filters.type;
  }

  if (filters.status) {
    params.status = filters.status;
  }

  if (filters.region) {
    params.region = filters.region;
  }

  return params;
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

function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 7,
        }).map((_, index) => (
          <div
            key={index}
            className="h-36 rounded-xl bg-slate-200"
          />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="h-80 rounded-xl bg-slate-200" />
        <div className="h-80 rounded-xl bg-slate-200" />
      </div>

      <div className="mt-6 h-72 rounded-xl bg-slate-200" />
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const [dashboard, setDashboard] =
    useState(null);

  const [filters, setFilters] =
    useState(initialFilters);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const fetchDashboard = useCallback(
    async ({
      showFullLoader = false,
    } = {}) => {
      try {
        setError("");

        if (showFullLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const response = await api.get(
          "/dashboard",
          {
            params:
              buildDashboardParams(
                filters
              ),
          }
        );

        setDashboard(response.data);
      } catch (requestError) {
        setError(
          requestError.response?.data
            ?.message ||
            "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    fetchDashboard({
      showFullLoader: true,
    });
  }, [fetchDashboard]);

  const hasActiveFilters = useMemo(
    () =>
      Object.values(filters).some(
        Boolean
      ),
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

  const kpis = dashboard?.kpis || {};
  const charts = dashboard?.charts || {};

  const filterOptions =
    dashboard?.filterOptions || {
      types: [],
      regions: [],
      statuses: [],
    };

  const recentTrips =
    dashboard?.recentTrips || [];

  return (
    <div>
      <PageHeader
        eyebrow="Operations Overview"
        title={`Welcome, ${user.name}`}
        description="Monitor fleet availability, active trips, maintenance activity and driver readiness."
        action={
          <button
            type="button"
            onClick={() =>
              fetchDashboard()
            }
            disabled={refreshing}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh Dashboard"}
          </button>
        }
      />

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <div className="grid flex-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="type"
                className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
              >
                Vehicle Type
              </label>

              <select
                id="type"
                name="type"
                value={filters.type}
                onChange={
                  handleFilterChange
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                htmlFor="status"
                className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
              >
                Vehicle Status
              </label>

              <select
                id="status"
                name="status"
                value={filters.status}
                onChange={
                  handleFilterChange
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
                      {status
                        .replaceAll(
                          "_",
                          " "
                        )
                        .toLowerCase()
                        .replace(
                          /\b\w/g,
                          (character) =>
                            character.toUpperCase()
                        )}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label
                htmlFor="region"
                className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
              >
                Region
              </label>

              <select
                id="region"
                name="region"
                value={filters.region}
                onChange={
                  handleFilterChange
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
          </div>

          <button
            type="button"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reset Filters
          </button>
        </div>
      </section>

      {error && (
        <div className="mt-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm font-medium text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              fetchDashboard({
                showFullLoader: true,
              })
            }
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {loading && !dashboard ? (
        <div className="mt-6">
          <DashboardSkeleton />
        </div>
      ) : (
        <>
          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title="Active Vehicles"
              value={
                kpis.activeVehicles ?? 0
              }
              symbol="AV"
              variant="blue"
              helper="All non-retired vehicles"
            />

            <KpiCard
              title="Available Vehicles"
              value={
                kpis.availableVehicles ??
                0
              }
              symbol="✓"
              variant="emerald"
              helper="Ready for dispatch"
            />

            <KpiCard
              title="Vehicles in Maintenance"
              value={
                kpis.vehiclesInMaintenance ??
                0
              }
              symbol="M"
              variant="amber"
              helper="Currently marked In Shop"
            />

            <KpiCard
              title="Vehicles On Trip"
              value={
                kpis.vehiclesOnTrip ?? 0
              }
              symbol="OT"
              variant="violet"
              helper="Currently assigned"
            />

            <KpiCard
              title="Active Trips"
              value={
                kpis.activeTrips ?? 0
              }
              symbol="T"
              variant="blue"
              helper="Dispatched trips"
            />

            <KpiCard
              title="Pending Trips"
              value={
                kpis.pendingTrips ?? 0
              }
              symbol="P"
              variant="rose"
              helper="Draft trips awaiting dispatch"
            />

            <KpiCard
              title="Drivers On Duty"
              value={
                kpis.driversOnDuty ?? 0
              }
              symbol="DR"
              variant="cyan"
              helper="Available or On Trip"
            />

            <KpiCard
              title="Fleet Utilization"
              value={
                kpis.fleetUtilizationPercentage ??
                0
              }
              suffix="%"
              symbol="%"
              variant="slate"
              helper="On Trip vehicles / active fleet"
            />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-2">
            <BreakdownCard
              title="Vehicle Status"
              description="Current distribution of fleet assets."
              data={
                charts.vehicleStatusBreakdown
              }
            />

            <BreakdownCard
              title="Trip Status"
              description="Distribution across the trip lifecycle."
              data={
                charts.tripStatusBreakdown
              }
            />
          </section>

          <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-bold text-slate-900">
                  Recent Trips
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  The five most recently created trips matching the selected filters.
                </p>
              </div>

              <span className="text-xs font-semibold text-slate-400">
                {recentTrips.length} shown
              </span>
            </div>

            {recentTrips.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-500">
                  T
                </div>

                <p className="mt-4 font-semibold text-slate-700">
                  No trips found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Create a trip or change the dashboard filters.
                </p>
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
                        "Status",
                        "Created",
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
                    {recentTrips.map(
                      (trip) => (
                        <tr
                          key={trip.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="whitespace-nowrap px-5 py-4">
                            <p className="text-sm font-semibold text-slate-900">
                              {trip.source}
                              {" → "}
                              {trip.destination}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Trip{" "}
                              {trip.id.slice(
                                0,
                                8
                              )}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <p className="text-sm font-semibold text-slate-800">
                              {trip.vehicle
                                ?.registrationNumber ||
                                "—"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {trip.vehicle
                                ?.name || ""}
                            </p>
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                            {trip.driver
                              ?.name || "—"}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <StatusBadge
                              status={
                                trip.status
                              }
                            />
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                            {formatDate(
                              trip.createdAt
                            )}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}