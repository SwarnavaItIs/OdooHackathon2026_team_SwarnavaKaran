import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const roles = [
    {
        code: "FLEET_MANAGER",
        name: "Fleet Manager",
    },
    {
        code: "DRIVER",
        name: "Driver",
    },
    {
        code: "SAFETY_OFFICER",
        name: "Safety Officer",
    },
    {
        code: "FINANCIAL_ANALYST",
        name: "Financial Analyst",
    },
];

const demoUsers = [
    {
        name: "Demo Fleet Manager",
        email: "fleet@demo.com",
        roleCode: "FLEET_MANAGER",
    },
    {
        name: "Demo Driver",
        email: "driver@demo.com",
        roleCode: "DRIVER",
    },
    {
        name: "Demo Safety Officer",
        email: "safety@demo.com",
        roleCode: "SAFETY_OFFICER",
    },
    {
        name: "Demo Financial Analyst",
        email: "finance@demo.com",
        roleCode: "FINANCIAL_ANALYST",
    },
];

async function main() {
    const roleMap = {};

    for (const role of roles) {
        const savedRole = await prisma.role.upsert({
            where: {
                code: role.code,
            },
            update: {
                name: role.name,
            },
            create: role,
        });

        roleMap[role.code] = savedRole;
    }

    const passwordHash = await bcrypt.hash("Demo@123", 10);

    for (const user of demoUsers) {
        await prisma.user.upsert({
            where: {
                email: user.email,
            },
            update: {
                name: user.name,
                passwordHash,
                roleId: roleMap[user.roleCode].id,
                isActive: true,
            },
            create: {
                name: user.name,
                email: user.email,
                passwordHash,
                roleId: roleMap[user.roleCode].id,
            },
        });
    }

    console.log("Database seeded successfully");
    console.log("Demo password: Demo@123");
}

main()
    .catch((error) => {
        console.error("Seed failed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });