import { supabase } from './supabase'

// ─── Direct REST fetch (bypasses Supabase JS session lock) ───────────────────
const _url = import.meta.env.VITE_SUPABASE_URL
const _key = import.meta.env.VITE_SUPABASE_ANON_KEY
let _tok = _key

export function _setAuthToken(token) { _tok = token || _key }

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

// Customers
export async function getCustomers() {
  return supabase.from('customers').select('*').order('name')
}
export async function getCustomer(id) {
  return supabase.from('customers').select('*').eq('id', id).single()
}
export async function createCustomer(data) {
  return supabase.from('customers').insert(data).select().single()
}
export async function updateCustomer(id, data) {
  return supabase.from('customers').update(data).eq('id', id).select().single()
}

// Buildings
export async function getBuildings(customerId) {
  return supabase.from('buildings').select('*').eq('customer_id', customerId).order('name')
}
export async function getBuilding(id) {
  return supabase.from('buildings').select('*').eq('id', id).single()
}
export async function createBuilding(data) {
  return supabase.from('buildings').insert(data).select().single()
}
export async function updateBuilding(id, data) {
  return supabase.from('buildings').update(data).eq('id', id).select().single()
}

// Elevators
export async function getElevators(buildingId) {
  return supabase.from('elevators').select('*').eq('building_id', buildingId).order('unit_number')
}
export async function getAllElevators() {
  return supabase
    .from('elevators')
    .select('*, buildings(name, customers(name))')
    .order('unit_number')
}
export async function getElevator(id) {
  return supabase.from('elevators').select('*').eq('id', id).single()
}
export async function createElevator(data) {
  return supabase.from('elevators').insert(data).select().single()
}
export async function updateElevator(id, data) {
  return supabase.from('elevators').update(data).eq('id', id).select().single()
}

// Maintenance Schedules
export async function getMaintenanceSchedules(elevatorId) {
  return supabase.from('maintenance_schedules').select('*').eq('elevator_id', elevatorId).order('next_due_date')
}
export async function getAllMaintenanceSchedules() {
  return supabase
    .from('maintenance_schedules')
    .select('*, elevators(unit_number, buildings(name, customers(name)))')
    .order('next_due_date')
}
export async function createMaintenanceSchedule(data) {
  return supabase.from('maintenance_schedules').insert(data).select().single()
}
export async function updateMaintenanceSchedule(id, data) {
  return supabase.from('maintenance_schedules').update(data).eq('id', id).select().single()
}

// Jobs
export async function getJobs() {
  return supabase
    .from('jobs')
    .select('*, elevators(unit_number, buildings(name, customers(name))), maintenance_schedules(visit_type)')
    .order('scheduled_date', { ascending: false })
}
export async function getJob(id) {
  return supabase.from('jobs').select('*').eq('id', id).single()
}
export async function createJob(data) {
  return supabase.from('jobs').insert(data).select().single()
}
export async function updateJob(id, data) {
  return supabase.from('jobs').update(data).eq('id', id).select().single()
}

// Invoices
export async function getInvoices() {
  return supabase
    .from('invoices')
    .select('*, customers(name)')
    .order('issue_date', { ascending: false })
}
export async function getInvoice(id) {
  return supabase
    .from('invoices')
    .select('*, customers(name), invoice_items(*), payments(*), jobs(elevators(unit_number))')
    .eq('id', id)
    .single()
}
export async function createInvoice(data) {
  return supabase.from('invoices').insert(data).select().single()
}
export async function updateInvoice(id, data) {
  return supabase.from('invoices').update(data).eq('id', id).select().single()
}
export async function createInvoiceItem(data) {
  return supabase.from('invoice_items').insert(data).select().single()
}
export async function deleteInvoiceItem(id) {
  return supabase.from('invoice_items').delete().eq('id', id)
}
export async function createPayment(data) {
  return supabase.from('payments').insert(data).select().single()
}
export async function deletePayment(id) {
  return supabase.from('payments').delete().eq('id', id)
}

// Installation Projects
export async function getProjects() {
  return rest('/installation_projects?select=*,customers(name)&order=created_at.desc')
}
export async function getProject(id) {
  const { data, error } = await rest(`/installation_projects?select=*,customers(name),payment_milestones(*)&id=eq.${id}`)
  if (error) return { data: null, error }
  return { data: Array.isArray(data) ? data[0] ?? null : data, error: null }
}
export async function createProject(data) {
  const { data: rows, error } = await rest('/installation_projects', {
    method: 'POST', body: JSON.stringify(data),
  })
  if (error) return { data: null, error }
  return { data: Array.isArray(rows) ? rows[0] : rows, error: null }
}
export async function updateProject(id, data) {
  return supabase.from('installation_projects').update(data).eq('id', id).select().single()
}
export async function createMilestone(data) {
  return supabase.from('payment_milestones').insert(data).select().single()
}
export async function updateMilestone(id, data) {
  return supabase.from('payment_milestones').update(data).eq('id', id).select().single()
}
export async function deleteMilestone(id) {
  return supabase.from('payment_milestones').delete().eq('id', id)
}

// Reports
export async function getOverdueMaintenance() {
  const today = new Date().toISOString().split('T')[0]
  return supabase
    .from('maintenance_schedules')
    .select('*, elevators(unit_number, buildings(name, customers(name)))')
    .lt('next_due_date', today)
    .order('next_due_date')
}
export async function getJobsThisMonth() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
  return supabase
    .from('jobs')
    .select('*, elevators(unit_number, buildings(name, customers(name))), maintenance_schedules(visit_type)')
    .eq('status', 'completed')
    .gte('completed_date', start)
    .lte('completed_date', end)
    .order('completed_date', { ascending: false })
}
export async function getTechnicianSummary() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  return supabase
    .from('jobs')
    .select('technician_name, status, completed_date')
    .gte('scheduled_date', start)
    .order('technician_name')
}
export async function getElevatorStatusOverview() {
  return supabase
    .from('elevators')
    .select('status, buildings(name, customers(name))')
    .order('status')
}
export async function getUnpaidInvoices() {
  return supabase
    .from('invoices')
    .select('*, customers(name)')
    .in('status', ['unpaid', 'partially_paid'])
    .order('due_date')
}
export async function getPaymentHistory() {
  return supabase
    .from('payments')
    .select('*, invoices(invoice_number, customers(name))')
    .order('payment_date', { ascending: false })
}
export async function getMonthlyRevenue() {
  return supabase
    .from('payments')
    .select('amount, payment_date')
    .order('payment_date', { ascending: false })
}

// AMC Contracts
export async function getAmcContracts() {
  return supabase
    .from('amc_contracts')
    .select('*, customers(name)')
    .order('end_date')
}
export async function getAmcContract(id) {
  return supabase
    .from('amc_contracts')
    .select('*, customers(name)')
    .eq('id', id)
    .single()
}
export async function createAmcContract(data) {
  return supabase.from('amc_contracts').insert(data).select().single()
}
export async function updateAmcContract(id, data) {
  return supabase.from('amc_contracts').update(data).eq('id', id).select().single()
}
export async function getExpiringAmcContracts() {
  const today = new Date().toISOString().split('T')[0]
  const in60days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  return supabase
    .from('amc_contracts')
    .select('*, customers(name)')
    .eq('status', 'active')
    .lte('end_date', in60days)
    .gte('end_date', today)
    .order('end_date')
}

// Breakdowns
export async function getBreakdowns() {
  return supabase
    .from('breakdowns')
    .select('*, elevators(unit_number, buildings(name, customers(name)))')
    .order('reported_date', { ascending: false })
}
export async function getBreakdown(id) {
  return supabase
    .from('breakdowns')
    .select('*, elevators(unit_number, buildings(name, customers(name)))')
    .eq('id', id)
    .single()
}
export async function createBreakdown(data) {
  return supabase.from('breakdowns').insert(data).select().single()
}
export async function updateBreakdown(id, data) {
  return supabase.from('breakdowns').update(data).eq('id', id).select().single()
}
export async function getOpenBreakdowns() {
  return supabase
    .from('breakdowns')
    .select('*, elevators(unit_number, buildings(name, customers(name)))')
    .in('status', ['open', 'in_progress'])
    .order('priority')
}

// ─── Pipeline Tracker ───────────────────────────────────────────────────────

export const PIPELINE_STEPS = [
  { number: 1,  label: 'Project Awarded',         gate: 'confirm_with_data',     role: 'admin' },
  { number: 2,  label: 'Shop Drawings Prepared',  gate: 'file_required',         role: 'admin' },
  { number: 3,  label: 'Client Signs Drawings',   gate: 'file_required',         role: 'admin' },
  { number: 4,  label: 'Supplier Approval',       gate: 'file_required',         role: 'coordinator' },
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
  const { data, error } = await rest(
    `/pipelines?select=*,installation_projects(project_name,customers(name)),pipeline_steps(*,pipeline_attachments(*))&id=eq.${id}`
  )
  if (error) return { data: null, error }
  return { data: Array.isArray(data) ? data[0] ?? null : data, error: null }
}

export async function createPipeline(data) {
  const { data: rows, error } = await rest('/pipelines', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { Prefer: 'return=representation' },
  })
  if (error) return { data: null, error }
  return { data: Array.isArray(rows) ? rows[0] : rows, error: null }
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
