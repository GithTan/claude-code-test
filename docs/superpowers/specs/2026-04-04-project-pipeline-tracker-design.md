# Project Pipeline Tracker — Design Spec
**Date:** 2026-04-04
**Status:** Approved
**Self-review:** Passed — fixed ambiguous checkpoint timing (now % based on expected duration per supplier) and clarified optional uploads

---

## Business Context

- **Company:** Elevator installation and maintenance company, Manila, Philippines
- **Core problem:** Steps in the project lifecycle get silently skipped (e.g., forgetting to get client signature on drawings), which blocks the entire flow downstream. No centralized tracking, no accountability.
- **Solution:** A gate-based pipeline tracker where each step MUST be completed before the next unlocks. Wraps around the existing project/invoice system as a workflow layer.
- **Scale:** ~10 active projects at a time, 5+ managerial users
- **Project types:** New Installation, Modernization, Escalator Installation, Dismantle + Install New

---

## Architecture: Hybrid Kanban + Pipeline

Two views working together:

1. **Kanban Overview (Dashboard)** — bird's-eye view of all projects as cards across stage columns
2. **Step-by-Step Pipeline (Detail)** — click into any project to see all 12 steps with gate enforcement

**Build order:** Pipeline detail view first (solves core problem), Kanban overview second.

---

## Pipeline Steps & Gate Rules

Every project (all 4 types) follows the same 12-step pipeline. Each step is a gate — it must be explicitly completed before the next one unlocks.

| # | Step | Owner(s) | Gate Requirement |
|---|------|----------|-----------------|
| 1 | Project Awarded | Boss | Mark confirmed + select project type & supplier |
| 2 | Shop Drawings Prepared | Engineer | Upload drawing file |
| 3 | Client Signs Drawings | Boss/Sales | Upload signed copy |
| 4 | Supplier Approval | Admin / Supplier contact | Upload approved drawings |
| 5 | Payment to Supplier | Admin / Boss | Mark paid + upload receipt |
| 6 | Production Started | Admin / Supplier contact | Enter expected completion date |
| 7 | Production Monitoring | Admin / Supplier contact | Auto-checkpoints at 40%, 80%, and 100% of expected production duration (based on date entered in Step 6) — person logs update at each |
| 8 | Shipment | Admin / Supplier contact | Enter tracking/shipping info |
| 9 | Customs & Arrival | Admin / Operations | Mark arrived + optional file upload |
| 10 | Installation | Operations | Mark complete |
| 11 | Testing | Engineer | Mark tested + upload test report |
| 12 | Turnover to Client | Boss | Upload signed turnover document |

### Gate Rules

- **File-required steps** (2, 3, 4, 5, 11, 12): Cannot be completed without attaching a file
- **Checkbox-only steps** (1, 9, 10): Mark done with optional note
- **Data-entry steps** (6, 8): Must fill in required fields (dates, tracking info)
- **Auto-checkpoint step** (7): System creates checkpoints at Day 10, 20, 25 from production start — assigned person must log an update at each checkpoint
- **Boss override:** Boss can unlock any gate in emergencies, but must provide a written reason (logged for accountability)
- **Every completion records:** Who, when, notes, attached files

---

## Dashboard Overview (Kanban Layer)

### Stage Columns

Projects displayed as cards grouped by current stage:

| Column | Steps Covered |
|--------|--------------|
| Drawings | Steps 1–4 |
| Payment & Production | Steps 5–7 |
| Shipping | Steps 8–9 |
| Installation | Steps 10–11 |
| Complete | Step 12 |

### Project Card

Each card shows:
- Project name + type (New Install / Modernization / Escalator / Dismantle+Install)
- Supplier name
- Current step (e.g., "Step 5: Payment to Supplier")
- Owner of current step
- Color indicator: **Red** = overdue (7+ days), **Yellow** = due soon (3+ days), **Green** = on track
- Days stuck (if step has been unlocked without action)

### "Needs Your Action" Section

Top of dashboard — personalized per logged-in user:
- Shows only steps assigned to YOU that are currently unlocked and waiting
- Shows how many days each step has been waiting

### Filters

- By project type (New Install / Modernization / Escalator / Dismantle+Install)
- By supplier
- By assigned person
- By status (overdue / on track / completed)

---

## Roles & Permissions

| Action | Boss | Admin | Operations Manager |
|--------|------|-------|-------------------|
| Create new project pipeline | Yes | No | No |
| Complete any step | Yes | Only their assigned steps | Only their assigned steps |
| Override a locked gate | Yes | No | No |
| Reassign a step to someone | Yes | No | No |
| View all projects | Yes | Yes | Yes |
| View financial steps (Step 5 payment details) | Yes | Yes | No |
| Delete a project | Yes | No | No |

- Operations Manager cannot see financial information (consistent with existing role restrictions)
- Every action is logged — Boss can audit who did what and when

---

## Notifications & Accountability

### In-App Only (No External Notifications)

All notifications are in-app. No email, no WhatsApp, no push notifications.

### Automatic Escalation (Visibility-Based)

| Condition | What Happens |
|-----------|-------------|
| Step unlocked 3+ days, no action | Card turns **yellow** on dashboard |
| Step unlocked 7+ days, no action | Card turns **red** + appears in Boss's "Overdue" section |
| Production at 40% of expected duration | Auto-checkpoint — assigned person must log update |
| Production at 80% of expected duration | Auto-checkpoint — assigned person must log update |
| Production at 100% of expected duration | Auto-checkpoint — assigned person must confirm completion |

### Accountability Trail

- Every step completion: who, when, notes, files
- Boss gate overrides: logged with mandatory reason
- Full project timeline view: "Step 3 completed by Juan on April 5 → Step 4 completed by Maria on April 8 → ..."

### The Gate IS the Pressure

No nagging popups. If someone doesn't complete their step, the entire project visibly stalls on the dashboard. Everyone can see it. That's the accountability mechanism.

---

## Integration with Existing System

The pipeline tracker is an added layer — nothing existing gets changed.

| Existing Module | Integration |
|----------------|-------------|
| **Projects** | Creating a pipeline links to the existing project record. Financial data (milestone billing) stays in the project module. |
| **Invoices** | Step 5 completion (Payment to Supplier) can auto-create a supplier payment record. Client invoices managed separately. |
| **Customers** | Pipeline displays customer name from existing customer data. |
| **AMC Contracts** | After Step 12 (Turnover), system prompts: "Create AMC contract for this elevator?" — links to existing AMC module. |
| **Breakdowns** | Breakdowns reported during installation (Steps 10–11) can be logged and linked to the pipeline project. |

### New Database Tables

- **`pipelines`** — links to existing `projects` table; stores project type, supplier, current step, overall status
- **`pipeline_steps`** — 12 rows per pipeline; tracks step number, status (locked/unlocked/completed), assigned owner, due date, completion date, notes
- **`pipeline_attachments`** — files uploaded per step (receipts, signed drawings, test reports)
- **`pipeline_activity_log`** — every action recorded: step completions, overrides, reassignments, checkpoint updates

### Independence

The pipeline is a layer on top. If removed, the existing project/invoice/AMC system continues to function independently.

---

## Tech Stack

Consistent with existing app:
- **Frontend:** React (Vite) with existing component patterns
- **Backend:** Supabase (PostgreSQL + Row Level Security + Storage for file uploads)
- **Hosting:** Vercel
- **Auth:** Existing Supabase auth with role-based access

---

## Build Order

1. **Pipeline detail view** (step-by-step with gates) — solves core problem
2. **Kanban dashboard overview** — bird's-eye view across all projects
3. **Production auto-checkpoints** — Day 10/20/25 monitoring
4. **AMC contract prompt** after turnover — links to existing module
