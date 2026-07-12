const styles = {
  AVAILABLE:
    "bg-emerald-100 text-emerald-700",
  ON_TRIP:
    "bg-blue-100 text-blue-700",
  IN_SHOP:
    "bg-amber-100 text-amber-700",
  RETIRED:
    "bg-slate-200 text-slate-700",

  OFF_DUTY:
    "bg-slate-200 text-slate-700",
  SUSPENDED:
    "bg-red-100 text-red-700",

  DRAFT:
    "bg-slate-100 text-slate-700",
  DISPATCHED:
    "bg-blue-100 text-blue-700",
  COMPLETED:
    "bg-emerald-100 text-emerald-700",
  CANCELLED:
    "bg-red-100 text-red-700",

  ACTIVE:
    "bg-amber-100 text-amber-700",
  CLOSED:
    "bg-emerald-100 text-emerald-700",
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
        "bg-slate-100 text-slate-700"
      }`}
    >
      {label || "Unknown"}
    </span>
  );
}