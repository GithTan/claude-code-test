import { supabase } from './supabase'

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
  return supabase
    .from('installation_projects')
    .select('*, customers(name)')
    .order('created_at', { ascending: false })
}
export async function getProject(id) {
  return supabase
    .from('installation_projects')
    .select('*, customers(name), payment_milestones(*)')
    .eq('id', id)
    .single()
}
export async function createProject(data) {
  return supabase.from('installation_projects').insert(data).select().single()
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
  return supabase
    .from('pipelines')
    .select('id, project_type, supplier, current_step, status')
    .order('created_at', { ascending: false })
}

export async function getPipeline(id) {
  return supabase
    .from('pipelines')
    .select('*, installation_projects(project_name, customers(name)), pipeline_steps(*, pipeline_attachments(*))')
    .eq('id', id)
    .single()
}

export async function createPipeline(data) {
  return supabase.from('pipelines').insert(data).select().single()
}

export async function createPipelineSteps(pipelineId) {
  const steps = PIPELINE_STEPS.map(s => ({
    pipeline_id: pipelineId,
    step_number: s.number,
    status: s.number === 1 ? 'unlocked' : 'locked',
    assigned_role: s.role,
    unlocked_at: s.number === 1 ? new Date().toISOString() : null,
  }))
  return supabase.from('pipeline_steps').insert(steps).select()
}

export async function updatePipelineStep(stepId, updates) {
  return supabase.from('pipeline_steps').update(updates).eq('id', stepId).select().single()
}

export async function completeStep(stepId, { notes, data }) {
  return supabase
    .from('pipeline_steps')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      notes,
      data,
    })
    .eq('id', stepId)
    .select()
    .single()
}

export async function unlockNextStep(pipelineId, nextStepNumber) {
  return supabase
    .from('pipeline_steps')
    .update({ status: 'unlocked', unlocked_at: new Date().toISOString() })
    .eq('pipeline_id', pipelineId)
    .eq('step_number', nextStepNumber)
    .select()
    .single()
}

export async function updatePipelineCurrentStep(pipelineId, stepNumber) {
  const updates = { current_step: stepNumber, updated_at: new Date().toISOString() }
  if (stepNumber > PIPELINE_STEPS.length) updates.status = 'completed'
  return supabase.from('pipelines').update(updates).eq('id', pipelineId).select().single()
}

export async function overrideGate(pipelineId, stepId, reason) {
  const { error } = await supabase
    .from('pipeline_steps')
    .update({ status: 'unlocked', unlocked_at: new Date().toISOString() })
    .eq('id', stepId)
  if (error) return { data: null, error }
  return logActivity(pipelineId, stepId, 'gate_overridden', reason, {})
}

export async function logActivity(pipelineId, stepId, action, notes, metadata) {
  return supabase.from('pipeline_activity_log').insert({
    pipeline_id: pipelineId,
    pipeline_step_id: stepId,
    action,
    notes,
    metadata,
  }).select().single()
}

export async function getPipelineActivity(pipelineId) {
  return supabase
    .from('pipeline_activity_log')
    .select('*')
    .eq('pipeline_id', pipelineId)
    .order('performed_at', { ascending: false })
}

export async function uploadPipelineFile(stepId, file) {
  const path = `${stepId}/${Date.now()}-${file.name}`
  const { data, error } = await supabase.storage
    .from('pipeline-files')
    .upload(path, file)
  if (error) return { data: null, error }
  return supabase.from('pipeline_attachments').insert({
    pipeline_step_id: stepId,
    file_name: file.name,
    file_path: path,
  }).select().single()
}

export async function getPipelineFileUrl(filePath) {
  return supabase.storage.from('pipeline-files').createSignedUrl(filePath, 3600)
}
