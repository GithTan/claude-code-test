# FIEC Elevator App — Claude.ai Handoff
**Date:** 2026-04-07  
**Repo:** `GithTan/claude-code-test` (branch: `main`, last commit: `40a3e0a`)  
**Continued from:** Claude Code (Cursor extension)

---

## What This Is

A browser-based operations management system for **FIEC Elevator**, an elevator installation and maintenance company in Manila, Philippines. The owner is non-technical. All code is written and maintained by AI.

**Live dev URL:** `http://localhost:5173` (run `npm run dev` inside `elevator-app/`)

---

## Tech Stack

- **React 18 + Vite**, JavaScript only (no TypeScript)
- **Supabase** — PostgreSQL database + auth + storage
- **React Router v6**
- **Tailwind CSS** + inline styles
- **API pattern:** All Supabase calls use direct REST fetch via helpers in `src/lib/api.js` — NOT supabase-js client. Helpers: `rest()`, `restPost()`, `restPatch()`, `restDelete()`, `restOne()`
- **Roles:** `admin` (full access) or `operations` (limited — no billing, no invoices, no phone numbers)

---

## Design System — NEVER deviate from this

- Gold: `#D4AF37` | Beige: `#F5F5DC` | Dark: `#2C2C2C` | Muted: `#888888` | Error: `#8B0000`
- **No rounded corners. No box shadows. Flat gold borders only.**
- Inputs: `border: '1px solid #D4AF37'`, white background
- Primary button: `backgroundColor: '#D4AF37', color: '#2C2C2C'`
- Table headers: beige background, gold bottom border
- All inline styles (not Tailwind classes) for component-level styling

---

## Current State — What's Built

### Core modules (all working):
- **Customers** — CRUD, buildings under each customer, phone hidden from operations role
- **Elevators** — per building, with maintenance schedules
- **Maintenance Contracts (AMC)** — auto-created on project handover (1-year free)
- **Service Visits / Jobs** — technician job tracking
- **Breakdown Calls** — open/in-progress/closed breakdown logging
- **Invoices** — admin only
- **Finance Dashboard** — admin only
- **Reports** — overdue maintenance, technician activity, elevator status, breakdown patterns

### Pipeline (New Installations):
- 12-step gate flow from client confirm → turnover
- File-required gates at steps 3, 4, 5, 9, 11, 12
- Step 3 document = "Client Signature", Step 4 = "Engineer Confirmation to Supplier"
- Step 5 auto-creates an ops project and links `pipeline_id`
- Multi-unit specs per project (brand, drive type, use type, stops/openings/floors)

### Project Status (Operations):
- Active projects: on_going_production → for_delivery → unit_delivered_awaiting_shaft → awaiting_shaft_readiness → for_unloading → mechanical_installation → for_tnc → done_tnc → awaiting_power → for_handover → handed_over
- Handed-over projects move to **Finished Projects** page (grouped by year)
- Features: next action + assigned_to tracking, no-owner warning, QA checkpoints (pre-install / mid / pre-handover), billing milestones (admin only), stall reason, comments, activity log
- Installation start/end dates required at mechanical_installation and beyond
- "Updated Xd ago by [name]" shown on list
- Pipeline link shown on list and detail
- Multi-unit specs shown on list (extra units from `project_units` table)
- **Handover summary** print page at `/operations/:id/handover` — certificate with specs, QA, warranty, signature block

### Dashboard:
- "Needs to be Addressed" board — items expire in 3 days, can check off
- Today's Schedule widget
- Stats grid

### Mobile:
- Hamburger menu → sidebar drawer on small screens
- Project Status list shows cards on mobile instead of table
- Project detail stacks to single column on mobile

---

## Team Members (dropdown everywhere)
`Chel, Vic, Jose, Isza, Jonathan`  
Exported as `TEAM_MEMBERS` from `src/pages/operations/OpsProjectDetail.jsx`

---

## ALL CAPS Normalization
When staff type in ALL CAPS, it's auto-converted to Title Case on save.  
Function `normalizeCase()` in `OperationsForm.jsx`. Applied to: project_name, pic, subcon, contact_person, address, specs, unit_label, brand, stall_reason, concerns.

---

## Key Files

```
elevator-app/
  src/
    App.jsx                          — all routes
    lib/api.js                       — ALL Supabase REST calls
    components/Layout.jsx            — sidebar + mobile hamburger
    contexts/AuthContext.jsx         — auth + role
    pages/
      Dashboard.jsx
      operations/
        OperationsList.jsx           — exports OPS_STATUSES, statusDef
        OpsProjectDetail.jsx         — exports TEAM_MEMBERS
        OperationsForm.jsx           — add/edit project, multi-unit
        FinishedProjects.jsx         — handed-over, grouped by year
        HandoverSummary.jsx          — printable certificate
      pipeline/
        PipelineList.jsx
        PipelineDetail.jsx           — 12-step gate flow
        PipelineForm.jsx             — new pipeline + multi-unit specs
      reports/Reports.jsx            — breakdown patterns section
  supabase/
    phase2-schema.sql     ← RUN THIS 1st (project_units, action_items)
    phase2b-schema.sql    ← RUN THIS 2nd (ops_project_id on project_units)
    phase3-schema.sql     ← RUN THIS 3rd (pipeline_id, last_updated_by on ops_projects)
    fix-allcaps-data.sql  ← RUN THIS 4th (fix existing ALL CAPS records)
```

---

## PENDING — SQL migrations not yet run in Supabase

The user has NOT yet run these. Until they do:
- The per-unit specs column on Project Status list shows blank (graceful fallback in place)
- `pipeline_id` and `last_updated_by` columns don't exist yet on `ops_projects`

**How to run:** Supabase dashboard → SQL Editor → paste each file's content → Run.  
Run in order: phase2 → phase2b → phase3 → fix-allcaps.

---

## Recent Bug Fixed

`getOpsProjects()` was returning empty (0 projects) because the `project_units` join failed when `ops_project_id` column didn't exist. Fixed with a graceful fallback: tries join first, falls back to plain `select *` if error. Committed `40a3e0a`.

---

## What To Work On Next (suggestions)

Nothing is actively broken. Possible next features:
1. **Subcon contact book** — list of subcontractors with phone + specialization
2. **Photo uploads on breakdowns** — field engineer uploads via Supabase Storage (already configured for pipeline docs)
3. **Project timeline view** — all active projects with target dates
4. **AMC renewal workflow** — alert at 30 days before expiry, track negotiation status
5. **Quick status update from list** — tap to change status without entering detail page (mobile UX)

---

## How to Give Claude Context When Asking Questions

Always tell Claude:
- Which page/file you're working on
- What you see vs. what you expect
- Whether it's a UI issue, data issue, or new feature

If asking Claude to write code, remind it:
- Use inline styles matching the gold/beige design system
- No TypeScript, no rounded corners, no shadows
- API calls go in `src/lib/api.js` using `rest()` / `restPost()` / `restPatch()`
- Check role with `const { role } = useAuth()` — admin-only content wrapped in `{role === 'admin' && ...}`
