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
import NotFoundPage from "../pages/NotFoundPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";

import VehiclesPage from "../pages/VehiclesPage";
import DriversPage from "../pages/DriversPage";

import TripsPage from "../pages/TripsPage";
import MaintenancePage from "../pages/MaintenancePage";

import CostsPage from "../pages/CostsPage";

import ReportsPage from "../pages/ReportsPage";

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
                <TripsPage />
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
                <MaintenancePage />
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
                <CostsPage />
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
                <ReportsPage />
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
