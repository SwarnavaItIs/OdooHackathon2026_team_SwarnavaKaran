export default function ModulePlaceholder({
  title,
  description,
}) {
  return (
    <div>
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {title}
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {description}
        </p>
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="font-semibold text-slate-700">
          {title} UI is ready to be
          connected.
        </p>
      </div>
    </div>
  );
}