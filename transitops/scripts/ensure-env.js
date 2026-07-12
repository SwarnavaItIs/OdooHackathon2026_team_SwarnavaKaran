import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const environmentFiles = [
    ["server/.env.example", "server/.env"],
    ["client/.env.example", "client/.env"],
];

for (const [example, destination] of environmentFiles) {
    const sourcePath = join(projectRoot, example);
    const destinationPath = join(projectRoot, destination);

    if (existsSync(destinationPath)) {
        console.log(`Keeping existing ${destination}.`);
        continue;
    }

    if (!existsSync(sourcePath)) {
        throw new Error(`Missing environment template: ${example}`);
    }

    copyFileSync(sourcePath, destinationPath);
    console.log(`Created ${destination} from ${example}.`);
}
