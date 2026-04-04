import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  }
}))

import { supabase } from './supabase'
import {
  getCustomers, createCustomer, updateCustomer,
  getBuildings, createBuilding,
  getElevators, createElevator, updateElevator,
  getMaintenanceSchedules, createMaintenanceSchedule, updateMaintenanceSchedule,
  getJobs, createJob, updateJob,
  getPipelines, createPipeline, completeStep,
} from './api'

function mockChain(returnValue) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(returnValue),
  }
  // Make the chain itself awaitable for list queries
  chain.then = (resolve) => Promise.resolve(returnValue).then(resolve)
  return chain
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getCustomers', () => {
  it('queries customers ordered by name', async () => {
    const chain = mockChain({ data: [], error: null })
    supabase.from.mockReturnValue(chain)
    const result = await getCustomers()
    expect(supabase.from).toHaveBeenCalledWith('customers')
    expect(result).toEqual({ data: [], error: null })
  })
})

describe('createCustomer', () => {
  it('inserts a customer and returns single', async () => {
    const chain = mockChain({ data: { id: '1' }, error: null })
    supabase.from.mockReturnValue(chain)
    const result = await createCustomer({ name: 'Acme Corp' })
    expect(supabase.from).toHaveBeenCalledWith('customers')
    expect(result).toEqual({ data: { id: '1' }, error: null })
  })
})

describe('getBuildings', () => {
  it('queries buildings for a customer', async () => {
    const chain = mockChain({ data: [], error: null })
    supabase.from.mockReturnValue(chain)
    const result = await getBuildings('customer-1')
    expect(supabase.from).toHaveBeenCalledWith('buildings')
    expect(result).toEqual({ data: [], error: null })
  })
})

describe('getElevators', () => {
  it('queries elevators for a building', async () => {
    const chain = mockChain({ data: [], error: null })
    supabase.from.mockReturnValue(chain)
    const result = await getElevators('building-1')
    expect(supabase.from).toHaveBeenCalledWith('elevators')
    expect(result).toEqual({ data: [], error: null })
  })
})

describe('getJobs', () => {
  it('queries all jobs ordered by scheduled_date desc', async () => {
    const chain = mockChain({ data: [], error: null })
    supabase.from.mockReturnValue(chain)
    const result = await getJobs()
    expect(supabase.from).toHaveBeenCalledWith('jobs')
    expect(result).toEqual({ data: [], error: null })
  })
})

// ─── Pipeline Tracker Tests ──────────────────────────────────────────────────

describe('getPipelines', () => {
  it('queries pipelines with project and steps', async () => {
    const chain = mockChain({ data: [], error: null })
    supabase.from.mockReturnValue(chain)
    const result = await getPipelines()
    expect(supabase.from).toHaveBeenCalledWith('pipelines')
    expect(result).toEqual({ data: [], error: null })
  })
})

describe('createPipeline', () => {
  it('inserts a pipeline and returns single', async () => {
    const chain = mockChain({ data: { id: 'p1' }, error: null })
    supabase.from.mockReturnValue(chain)
    const result = await createPipeline({
      project_id: 'proj1',
      project_type: 'new_installation',
      supplier: 'KONE',
    })
    expect(supabase.from).toHaveBeenCalledWith('pipelines')
    expect(result).toEqual({ data: { id: 'p1' }, error: null })
  })
})

describe('completeStep', () => {
  it('updates a pipeline_step status to completed', async () => {
    const chain = mockChain({ data: { id: 's1', status: 'completed' }, error: null })
    supabase.from.mockReturnValue(chain)
    const result = await completeStep('s1', { notes: 'Done', data: {} })
    expect(supabase.from).toHaveBeenCalledWith('pipeline_steps')
    expect(result).toEqual({ data: { id: 's1', status: 'completed' }, error: null })
  })
})
