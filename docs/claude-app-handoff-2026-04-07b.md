# FIEC Elevator App — Claude Handoff
**Date:** 2026-04-07 (Session 2)
**Repo:** GithTan/claude-code-test (branch: main, last commit: 40a3e0a)
**Continued from:** 2026-04-07 (Session 1 — docs/claude-app-handoff-2026-04-07.md)

---

## Tech Stack
- React 18 + Vite, JavaScript only (no TypeScript)
- Supabase — PostgreSQL + auth + storage. All calls via direct REST fetch in `src/lib/api.js` using `rest()`, `restPost()`, `restPatch()`, `restDelete()`, `restOne()` — NOT supabase-js client
- React Router v6, Tailwind CSS + inline styles
- Roles: `admin` (full access) or `operations` (no billing, no invoices, no phone numbers)

## Design Rules — Never Break These
- Gold: `#D4AF37` | Beige: `#F5F5DC` | Dark: `#2C2C2C` | Muted: `#888888` | Error: `#8B0000`
- No rounded corners. No box shadows. Flat gold borders only.
- Inputs: `border: '1px solid #D4AF37'`, white background
- Primary button: `backgroundColor: '#D4AF37', color: '#2C2C2C'`
- All inline styles (not Tailwind classes) for component-level styling

---

## What's Built — All Working Modules
- **Customers** — CRUD, buildings under each customer, phone hidden from operations role
- **Elevators** — per building, with maintenance schedules
- **Maintenance Contracts (AMC)** — auto-created on project handover (1-year free)
- **Service Visits / Jobs** — technician job tracking
- **Breakdown Calls** — open/in-progress/closed breakdown logging
- **Invoices** — admin only
- **Finance Dashboard** — admin only
- **Reports** — overdue maintenance, technician activity, elevator status, breakdown patterns
- **Pipeline** — 12-step gate flow (client confirm → turnover), file-required gates at steps 3/4/5/9/11/12, multi-unit specs
- **Project Status (Operations)** — 11-status workflow, next action + assigned_to, QA checkpoints, billing milestones (admin only), stall reason, comments, activity log, "Updated Xd ago by [name]", pipeline link, multi-unit specs on list
- **Finished Projects** — handed-over projects grouped by year
- **Handover Summary** — printable certificate at `/operations/:id/handover`
- **Dashboard** — "Needs to be Addressed" board (3-day expiry), Today's Schedule, stats grid
- **Mobile** — hamburger menu, card view on mobile, single-column detail

## Key Files
| File | Purpose |
|------|---------|
| `src/App.jsx` | All routes |
| `src/lib/api.js` | All Supabase REST calls |
| `src/components/Layout.jsx` | Sidebar + mobile hamburger |
| `src/contexts/AuthContext.jsx` | Auth + role (`user`, `role`) |
| `src/pages/operations/OperationsList.jsx` | Project Status list — exports `OPS_STATUSES`, `statusDef` |
| `src/pages/operations/OpsProjectDetail.jsx` | Project detail — exports `TEAM_MEMBERS` (`Chel, Vic, Jose, Isza, Jonathan`) |
| `src/pages/operations/OperationsForm.jsx` | Add/edit project, multi-unit, normalizeCase() |
| `src/pages/operations/FinishedProjects.jsx` | Handed-over projects grouped by year |
| `src/pages/operations/HandoverSummary.jsx` | Printable handover certificate |
| `src/pages/pipeline/PipelineDetail.jsx` | 12-step gate flow |

## Pending SQL Migrations — NOT Yet Run
Run these in order in Supabase dashboard → SQL Editor:
1. `supabase/phase2-schema.sql` — adds `project_units` table, `action_items` table
2. `supabase/phase2b-schema.sql` — adds `ops_project_id` column on `project_units`
3. `supabase/phase3-schema.sql` — adds `pipeline_id`, `last_updated_by` on `ops_projects`
4. `supabase/fix-allcaps-data.sql` — fixes existing ALL CAPS records

Until these are run: per-unit specs column shows blank (graceful fallback in place), pipeline links won't show on project list.

---

## What We Did This Session (2026-04-07 Session 2)

- **Quick Status Update from list** — `src/pages/operations/OperationsList.jsx`
  - Added `QuickStatusBadge` component: clicking any status badge on the list opens a dropdown of all 11 statuses
  - Select a new status → saves immediately via `updateOpsProject`, updates local state
  - Shows "Saving…" while in flight, badge updates without page navigation
  - If status changed to `handed_over` → project disappears from list (moves to Finished Projects)
  - Works on both mobile cards and desktop table rows
  - Added imports: `useRef`, `updateOpsProject`, `useAuth`
  - Added state: `editingStatus`, `savingStatus`

- **Created `/handoff` command** — `~/.claude/commands/handoff.md`
  - Type `/handoff` in Claude Code to generate a new dated handoff doc

---

## Known Issues / Gotchas
- `getOpsProjects()` has a graceful fallback: tries `project_units` join first, falls back to plain `select *` if join fails. This means per-unit specs are blank until `phase2b-schema.sql` is run.
- `last_updated_by` on ops_projects stores the user's email (from `user.email`), not their display name. Column requires `phase3-schema.sql` to be run first.
- `normalizeCase()` in `OperationsForm.jsx` converts ALL CAPS input to Title Case on save.
- Pipeline step 5 auto-creates an ops project and links `pipeline_id` — requires `phase3-schema.sql`.
- ALL CAPS normalization applies to: project_name, pic, subcon, contact_person, address, specs, unit_label, brand, stall_reason, concerns.

## Next Steps (priority order)
1. **Run the 4 pending SQL migrations** (prerequisite for full pipeline + per-unit specs functionality)
2. **AMC renewal workflow** — alert 30 days before contract expiry, track renewal negotiation status
3. **Subcon contact book** — list of subcontractors with phone + specialization
4. **Project timeline view** — all active projects with target dates
5. **Photo uploads on breakdowns** — field engineer uploads via Supabase Storage

---

## Resume Prompt — Copy This Into Your Next Session

This is FIEC Elevator, a browser-based operations management system for an elevator installation and maintenance company in Manila (React 18 + Vite + Supabase REST API, JavaScript only, no TypeScript). Design rules: gold #D4AF37, beige #F5F5DC, dark #2C2C2C — no rounded corners, no shadows, flat gold borders, all inline styles. All Supabase calls use direct REST fetch helpers (rest, restPost, restPatch) in src/lib/api.js. Roles: admin (full access) or operations (no billing/invoices/phones). Built modules: Customers, Buildings, Elevators, Maintenance Contracts (AMC), Service Jobs, Breakdowns, Invoices (admin), Finance Dashboard (admin), Reports, Pipeline (12-step gate flow), Project Status (11-status ops workflow with QA/billing/comments/activity log), Finished Projects, Handover Summary, Dashboard. Last session: added QuickStatusBadge to OperationsList.jsx — clicking any status badge opens a dropdown to change project status without navigating to the detail page; also added a /handoff command. Pending: 4 SQL migrations in supabase/ (phase2 → phase2b → phase3 → fix-allcaps, run in that order) not yet run in Supabase dashboard. Next priority: AMC renewal workflow (alert 30 days before expiry, track negotiation status) — start in src/pages/contracts/AmcList.jsx and src/lib/api.js getExpiringAmcContracts().
