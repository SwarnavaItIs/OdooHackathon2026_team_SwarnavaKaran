export default function FullPageLoader({
  text = "Loading TransitOps...",
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center bg-slate-50"
    >
      <div className="text-center">
        <div
          aria-hidden="true"
          className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"
        />

        <p className="mt-4 text-sm font-medium text-slate-600">
          {text}
        </p>
      </div>
    </div>
  );
}
