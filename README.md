# TransitOps - Intelligent Fleet & Transport Operations Management Platform

TransitOps is a full-stack transport operations platform that digitizes and automates fleet management for logistics organizations. Instead of relying on spreadsheets, phone calls, and manual record keeping, TransitOps provides a centralized system for managing vehicles, drivers, trips, maintenance, fuel expenses, and operational analytics while automatically enforcing business rules across the platform. The project was developed as part of the Odoo Hackathon challenge. :contentReference[oaicite:0]{index=0}

---

# Problem Statement

Many logistics and transport companies still manage their operations using spreadsheets and manual workflows. This results in:

- Vehicle scheduling conflicts
- Double booking of vehicles and drivers
- Dispatching vehicles that are under maintenance
- Expired driver licenses going unnoticed
- Manual synchronization of trip and vehicle status
- Scattered fuel and expense records
- Poor visibility into fleet utilization and operational costs

These issues increase operational costs, introduce human errors, and make it difficult for organizations to efficiently manage their fleet. :contentReference[oaicite:1]{index=1}

---

# Our Solution

TransitOps provides a centralized transport operations platform where all departments work on synchronized real-time data.

Instead of allowing users to manually update multiple records independently, the backend automatically enforces business rules and maintains consistency across the system.

For example:

### Trip Dispatch

When a trip is dispatched, the system automatically:

- Changes trip status to **Dispatched**
- Marks the assigned vehicle as **On Trip**
- Marks the assigned driver as **On Trip**
- Removes both vehicle and driver from future dispatch selections

### Trip Completion

When a trip is completed:

- Vehicle status automatically changes back to **Available**
- Driver status automatically changes back to **Available**
- Operational statistics are updated

### Maintenance Workflow

When maintenance starts:

- Vehicle status changes to **In Shop**
- Vehicle becomes unavailable for dispatch

When maintenance closes:

- Vehicle automatically returns to **Available**
- Vehicle becomes eligible for future trips

This automated workflow eliminates inconsistent data, prevents operational conflicts, and significantly reduces manual intervention.

---

# Features

## Authentication & Role Based Access Control

- Secure Email & Password Authentication
- JWT Authentication
- Password Hashing
- Role-Based Access Control (RBAC)

Supported Roles:

- Fleet Manager
- Driver
- Safety Officer
- Financial Analyst

---

## Vehicle Management

Manage complete fleet information including:

- Registration Number
- Vehicle Model
- Vehicle Type
- Maximum Load Capacity
- Acquisition Cost
- Odometer
- Current Status

Business validations ensure:

- Unique vehicle registration
- Retired vehicles cannot be dispatched
- Vehicles under maintenance cannot be assigned to trips

---

## Driver Management

Maintain driver information including:

- License Details
- License Expiry
- Safety Score
- Contact Information
- Operational Status

Backend validations prevent dispatch if:

- License has expired
- Driver is suspended
- Driver is already on another trip

---

## Trip Management

Trip lifecycle:

```
Draft
   ↓
Dispatched
   ↓
Completed

or

Cancelled
```

Each transition automatically updates related resources across the platform.

---

## 🔧 Maintenance Management

Track vehicle maintenance records with:

- Maintenance Type
- Description
- Cost
- Status
- Start & Close Time

Automatic status transitions ensure vehicles undergoing maintenance are never available for dispatch.

---

## Fuel & Expense Management

Track:

- Fuel Logs
- Toll Charges
- Repairs
- Parking
- Insurance
- Maintenance Expenses
- Other Operational Costs

All expenses are linked to vehicles or trips for accurate cost analysis.

---

## Reports & Analytics

TransitOps converts operational data into actionable business insights.

Automatically generated analytics include:

- Fleet Utilization
- Fuel Efficiency
- Operational Cost
- Vehicle ROI
- Active Trips
- Available Vehicles
- Vehicles in Maintenance

Supports:

- Search
- Filters
- Sorting
- CSV Export
- Authenticated PDF Export

---

# Intelligent Business Rule Engine

TransitOps goes beyond traditional CRUD applications by enforcing operational constraints directly on the backend.

Examples include:

- Vehicle registration numbers must be unique.
- Cargo weight cannot exceed vehicle capacity.
- Vehicles under maintenance cannot be dispatched.
- Drivers with expired licenses cannot be assigned.
- Drivers or vehicles already on a trip cannot be reassigned.
- Dispatch automatically synchronizes trip, vehicle, and driver states.
- Completing or cancelling a trip restores resource availability.
- Database constraints prevent double booking even under concurrent requests.

These validations ensure data consistency and eliminate operational conflicts. :contentReference[oaicite:2]{index=2}

---

# Tech Stack

### Frontend

- React
- React Router
- Axios
- Tailwind CSS

### Backend

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JWT Authentication
- bcrypt
- Zod Validation

### Database

- PostgreSQL
- Prisma ORM
- ACID Transactions
- Normalized Relational Schema
- Foreign Keys
- Partial Unique Indexes

---

# System Architecture

```
React Frontend
        │
        ▼
REST APIs
        │
        ▼
Express.js Backend
        │
Business Rule Engine
        │
        ▼
Prisma ORM
        │
        ▼
PostgreSQL Database
```

---

---

# API: Vehicle Report PDF Export

`GET /api/reports/vehicles/pdf`

Authentication is required. Only `FLEET_MANAGER` and `FINANCIAL_ANALYST` may download this financial report; `DRIVER` and `SAFETY_OFFICER` are denied by RBAC.

Supported query parameters match the existing vehicle report endpoint:

- `search`
- `type`
- `region`
- `status`
- `sortBy`
- `sortOrder`

Example filename:

```text
transitops-vehicle-report-2026-07-12.pdf
```

The PDF includes a generated-by header, applied filters, executive summary, top-5 fuel efficiency and operational-cost bar visuals, paginated detailed vehicle table, formulas, disclaimer, and page footers.

---

# Bonus Features

- CSV export for vehicle performance analytics
- Server-side authenticated PDF export for Vehicle Performance Reports
# Team

| Name | Role |
|------|------|
| **Swarnava Karan** | Team Leader |
| **Aman Tudu** | Developer |

---

# Why TransitOps?

TransitOps is not just a fleet management system—it is an intelligent transport operations platform.

Every operational event—dispatching a trip, completing a delivery, logging fuel, recording maintenance, or generating reports—triggers automated backend validations and synchronized state transitions across multiple entities.

By combining operational automation with business analytics, TransitOps enables logistics organizations to improve fleet utilization, reduce manual effort, eliminate scheduling conflicts, and make data-driven operational decisions.