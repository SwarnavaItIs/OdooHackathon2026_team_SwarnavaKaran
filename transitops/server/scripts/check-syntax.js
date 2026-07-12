import { readdirSync } from "node:fs";
import { extname, join } from "node:path";
import { spawnSync } from "node:child_process";

const roots = ["src", "prisma", "scripts"];
const files = [];

function collectJavaScriptFiles(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);

        if (entry.isDirectory()) {
            if (entry.name !== "migrations") {
                collectJavaScriptFiles(path);
            }
        } else if (extname(entry.name) === ".js") {
            files.push(path);
        }
    }
}

for (const root of roots) {
    collectJavaScriptFiles(root);
}

for (const file of files) {
    const result = spawnSync(process.execPath, ["--check", file], {
        encoding: "utf8",
    });

    if (result.error) {
        console.error(`Could not check ${file}: ${result.error.message}`);
        process.exit(1);
    }

    if (result.status !== 0) {
        process.stderr.write(
            result.stderr || result.stdout || `Syntax check failed: ${file}\n`,
        );
        process.exit(result.status || 1);
    }
}

console.log(`Syntax check passed for ${files.length} JavaScript files.`);
