import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import ProtectedRoute from "../components/ProtectedRoute";
import RoleRoute from "../components/RoleRoute";

import AppLayout from "../layouts/AppLayout";

import DashboardPage from "../pages/DashboardPage";
import LoginPage from "../pages/LoginPage";
import ModulePlaceholder from "../pages/ModulePlaceholder";
import NotFoundPage from "../pages/NotFoundPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";

import VehiclesPage from "../pages/VehiclesPage";
import DriversPage from "../pages/DriversPage";

const ALL_ROLES = [
  "FLEET_MANAGER",
  "DRIVER",
  "SAFETY_OFFICER",
  "FINANCIAL_ANALYST",
];

export default function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route
            index
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

          <Route
            path="/dashboard"
            element={<DashboardPage />}
          />

          {/* <Route
            path="/vehicles"
            element={
              <RoleRoute
                allowedRoles={ALL_ROLES}
              >
                <ModulePlaceholder
                  title="Vehicle Registry"
                  description="Manage fleet assets, status, capacity and vehicle lifecycle."
                />
              </RoleRoute>
            }
          /> */}

          <Route
            path="/vehicles"
            element={
                <RoleRoute
                allowedRoles={ALL_ROLES}
                >
                <VehiclesPage />
                </RoleRoute>
            }
            />

          <Route
            path="/drivers"
            element={
                <RoleRoute
                allowedRoles={[
                    "FLEET_MANAGER",
                    "SAFETY_OFFICER",
                ]}
                >
                <DriversPage />
                </RoleRoute>
            }
            />

          <Route
            path="/trips"
            element={
              <RoleRoute
                allowedRoles={[
                  "FLEET_MANAGER",
                  "DRIVER",
                ]}
              >
                <ModulePlaceholder
                  title="Trip Management"
                  description="Create, dispatch, complete and cancel transport assignments."
                />
              </RoleRoute>
            }
          />

          <Route
            path="/maintenance"
            element={
              <RoleRoute
                allowedRoles={[
                  "FLEET_MANAGER",
                ]}
              >
                <ModulePlaceholder
                  title="Maintenance"
                  description="Track active maintenance and manage vehicle shop status."
                />
              </RoleRoute>
            }
          />

          <Route
            path="/costs"
            element={
              <RoleRoute
                allowedRoles={[
                  "FLEET_MANAGER",
                  "DRIVER",
                  "FINANCIAL_ANALYST",
                ]}
              >
                <ModulePlaceholder
                  title="Fuel & Expenses"
                  description="Record fuel consumption and operational expenses."
                />
              </RoleRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <RoleRoute
                allowedRoles={[
                  "FLEET_MANAGER",
                  "FINANCIAL_ANALYST",
                ]}
              >
                <ModulePlaceholder
                  title="Reports"
                  description="Review efficiency, cost, utilization and vehicle ROI."
                />
              </RoleRoute>
            }
          />

          <Route
            path="/unauthorized"
            element={
              <UnauthorizedPage />
            }
          />
        </Route>
      </Route>

      <Route
        path="*"
        element={<NotFoundPage />}
      />
    </Routes>
  );
}