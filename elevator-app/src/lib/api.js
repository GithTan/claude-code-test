import { supabase } from './supabase'

// ─── Direct REST fetch (bypasses Supabase JS session lock) ───────────────────
const _url = import.meta.env.VITE_SUPABASE_URL
const _key = import.meta.env.VITE_SUPABASE_ANON_KEY
let _tok = _key
let _viewerRole = null

export function _setAuthToken(token) { _tok = token || _key }
export function _setViewerRole(role) { _viewerRole = role || null }

function isAdminViewer() {
  return _viewerRole === 'admin'
}

function forbiddenForNonAdmin(message = 'Admin access required.') {
  return Promise.resolve({ data: null, error: { message } })
}

function rest(path, opts = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 12000)
  const headers = {
    apikey: _key,
    Authorization: `Bearer ${_tok}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    ...opts.headers,
  }
  return fetch(`${_url}/rest/v1${path}`, { ...opts, headers, signal: ctrl.signal })
    .then(async r => {
      clearTimeout(timer)
      if (!r.ok) {
        const e = await r.json().catch(() => ({ message: r.statusText }))
        return { data: null, error: e }
      }
      return { data: await r.json(), error: null }
    })
    .catch(e => {
      clearTimeout(timer)
      return { data: null, error: { message: e.name === 'AbortError' ? 'Request timed out' : e.message } }
    })
}

// Unwrap array → single record
async function restOne(path) {
  const { data, error } = await rest(path)
  if (error) return { data: null, error }
  return { data: Array.isArray(data) ? data[0] ?? null : data, error: null }
}

// POST → single record
async function restPost(path, body) {
  const { data, error } = await rest(path, { method: 'POST', body: JSON.stringify(body) })
  if (error) return { data: null, error }
  return { data: Array.isArray(data) ? data[0] : data, error: null }
}

// PATCH → single record
async function restPatch(path, body) {
  const { data, error } = await rest(path, { method: 'PATCH', body: JSON.stringify(body) })
  if (error) return { data: null, error }
  return { data: Array.isArray(data) ? data[0] : data, error: null }
}

// DELETE
function restDelete(path) {
  return rest(path, { method: 'DELETE', headers: { Prefer: '' } })
}

// ─── Profile ─────────────────────────────────────────────────────────────────
export async function getProfile(userId) {
  return restOne(`/profiles?select=role,full_name&id=eq.${userId}`)
}

// ─── Customers ───────────────────────────────────────────────────────────────
export async function getCustomers() {
  return rest('/customers?select=*&order=name.asc')
}
export async function getCustomer(id) {
  return restOne(`/customers?select=*&id=eq.${id}`)
}
export async function createCustomer(data) {
  return restPost('/customers', data)
}
export async function updateCustomer(id, data) {
  return restPatch(`/customers?id=eq.${id}`, data)
}
export async function deleteCustomer(id) {
  return restDelete(`/customers?id=eq.${id}`)
}

// ─── Buildings ───────────────────────────────────────────────────────────────
export async function getBuildings(customerId) {
  return rest(`/buildings?select=*&customer_id=eq.${customerId}&order=name.asc`)
}
export async function getBuilding(id) {
  return restOne(`/buildings?select=*&id=eq.${id}`)
}
export async function createBuilding(data) {
  return restPost('/buildings', data)
}
export async function updateBuilding(id, data) {
  return restPatch(`/buildings?id=eq.${id}`, data)
}

// ─── Elevators ───────────────────────────────────────────────────────────────
export async function getElevators(buildingId) {
  return rest(`/elevators?select=*&building_id=eq.${buildingId}&order=unit_number.asc`)
}
export async function getAllElevators() {
  return rest('/elevators?select=*,buildings(name,customers(name))&order=unit_number.asc')
}
export async function getElevator(id) {
  return restOne(`/elevators?select=*&id=eq.${id}`)
}
export async function createElevator(data) {
  return restPost('/elevators', data)
}
export async function updateElevator(id, data) {
  return restPatch(`/elevators?id=eq.${id}`, data)
}

// ─── Maintenance Schedules ───────────────────────────────────────────────────
export async function getMaintenanceSchedules(elevatorId) {
  return rest(`/maintenance_schedules?select=*&elevator_id=eq.${elevatorId}&order=next_due_date.asc`)
}
export async function getAllMaintenanceSchedules() {
  return rest('/maintenance_schedules?select=*,elevators(unit_number,buildings(name,customers(name)))&order=next_due_date.asc')
}
export async function createMaintenanceSchedule(data) {
  return restPost('/maintenance_schedules', data)
}
export async function updateMaintenanceSchedule(id, data) {
  return restPatch(`/maintenance_schedules?id=eq.${id}`, data)
}

// ─── Jobs ────────────────────────────────────────────────────────────────────
export async function getJobs() {
  return rest('/jobs?select=*,elevators(unit_number,buildings(name,customers(name))),maintenance_schedules(visit_type)&order=scheduled_date.desc')
}
export async function getJob(id) {
  return restOne(`/jobs?select=*&id=eq.${id}`)
}
export async function createJob(data) {
  return restPost('/jobs', data)
}
export async function updateJob(id, data) {
  return restPatch(`/jobs?id=eq.${id}`, data)
}

// ─── Invoices ────────────────────────────────────────────────────────────────
export async function getInvoices() {
  if (!isAdminViewer()) return forbiddenForNonAdmin()
  return rest('/invoices?select=*,customers(name)&order=issue_date.desc')
}
export async function getInvoice(id) {
  if (!isAdminViewer()) return forbiddenForNonAdmin()
  return restOne(`/invoices?select=*,customers(name),invoice_items(*),payments(*),jobs(elevators(unit_number))&id=eq.${id}`)
}
export async function createInvoice(data) {
  return restPost('/invoices', data)
}
export async function updateInvoice(id, data) {
  return restPatch(`/invoices?id=eq.${id}`, data)
}
export async function createInvoiceItem(data) {
  return restPost('/invoice_items', data)
}
export async function deleteInvoiceItem(id) {
  return restDelete(`/invoice_items?id=eq.${id}`)
}
export async function createPayment(data) {
  return restPost('/payments', data)
}
export async function deletePayment(id) {
  return restDelete(`/payments?id=eq.${id}`)
}

// ─── Installation Projects ───────────────────────────────────────────────────
export async function getProjects() {
  if (!isAdminViewer()) return forbiddenForNonAdmin()
  return rest('/installation_projects?select=*,customers(name)&order=created_at.desc')
}
export async function getProject(id) {
  if (!isAdminViewer()) return forbiddenForNonAdmin()
  return restOne(`/installation_projects?select=*,customers(name),payment_milestones(*)&id=eq.${id}`)
}
export async function createProject(data) {
  return restPost('/installation_projects', data)
}
export async function updateProject(id, data) {
  return restPatch(`/installation_projects?id=eq.${id}`, data)
}
export async function createMilestone(data) {
  return restPost('/payment_milestones', data)
}
export async function updateMilestone(id, data) {
  return restPatch(`/payment_milestones?id=eq.${id}`, data)
}
export async function deleteMilestone(id) {
  return restDelete(`/payment_milestones?id=eq.${id}`)
}

// ─── Reports ─────────────────────────────────────────────────────────────────
export async function getOverdueMaintenance() {
  const today = new Date().toISOString().split('T')[0]
  return rest(`/maintenance_schedules?select=*,elevators(unit_number,buildings(name,customers(name)))&next_due_date=lt.${today}&order=next_due_date.asc`)
}
export async function getJobsThisMonth() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  return rest(`/jobs?select=*,elevators(unit_number,buildings(name,customers(name))),maintenance_schedules(visit_type)&status=eq.completed&completed_date=gte.${start}&completed_date=lte.${end}&order=completed_date.desc`)
}
export async function getTechnicianSummary() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  return rest(`/jobs?select=technician_name,status,completed_date&scheduled_date=gte.${start}&order=technician_name.asc`)
}
export async function getElevatorStatusOverview() {
  return rest('/elevators?select=status,buildings(name,customers(name))&order=status.asc')
}
export async function getUnpaidInvoices() {
  if (!isAdminViewer()) return forbiddenForNonAdmin()
  return rest('/invoices?select=*,customers(name)&status=in.(unpaid,partially_paid)&order=due_date.asc')
}
export async function getPaymentHistory() {
  if (!isAdminViewer()) return forbiddenForNonAdmin()
  return rest('/payments?select=*,invoices(invoice_number,customers(name))&order=payment_date.desc')
}
export async function getMonthlyRevenue() {
  if (!isAdminViewer()) return forbiddenForNonAdmin()
  return rest('/payments?select=amount,payment_date&order=payment_date.desc')
}

// ─── AMC Contracts ───────────────────────────────────────────────────────────
export async function getAmcContracts() {
  if (isAdminViewer()) {
    return rest('/amc_contracts?select=*,customers(name)&order=end_date.asc')
  }
  return rest('/amc_contracts?select=id,customer_id,project_name,contact_name,contract_type,start_date,end_date,billing_frequency,coverage_notes,status,renewal_negotiation_status,contract_number,renewal_status,renewal_notes,customers(name)&order=end_date.asc')
}
export async function getAmcContract(id) {
  if (isAdminViewer()) {
    return restOne(`/amc_contracts?select=*,customers(name)&id=eq.${id}`)
  }
  return restOne(`/amc_contracts?select=id,customer_id,project_name,contact_name,contract_type,start_date,end_date,billing_frequency,coverage_notes,status,renewal_negotiation_status,contract_number,renewal_status,renewal_notes,customers(name)&id=eq.${id}`)
}
export async function getAmcActivity(amcContractId) {
  return rest(`/amc_activity?amc_contract_id=eq.${amcContractId}&order=performed_at.desc&limit=50`)
}
export async function getRecentAmcActivity() {
  if (!isAdminViewer()) return forbiddenForNonAdmin()
  return rest('/amc_activity?select=*,amc_contracts(contract_number,project_name,customers(name))&order=performed_at.desc&limit=100')
}
export async function logAmcActivity(amcContractId, action, details, performedBy) {
  return restPost('/amc_activity', {
    amc_contract_id: amcContractId,
    action,
    details: details || null,
    performed_by: performedBy || null,
    performed_at: new Date().toISOString(),
  })
}
export async function createAmcContract(data) {
  return restPost('/amc_contracts', data)
}
export async function updateAmcContract(id, data) {
  return restPatch(`/amc_contracts?id=eq.${id}`, data)
}
export async function getExpiringAmcContracts() {
  const today = new Date().toISOString().split('T')[0]
  const in60days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  return rest(`/amc_contracts?select=*,customers(name)&status=eq.active&end_date=lte.${in60days}&end_date=gte.${today}&order=end_date.asc`)
}

export async function getAmcBillingRecords(billingMonth) {
  return rest(`/amc_billing_records?select=*,amc_contracts(contract_number,project_name,customer_id,customers(name))&billing_month=eq.${billingMonth}&order=created_at.asc`)
}

export async function createAmcBillingRecord(data) {
  return restPost('/amc_billing_records', data)
}

export async function updateAmcBillingRecord(id, data) {
  return restPatch(`/amc_billing_records?id=eq.${id}`, data)
}

export async function getAmcBillingTrackerMonth(billingMonth) {
  const [contractsRes, recordsRes] = await Promise.all([
    getAmcContracts(),
    getAmcBillingRecords(billingMonth),
  ])

  if (contractsRes.error) return { data: null, error: contractsRes.error }
  if (recordsRes.error) return { data: null, error: recordsRes.error }

  const monthStart = new Date(`${billingMonth}T00:00:00`)
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)
  const recordsByContract = new Map((recordsRes.data || []).map(record => [record.amc_contract_id, record]))

  const activeContracts = (contractsRes.data || []).filter(contract => {
    if (contract.status !== 'active') return false
    if (!contract.start_date || !contract.end_date) return true

    const start = new Date(`${contract.start_date}T00:00:00`)
    const end = new Date(`${contract.end_date}T00:00:00`)
    return start <= monthEnd && end >= monthStart
  })

  const rows = activeContracts.map(contract => {
    const record = recordsByContract.get(contract.id)
    return {
      contract,
      record: record || null,
      amount: Number(record?.amount ?? contract.monthly_fee ?? 0),
      status: record?.status || 'pending',
    }
  })

  return { data: rows, error: null }
}

export async function markAmcBillingStatus(contract, billingMonth, nextStatus, performedBy) {
  const { data: existing, error } = await restOne(`/amc_billing_records?select=*&amc_contract_id=eq.${contract.id}&billing_month=eq.${billingMonth}`)
  if (error) return { data: null, error }

  const now = new Date().toISOString()
  const payload = {
    amount: Number(existing?.amount ?? contract.monthly_fee ?? 0),
    status: nextStatus,
    updated_at: now,
  }

  if (nextStatus === 'billed') {
    payload.billed_at = existing?.billed_at || now
    payload.paid_at = existing?.status === 'paid' ? existing.paid_at : null
  }

  if (nextStatus === 'paid') {
    payload.billed_at = existing?.billed_at || now
    payload.paid_at = now
  }

  if (nextStatus === 'pending') {
    payload.billed_at = null
    payload.paid_at = null
  }

  const previousStatus = existing?.status || 'pending'
  const result = existing?.id
    ? await updateAmcBillingRecord(existing.id, payload)
    : await createAmcBillingRecord({
    amc_contract_id: contract.id,
    billing_month: billingMonth,
    ...payload,
  })

  if (!result.error && performedBy && previousStatus !== nextStatus) {
    await logAmcActivity(
      contract.id,
      'billing_status_updated',
      `Monthly billing for ${billingMonth} changed from ${previousStatus} to ${nextStatus}.`,
      performedBy
    )
  }

  return result
}

// ─── Breakdowns ──────────────────────────────────────────────────────────────
export async function getBreakdowns() {
  return rest('/breakdowns?select=*,elevators(unit_number,buildings(name,customers(name)))&order=reported_date.desc')
}
export async function getBreakdown(id) {
  return restOne(`/breakdowns?select=*,elevators(unit_number,buildings(name,customers(name)))&id=eq.${id}`)
}
export async function createBreakdown(data) {
  return restPost('/breakdowns', data)
}
export async function updateBreakdown(id, data) {
  return restPatch(`/breakdowns?id=eq.${id}`, data)
}
export async function getOpenBreakdowns() {
  return rest('/breakdowns?select=*,elevators(unit_number,buildings(name,customers(name)))&status=in.(open,in_progress)&order=priority.asc')
}
export async function getBreakdownPatterns() {
  // Returns all breakdowns with elevator+building+customer for pattern analysis
  return rest('/breakdowns?select=id,reported_date,priority,status,description,elevators(id,unit_number,buildings(id,name,customers(name)))&order=reported_date.desc')
}

// ─── Pipeline Tracker ───────────────────────────────────────────────────────

export const PIPELINE_STEPS = [
  { number: 1,  label: 'Project Awarded',         gate: 'confirm_with_data',     role: 'admin' },
  { number: 2,  label: 'Shop Drawings Prepared',  gate: 'file_required',         role: 'admin' },
  { number: 3,  label: 'Client Signs Drawings',   gate: 'file_required',         role: 'admin' },
  { number: 4,  label: 'Engineer Approval',        gate: 'file_required',         role: 'coordinator' },
  { number: 5,  label: 'Payment to Supplier',     gate: 'file_required',         role: 'coordinator' },
  { number: 6,  label: 'Production Started',      gate: 'date_entry',            role: 'coordinator' },
  { number: 7,  label: 'Production Monitoring',   gate: 'checkpoint',            role: 'coordinator' },
  { number: 8,  label: 'Shipment',                gate: 'tracking_entry',        role: 'coordinator' },
  { number: 9,  label: 'Customs & Arrival',       gate: 'confirm_optional_file', role: 'coordinator' },
  { number: 10, label: 'Installation',            gate: 'confirm_optional_file', role: 'operations' },
  { number: 11, label: 'Testing',                 gate: 'file_required',         role: 'admin' },
  { number: 12, label: 'Turnover to Client',      gate: 'file_required',         role: 'admin' },
]

export const PROJECT_TYPES = [
  { value: 'new_installation', label: 'New Installation' },
  { value: 'modernization',    label: 'Modernization' },
  { value: 'escalator',        label: 'Escalator Installation' },
  { value: 'dismantle_install', label: 'Dismantle + Install New' },
]

export const PIPELINE_STAGES = [
  { label: 'Drawings',              steps: [1, 2, 3, 4] },
  { label: 'Payment & Production',  steps: [5, 6, 7] },
  { label: 'Shipping',              steps: [8, 9] },
  { label: 'Installation',          steps: [10, 11] },
  { label: 'Complete',              steps: [12] },
]

export async function getPipelines() {
  return rest('/pipelines?select=id,project_type,elevator_type,home_elevator_type,with_structure,unit_count,current_step,status,installation_projects(project_name,customers(name)),pipeline_steps(id,step_number,status,unlocked_at)&order=created_at.desc')
}

export async function getPipeline(id) {
  if (isAdminViewer()) {
    return restOne(`/pipelines?select=*,installation_projects(project_name,contract_amount,vat_inclusive,customers(name)),pipeline_steps(*,pipeline_attachments(*))&id=eq.${id}`)
  }
  return restOne(`/pipelines?select=*,installation_projects(project_name,customers(name)),pipeline_steps(*,pipeline_attachments(*))&id=eq.${id}`)
}

export async function createPipeline(data) {
  return restPost('/pipelines', data)
}

export async function createPipelineSteps(pipelineId) {
  const steps = PIPELINE_STEPS.map(s => ({
    pipeline_id: pipelineId,
    step_number: s.number,
    status: s.number === 1 ? 'unlocked' : 'locked',
    assigned_role: s.role,
    unlocked_at: s.number === 1 ? new Date().toISOString() : null,
  }))
  return rest('/pipeline_steps', { method: 'POST', body: JSON.stringify(steps) })
}

export async function completeStep(stepId, { notes, data }) {
  return rest(`/pipeline_steps?id=eq.${stepId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'completed', completed_at: new Date().toISOString(), notes, data }),
  })
}

export async function unlockNextStep(pipelineId, nextStepNumber) {
  return rest(`/pipeline_steps?pipeline_id=eq.${pipelineId}&step_number=eq.${nextStepNumber}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'unlocked', unlocked_at: new Date().toISOString() }),
  })
}

export async function updatePipelineCurrentStep(pipelineId, stepNumber) {
  const updates = { current_step: stepNumber, updated_at: new Date().toISOString() }
  if (stepNumber > PIPELINE_STEPS.length) updates.status = 'completed'
  return rest(`/pipelines?id=eq.${pipelineId}`, { method: 'PATCH', body: JSON.stringify(updates) })
}

export async function overrideGate(pipelineId, stepId, reason) {
  const { error } = await rest(`/pipeline_steps?id=eq.${stepId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'unlocked', unlocked_at: new Date().toISOString() }),
  })
  if (error) return { data: null, error }
  return logActivity(pipelineId, stepId, 'gate_overridden', reason, {})
}

export async function logActivity(pipelineId, stepId, action, notes, metadata) {
  return rest('/pipeline_activity_log', {
    method: 'POST',
    body: JSON.stringify({ pipeline_id: pipelineId, pipeline_step_id: stepId, action, notes, metadata }),
  })
}

export async function getPipelineActivity(pipelineId) {
  return rest(`/pipeline_activity_log?pipeline_id=eq.${pipelineId}&order=performed_at.desc`)
}

export async function uploadPipelineFile(stepId, file) {
  const path = `${stepId}/${Date.now()}-${file.name}`
  const { data, error } = await supabase.storage.from('pipeline-files').upload(path, file)
  if (error) return { data: null, error }
  return rest('/pipeline_attachments', {
    method: 'POST',
    body: JSON.stringify({ pipeline_step_id: stepId, file_name: file.name, file_path: path }),
  })
}

export async function getPipelineFileUrl(filePath) {
  return supabase.storage.from('pipeline-files').createSignedUrl(filePath, 3600)
}

export async function deletePipeline(id) {
  return rest(`/pipelines?id=eq.${id}`, { method: 'DELETE', headers: { Prefer: '' } })
}

export async function resetPipelineToStep(pipelineId, stepNumber) {
  // Lock all steps after stepNumber and clear their completion data
  await rest(
    `/pipeline_steps?pipeline_id=eq.${pipelineId}&step_number=gt.${stepNumber}`,
    { method: 'PATCH', body: JSON.stringify({ status: 'locked', unlocked_at: null, completed_at: null, notes: null }) }
  )
  // Reset the target step to unlocked
  await rest(
    `/pipeline_steps?pipeline_id=eq.${pipelineId}&step_number=eq.${stepNumber}`,
    { method: 'PATCH', body: JSON.stringify({ status: 'unlocked', unlocked_at: new Date().toISOString(), completed_at: null, notes: null }) }
  )
  // Update pipeline current step
  return rest(`/pipelines?id=eq.${pipelineId}`, {
    method: 'PATCH',
    body: JSON.stringify({ current_step: stepNumber, status: 'active', updated_at: new Date().toISOString() }),
  })
}

// ─── Operations Projects ──────────────────────────────────────────────────────
export async function getOpsProjects() {
  // Note: project_units join requires phase2b-schema.sql to be run first.
  // Falls back to plain select if join fails (ops_project_id column missing).
  const withUnits = await rest('/ops_projects?select=*,project_units(unit_number,unit_label,specs,brand,drive_type,use_type,stops,openings,floors)&order=created_at.desc')
  if (withUnits.error) {
    return rest('/ops_projects?select=*&order=created_at.desc')
  }
  return withUnits
}
export async function getOpsProject(id) {
  return restOne(`/ops_projects?select=*&id=eq.${id}`)
}
export async function createOpsProject(data) {
  return restPost('/ops_projects', data)
}
export async function updateOpsProject(id, data) {
  return restPatch(`/ops_projects?id=eq.${id}`, data)
}
export async function deleteOpsProject(id) {
  return restDelete(`/ops_projects?id=eq.${id}`)
}

// ─── Alerts ──────────────────────────────────────────────────────────────────
export async function getAlerts() {
  const prodCutoff = new Date(Date.now() - 23 * 86400000).toISOString().split('T')[0]
  const overdueCutoff = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  const today = new Date().toISOString().split('T')[0]
  const escalationCutoff = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0]
  const [prod, del, overdue, nextActionDue, escalations] = await Promise.all([
    rest(`/ops_projects?select=id,project_name,production_start_date&status=eq.on_going_production&production_start_date=lte.${prodCutoff}&deletion_pending=eq.false`),
    rest('/ops_projects?select=id,project_name,deletion_requested_by,deletion_requested_at&deletion_pending=eq.true'),
    rest(`/ops_projects?select=id,project_name,last_updated_at,status&last_updated_at=lte.${overdueCutoff}&status=neq.handed_over&deletion_pending=eq.false`),
    rest(`/ops_projects?select=id,project_name,next_action,next_action_date,assigned_to&next_action_date=lte.${today}&next_action=not.is.null&status=neq.handed_over`),
    rest(`/ops_projects?select=id,project_name,next_action,next_action_date,assigned_to,owner_role&next_action_date=lte.${escalationCutoff}&next_action=not.is.null&status=neq.handed_over`),
  ])
  const production = prod.data || []
  const deletions = del.data || []
  const overdueUpdates = overdue.data || []
  const actionsDue = nextActionDue.data || []
  const escalated = escalations.data || []
  return {
    production,
    deletions,
    overdueUpdates,
    actionsDue,
    escalated,
    total: production.length + deletions.length + overdueUpdates.length + actionsDue.length + escalated.length,
  }
}

// Deletion approval flow
export async function requestDeletion(id, requestedBy) {
  return restPatch(`/ops_projects?id=eq.${id}`, {
    deletion_pending: true,
    deletion_requested_by: requestedBy,
    deletion_requested_at: new Date().toISOString(),
  })
}
export async function approveDeletion(id) {
  return restDelete(`/ops_projects?id=eq.${id}`)
}
export async function denyDeletion(id) {
  return restPatch(`/ops_projects?id=eq.${id}`, {
    deletion_pending: false,
    deletion_requested_by: null,
    deletion_requested_at: null,
  })
}

// ─── Project Units (per-unit specs) ──────────────────────────────────────────
export async function getProjectUnits(pipelineId) {
  return rest(`/project_units?pipeline_id=eq.${pipelineId}&order=unit_number.asc`)
}
export async function getOpsProjectUnits(opsProjectId) {
  return rest(`/project_units?ops_project_id=eq.${opsProjectId}&order=unit_number.asc`)
}
export async function createProjectUnits(units) {
  return rest('/project_units', { method: 'POST', body: JSON.stringify(units) })
}
export async function updateProjectUnit(id, data) {
  return restPatch(`/project_units?id=eq.${id}`, data)
}
export async function deleteProjectUnit(id) {
  return restDelete(`/project_units?id=eq.${id}`)
}
export async function deleteOpsProjectUnits(opsProjectId) {
  return restDelete(`/project_units?ops_project_id=eq.${opsProjectId}`)
}

// ─── Action Items (Needs to be Addressed) ────────────────────────────────────
export async function getActionItems() {
  const now = new Date().toISOString()
  return rest(`/action_items?is_active=eq.true&or=(expires_at.gt.${encodeURIComponent(now)},expires_at.is.null)&order=created_at.desc`)
}
export async function createActionItem(text, createdByName) {
  const expiresAt = new Date(Date.now() + 3 * 86400000).toISOString()
  return restPost('/action_items', { text, created_by_name: createdByName, expires_at: expiresAt, is_active: true })
}
export async function getRecentlyConfirmedItems() {
  const since = new Date(Date.now() - 1 * 86400000).toISOString()
  return rest(`/action_items?is_active=eq.false&checked_at=gte.${encodeURIComponent(since)}&order=checked_at.desc&limit=10`)
}

export async function checkOffActionItem(id, checkedByName) {
  return restPatch(`/action_items?id=eq.${id}`, {
    is_active: false,
    checked_by_name: checkedByName,
    checked_at: new Date().toISOString(),
  })
}

// ─── Finished Projects ────────────────────────────────────────────────────────
export async function getFinishedOpsProjects() {
  return rest('/ops_projects?select=*&status=eq.handed_over&order=handed_over_date.desc')
}

// ─── Activity Log ─────────────────────────────────────────────────────────────
export async function getProjectActivity(opsProjectId) {
  return rest(`/project_activity?ops_project_id=eq.${opsProjectId}&order=performed_at.desc&limit=50`)
}
export async function getRecentProjectActivity() {
  if (!isAdminViewer()) return forbiddenForNonAdmin()
  return rest('/project_activity?select=*,ops_projects(project_name)&order=performed_at.desc&limit=100')
}
export async function logProjectActivity(opsProjectId, action, details, performedBy) {
  return restPost('/project_activity', {
    ops_project_id: opsProjectId,
    action,
    details: details || null,
    performed_by: performedBy || null,
    performed_at: new Date().toISOString(),
  })
}

export async function logSensitivePageAccess(pageKey, pageLabel, pagePath, viewedBy, role) {
  return restPost('/sensitive_page_access', {
    page_key: pageKey,
    page_label: pageLabel,
    page_path: pagePath,
    viewed_by: viewedBy || null,
    viewer_role: role || null,
    viewed_at: new Date().toISOString(),
  })
}
export async function getSensitivePageAccess() {
  if (!isAdminViewer()) return forbiddenForNonAdmin()
  return rest('/sensitive_page_access?select=*&order=viewed_at.desc&limit=100')
}

// ─── Comments ─────────────────────────────────────────────────────────────────
export async function getProjectComments(opsProjectId) {
  return rest(`/project_comments?ops_project_id=eq.${opsProjectId}&order=created_at.desc`)
}
export async function addProjectComment(opsProjectId, comment, author) {
  return restPost('/project_comments', {
    ops_project_id: opsProjectId,
    comment,
    author,
    created_at: new Date().toISOString(),
  })
}
export async function deleteProjectComment(id) {
  return restDelete(`/project_comments?id=eq.${id}`)
}

// ─── Billing Milestones ───────────────────────────────────────────────────────
export async function getBillingMilestones(opsProjectId) {
  return rest(`/billing_milestones?ops_project_id=eq.${opsProjectId}&order=created_at.asc`)
}
export async function upsertBillingMilestone(opsProjectId, milestoneType, data) {
  return rest(`/billing_milestones?ops_project_id=eq.${opsProjectId}&milestone_type=eq.${milestoneType}`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({ ops_project_id: opsProjectId, milestone_type: milestoneType, ...data }),
  })
}
export async function getUnpaidMilestones() {
  const today = new Date().toISOString().split('T')[0]
  return rest(`/billing_milestones?select=*,ops_projects(project_name,pic)&status=in.(pending,invoiced)&due_date=lte.${today}&order=due_date.asc`)
}

// ─── Warranty Alerts ──────────────────────────────────────────────────────────
export async function getWarrantyAlerts() {
  const today = new Date().toISOString().split('T')[0]
  const in7days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  const in30days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  const last10days = new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0]
  const last30days = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]
  const [expiring, expired, amcExpiring, amcFollowup] = await Promise.all([
    // ops_projects warranty expiring within 7 days
    rest(`/ops_projects?select=id,project_name,maintenance_end_date&maintenance_end_date=gte.${today}&maintenance_end_date=lte.${in7days}&status=neq.handed_over`),
    // ops_projects expired in last 10 days, renewal pending
    rest(`/ops_projects?select=id,project_name,maintenance_end_date,renewal_negotiation_status&maintenance_end_date=lt.${today}&maintenance_end_date=gte.${last10days}&renewal_negotiation_status=in.(none,in_negotiation)`),
    // AMC contracts expiring within 30 days
    rest(`/amc_contracts?select=id,contract_number,end_date,customers(name)&status=eq.active&end_date=lte.${in30days}&end_date=gte.${today}&order=end_date.asc`),
    // AMC contracts expired in last 30 days — renewal not finalized
    rest(`/amc_contracts?select=id,contract_number,end_date,renewal_status,customers(name)&end_date=lt.${today}&end_date=gte.${last30days}&order=end_date.asc`),
  ])
  // Filter amcFollowup: exclude renewed/not_renewing (handle missing column gracefully)
  const amcFollowupData = (amcFollowup.data || []).filter(
    c => !['renewed', 'not_renewing'].includes(c.renewal_status)
  )
  return {
    expiring: expiring.data || [],
    renewalFollowup: expired.data || [],
    amcExpiring: amcExpiring.data || [],
    amcRenewalFollowup: amcFollowupData,
  }
}

export async function updateAmcRenewal(id, renewalStatus, renewalNotes) {
  return restPatch(`/amc_contracts?id=eq.${id}`, {
    renewal_status: renewalStatus,
    renewal_notes: renewalNotes,
  })
}
