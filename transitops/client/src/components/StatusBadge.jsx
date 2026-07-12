const styles = {
  AVAILABLE:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  ON_TRIP:
    "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  IN_SHOP:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  RETIRED:
    "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",

  OFF_DUTY:
    "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  SUSPENDED:
    "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",

  DRAFT:
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  DISPATCHED:
    "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  COMPLETED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  CANCELLED:
    "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300",

  ACTIVE:
    "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  CLOSED:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
};

export default function StatusBadge({
  status,
}) {
  const label = status
    ?.replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[status] ||
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
      }`}
    >
      {label || "Unknown"}
    </span>
  );
}