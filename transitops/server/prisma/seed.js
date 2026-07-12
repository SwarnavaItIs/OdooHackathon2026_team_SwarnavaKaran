import bcrypt from "bcryptjs";

import prisma from "../src/config/prisma.js";

const DEMO_PASSWORD = "Demo@123";

const FIXTURE_IDS = {
    completedTrip: "10000000-0000-4000-8000-000000000001",
    draftTrip: "10000000-0000-4000-8000-000000000002",
    dispatchedTrip: "10000000-0000-4000-8000-000000000003",
    completedTripFuel: "20000000-0000-4000-8000-000000000001",
    completedTripToll: "30000000-0000-4000-8000-000000000001",
    insuranceExpense: "30000000-0000-4000-8000-000000000002",
    activeMaintenance: "40000000-0000-4000-8000-000000000001",
    historicalMaintenance: "40000000-0000-4000-8000-000000000002",
};

function daysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
}

function daysFromNow(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
}

async function seedRoles(tx) {
    const roleData = [
        { code: "FLEET_MANAGER", name: "Fleet Manager" },
        { code: "DRIVER", name: "Driver" },
        { code: "SAFETY_OFFICER", name: "Safety Officer" },
        { code: "FINANCIAL_ANALYST", name: "Financial Analyst" },
    ];
    const roles = {};

    for (const role of roleData) {
        roles[role.code] = await tx.role.upsert({
            where: { code: role.code },
            update: { name: role.name },
            create: role,
        });
    }

    return roles;
}

async function seedUsers(tx, roles, passwordHash) {
    const userData = [
        {
            key: "fleet",
            name: "Ananya Sharma",
            email: "fleet@demo.com",
            roleId: roles.FLEET_MANAGER.id,
        },
        {
            key: "driver",
            name: "Operational Driver",
            email: "driver@demo.com",
            roleId: roles.DRIVER.id,
        },
        {
            key: "safety",
            name: "Rohan Safety",
            email: "safety@demo.com",
            roleId: roles.SAFETY_OFFICER.id,
        },
        {
            key: "finance",
            name: "Meera Finance",
            email: "finance@demo.com",
            roleId: roles.FINANCIAL_ANALYST.id,
        },
    ];
    const users = {};

    for (const user of userData) {
        const data = {
            name: user.name,
            passwordHash,
            roleId: user.roleId,
            isActive: true,
        };

        users[user.key] = await tx.user.upsert({
            where: { email: user.email },
            update: data,
            create: { ...data, email: user.email },
        });
    }

    return users;
}

async function seedVehicles(tx) {
    const vehicleData = [
        {
            key: "van05",
            registrationNumber: "WB-01-VAN-05",
            name: "Van-05",
            model: "Tata Ace",
            type: "Van",
            region: "Kolkata",
            maxLoadKg: 500,
            odometerKm: 12780,
            acquisitionCost: 850000,
            status: "AVAILABLE",
        },
        {
            key: "truck12",
            registrationNumber: "WB-02-TRUCK-12",
            name: "Truck-12",
            model: "Tata 1109",
            type: "Truck",
            region: "Howrah",
            maxLoadKg: 6000,
            odometerKm: 48500,
            acquisitionCost: 2450000,
            status: "IN_SHOP",
        },
        {
            key: "mini08",
            registrationNumber: "WB-03-MINI-08",
            name: "Mini-08",
            model: "Mahindra Supro",
            type: "Mini Truck",
            region: "Kolkata",
            maxLoadKg: 1200,
            odometerKm: 22500,
            acquisitionCost: 1100000,
            status: "ON_TRIP",
        },
        {
            key: "retired01",
            registrationNumber: "WB-04-OLD-01",
            name: "Legacy Truck",
            model: "Tata 407",
            type: "Truck",
            region: "Durgapur",
            maxLoadKg: 3500,
            odometerKm: 178000,
            acquisitionCost: 900000,
            status: "RETIRED",
        },
    ];
    const vehicles = {};

    for (const vehicle of vehicleData) {
        const { key, status, odometerKm, ...identity } = vehicle;

        vehicles[key] = await tx.vehicle.upsert({
            where: { registrationNumber: identity.registrationNumber },
            update: identity,
            create: { ...identity, status, odometerKm },
        });
    }

    return vehicles;
}

async function seedDrivers(tx) {
    const driverData = [
        {
            key: "alex",
            name: "Alex Roy",
            licenseNumber: "WB-DL-1001",
            licenseCategory: "LMV",
            licenseExpiry: daysFromNow(800),
            contactNumber: "9876543210",
            safetyScore: 92,
            status: "AVAILABLE",
            region: "Kolkata",
        },
        {
            key: "priya",
            name: "Priya Das",
            licenseNumber: "WB-DL-1002",
            licenseCategory: "HMV",
            licenseExpiry: daysFromNow(600),
            contactNumber: "9876543211",
            safetyScore: 88,
            status: "ON_TRIP",
            region: "Kolkata",
        },
        {
            key: "bob",
            name: "Bob Sen",
            licenseNumber: "WB-DL-1003",
            licenseCategory: "LMV",
            licenseExpiry: daysAgo(180),
            contactNumber: "9876543212",
            safetyScore: 74,
            status: "OFF_DUTY",
            region: "Howrah",
        },
        {
            key: "sam",
            name: "Sam Ghosh",
            licenseNumber: "WB-DL-1004",
            licenseCategory: "HMV",
            licenseExpiry: daysFromNow(400),
            contactNumber: "9876543213",
            safetyScore: 55,
            status: "SUSPENDED",
            region: "Durgapur",
        },
    ];
    const drivers = {};

    for (const driver of driverData) {
        const { key, status, ...identity } = driver;

        drivers[key] = await tx.driver.upsert({
            where: { licenseNumber: identity.licenseNumber },
            update: identity,
            create: { ...identity, status },
        });
    }

    return drivers;
}

async function findOrCreate(model, where, data) {
    const existing = await model.findFirst({ where });
    return existing || model.create({ data });
}

async function seedOperations(tx, users, vehicles, drivers, notes) {
    const completedTrip = await findOrCreate(
        tx.trip,
        {
            source: "Kolkata",
            destination: "Howrah",
            vehicleId: vehicles.van05.id,
            driverId: drivers.alex.id,
            createdById: users.fleet.id,
        },
        {
            id: FIXTURE_IDS.completedTrip,
            source: "Kolkata",
            destination: "Howrah",
            vehicleId: vehicles.van05.id,
            driverId: drivers.alex.id,
            cargoWeightKg: 450,
            plannedDistanceKm: 25,
            actualDistanceKm: 30,
            startOdometerKm: 12750,
            finalOdometerKm: 12780,
            revenue: 12000,
            status: "COMPLETED",
            dispatchedAt: daysAgo(4),
            completedAt: daysAgo(4),
            createdAt: daysAgo(5),
            createdById: users.fleet.id,
        },
    );

    await findOrCreate(
        tx.fuelLog,
        {
            tripId: completedTrip.id,
            vehicleId: vehicles.van05.id,
            createdById: users.fleet.id,
            liters: 4.5,
            totalCost: 480,
        },
        {
            id: FIXTURE_IDS.completedTripFuel,
            vehicleId: vehicles.van05.id,
            tripId: completedTrip.id,
            liters: 4.5,
            totalCost: 480,
            odometerKm: 12780,
            loggedAt: daysAgo(4),
            createdById: users.fleet.id,
        },
    );

    await findOrCreate(
        tx.expense,
        {
            tripId: completedTrip.id,
            vehicleId: vehicles.van05.id,
            createdById: users.finance.id,
            description: "Howrah bridge toll",
        },
        {
            id: FIXTURE_IDS.completedTripToll,
            vehicleId: vehicles.van05.id,
            tripId: completedTrip.id,
            category: "TOLL",
            description: "Howrah bridge toll",
            amount: 180,
            expenseDate: daysAgo(4),
            createdById: users.finance.id,
        },
    );

    await findOrCreate(
        tx.trip,
        {
            source: "Kolkata",
            destination: "Salt Lake",
            vehicleId: vehicles.van05.id,
            driverId: drivers.alex.id,
            createdById: users.fleet.id,
        },
        {
            id: FIXTURE_IDS.draftTrip,
            source: "Kolkata",
            destination: "Salt Lake",
            vehicleId: vehicles.van05.id,
            driverId: drivers.alex.id,
            cargoWeightKg: 300,
            plannedDistanceKm: 18,
            revenue: 8000,
            status: "DRAFT",
            createdById: users.fleet.id,
        },
    );

    const dispatchedFixture = await tx.trip.findFirst({
        where: {
            source: "Kolkata",
            destination: "Durgapur",
            vehicleId: vehicles.mini08.id,
            driverId: drivers.priya.id,
            createdById: users.driver.id,
        },
    });

    if (!dispatchedFixture) {
        const dispatchConflict = await tx.trip.findFirst({
            where: {
                status: "DISPATCHED",
                OR: [
                    { vehicleId: vehicles.mini08.id },
                    { driverId: drivers.priya.id },
                ],
            },
        });

        if (dispatchConflict) {
            notes.push(
                "Skipped the sample dispatched trip because its demo vehicle or driver is already assigned.",
            );
        } else {
            await tx.trip.create({
                data: {
                    id: FIXTURE_IDS.dispatchedTrip,
                    source: "Kolkata",
                    destination: "Durgapur",
                    vehicleId: vehicles.mini08.id,
                    driverId: drivers.priya.id,
                    cargoWeightKg: 900,
                    plannedDistanceKm: 165,
                    startOdometerKm: 22500,
                    revenue: 28000,
                    status: "DISPATCHED",
                    dispatchedAt: daysAgo(1),
                    createdAt: daysAgo(2),
                    createdById: users.driver.id,
                },
            });
        }
    }

    const activeMaintenance = await tx.maintenanceLog.findFirst({
        where: {
            vehicleId: vehicles.truck12.id,
            maintenanceType: "Brake Inspection",
            createdById: users.fleet.id,
        },
    });

    if (!activeMaintenance) {
        const maintenanceConflict = await tx.maintenanceLog.findFirst({
            where: {
                vehicleId: vehicles.truck12.id,
                status: "ACTIVE",
            },
        });

        if (maintenanceConflict) {
            notes.push(
                "Skipped the sample maintenance record because the demo truck already has active maintenance.",
            );
        } else {
            await tx.maintenanceLog.create({
                data: {
                    id: FIXTURE_IDS.activeMaintenance,
                    vehicleId: vehicles.truck12.id,
                    maintenanceType: "Brake Inspection",
                    description:
                        "Brake pads, fluid and hydraulic system inspection",
                    cost: 6500,
                    status: "ACTIVE",
                    startedAt: daysAgo(2),
                    createdById: users.fleet.id,
                },
            });
        }
    }

    await findOrCreate(
        tx.maintenanceLog,
        {
            vehicleId: vehicles.van05.id,
            maintenanceType: "Oil Change",
            createdById: users.fleet.id,
        },
        {
            id: FIXTURE_IDS.historicalMaintenance,
            vehicleId: vehicles.van05.id,
            maintenanceType: "Oil Change",
            description: "Engine oil, oil filter and air filter replaced",
            cost: 4200,
            status: "CLOSED",
            startedAt: daysAgo(30),
            closedAt: daysAgo(29),
            createdById: users.fleet.id,
        },
    );

    await findOrCreate(
        tx.expense,
        {
            vehicleId: vehicles.van05.id,
            tripId: null,
            createdById: users.finance.id,
            description: "Commercial vehicle insurance allocation",
        },
        {
            id: FIXTURE_IDS.insuranceExpense,
            vehicleId: vehicles.van05.id,
            category: "INSURANCE",
            description: "Commercial vehicle insurance allocation",
            amount: 18000,
            expenseDate: daysAgo(20),
            createdById: users.finance.id,
        },
    );
}

async function main() {
    console.log("Seeding TransitOps demo data...");

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
    const notes = [];

    await prisma.$transaction(
        async (tx) => {
            const roles = await seedRoles(tx);
            const users = await seedUsers(tx, roles, passwordHash);
            const vehicles = await seedVehicles(tx);
            const drivers = await seedDrivers(tx);

            await seedOperations(tx, users, vehicles, drivers, notes);
        },
        { timeout: 30000 },
    );

    console.log("TransitOps demo data is ready.");

    for (const note of notes) {
        console.log(`Note: ${note}`);
    }

    console.log("Demo accounts (password: Demo@123):");
    console.log("  fleet@demo.com");
    console.log("  driver@demo.com");
    console.log("  safety@demo.com");
    console.log("  finance@demo.com");
}

main()
    .catch((error) => {
        console.error("Demo seeding failed:");
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
