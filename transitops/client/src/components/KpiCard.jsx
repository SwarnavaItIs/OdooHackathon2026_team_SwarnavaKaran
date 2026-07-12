const variants = {
  blue: {
    container:
      "border-blue-100 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/30",
    icon:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300",
  },

  emerald: {
    container:
      "border-emerald-100 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30",
    icon:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
  },

  amber: {
    container:
      "border-amber-100 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/30",
    icon:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
  },

  violet: {
    container:
      "border-violet-100 bg-violet-50 dark:border-violet-900/50 dark:bg-violet-950/30",
    icon:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300",
  },

  rose: {
    container:
      "border-rose-100 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30",
    icon:
      "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300",
  },

  cyan: {
    container:
      "border-cyan-100 bg-cyan-50 dark:border-cyan-900/50 dark:bg-cyan-950/30",
    icon:
      "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-300",
  },

  slate: {
    container:
      "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
    icon:
      "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
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
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {title}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
            {value}
            {suffix && (
              <span className="ml-1 text-lg font-semibold text-slate-500 dark:text-slate-400">
                {suffix}
              </span>
            )}
          </p>

          {helper && (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
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