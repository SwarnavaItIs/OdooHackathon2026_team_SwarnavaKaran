import {
  Link,
} from "react-router-dom";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-xl font-bold text-red-700">
          403
        </div>

        <h2 className="mt-5 text-2xl font-bold text-slate-900">
          Access denied
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Your role does not have
          permission to open this module.
        </p>

        <Link
          to="/dashboard"
          className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Return to dashboard
        </Link>
      </div>
    </div>
  );
}