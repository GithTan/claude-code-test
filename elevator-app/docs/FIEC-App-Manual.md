# FIEC Elevator — App Manual
**Version:** Trial / Staff Review
**App URL:** https://elevator-app-peach.vercel.app

---

## How to Log In

| Who | How |
|---|---|
| **Staff (trial)** | Open the app → tap **"Enter App →"** — no password needed |
| **Admin / Owner** | Use your own email and password |

---

## What This App Does

The FIEC Elevator app manages the full lifecycle of every elevator project — from the first sales call all the way to handover and ongoing maintenance. It replaces spreadsheets, group chats, and sticky notes with one system everyone can see.

---

## Who Uses It

| Role | What They Can See |
|---|---|
| **Admin (Owner/Boss)** | Everything — including prices, contracts, finance, invoices |
| **Operations Staff** | Projects, jobs, breakdowns, customers — no prices or billing |

---

## The Big Picture — How a Project Flows

```
New Client Inquiry
       ↓
  Add Customer
       ↓
  Start Pipeline  ←── 12-step checklist (drawings → payment → shipping → install → handover)
       ↓
  Step 5 Complete (Payment to Supplier)
       ↓
  Auto-added to Project Status ←── Team tracks progress here daily
       ↓
  Project Complete → Handover Documents generated
       ↓
  Maintenance Contract (AMC) created
       ↓
  Monthly Service Visits scheduled
       ↓
  Breakdown Calls logged if issues arise
```

---

## Module Guide

### 1. Dashboard
**Who uses it:** Everyone, every day
**What it shows:**
- Active alerts (breakdowns, stalled projects, payments due)
- Needs Attention items — things that need someone to act
- Recently confirmed items — what got resolved

**How to use:**
- Check this first thing every morning
- Add action items for the team using the text box
- Click the bell (top of sidebar) for all alerts

---

### 2. Customers
**Who uses it:** Admin, Operations
**What it does:** Stores all client information — name, address, contact, buildings, elevators

**When to use:**
- When a new client signs a contract → Add them here first
- Before starting a pipeline or maintenance contract, the customer must exist

---

### 3. New Installations (Pipeline)
**Who uses it:** Admin starts it, Operations updates steps
**What it does:** Tracks a new elevator installation through 12 steps from award to handover

**The 12 Steps:**
```
Step  1 — Project Awarded           (Admin confirms)
Step  2 — Shop Drawings Prepared    (Upload drawings file)
Step  3 — Client Signs Drawings     (Upload signed copy)
Step  4 — Engineer Approval         (Upload approval)
Step  5 — Payment to Supplier       ← triggers Project Status entry
Step  6 — Production Started        (Enter expected end date)
Step  7 — Production Monitoring     (Checkpoint)
Step  8 — Shipment                  (Enter tracking number)
Step  9 — Customs & Arrival         (Confirm arrival)
Step 10 — Installation              (Confirm on site)
Step 11 — Testing                   (Upload test results)
Step 12 — Turnover to Client        (Final handover)
```

**Rules:**
- Each step must be completed before the next unlocks
- Steps that need a file — you must upload the document
- Admin can override a locked step if urgent (logged automatically)
- Only the assigned role can complete each step

---

### 4. Project Status
**Who uses it:** Operations team daily
**What it does:** Shows all active installation projects and their current status

**Status Options:**
| Status | Meaning |
|---|---|
| On-Going Production | Elevator being manufactured |
| On-Going Installation | On-site installation in progress |
| For Permits | Waiting for government permits |
| For Inspection | Awaiting inspector visit |
| For Handover | Ready to hand to client |
| Handed Over | Complete |
| On Hold | Paused for any reason |
| Breakdown | Emergency issue on site |

**How to use:**
- Update the status whenever something changes
- Set a Next Action + due date so the team knows what happens next
- Assign a PIC (Person In Charge) to every project
- Use the Timeline view to see all projects on a calendar

---

### 5. Maintenance Contracts (AMC)
**AMC = Annual Maintenance Contract**
**Who uses it:** Admin manages, Operations views
**What it does:** Stores all maintenance agreements with clients — how often visits happen, how much it costs, when it expires

**Renewal Tracking:**
When a contract is close to expiry (within 60 days), a Renewal Tracking panel appears. Update the status as you go:
```
Not started → Client contacted → In negotiation → Proposal sent → Renewed ✓
```

**AMC Billing:**
Go to **AMC Billing** in the sidebar to see which clients need to be billed this month. Mark each one as Billed → Paid.

---

### 6. Service Visits (Jobs)
**Who uses it:** Operations, Technicians
**What it does:** Logs every scheduled maintenance visit — who went, when, what was done

**How to use:**
- When a visit is scheduled, add a new job
- After the visit, mark it complete and add notes
- This feeds into the reports at end of month

---

### 7. Breakdown Calls
**Who uses it:** Everyone
**What it does:** Logs emergency breakdowns — which elevator, what happened, who responded

**Priority levels:**
- **Critical** — elevator stuck with passengers / hospital / fire escape
- **High** — elevator stopped, no passengers stuck
- **Medium** — partial issue, still running
- **Low** — minor complaint, cosmetic

**How to use:**
- Log it immediately when a client calls
- Assign to a technician
- Update status as it progresses: Open → In Progress → Resolved

---

### 8. Finance / Invoices / Reports
**Who uses it:** Admin only
**What it does:** Billing milestones, invoice tracking, revenue reports
These pages show a watermark and are access-logged for security.

---

### 9. Admin Audit
**Who uses it:** Admin only
**What it does:** Shows a log of who accessed sensitive pages, what changes were made to projects, and AMC activity. Use this to monitor staff activity.

---

## How the Team Works Together

```
OWNER / ADMIN
├── Approves pipeline steps (Step 1, 3, 11, 12)
├── Sets contract amounts (hidden from staff)
├── Handles finance, invoices, billing
├── Monitors Admin Audit log
└── Approves or denies deletion requests

OPERATIONS TEAM (Chel, Vic, Jose, Isza, Jonathan)
├── Updates Project Status daily
├── Completes pipeline steps assigned to them
├── Logs service visits after each job
├── Logs breakdown calls immediately
└── Adds Needs Attention items on Dashboard

EVERYONE
├── Checks Dashboard every morning
├── Updates their assigned projects
└── Adds comments and notes on any project
```

---

## Notification Bell (Top of Sidebar)

The bell shows automatic alerts. Red number = alerts waiting.

| Alert | What it means |
|---|---|
| Pre-Shipment Payment Due | A production project is past 23 days — client needs to pay |
| Deletion Requests | Staff asked to delete a project — boss approves or denies |
| No Update in 7+ Days | A project hasn't been touched — needs attention |
| Next Actions Due | Someone set a next action and it's past due |
| Warranty Expiring | Maintenance end date is within 7 days |
| AMC Expiring Soon | A maintenance contract expires within 30 days |
| AMC Renewal Needed | Contract expired, no renewal action taken |

---

## Common Tasks — Quick Reference

| Task | Where to go |
|---|---|
| Add a new client | Customers → New Customer |
| Start a new installation | New Installations → Start Pipeline |
| Update a project status | Project Status → click project → change status |
| Log a breakdown | Breakdown Calls → New Breakdown |
| Schedule a service visit | Service Visits → New Job |
| Add a maintenance contract | Maintenance Contracts → New Contract |
| Generate handover documents | Project Status → project → Handover Documents |
| Check who needs billing this month | AMC Billing (sidebar) |
| See all projects on a timeline | Project Status → Timeline |
| Check what alerts are pending | Click the bell icon in the sidebar |

---

## Trial Mode Notice

During the staff review period:
- Project names are shown as **Project 0421** (real names hidden)
- Contact numbers show as **Hidden during trial**
- Document uploads in the pipeline are optional

These will all be restored when the app goes live.

---

## Questions or Issues

Contact the admin. Do not try to delete records — use the "Request Deletion" option instead so the admin can approve it.
