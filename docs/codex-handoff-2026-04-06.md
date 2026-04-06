# FIEC Elevator App — Codex Handoff
**Date:** 2026-04-06  
**Repo:** `GithTan/claude-code-test` (branch: `main`)  
**Last commit:** `71f3c00` — mobile-responsive layout and project status views

---

## What This App Is

A full operations management system for FIEC Elevator, an elevator installation and maintenance company in Manila, Philippines. Built with React 18 + Vite + Supabase. The owner is non-technical; all code is maintained by AI.

---

## Tech Stack

- **Frontend:** React 18 + Vite, JavaScript only (no TypeScript)
- **Styling:** Tailwind CSS + inline styles. Gold/beige design system applied via inline styles.
- **Routing:** React Router v6
- **Backend:** Supabase (PostgreSQL + RLS + Storage)
- **API pattern:** Direct REST fetch via helper functions in `elevator-app/src/lib/api.js` — NOT supabase-js client (avoids session lock timeouts). Helpers: `rest()`, `restPost()`, `restPatch()`, `restDelete()`, `restOne()`
- **Auth:** Supabase auth, roles stored in user metadata: `admin` or `operations`
- **Dev server:** `npm run dev` inside `elevator-app/`

---

## Design System (MUST follow exactly)

- **Gold:** `#D4AF37`
- **Beige:** `#F5F5DC`
- **Dark gray:** `#2C2C2C`
- **Muted text:** `#888888`
- **Error red:** `#8B0000`
- **Warm orange (stall/concerns):** `#8B4500`
- **No rounded corners. No box shadows. Flat gold borders only.**
- All inputs: `border: '1px solid #D4AF37'`, `backgroundColor: '#FFFFFF'`
- Tables: `backgroundColor: '#F5F5DC'` for header, `backgroundColor: '#FFFFFF'` for rows
- Buttons primary: `backgroundColor: '#D4AF37', color: '#2C2C2C'`
- Buttons secondary: `border: '1px solid #D4AF37', color: '#888888'`

---

## Roles

- `admin` — full access (billing, invoices, finance, deletion approval, phone numbers)
- `operations` — cannot see: billing milestones, invoices, finance dashboard, contact phone numbers

Access check pattern:
```jsx
const { role } = useAuth()
const isAdmin = role === 'admin'
{isAdmin && <div>...</div>}
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/App.jsx` | All routes |
| `src/lib/api.js` | All Supabase REST calls |
| `src/components/Layout.jsx` | Sidebar nav + mobile hamburger |
| `src/contexts/AuthContext.jsx` | Auth + role |
| `src/pages/Dashboard.jsx` | Dashboard with "Needs to be Addressed" widget |
| `src/pages/operations/OperationsList.jsx` | Project Status list (table + mobile cards). Exports `OPS_STATUSES`, `statusDef` |
| `src/pages/operations/OpsProjectDetail.jsx` | Project detail. Exports `TEAM_MEMBERS` |
| `src/pages/operations/OperationsForm.jsx` | Add/edit project with multi-unit support |
| `src/pages/operations/FinishedProjects.jsx` | Handed-over projects grouped by year |
| `src/pages/operations/HandoverSummary.jsx` | Printable handover certificate |
| `src/pages/pipeline/PipelineList.jsx` | New installation pipeline list |
| `src/pages/pipeline/PipelineDetail.jsx` | 12-step gate flow |
| `src/pages/pipeline/PipelineForm.jsx` | New pipeline with multi-unit specs |
| `src/pages/reports/Reports.jsx` | Reports including breakdown patterns |
| `supabase/phase2-schema.sql` | project_units, action_items, handed_over_date, year_completed |
| `supabase/phase2b-schema.sql` | ops_project_id on project_units, project_start/end_date |
| `supabase/phase3-schema.sql` | pipeline_id and last_updated_by on ops_projects |
| `supabase/fix-allcaps-data.sql` | Retroactive ALL CAPS data fix (PostgreSQL initcap) |

---

## Database Tables (key ones)

### `ops_projects`
All columns: `id, project_name, address, pic, specs, unit_label, brand, drive_type, use_type, stops, openings, floors, s_o_f, subcon, contact_person, contact_number, concerns, status, health, next_action, next_action_date, assigned_to, qa_pre_install, qa_mid, qa_pre_handover, stall_reason, production_start_date, project_start_date, project_end_date, handed_over_date, year_completed, deletion_pending, deletion_requested_by, deletion_requested_at, last_updated_at, last_updated_by, pipeline_id, created_at`

### `project_units`
Multi-unit specs: `id, pipeline_id, ops_project_id, unit_number, unit_label, specs, brand, drive_type, use_type, stops, openings, floors, with_structure, is_home_elevator`

### `pipelines`
12-step installation tracker: `id, project_name, customer_id, current_step, status, supplier, notes, created_at, ...`

### `action_items`
Dashboard "Needs to be Addressed" board: `id, text, created_by_name, expires_at, checked_by_name, checked_at, is_active`

### `breakdowns`
Breakdown calls: `id, elevator_id, status, priority, description, reported_date, ...`

---

## Important Constants / Exports

**Team members** (exported from `OpsProjectDetail.jsx`, imported by `OperationsForm.jsx` and `OperationsList.jsx`):
```js
export const TEAM_MEMBERS = ['Chel', 'Vic', 'Jose', 'Isza', 'Jonathan']
```

**OPS_STATUSES** (exported from `OperationsList.jsx`):
```js
['on_going_production', 'for_delivery', 'unit_delivered_awaiting_shaft',
 'awaiting_shaft_readiness', 'for_unloading', 'mechanical_installation',
 'for_tnc', 'done_tnc', 'awaiting_power', 'for_handover', 'handed_over']
```

**MECH_INSTALL_AND_BEYOND** — statuses that require installation start/end dates:
```js
['mechanical_installation','for_tnc','done_tnc','awaiting_power','for_handover','handed_over']
```

---

## normalizeCase() Pattern

ALL CAPS input is normalized to title case on save. Function in `OperationsForm.jsx`:
```js
function normalizeCase(str) {
  if (!str) return str
  if (str === str.toUpperCase()) return str.replace(/\b\w+/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase())
  return str
}
function normalizeCaseFields(obj, fields) {
  const out = { ...obj }
  fields.forEach(f => { if (out[f]) out[f] = normalizeCase(out[f]) })
  return out
}
```
Applied on submit for: `project_name, pic, subcon, contact_person, address, specs, unit_label, brand, stall_reason, concerns`

---

## Pipeline Gate Flow (12 steps)

Steps 1–12. File-required gates at steps 3, 4, 5, 9, 11, 12.
- **Step 3** document label: "Client Signature"
- **Step 4** document label: "Engineer Confirmation to Supplier"
- **Step 5** auto-creates ops_project when completed (links `pipeline_id` back to ops_projects)

---

## Routes (full list)

```
/                          Dashboard
/start                     StartHere
/customers                 CustomerList
/customers/new             CustomerForm
/customers/:id             CustomerDetail
/customers/:id/edit        CustomerForm
/customers/:customerId/buildings/new  BuildingForm
/elevators                 AllElevatorList
/buildings/:buildingId/elevators      ElevatorList
/buildings/:buildingId/elevators/new  ElevatorForm
/elevators/:id             ElevatorDetail
/elevators/:id/edit        ElevatorForm
/maintenance               MaintenanceList
/jobs                      JobList
/jobs/new                  JobForm
/contracts                 AmcList
/contracts/new             AmcForm
/contracts/:id             AmcDetail
/operations                OperationsList
/operations/finished       FinishedProjects
/operations/new            OperationsForm
/operations/:id            OpsProjectDetail
/operations/:id/edit       OperationsForm
/operations/:id/handover   HandoverSummary  ← NEW
/breakdowns                BreakdownList
/breakdowns/new            BreakdownForm
/pipeline                  PipelineList
/pipeline/new              PipelineForm (admin only)
/pipeline/:id              PipelineDetail
/invoices                  InvoiceList (admin only)
/reports                   Reports
/finance                   FinanceDashboard (admin only)
```

---

## Mobile Responsiveness

Added in last session:
- `src/index.css` — utility classes: `.mobile-hide`, `.desktop-hide`, `.mobile-stack`, `.mobile-card-grid`, `.mobile-full`
- Breakpoint: `max-width: 767px` = mobile
- Layout has hamburger menu → sidebar drawer on mobile
- OperationsList shows cards on mobile (`.desktop-hide` on table, `.mobile-card-grid` on card list)
- OpsProjectDetail uses `.mobile-stack` on 2-column grids

---

## Pending SQL (must run in Supabase SQL Editor)

User has NOT yet run these:
1. **`supabase/phase3-schema.sql`** — adds `pipeline_id` and `last_updated_by` to `ops_projects`
2. **`supabase/fix-allcaps-data.sql`** — cleans up existing ALL CAPS records with PostgreSQL `initcap()`

---

## What's Been Built (features complete)

1. ✅ Gate-based 12-step pipeline with file-required gates
2. ✅ Project Status (ops_projects) — full CRUD, status/health tracking
3. ✅ Multi-unit specs per project (project_units table, shown on list + form + handover)
4. ✅ Finished Projects page — grouped by year, warranty countdown
5. ✅ Auto-create 1-year free AMC contract on handover
6. ✅ "Needs to be Addressed" board on dashboard (3-day expiry, check-off)
7. ✅ Team member dropdowns (Chel, Vic, Jose, Isza, Jonathan)
8. ✅ No-owner warnings — projects missing next_action or assigned_to
9. ✅ normalizeCase() — ALL CAPS → Title Case on save
10. ✅ Billing milestones — admin only, installation dates required at Mech Install+
11. ✅ Pipeline → ops link (pipeline_id on ops_projects)
12. ✅ Last-updated-by tracking on list ("Updated 2d ago by Vic")
13. ✅ Per-unit specs shown on Project Status list
14. ✅ Breakdown patterns report (repeat offender elevators)
15. ✅ Handover summary print page with certificate + signature block
16. ✅ Mobile-responsive layout + card view

---

## Suggested Next Features

- **Maintenance contract auto-renewal workflow** — alert when AMC is 30 days from expiry, track renewal negotiation status
- **Subcon contact book** — list of subcontractors with their contact numbers and elevator specializations
- **Photo uploads on breakdowns** — field engineers can upload photos via Supabase Storage
- **Project timeline view** — Gantt-style view of all active projects by target dates
- **SMS / email notifications** — when next_action_date passes with no update

---

## How to Run Locally

```bash
cd elevator-app
npm install
npm run dev
# Opens at http://localhost:5173
```

Environment variables needed in `elevator-app/.env`:
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
