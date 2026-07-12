import { useAuth } from "../context/AuthContext";
import { formatRole } from "../utils/role";

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <div>
        <p className="text-sm font-semibold text-blue-600">
          Operations Overview
        </p>

        <h2 className="mt-1 text-2xl font-bold text-slate-900">
          Welcome, {user.name}
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Signed in as{" "}
          {formatRole(user.role.code)}.
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="font-semibold text-slate-800">
          Dashboard foundation is ready
        </p>

        <p className="mt-2 text-sm text-slate-500">
          KPI cards and live analytics are
          added in the next checkpoint.
        </p>
      </div>
    </div>
  );
}