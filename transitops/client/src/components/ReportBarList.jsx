function formatNumber(value) {
    return new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2,
    }).format(Number(value || 0));
}

export default function ReportBarList({
    title,
    description,
    rows,
    metric,
    suffix = "",
    currency = false,
}) {
    const sortedRows = [...rows]
        .sort(
            (first, second) =>
                Number(second[metric] || 0) -
                Number(first[metric] || 0)
        )
        .slice(0, 5);

    const maximumValue = Math.max(
        ...sortedRows.map((row) =>
            Number(row[metric] || 0)
        ),
        0
    );

    function formatValue(value) {
        if (currency) {
            return new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 0,
            }).format(Number(value || 0));
        }

        return `${formatNumber(value)}${suffix}`;
    }

    return (
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
                <h3 className="font-bold text-slate-900">
                    {title}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                    {description}
                </p>
            </div>

            <div className="mt-6 space-y-5">
                {sortedRows.map((row) => {
                    const value = Number(
                        row[metric] || 0
                    );

                    const percentage =
                        maximumValue > 0
                            ? (value / maximumValue) * 100
                            : 0;

                    return (
                        <div key={row.vehicleId}>
                            <div className="mb-2 flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">
                                        {row.registrationNumber}
                                    </p>

                                    <p className="mt-0.5 text-xs text-slate-500">
                                        {row.vehicleName}
                                    </p>
                                </div>

                                <span className="text-sm font-bold text-slate-900">
                                    {formatValue(value)}
                                </span>
                            </div>

                            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className="h-full rounded-full bg-blue-600 transition-all duration-500"
                                    style={{
                                        width: `${percentage}%`,
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}

                {sortedRows.length === 0 && (
                    <div className="py-12 text-center text-sm text-slate-500">
                        No report data available.
                    </div>
                )}
            </div>
        </article>
    );
}