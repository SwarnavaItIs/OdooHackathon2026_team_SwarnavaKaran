import {
  useEffect,
  useState,
} from "react";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getRoleHome } from "../utils/role";

const demoAccounts = [
  {
    label: "Fleet Manager",
    email: "fleet@demo.com",
  },
  {
    label: "Driver",
    email: "driver@demo.com",
  },
  {
    label: "Safety Officer",
    email: "safety@demo.com",
  },
  {
    label: "Financial Analyst",
    email: "finance@demo.com",
  },
];

export default function LoginPage() {
  const {
    login,
    isAuthenticated,
    user,
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "fleet@demo.com",
    password: "Demo@123",
  });

  const [error, setError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(
        getRoleHome(user.role.code),
        {
          replace: true,
        }
      );
    }
  }, [
    isAuthenticated,
    user,
    navigate,
  ]);

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

  function selectDemoAccount(email) {
    setForm({
      email,
      password: "Demo@123",
    });

    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const authenticatedUser =
        await login(form);

      const requestedPath =
        location.state?.from;

      navigate(
        requestedPath ||
          getRoleHome(
            authenticatedUser.role.code
          ),
        {
          replace: true,
        }
      );
    } catch (requestError) {
      setError(
        requestError.response?.data
          ?.message ||
          "Unable to log in. Check that the backend is running."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
      <section className="hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold">
            TO
          </div>

          <h1 className="mt-8 max-w-lg text-4xl font-bold leading-tight">
            Complete visibility across
            your transport operations.
          </h1>

          <p className="mt-5 max-w-lg text-lg leading-8 text-slate-300">
            Manage vehicles, drivers,
            trips, maintenance and costs
            from one operational platform.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            "Fleet visibility",
            "Safe dispatching",
            "Maintenance control",
            "Cost analytics",
          ].map((feature) => (
            <div
              key={feature}
              className="rounded-xl border border-slate-800 bg-slate-900 p-4"
            >
              <p className="font-semibold">
                {feature}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center p-5 sm:p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
              TO
            </div>

            <h1 className="mt-4 text-2xl font-bold text-slate-900">
              TransitOps
            </h1>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-2xl font-bold text-slate-900">
              Welcome back
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Sign in to manage transport
              operations.
            </p>

            {error && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Password
                </label>

                <input
                  id="password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting
                  ? "Signing in..."
                  : "Sign in"}
              </button>
            </form>

            <div className="mt-7 border-t border-slate-200 pt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Demo accounts
              </p>

              <div className="grid grid-cols-2 gap-2">
                {demoAccounts.map(
                  (account) => (
                    <button
                      key={account.email}
                      type="button"
                      onClick={() =>
                        selectDemoAccount(
                          account.email
                        )
                      }
                      className="rounded-lg border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                    >
                      {account.label}
                    </button>
                  )
                )}
              </div>

              <p className="mt-3 text-xs text-slate-400">
                Password for all accounts:
                Demo@123
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}