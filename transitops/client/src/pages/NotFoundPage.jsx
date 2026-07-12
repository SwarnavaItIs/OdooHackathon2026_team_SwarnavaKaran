import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="text-center">
        <p className="text-6xl font-bold text-blue-600">
          404
        </p>

        <h1 className="mt-4 text-2xl font-bold text-slate-900">
          Page not found
        </h1>

        <p className="mt-2 text-slate-500">
          The requested TransitOps page
          does not exist.
        </p>

        <Link
          to="/dashboard"
          className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}