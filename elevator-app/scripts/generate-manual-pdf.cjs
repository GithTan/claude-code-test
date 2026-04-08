// scripts/generate-manual-pdf.js
// Run: node scripts/generate-manual-pdf.js
const { jsPDF } = require('jspdf')
const fs = require('fs')
const path = require('path')

const OUT = path.join(__dirname, '../docs/FIEC-App-Manual.pdf')

// ── colours ───────────────────────────────────────────────────
const GOLD   = [212, 175,  55]   // #D4AF37
const DARK   = [ 44,  44,  44]   // #2C2C2C
const BEIGE  = [245, 245, 220]   // #F5F5DC
const WHITE  = [255, 255, 255]
const RED    = [139,   0,   0]
const GREY   = [136, 136, 136]
const LGREY  = [220, 220, 220]

const doc = new jsPDF({ unit: 'mm', format: 'a4' })
const W = 210   // page width mm
const H = 297   // page height mm
const ML = 18   // left margin
const MR = 18   // right margin
const TW = W - ML - MR   // text width
let y = 0

// ── helpers ───────────────────────────────────────────────────
function newPage() {
  doc.addPage()
  y = 20
  // subtle footer rule
  doc.setDrawColor(...LGREY)
  doc.setLineWidth(0.3)
  doc.line(ML, H - 12, W - MR, H - 12)
  doc.setFontSize(8)
  doc.setTextColor(...GREY)
  doc.text('FIEC Elevator — Staff Manual  |  Trial Version', ML, H - 7)
  doc.text(`Page ${doc.getNumberOfPages()}`, W - MR, H - 7, { align: 'right' })
}

function checkY(needed = 10) {
  if (y + needed > H - 20) newPage()
}

function rule(color = LGREY, lw = 0.3) {
  doc.setDrawColor(...color)
  doc.setLineWidth(lw)
  doc.line(ML, y, W - MR, y)
  y += 4
}

function gap(mm = 4) { y += mm }

function h1(text) {
  checkY(14)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK)
  doc.text(text, ML, y)
  y += 3
  rule(GOLD, 0.8)
}

function h2(text) {
  checkY(12)
  gap(2)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...DARK)
  doc.text(text, ML, y)
  y += 6
}

function h3(text) {
  checkY(10)
  gap(1)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...GOLD[0] ? GOLD : DARK)
  doc.setTextColor(GOLD[0], GOLD[1], GOLD[2])
  doc.text(text, ML, y)
  y += 5
}

function body(text, indent = 0) {
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...DARK)
  const lines = doc.splitTextToSize(text, TW - indent)
  checkY(lines.length * 5)
  doc.text(lines, ML + indent, y)
  y += lines.length * 5 + 1
}

function bullet(text, indent = 4) {
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...DARK)
  const lines = doc.splitTextToSize(text, TW - indent - 4)
  checkY(lines.length * 5 + 1)
  doc.setFillColor(...GOLD)
  doc.circle(ML + indent + 1, y - 1.2, 0.8, 'F')
  doc.text(lines, ML + indent + 4, y)
  y += lines.length * 5 + 1
}

// table: cols = [{label, width}], rows = [[cell,...]]
function table(cols, rows) {
  const rowH = 8
  const totalW = cols.reduce((a, c) => a + c.width, 0)
  checkY(rowH * (rows.length + 1) + 4)

  // header row
  let x = ML
  doc.setFillColor(...DARK)
  doc.rect(ML, y, totalW, rowH, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...GOLD)
  cols.forEach(col => {
    doc.text(col.label, x + 2, y + 5.5)
    x += col.width
  })
  y += rowH

  // data rows
  rows.forEach((row, ri) => {
    checkY(rowH + 2)
    doc.setFillColor(...(ri % 2 === 0 ? WHITE : BEIGE))
    doc.rect(ML, y, totalW, rowH, 'F')
    doc.setDrawColor(...LGREY)
    doc.setLineWidth(0.2)
    doc.rect(ML, y, totalW, rowH)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...DARK)
    x = ML
    cols.forEach((col, ci) => {
      const cell = String(row[ci] || '')
      const lines = doc.splitTextToSize(cell, col.width - 4)
      doc.text(lines[0] || '', x + 2, y + 5.5)
      x += col.width
    })
    y += rowH
  })
  y += 4
}

function codeBlock(lines) {
  const lh = 5
  const pad = 4
  checkY(lines.length * lh + pad * 2 + 4)
  doc.setFillColor(...BEIGE)
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.4)
  doc.rect(ML, y, TW, lines.length * lh + pad * 2, 'FD')
  doc.setFontSize(9)
  doc.setFont('courier', 'normal')
  doc.setTextColor(...DARK)
  lines.forEach((line, i) => {
    doc.text(line, ML + pad, y + pad + lh * i + 3.5)
  })
  y += lines.length * lh + pad * 2 + 4
}

function infoBox(text, bgColor = BEIGE) {
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const lines = doc.splitTextToSize(text, TW - 8)
  const boxH = lines.length * 5 + 8
  checkY(boxH + 2)
  doc.setFillColor(...bgColor)
  doc.setDrawColor(...GOLD)
  doc.setLineWidth(0.5)
  doc.rect(ML, y, TW, boxH, 'FD')
  doc.setTextColor(...DARK)
  doc.text(lines, ML + 4, y + 6)
  y += boxH + 4
}

// ════════════════════════════════════════════════════════════
//  COVER PAGE
// ════════════════════════════════════════════════════════════
y = 60
doc.setFillColor(...DARK)
doc.rect(0, 0, W, 50, 'F')
doc.setFillColor(...GOLD)
doc.rect(0, 50, W, 4, 'F')

doc.setFontSize(28)
doc.setFont('helvetica', 'bold')
doc.setTextColor(...GOLD)
doc.text('FIEC ELEVATOR', W / 2, 28, { align: 'center' })

doc.setFontSize(16)
doc.setFont('helvetica', 'normal')
doc.setTextColor(...WHITE)
doc.text('Staff App Manual', W / 2, 40, { align: 'center' })

doc.setFontSize(11)
doc.setFont('helvetica', 'normal')
doc.setTextColor(...GREY)
doc.text('Version: Trial / Staff Review', W / 2, y + 8, { align: 'center' })

doc.setFontSize(10)
doc.setTextColor(...DARK)
doc.text('App URL:', W / 2 - 24, y + 20, { align: 'right' })
doc.setFont('helvetica', 'bold')
doc.setTextColor(...GOLD)
doc.text('https://elevator-app-peach.vercel.app', W / 2 - 22, y + 20)

doc.setFont('helvetica', 'normal')
doc.setTextColor(...DARK)
doc.text('Login:', W / 2 - 24, y + 30, { align: 'right' })
doc.setFont('helvetica', 'bold')
doc.text('Tap "Enter App →" — no password needed', W / 2 - 22, y + 30)

// footer on cover
doc.setDrawColor(...LGREY)
doc.setLineWidth(0.3)
doc.line(ML, H - 12, W - MR, H - 12)
doc.setFontSize(8)
doc.setTextColor(...GREY)
doc.setFont('helvetica', 'normal')
doc.text('FIEC Elevator — Staff Manual  |  Trial Version', ML, H - 7)
doc.text('Page 1', W - MR, H - 7, { align: 'right' })

// ════════════════════════════════════════════════════════════
//  PAGE 2 — How to Log In + What This App Does
// ════════════════════════════════════════════════════════════
newPage()

h1('How to Log In')
gap(2)
table(
  [{ label: 'Who', width: 60 }, { label: 'How', width: TW - 60 }],
  [
    ['Staff (trial)', 'Open the app → tap "Enter App →" — no password needed'],
    ['Admin / Owner', 'Use your own email and password'],
  ]
)

gap(4)
h1('What This App Does')
body('The FIEC Elevator app manages the full lifecycle of every elevator project — from the first sales call all the way to handover and ongoing maintenance. It replaces spreadsheets, group chats, and sticky notes with one system everyone can see.')

gap(4)
h1('Who Uses It')
table(
  [{ label: 'Role', width: 60 }, { label: 'What They Can See', width: TW - 60 }],
  [
    ['Admin (Owner / Boss)', 'Everything — including prices, contracts, finance, invoices'],
    ['Operations Staff', 'Projects, jobs, breakdowns, customers — no prices or billing'],
  ]
)

// ════════════════════════════════════════════════════════════
//  PAGE 3 — Project Flow
// ════════════════════════════════════════════════════════════
newPage()
h1('The Big Picture — How a Project Flows')
gap(2)
codeBlock([
  'New Client Inquiry',
  '       |',
  '  Add Customer',
  '       |',
  '  Start Pipeline  <--- 12-step checklist (drawings -> payment -> shipping -> install -> handover)',
  '       |',
  '  Step 5 Complete (Payment to Supplier)',
  '       |',
  '  Auto-added to Project Status <--- Team tracks progress here daily',
  '       |',
  '  Project Complete -> Handover Documents generated',
  '       |',
  '  Maintenance Contract (AMC) created',
  '       |',
  '  Monthly Service Visits scheduled',
  '       |',
  '  Breakdown Calls logged if issues arise',
])

// ════════════════════════════════════════════════════════════
//  PAGE 4 — Module Guide
// ════════════════════════════════════════════════════════════
newPage()
h1('Module Guide')

h2('1. Dashboard')
body('Who uses it: Everyone, every day')
body('What it shows:')
bullet('Active alerts (breakdowns, stalled projects, payments due)')
bullet('Needs Attention items — things that need someone to act')
bullet('Recently confirmed items — what got resolved')
gap(2)
body('How to use:')
bullet('Check this first thing every morning')
bullet('Add action items for the team using the text box')
bullet('Click the bell (top of sidebar) for all alerts')

gap(4)
h2('2. Customers')
body('Who uses it: Admin, Operations')
body('What it does: Stores all client information — name, address, contact, buildings, elevators')
gap(2)
body('When to use:')
bullet('When a new client signs a contract — Add them here first')
bullet('Before starting a pipeline or maintenance contract, the customer must exist')

gap(4)
h2('3. New Installations (Pipeline)')
body('Who uses it: Admin starts it, Operations updates steps')
body('What it does: Tracks a new elevator installation through 12 steps from award to handover')

// ════════════════════════════════════════════════════════════
//  PAGE 5 — 12 Steps
// ════════════════════════════════════════════════════════════
newPage()
h2('The 12 Pipeline Steps')
gap(2)
table(
  [{ label: 'Step', width: 20 }, { label: 'Name', width: 70 }, { label: 'Notes', width: TW - 90 }],
  [
    ['1', 'Project Awarded', 'Admin confirms'],
    ['2', 'Shop Drawings Prepared', 'Upload drawings file'],
    ['3', 'Client Signs Drawings', 'Upload signed copy'],
    ['4', 'Engineer Approval', 'Upload approval'],
    ['5', 'Payment to Supplier', 'Triggers Project Status entry'],
    ['6', 'Production Started', 'Enter expected end date'],
    ['7', 'Production Monitoring', 'Checkpoint'],
    ['8', 'Shipment', 'Enter tracking number'],
    ['9', 'Customs & Arrival', 'Confirm arrival'],
    ['10', 'Installation', 'Confirm on site'],
    ['11', 'Testing', 'Upload test results'],
    ['12', 'Turnover to Client', 'Final handover'],
  ]
)
gap(2)
body('Rules:')
bullet('Each step must be completed before the next unlocks')
bullet('Steps that need a file — you must upload the document')
bullet('Admin can override a locked step if urgent (logged automatically)')
bullet('Only the assigned role can complete each step')

// ════════════════════════════════════════════════════════════
//  PAGE 6 — Project Status
// ════════════════════════════════════════════════════════════
newPage()
h2('4. Project Status')
body('Who uses it: Operations team daily')
body('What it does: Shows all active installation projects and their current status')
gap(2)
table(
  [{ label: 'Status', width: 60 }, { label: 'Meaning', width: TW - 60 }],
  [
    ['On-Going Production', 'Elevator being manufactured'],
    ['On-Going Installation', 'On-site installation in progress'],
    ['For Permits', 'Waiting for government permits'],
    ['For Inspection', 'Awaiting inspector visit'],
    ['For Handover', 'Ready to hand to client'],
    ['Handed Over', 'Complete'],
    ['On Hold', 'Paused for any reason'],
    ['Breakdown', 'Emergency issue on site'],
  ]
)
gap(2)
body('How to use:')
bullet('Update the status whenever something changes')
bullet('Set a Next Action + due date so the team knows what happens next')
bullet('Assign a PIC (Person In Charge) to every project')
bullet('Use the Timeline view to see all projects on a calendar')

gap(4)
h2('5. Maintenance Contracts (AMC)')
body('AMC = Annual Maintenance Contract')
body('Who uses it: Admin manages, Operations views')
body('What it does: Stores all maintenance agreements — how often visits happen, how much it costs, when it expires')
gap(2)
body('Renewal Tracking — when a contract is close to expiry (within 60 days), a Renewal Tracking panel appears. Update the status as you go:')
gap(1)
codeBlock(['Not started -> Client contacted -> In negotiation -> Proposal sent -> Renewed'])
gap(2)
body('AMC Billing: Go to AMC Billing in the sidebar to see which clients need to be billed this month. Mark each one as Billed then Paid.')

// ════════════════════════════════════════════════════════════
//  PAGE 7 — Service Visits, Breakdown, Finance
// ════════════════════════════════════════════════════════════
newPage()
h2('6. Service Visits (Jobs)')
body('Who uses it: Operations, Technicians')
body('What it does: Logs every scheduled maintenance visit — who went, when, what was done')
gap(2)
body('How to use:')
bullet('When a visit is scheduled, add a new job')
bullet('After the visit, mark it complete and add notes')
bullet('This feeds into the reports at end of month')

gap(4)
h2('7. Breakdown Calls')
body('Who uses it: Everyone')
body('What it does: Logs emergency breakdowns — which elevator, what happened, who responded')
gap(2)
body('Priority levels:')
bullet('Critical — elevator stuck with passengers / hospital / fire escape')
bullet('High — elevator stopped, no passengers stuck')
bullet('Medium — partial issue, still running')
bullet('Low — minor complaint, cosmetic')
gap(2)
body('How to use:')
bullet('Log it immediately when a client calls')
bullet('Assign to a technician')
bullet('Update status as it progresses: Open -> In Progress -> Resolved')

gap(4)
h2('8. Finance / Invoices / Reports')
body('Who uses it: Admin only')
body('What it does: Billing milestones, invoice tracking, revenue reports. These pages show a watermark and are access-logged for security.')

gap(4)
h2('9. Admin Audit')
body('Who uses it: Admin only')
body('What it does: Shows a log of who accessed sensitive pages, what changes were made to projects, and AMC activity. Use this to monitor staff activity.')

// ════════════════════════════════════════════════════════════
//  PAGE 8 — Team Workflow
// ════════════════════════════════════════════════════════════
newPage()
h1('How the Team Works Together')
gap(2)
codeBlock([
  'OWNER / ADMIN',
  '  - Approves pipeline steps (Step 1, 3, 11, 12)',
  '  - Sets contract amounts (hidden from staff)',
  '  - Handles finance, invoices, billing',
  '  - Monitors Admin Audit log',
  '  - Approves or denies deletion requests',
  '',
  'OPERATIONS TEAM (Chel, Vic, Jose, Isza, Jonathan)',
  '  - Updates Project Status daily',
  '  - Completes pipeline steps assigned to them',
  '  - Logs service visits after each job',
  '  - Logs breakdown calls immediately',
  '  - Adds Needs Attention items on Dashboard',
  '',
  'EVERYONE',
  '  - Checks Dashboard every morning',
  '  - Updates their assigned projects',
  '  - Adds comments and notes on any project',
])

// ════════════════════════════════════════════════════════════
//  PAGE 9 — Notification Bell
// ════════════════════════════════════════════════════════════
newPage()
h1('Notification Bell (Top of Sidebar)')
body('The bell shows automatic alerts. Red number = alerts waiting.')
gap(2)
table(
  [{ label: 'Alert', width: 70 }, { label: 'What it means', width: TW - 70 }],
  [
    ['Pre-Shipment Payment Due', 'A production project is past 23 days — client needs to pay'],
    ['Deletion Requests', 'Staff asked to delete a project — boss approves or denies'],
    ['No Update in 7+ Days', "A project hasn't been touched — needs attention"],
    ['Next Actions Due', 'Someone set a next action and it is past due'],
    ['Warranty Expiring', 'Maintenance end date is within 7 days'],
    ['AMC Expiring Soon', 'A maintenance contract expires within 30 days'],
    ['AMC Renewal Needed', 'Contract expired, no renewal action taken'],
  ]
)

// ════════════════════════════════════════════════════════════
//  PAGE 10 — Quick Reference
// ════════════════════════════════════════════════════════════
newPage()
h1('Common Tasks — Quick Reference')
gap(2)
table(
  [{ label: 'Task', width: 80 }, { label: 'Where to go', width: TW - 80 }],
  [
    ['Add a new client', 'Customers -> New Customer'],
    ['Start a new installation', 'New Installations -> Start Pipeline'],
    ['Update a project status', 'Project Status -> click project -> change status'],
    ['Log a breakdown', 'Breakdown Calls -> New Breakdown'],
    ['Schedule a service visit', 'Service Visits -> New Job'],
    ['Add a maintenance contract', 'Maintenance Contracts -> New Contract'],
    ['Generate handover documents', 'Project Status -> project -> Handover Documents'],
    ['Check who needs billing this month', 'AMC Billing (sidebar)'],
    ['See all projects on a timeline', 'Project Status -> Timeline'],
    ['Check what alerts are pending', 'Click the bell icon in the sidebar'],
  ]
)

gap(6)
infoBox('TRIAL MODE NOTICE\n\nDuring the staff review period:\n- Project names are shown as "Project 0421" (real names hidden)\n- Contact numbers show as "Hidden during trial"\n- Document uploads in the pipeline are optional\n\nThese will all be restored when the app goes live.')

gap(6)
doc.setFillColor(...DARK)
doc.rect(ML, y, TW, 14, 'F')
doc.setFontSize(10)
doc.setFont('helvetica', 'normal')
doc.setTextColor(...GOLD)
doc.text('Questions or issues? Contact the admin.', ML + 4, y + 6)
doc.setTextColor(200, 200, 200)
doc.text('Do not delete records — use "Request Deletion" so the admin can approve.', ML + 4, y + 11.5)

// ════════════════════════════════════════════════════════════
//  WRITE FILE
// ════════════════════════════════════════════════════════════
const buf = Buffer.from(doc.output('arraybuffer'))
fs.writeFileSync(OUT, buf)
console.log('PDF written to:', OUT)
console.log('Pages:', doc.getNumberOfPages())
