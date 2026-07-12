import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import ThemeToggle from "../components/ThemeToggle";
import { useAuth } from "../context/AuthContext";
import { formatRole } from "../utils/role";

const navigationItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    symbol: "D",
    roles: [
      "FLEET_MANAGER",
      "DRIVER",
      "SAFETY_OFFICER",
      "FINANCIAL_ANALYST",
    ],
  },
  {
    label: "Vehicles",
    path: "/vehicles",
    symbol: "V",
    roles: [
      "FLEET_MANAGER",
      "DRIVER",
      "SAFETY_OFFICER",
      "FINANCIAL_ANALYST",
    ],
  },
  {
    label: "Drivers",
    path: "/drivers",
    symbol: "DR",
    roles: [
      "FLEET_MANAGER",
      "SAFETY_OFFICER",
    ],
  },
  {
    label: "Trips",
    path: "/trips",
    symbol: "T",
    roles: [
      "FLEET_MANAGER",
      "DRIVER",
    ],
  },
  {
    label: "Maintenance",
    path: "/maintenance",
    symbol: "M",
    roles: [
      "FLEET_MANAGER",
    ],
  },
  {
    label: "Fuel & Expenses",
    path: "/costs",
    symbol: "₹",
    roles: [
      "FLEET_MANAGER",
      "DRIVER",
      "FINANCIAL_ANALYST",
    ],
  },
  {
    label: "Reports",
    path: "/reports",
    symbol: "R",
    roles: [
      "FLEET_MANAGER",
      "FINANCIAL_ANALYST",
    ],
  },
];

function SidebarContent({
  user,
  closeSidebar,
}) {
  const visibleItems = useMemo(
    () =>
      navigationItems.filter((item) =>
        item.roles.includes(
          user.role.code
        )
      ),
    [user.role.code]
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-800 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white">
            TO
          </div>

          <div>
            <h1 className="text-lg font-bold text-white">
              TransitOps
            </h1>

            <p className="text-xs text-slate-400">
              Operations Platform
            </p>
          </div>
        </div>
      </div>

      <nav
        aria-label="Primary navigation"
        className="flex-1 space-y-1 overflow-y-auto px-3 py-5"
      >
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={closeSidebar}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              ].join(" ")
            }
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-xs font-bold">
              {item.symbol}
            </span>

            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <p className="truncate text-sm font-semibold text-white">
          {user.name}
        </p>

        <p className="mt-1 text-xs text-slate-400">
          {formatRole(user.role.code)}
        </p>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  const {
    user,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    if (!sidebarOpen) {
      return undefined;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
  }, [sidebarOpen]);

  function handleLogout() {
    logout();
    navigate("/login", {
      replace: true,
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-slate-950 lg:block">
        <SidebarContent
          user={user}
          closeSidebar={() => {}}
        />
      </aside>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() =>
            setSidebarOpen(false)
          }
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
        />
      )}

      {/* Mobile sidebar */}
      <aside
        aria-hidden={!sidebarOpen}
        inert={!sidebarOpen}
        className={[
          "fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 transition-transform duration-200 lg:hidden",
          sidebarOpen
            ? "translate-x-0"
            : "-translate-x-full",
        ].join(" ")}
      >
        <SidebarContent
          user={user}
          closeSidebar={() =>
            setSidebarOpen(false)
          }
        />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() =>
                  setSidebarOpen(true)
                }
                className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 lg:hidden"
                aria-label="Open navigation"
              >
                <span className="block h-0.5 w-5 bg-current" />
                <span className="mt-1 block h-0.5 w-5 bg-current" />
                <span className="mt-1 block h-0.5 w-5 bg-current" />
              </button>

              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Smart Transport Operations
                </p>

                <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
                  Monitor your fleet in real time
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {user.name}
                </p>

                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatRole(
                    user.role.code
                  )}
                </p>
              </div>

              <ThemeToggle />

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {user.name
                  .split(" ")
                  .map((word) => word[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()}
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
