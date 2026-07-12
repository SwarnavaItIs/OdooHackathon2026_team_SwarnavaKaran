export default function PageHeader({
  eyebrow,
  title,
  description,
  action,
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            {eyebrow}
          </p>
        )}

        <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
          {title}
        </h2>

        {description && (
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}