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
