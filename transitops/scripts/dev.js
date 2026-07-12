import { spawn } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const isWindows = process.platform === "win32";
const services = [
    { name: "server", prefix: "server" },
    { name: "client", prefix: "client" },
];
const children = [];
let shuttingDown = false;

function terminate(child) {
    if (!child.pid || child.exitCode !== null) {
        return Promise.resolve();
    }

    if (!isWindows) {
        try {
            process.kill(-child.pid, "SIGTERM");
        } catch {
            child.kill("SIGTERM");
        }

        return Promise.resolve();
    }

    return new Promise((resolve) => {
        const killer = spawn(
            "taskkill",
            ["/pid", String(child.pid), "/t", "/f"],
            { stdio: "ignore", windowsHide: true },
        );

        killer.once("error", resolve);
        killer.once("exit", resolve);
    });
}

async function shutdown(exitCode) {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;
    await Promise.all(children.map(terminate));
    process.exit(exitCode);
}

for (const service of services) {
    const command = isWindows
        ? process.env.ComSpec || "cmd.exe"
        : "npm";
    const args = isWindows
        ? [
              "/d",
              "/s",
              "/c",
              `npm --prefix ${service.prefix} run dev`,
          ]
        : ["--prefix", service.prefix, "run", "dev"];
    const child = spawn(
        command,
        args,
        {
            cwd: projectRoot,
            detached: !isWindows,
            env: process.env,
            stdio: "inherit",
        },
    );

    children.push(child);
    console.log(`[${service.name}] started (PID ${child.pid})`);

    child.once("error", (error) => {
        console.error(`[${service.name}] failed to start: ${error.message}`);
        void shutdown(1);
    });

    child.once("exit", (code, signal) => {
        if (!shuttingDown) {
            const detail = signal ? `signal ${signal}` : `code ${code ?? 1}`;
            console.error(`[${service.name}] stopped (${detail}).`);
            void shutdown(code ?? 1);
        }
    });
}

process.once("SIGINT", () => void shutdown(0));
process.once("SIGTERM", () => void shutdown(0));
