import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import api from "../api/api";

import ExpenseFormModal from "../components/ExpenseFormModal";
import FuelLogFormModal from "../components/FuelLogFormModal";
import PageHeader from "../components/PageHeader";

import { useAuth } from "../context/AuthContext";

const initialFuelFilters = {
    vehicleId: "",
    dateFrom: "",
    dateTo: "",
    sortOrder: "desc",
};

const initialExpenseFilters = {
    vehicleId: "",
    category: "",
    dateFrom: "",
    dateTo: "",
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

function formatCurrency(value) {
    return new Intl.NumberFormat(
        "en-IN",
        {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
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

function formatCategory(category) {
    return category
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (character) =>
            character.toUpperCase()
        );
}

function LogsSkeleton() {
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

export default function CostsPage() {
    const { user } = useAuth();

    const role = user.role.code;

    const canCreateFuel = [
        "FLEET_MANAGER",
        "DRIVER",
        "FINANCIAL_ANALYST",
    ].includes(role);

    const canCreateExpense = [
        "FLEET_MANAGER",
        "FINANCIAL_ANALYST",
    ].includes(role);

    const [activeTab, setActiveTab] =
        useState("fuel");

    const [vehicles, setVehicles] =
        useState([]);

    const [fuelLogs, setFuelLogs] =
        useState([]);

    const [expenses, setExpenses] =
        useState([]);

    const [
        fuelFilters,
        setFuelFilters,
    ] = useState(initialFuelFilters);

    const [
        expenseFilters,
        setExpenseFilters,
    ] = useState(initialExpenseFilters);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [notice, setNotice] =
        useState("");

    const [fuelModalOpen, setFuelModalOpen] =
        useState(false);

    const [
        expenseModalOpen,
        setExpenseModalOpen,
    ] = useState(false);

    useEffect(() => {
        async function loadVehicles() {
            try {
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
            } catch {
                // Logs remain usable without
                // vehicle filter metadata.
            }
        }

        loadVehicles();
    }, []);

    const loadFuelLogs = useCallback(
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
                    "/costs/fuel",
                    {
                        params: buildQuery(
                            fuelFilters
                        ),
                    }
                );

                setFuelLogs(
                    response.data.fuelLogs || []
                );
            } catch (requestError) {
                setError(
                    requestError.response?.data
                        ?.message ||
                    "Unable to load fuel logs."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [fuelFilters]
    );

    const loadExpenses = useCallback(
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
                    "/costs/expenses",
                    {
                        params: buildQuery(
                            expenseFilters
                        ),
                    }
                );

                setExpenses(
                    response.data.expenses || []
                );
            } catch (requestError) {
                setError(
                    requestError.response?.data
                        ?.message ||
                    "Unable to load expenses."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [expenseFilters]
    );

    useEffect(() => {
        if (activeTab === "fuel") {
            loadFuelLogs({
                fullLoader: true,
            });
        } else {
            loadExpenses({
                fullLoader: true,
            });
        }
    }, [
        activeTab,
        loadFuelLogs,
        loadExpenses,
    ]);

    const fuelSummary = useMemo(
        () =>
            fuelLogs.reduce(
                (summary, log) => {
                    summary.liters += Number(
                        log.liters || 0
                    );

                    summary.cost += Number(
                        log.totalCost || 0
                    );

                    return summary;
                },
                {
                    liters: 0,
                    cost: 0,
                }
            ),
        [fuelLogs]
    );

    const expenseSummary = useMemo(
        () =>
            expenses.reduce(
                (summary, expense) => {
                    summary.total += Number(
                        expense.amount || 0
                    );

                    summary.categories.add(
                        expense.category
                    );

                    return summary;
                },
                {
                    total: 0,
                    categories: new Set(),
                }
            ),
        [expenses]
    );

    function handleFuelFilterChange(
        event
    ) {
        const {
            name,
            value,
        } = event.target;

        setFuelFilters((current) => ({
            ...current,
            [name]: value,
        }));
    }

    function handleExpenseFilterChange(
        event
    ) {
        const {
            name,
            value,
        } = event.target;

        setExpenseFilters((current) => ({
            ...current,
            [name]: value,
        }));
    }

    async function handleFuelSaved(
        fuelLog,
        message
    ) {
        setFuelModalOpen(false);
        setActiveTab("fuel");
        setNotice(message);

        await loadFuelLogs();
    }

    async function handleExpenseSaved(
        expense,
        message
    ) {
        setExpenseModalOpen(false);
        setActiveTab("expenses");
        setNotice(message);

        await loadExpenses();
    }

    function refreshActiveTab() {
        if (activeTab === "fuel") {
            loadFuelLogs();
        } else {
            loadExpenses();
        }
    }

    return (
        <div>
            <PageHeader
                eyebrow="Financial Operations"
                title="Fuel & Expenses"
                description="Track fuel consumption, operational spending and vehicle-linked financial records."
                action={
                    <div className="flex flex-wrap gap-3">
                        {canCreateFuel && (
                            <button
                                type="button"
                                onClick={() =>
                                    setFuelModalOpen(true)
                                }
                                className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                            >
                                + Add Fuel Log
                            </button>
                        )}

                        {canCreateExpense && (
                            <button
                                type="button"
                                onClick={() =>
                                    setExpenseModalOpen(true)
                                }
                                className="rounded-lg border border-blue-600 bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                            >
                                + Add Expense
                            </button>
                        )}
                    </div>
                }
            />

            <div className="mt-6 flex border-b border-slate-200">
                <button
                    type="button"
                    onClick={() =>
                        setActiveTab("fuel")
                    }
                    className={`border-b-2 px-5 py-3 text-sm font-semibold ${activeTab === "fuel"
                            ? "border-blue-600 text-blue-700"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                >
                    Fuel Logs
                </button>

                <button
                    type="button"
                    onClick={() =>
                        setActiveTab("expenses")
                    }
                    className={`border-b-2 px-5 py-3 text-sm font-semibold ${activeTab === "expenses"
                            ? "border-blue-600 text-blue-700"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                >
                    Expenses
                </button>
            </div>

            {activeTab === "fuel" ? (
                <>
                    <section className="mt-6 grid gap-4 sm:grid-cols-3">
                        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Filtered Fuel Logs
                            </p>

                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                {fuelLogs.length}
                            </p>
                        </article>

                        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Fuel Consumed
                            </p>

                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                {formatNumber(
                                    fuelSummary.liters
                                )}{" "}
                                L
                            </p>
                        </article>

                        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Fuel Cost
                            </p>

                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                {formatCurrency(
                                    fuelSummary.cost
                                )}
                            </p>
                        </article>
                    </section>

                    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                            <div>
                                <label
                                    htmlFor="fuel-filter-vehicle"
                                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                                >
                                    Vehicle
                                </label>

                                <select
                                    id="fuel-filter-vehicle"
                                    name="vehicleId"
                                    value={
                                        fuelFilters.vehicleId
                                    }
                                    onChange={
                                        handleFuelFilterChange
                                    }
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                                >
                                    <option value="">
                                        All vehicles
                                    </option>

                                    {vehicles.map((vehicle) => (
                                        <option
                                            key={vehicle.id}
                                            value={vehicle.id}
                                        >
                                            {
                                                vehicle.registrationNumber
                                            }
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="fuel-date-from"
                                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                                >
                                    Date From
                                </label>

                                <input
                                    id="fuel-date-from"
                                    name="dateFrom"
                                    type="date"
                                    value={fuelFilters.dateFrom}
                                    onChange={
                                        handleFuelFilterChange
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="fuel-date-to"
                                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                                >
                                    Date To
                                </label>

                                <input
                                    id="fuel-date-to"
                                    name="dateTo"
                                    type="date"
                                    value={fuelFilters.dateTo}
                                    onChange={
                                        handleFuelFilterChange
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="fuel-order"
                                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                                >
                                    Order
                                </label>

                                <select
                                    id="fuel-order"
                                    name="sortOrder"
                                    value={
                                        fuelFilters.sortOrder
                                    }
                                    onChange={
                                        handleFuelFilterChange
                                    }
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                                >
                                    <option value="desc">
                                        Newest First
                                    </option>

                                    <option value="asc">
                                        Oldest First
                                    </option>
                                </select>
                            </div>

                            <div className="flex items-end gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFuelFilters(
                                            initialFuelFilters
                                        )
                                    }
                                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Reset
                                </button>

                                <button
                                    type="button"
                                    onClick={refreshActiveTab}
                                    disabled={refreshing}
                                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                >
                                    {refreshing
                                        ? "..."
                                        : "Refresh"}
                                </button>
                            </div>
                        </div>
                    </section>
                </>
            ) : (
                <>
                    <section className="mt-6 grid gap-4 sm:grid-cols-3">
                        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Filtered Expenses
                            </p>

                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                {expenses.length}
                            </p>
                        </article>

                        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Expense Categories
                            </p>

                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                {
                                    expenseSummary.categories
                                        .size
                                }
                            </p>
                        </article>

                        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                                Total Expenses
                            </p>

                            <p className="mt-2 text-2xl font-bold text-slate-900">
                                {formatCurrency(
                                    expenseSummary.total
                                )}
                            </p>
                        </article>
                    </section>

                    <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                            <div>
                                <label
                                    htmlFor="expense-filter-vehicle"
                                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                                >
                                    Vehicle
                                </label>

                                <select
                                    id="expense-filter-vehicle"
                                    name="vehicleId"
                                    value={
                                        expenseFilters.vehicleId
                                    }
                                    onChange={
                                        handleExpenseFilterChange
                                    }
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                                >
                                    <option value="">
                                        All vehicles
                                    </option>

                                    {vehicles.map((vehicle) => (
                                        <option
                                            key={vehicle.id}
                                            value={vehicle.id}
                                        >
                                            {
                                                vehicle.registrationNumber
                                            }
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="expense-category-filter"
                                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                                >
                                    Category
                                </label>

                                <select
                                    id="expense-category-filter"
                                    name="category"
                                    value={
                                        expenseFilters.category
                                    }
                                    onChange={
                                        handleExpenseFilterChange
                                    }
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                                >
                                    <option value="">
                                        All categories
                                    </option>

                                    {[
                                        "TOLL",
                                        "PARKING",
                                        "INSURANCE",
                                        "PENALTY",
                                        "REPAIR",
                                        "OTHER",
                                    ].map((category) => (
                                        <option
                                            key={category}
                                            value={category}
                                        >
                                            {formatCategory(
                                                category
                                            )}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label
                                    htmlFor="expense-date-from"
                                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                                >
                                    Date From
                                </label>

                                <input
                                    id="expense-date-from"
                                    name="dateFrom"
                                    type="date"
                                    value={
                                        expenseFilters.dateFrom
                                    }
                                    onChange={
                                        handleExpenseFilterChange
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="expense-date-to"
                                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                                >
                                    Date To
                                </label>

                                <input
                                    id="expense-date-to"
                                    name="dateTo"
                                    type="date"
                                    value={
                                        expenseFilters.dateTo
                                    }
                                    onChange={
                                        handleExpenseFilterChange
                                    }
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="expense-order"
                                    className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500"
                                >
                                    Order
                                </label>

                                <select
                                    id="expense-order"
                                    name="sortOrder"
                                    value={
                                        expenseFilters.sortOrder
                                    }
                                    onChange={
                                        handleExpenseFilterChange
                                    }
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm"
                                >
                                    <option value="desc">
                                        Newest First
                                    </option>

                                    <option value="asc">
                                        Oldest First
                                    </option>
                                </select>
                            </div>

                            <div className="flex items-end gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setExpenseFilters(
                                            initialExpenseFilters
                                        )
                                    }
                                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Reset
                                </button>

                                <button
                                    type="button"
                                    onClick={refreshActiveTab}
                                    disabled={refreshing}
                                    className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                >
                                    {refreshing
                                        ? "..."
                                        : "Refresh"}
                                </button>
                            </div>
                        </div>
                    </section>
                </>
            )}

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
                <div className="border-b border-slate-200 px-5 py-4">
                    <h3 className="font-bold text-slate-900">
                        {activeTab === "fuel"
                            ? "Fuel History"
                            : "Expense History"}
                    </h3>
                </div>

                {loading ? (
                    <LogsSkeleton />
                ) : activeTab === "fuel" ? (
                    fuelLogs.length === 0 ? (
                        <div className="px-6 py-14 text-center text-sm text-slate-500">
                            No fuel logs match the current
                            filters.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200">
                                <thead className="bg-slate-50">
                                    <tr>
                                        {[
                                            "Vehicle",
                                            "Trip",
                                            "Fuel",
                                            "Cost",
                                            "Odometer",
                                            "Date",
                                            "Recorded By",
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
                                    {fuelLogs.map((log) => (
                                        <tr
                                            key={log.id}
                                            className="hover:bg-slate-50"
                                        >
                                            <td className="whitespace-nowrap px-5 py-4">
                                                <p className="text-sm font-bold text-slate-900">
                                                    {
                                                        log.vehicle
                                                            ?.registrationNumber
                                                    }
                                                </p>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    {log.vehicle?.name}
                                                </p>
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                                                {log.trip ? (
                                                    <>
                                                        <p className="font-semibold">
                                                            {log.trip.source}
                                                            {" → "}
                                                            {
                                                                log.trip
                                                                    .destination
                                                            }
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {
                                                                log.trip
                                                                    .status
                                                            }
                                                        </p>
                                                    </>
                                                ) : (
                                                    "Vehicle log"
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-700">
                                                {formatNumber(
                                                    log.liters
                                                )}{" "}
                                                L
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-700">
                                                {formatCurrency(
                                                    log.totalCost
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                                {log.odometerKm ===
                                                    null
                                                    ? "—"
                                                    : `${formatNumber(
                                                        log.odometerKm
                                                    )} km`}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                                {formatDate(
                                                    log.loggedAt
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                                {log.createdBy?.name ||
                                                    "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                ) : expenses.length === 0 ? (
                    <div className="px-6 py-14 text-center text-sm text-slate-500">
                        No expenses match the current
                        filters.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    {[
                                        "Vehicle",
                                        "Category",
                                        "Description",
                                        "Trip",
                                        "Amount",
                                        "Date",
                                        "Recorded By",
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
                                {expenses.map((expense) => (
                                    <tr
                                        key={expense.id}
                                        className="hover:bg-slate-50"
                                    >
                                        <td className="whitespace-nowrap px-5 py-4">
                                            <p className="text-sm font-bold text-slate-900">
                                                {
                                                    expense.vehicle
                                                        ?.registrationNumber
                                                }
                                            </p>

                                            <p className="mt-1 text-xs text-slate-500">
                                                {expense.vehicle?.name}
                                            </p>
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4">
                                            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                                                {formatCategory(
                                                    expense.category
                                                )}
                                            </span>
                                        </td>

                                        <td className="min-w-60 px-5 py-4 text-sm text-slate-600">
                                            {expense.description ||
                                                "No description"}
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                            {expense.trip
                                                ? `${expense.trip.source} → ${expense.trip.destination}`
                                                : "Vehicle expense"}
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-slate-800">
                                            {formatCurrency(
                                                expense.amount
                                            )}
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                            {formatDate(
                                                expense.expenseDate
                                            )}
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                                            {expense.createdBy?.name ||
                                                "—"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <FuelLogFormModal
                open={fuelModalOpen}
                onClose={() =>
                    setFuelModalOpen(false)
                }
                onSaved={handleFuelSaved}
            />

            <ExpenseFormModal
                open={expenseModalOpen}
                onClose={() =>
                    setExpenseModalOpen(false)
                }
                onSaved={handleExpenseSaved}
            />
        </div>
    );
}