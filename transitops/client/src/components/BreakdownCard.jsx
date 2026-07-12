const barStyles = {
  AVAILABLE: "bg-emerald-500",
  ON_TRIP: "bg-blue-500",
  IN_SHOP: "bg-amber-500",
  RETIRED: "bg-slate-500",

  DRAFT: "bg-slate-400",
  DISPATCHED: "bg-blue-500",
  COMPLETED: "bg-emerald-500",
  CANCELLED: "bg-red-500",
};

function formatLabel(value) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

export default function BreakdownCard({
  title,
  description,
  data,
}) {
  const entries = Object.entries(
    data || {}
  );

  const total = entries.reduce(
    (sum, [, value]) =>
      sum + Number(value || 0),
    0
  );

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h3 className="font-bold text-slate-900">
          {title}
        </h3>

        {description && (
          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        )}
      </div>

      <div className="mt-6 space-y-5">
        {entries.map(([label, value]) => {
          const numericValue =
            Number(value || 0);

          const percentage =
            total > 0
              ? (numericValue / total) * 100
              : 0;

          return (
            <div key={label}>
              <div className="mb-2 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      barStyles[label] ||
                      "bg-slate-400"
                    }`}
                  />

                  <span className="text-sm font-medium text-slate-700">
                    {formatLabel(label)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold text-slate-900">
                    {numericValue}
                  </span>

                  <span className="ml-2 text-xs text-slate-400">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    barStyles[label] ||
                    "bg-slate-400"
                  }`}
                  style={{
                    width: `${percentage}%`,
                  }}
                />
              </div>
            </div>
          );
        })}

        {entries.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">
            No data available.
          </p>
        )}
      </div>

      <div className="mt-6 border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500">
          Total records:{" "}
          <span className="font-bold text-slate-700">
            {total}
          </span>
        </p>
      </div>
    </article>
  );
}