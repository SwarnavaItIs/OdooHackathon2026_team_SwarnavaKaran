const variants = {
  blue: {
    container:
      "border-blue-100 bg-blue-50",
    icon:
      "bg-blue-100 text-blue-700",
  },

  emerald: {
    container:
      "border-emerald-100 bg-emerald-50",
    icon:
      "bg-emerald-100 text-emerald-700",
  },

  amber: {
    container:
      "border-amber-100 bg-amber-50",
    icon:
      "bg-amber-100 text-amber-700",
  },

  violet: {
    container:
      "border-violet-100 bg-violet-50",
    icon:
      "bg-violet-100 text-violet-700",
  },

  rose: {
    container:
      "border-rose-100 bg-rose-50",
    icon:
      "bg-rose-100 text-rose-700",
  },

  cyan: {
    container:
      "border-cyan-100 bg-cyan-50",
    icon:
      "bg-cyan-100 text-cyan-700",
  },

  slate: {
    container:
      "border-slate-200 bg-white",
    icon:
      "bg-slate-100 text-slate-700",
  },
};

export default function KpiCard({
  title,
  value,
  symbol,
  variant = "slate",
  suffix = "",
  helper,
}) {
  const style =
    variants[variant] || variants.slate;

  return (
    <article
      className={`rounded-xl border p-5 shadow-sm ${style.container}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">
            {title}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            {value}
            {suffix && (
              <span className="ml-1 text-lg font-semibold text-slate-500">
                {suffix}
              </span>
            )}
          </p>

          {helper && (
            <p className="mt-2 text-xs text-slate-500">
              {helper}
            </p>
          )}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${style.icon}`}
        >
          {symbol}
        </div>
      </div>
    </article>
  );
}