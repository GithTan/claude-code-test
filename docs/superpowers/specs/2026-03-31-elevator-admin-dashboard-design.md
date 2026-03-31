# Elevator Company Admin Dashboard — Design Spec
**Date:** 2026-03-31
**Status:** Approved — ready for implementation planning

---

## Business Context

- **Company:** Elevator installation and maintenance company, Manila, Philippines
- **Language:** English only (no Tagalog)
- **Currency:** PHP (Philippine Peso)
- **Scale:** 20 field technicians, ~100 customer buildings
- **Current state:** Managed via Excel, paper, WhatsApp, and memory — things are falling through the cracks
- **Biggest pain points:** (1) Billing/payment tracking, (2) Maintenance scheduling

---

## Project Scope: Phase 1 — Admin Dashboard Only

This spec covers Phase 1 only. Later phases will add:
- Phase 2: Technician mobile app (GPS, job list, photo upload, signatures)
- Phase 3: Customer app (live tracking, invoice viewing, emergency button)

---

## Users & Roles

Two roles with different access levels:

| Role | Access |
|---|---|
| **Admin (BDM/Owner)** | Full access to all modules including finances |
| **Operations Manager** | Buildings, Elevators, Maintenance Schedule, Jobs, Operational Reports only — NO access to Invoices, Payments, or Financial Reports |

The system supports multiple simultaneous users (cloud-based, real-time sync).

---

## Five Core Modules

### 1. Customers & Buildings
- Manage customer accounts (company name, contact person, contact details)
- Each customer can have multiple buildings
- Each building has an address and can have multiple elevator units

### 2. Elevators
- Each elevator belongs to a building
- Elevator details: unit number, brand, model, serial number, type, floor count
- Status: Active, Under Warranty, Under Free Maintenance, Inactive
- Turnover date recorded → system auto-calculates:
  - **Warranty expiry** = turnover date + 1 year (always fixed)
  - **Free maintenance end** = turnover date + 1 year (always fixed)
- Automated reminders to Admin at 6 months, 3 months, and 1 month before warranty/free maintenance expiry

### 3. Maintenance Schedule
- Each elevator has a maintenance schedule
- Visit types:
  - **Scheduled:** Monthly, Quarterly, or Annual — system auto-generates next due date after each completed visit
  - **Ad-hoc PM:** On-demand, logged manually when client calls
- Overdue visits shown in red on dashboard home

### 4. Jobs
- A Job is created when a maintenance visit is assigned to a technician
- Job fields: elevator, visit type, scheduled date, assigned technician, status, completion notes
- Status flow: Scheduled → In Progress → Completed
- Accessible by both Admin and Operations Manager

### 5. Invoices & Payments (Admin only)

**Two invoice types:**

**A. Maintenance Invoice**
- Generated from a completed job or a recurring maintenance contract
- Line items: service description, amount

**B. Installation Project Invoice (milestone-based)**
- Created per new elevator installation project
- Custom payment schedule defined per contract (case-by-case)
- Two billing categories per project:
  - Equipment / Importation costs
  - Installation / Locally Supplied Materials
- Each milestone has: description, amount, status (Unbilled → Billed → Paid)
- Example milestones:
  - 30% Total Import and Equipment Value upon order
  - 50% Total Import and Equipment Value before shipment
  - 20% Total Import and Equipment Value upon arrival to site
  - 50% Down payment (installation)
  - 40% Progress Billing (installation)
  - 10% After installation and commissioning within 10 working days

**Payment tracking:**
- Partial payments allowed
- Cheque and bank transfer both supported
- Outstanding balance visible per invoice and per customer

---

## Reports

Split by role:

| Report | Ops Manager | Admin |
|---|---|---|
| Overdue maintenance visits | Yes | Yes |
| Jobs completed this month | Yes | Yes |
| Technician activity summary | Yes | Yes |
| Elevator status overview | Yes | Yes |
| Unpaid invoices / outstanding balances | No | Yes |
| Cash flow summary | No | Yes |
| Payment history | No | Yes |
| Monthly revenue summary | No | Yes |

All reports exportable to PDF. Financial reports visible to Admin only.

---

## Dashboard Home (Overview Screen)

Visible to both roles (financial figures hidden from Ops Manager):

- Overdue maintenance visits (count, in red)
- Upcoming visits this week
- Jobs in progress today
- [Admin only] Total unpaid invoices (PHP)
- [Admin only] Invoices due this month
- Elevators with warranty expiring within 3 months

---

## Data Structure

```
Customer
└── Building (customer can have multiple)
    └── Elevator (building can have multiple)
        ├── Maintenance Schedule (type + frequency)
        │   └── Job (assigned technician, date, status, notes)
        ├── Installation Project (if new installation)
        │   └── Payment Milestones (custom per contract)
        │       └── Payments (recorded as received)
        └── Invoice (linked to job or milestone)
            └── Payment (partial or full)
```

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React | Component-based, widely supported, good tooling |
| Database | Supabase | Cloud, real-time, multi-user, free tier available |
| Hosting | Vercel | Free tier, accessible from any browser via URL |
| Auth | Supabase Auth | Built-in, supports role-based access |

No installation required for end users — they open a URL in any browser.

---

## What This Does NOT Include (Phase 1)

- GPS technician tracking
- Mobile apps (technician or customer)
- Supplier management / purchase orders
- Viber/WhatsApp sharing
- QR codes on printed reports
- Sales pipeline / leads management

These are all valid future features, explicitly deferred to later phases.

---

## Open Questions (Resolved)

- Warranty duration: always 1 year — confirmed
- Free maintenance duration: always 1 year — confirmed
- Language: English only — confirmed
- Currency: PHP — confirmed
