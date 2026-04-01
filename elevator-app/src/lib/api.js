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
