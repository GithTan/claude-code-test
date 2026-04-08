# FIEC Elevator App — Claude Handoff
**Date:** 2026-04-08
**Repo:** GithTan/claude-code-test (branch: main)
**Continued from:** 2026-04-07

---

## Tech Stack
React 18 + Vite, JavaScript only (no TypeScript). Supabase via direct REST fetch helpers (no Supabase JS client for queries). Tailwind for layout classes only — all component styling is inline styles. Two roles: `admin` (full access) and `operations` (no billing/invoices/phones).

## Design Rules (never break these)
- Colors: Gold `#D4AF37`, Beige `#F5F5DC`, Dark `#2C2C2C`, White `#FFFFFF`
- NO rounded corners anywhere. NO box shadows.
- All component styles are inline — never add Tailwind color/border/radius classes to components
- Borders always `1px solid #D4AF37`. Section headers dark bg with gold text.
- Operations role never sees: phone numbers, billing amounts, invoice data

## What's Built
- Customers, Buildings, Elevators (CRUD)
- Maintenance Contracts (AMC) — with renewal tracking (renewal_status, renewal_notes columns added)
- Service Visits (Jobs)
- Breakdown Calls
- New Installations Pipeline (12-step gated workflow)
- Project Status / Operations (ops_projects) — full CRUD, status management
- Project Timeline — Gantt-style view at /operations/timeline
- Handover Documents — 5-doc generator (Certificate of Completion, Turn Over, Warranty, Load Test, Internal Summary) at /operations/:id/handover
- Dashboard — Action Items board, Recently Confirmed items, Needs Attention alerts
- Notification Bell — in sidebar, shows: pre-shipment payment due, deletion requests, stalled projects, next actions due, warranty expiring, AMC expiring, renewal follow-up (admin)
- Finance Dashboard, Invoices, Reports (admin only)
- AMC Renewal Workflow — renewal status tracking in AmcDetail, renewal badge in AmcList, AMC alerts in bell

## Key Files
| File | Purpose |
|---|---|
| `src/lib/api.js` | All Supabase REST helpers — rest(), restPost(), restPatch(), restDelete(), restOne() |
| `src/components/Layout.jsx` | Sidebar nav + NotificationBell component (full alerts logic) |
| `src/pages/Dashboard.jsx` | Action items board, recently confirmed, KPI cards |
| `src/pages/operations/OperationsList.jsx` | Ops project list with QuickStatusBadge, handover button |
| `src/pages/operations/ProjectTimeline.jsx` | Gantt timeline view |
| `src/pages/operations/HandoverSummary.jsx` | 5-doc handover generator with PDF download |
| `src/pages/operations/OpsProjectDetail.jsx` | Project detail with handover section |
| `src/pages/operations/OperationsForm.jsx` | Create/edit ops project — date fields send null not "" |
| `src/pages/contracts/AmcDetail.jsx` | AMC contract detail with Renewal Tracking panel |
| `src/pages/contracts/AmcList.jsx` | AMC list with renewal status badge on expiring contracts |
| `src/App.jsx` | All routes |

## Pending SQL Migrations
All migrations have been run. The following are complete:
- phase2-schema.sql (project_units, action_items tables)
- phase2b-schema.sql (ops_project_id on project_units, project dates)
- phase3-schema.sql (pipeline_id, last_updated_by on ops_projects)
- fix-allcaps-data.sql (initcap cleanup)
- AMC renewal columns: renewal_status (default 'none'), renewal_notes on amc_contracts

## What We Did This Session
- Built AMC renewal workflow:
  - Added `renewal_status` + `renewal_notes` columns to `amc_contracts` via Supabase Management API
  - Updated `getWarrantyAlerts()` in api.js — now also fetches AMC contracts expiring within 30 days and expired AMC contracts awaiting renewal (`amcExpiring`, `amcRenewalFollowup`)
  - Added `updateAmcRenewal(id, status, notes)` to api.js
  - Rebuilt `AmcDetail.jsx` — dark Renewal Tracking panel with 6-button status selector (none/contacted/in_negotiation/proposal_sent/renewed/not_renewing) + notes field, visible when expiring ≤60d or expired
  - Updated `AmcList.jsx` — renewal status badge appears under expiry badge for contracts ≤60d or expired
  - Updated `Layout.jsx` NotificationBell — added AMC Expiring Soon + AMC Renewal Needed sections with View → links
- Ran all 4 pending SQL migrations via Supabase Management API (node script)

## Known Issues / Gotchas
- Supabase anon key is in `.env` as `VITE_SUPABASE_ANON_KEY` — service role key and PAT are NOT stored in the repo (don't commit them)
- PAT for Supabase Management API: `sbp_a550f12af48a97e883a96645bd855d982aa10496` (user's token — don't commit)
- ops_projects `getOpsProjects()` has a fallback if project_units join fails — now that migrations are run, join should work
- Date fields in OperationsForm must send `null` not `""` — already fixed
- `renewal_negotiation_status` on ops_projects is separate from `renewal_status` on amc_contracts — two different renewal flows
- Team members: Chel, Vic, Jose, Isza, Jonathan (used in assigned_to dropdowns)

## Next Steps (in priority order)
1. **AMC Monthly Billing Tracker** — which contracts need billing this month, mark as billed/paid, monthly revenue view. Needs new `billing_records` table or use existing billing_milestones. User confirmed this is wanted.
2. **WhatsApp alerts via Callmebot** — free, no API approval. Setup: user sends "I allow callmebot to send me messages" to +34 644 59 80 08 on WhatsApp, gets API key. Then `GET https://api.callmebot.com/whatsapp.php?phone=NUMBER&text=MESSAGE&apikey=KEY`. Trigger on: AMC expiry, breakdown reported, stalled project.
3. **Service Report PDF** — after job completed, generate PDF like handover docs (technician, date, work done, client signature line)
4. **Dashboard KPI cards** — active projects, open breakdowns, AMC renewals due, unpaid invoices total

## Resume Prompt
Paste this at the start of your Codex or Claude session:

---
I'm building the FIEC Elevator web app — React 18 + Vite + Supabase REST API, JavaScript only (no TypeScript). All Supabase queries use direct fetch helpers (rest, restPost, restPatch, restDelete, restOne) in src/lib/api.js — no Supabase JS client. Design rules: Gold #D4AF37, Beige #F5F5DC, Dark #2C2C2C — NO rounded corners, NO shadows, inline styles only, borders always 1px solid #D4AF37. Two roles: admin and operations (ops hides billing/phones). Repo: GithTan/claude-code-test, branch main, project folder: "C:\Users\RICHT\OneDrive\文档\Claude Code Test\elevator-app". Last session: ran all pending SQL migrations, built AMC renewal workflow (renewal_status/renewal_notes on amc_contracts, Renewal Tracking panel in AmcDetail.jsx, renewal badges in AmcList.jsx, AMC expiry alerts in notification bell in Layout.jsx). Next task: build the AMC Monthly Billing Tracker — active AMC contracts need a way to track monthly billing: which clients need invoicing this month, mark each as billed/paid, show total expected vs collected revenue. Likely needs a new `amc_billing_records` table: (id, amc_contract_id, billing_month DATE, amount, status: pending/billed/paid, billed_at, paid_at). Add a new page at /contracts/billing and a nav link or button from AmcList. The billing tracker should show a monthly view (default: current month) with all active contracts, their monthly fee, billing status, and quick action buttons to mark billed/paid.
---
