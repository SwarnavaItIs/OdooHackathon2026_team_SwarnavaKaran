const API_BASE_URL =
    process.env.API_BASE_URL ||
    "http://localhost:5000/api";

const EMAIL =
    process.env.SMOKE_EMAIL ||
    "fleet@demo.com";

const PASSWORD =
    process.env.SMOKE_PASSWORD ||
    "Demo@123";

let passed = 0;
let failed = 0;

function printResult(success, name, detail = "") {
    if (success) {
        passed += 1;

        console.log(
            `✓ ${name}${detail ? ` — ${detail}` : ""}`
        );
    } else {
        failed += 1;

        console.error(
            `✗ ${name}${detail ? ` — ${detail}` : ""}`
        );
    }
}

async function request(
    path,
    {
        method = "GET",
        token,
        body,
    } = {}
) {
    const response = await fetch(
        `${API_BASE_URL}${path}`,
        {
            method,

            headers: {
                "Content-Type":
                    "application/json",

                ...(token
                    ? {
                        Authorization:
                            `Bearer ${token}`,
                    }
                    : {}),
            },

            ...(body
                ? {
                    body: JSON.stringify(body),
                }
                : {}),
        }
    );

    const contentType =
        response.headers.get(
            "content-type"
        ) || "";

    const data =
        contentType.includes(
            "application/json"
        )
            ? await response.json()
            : await response.text();

    return {
        response,
        data,
    };
}

async function checkEndpoint(
    name,
    path,
    token,
    validator = () => true
) {
    try {
        const {
            response,
            data,
        } = await request(path, {
            token,
        });

        const success =
            response.ok && validator(data);

        printResult(
            success,
            name,
            `HTTP ${response.status}`
        );

        if (!success) {
            console.error(data);
        }
    } catch (error) {
        printResult(
            false,
            name,
            error.message
        );
    }
}

async function main() {
    console.log(
        `Testing ${API_BASE_URL}\n`
    );

    await checkEndpoint(
        "Health endpoint",
        "/health",
        undefined,
        (data) =>
            data.success === true
    );

    let token;

    try {
        const {
            response,
            data,
        } = await request(
            "/auth/login",
            {
                method: "POST",
                body: {
                    email: EMAIL,
                    password: PASSWORD,
                },
            }
        );

        token = data.token;

        printResult(
            response.ok &&
            Boolean(token),
            "Fleet Manager login",
            `HTTP ${response.status}`
        );
    } catch (error) {
        printResult(
            false,
            "Fleet Manager login",
            error.message
        );
    }

    if (!token) {
        throw new Error(
            "Authentication failed; remaining checks cannot run"
        );
    }

    await checkEndpoint(
        "Current user",
        "/auth/me",
        token,
        (data) =>
            data.user?.role?.code ===
            "FLEET_MANAGER"
    );

    await checkEndpoint(
        "Dashboard",
        "/dashboard",
        token,
        (data) =>
            Boolean(data.kpis)
    );

    await checkEndpoint(
        "Vehicle registry",
        "/vehicles",
        token,
        (data) =>
            Array.isArray(data.vehicles)
    );

    await checkEndpoint(
        "Driver registry",
        "/drivers",
        token,
        (data) =>
            Array.isArray(data.drivers)
    );

    await checkEndpoint(
        "Trip registry",
        "/trips",
        token,
        (data) =>
            Array.isArray(data.trips)
    );

    await checkEndpoint(
        "Dispatch options",
        "/trips/dispatch-options",
        token,
        (data) =>
            Array.isArray(data.vehicles) &&
            Array.isArray(data.drivers)
    );

    await checkEndpoint(
        "Maintenance logs",
        "/maintenance",
        token,
        (data) =>
            Array.isArray(
                data.maintenanceRecords
            )
    );

    await checkEndpoint(
        "Fuel logs",
        "/costs/fuel",
        token,
        (data) =>
            Array.isArray(data.fuelLogs)
    );

    await checkEndpoint(
        "Expense logs",
        "/costs/expenses",
        token,
        (data) =>
            Array.isArray(data.expenses)
    );

    await checkEndpoint(
        "Vehicle reports",
        "/reports/vehicles",
        token,
        (data) =>
            Array.isArray(data.vehicles)
    );

    console.log("");
    console.log(
        `Passed: ${passed}`
    );

    console.log(
        `Failed: ${failed}`
    );

    if (failed > 0) {
        process.exitCode = 1;
    }
}

main().catch((error) => {
    console.error(
        `\nSmoke test stopped: ${error.message}`
    );

    process.exitCode = 1;
});