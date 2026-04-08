# Elevator Admin Dashboard — Plan 2: Core Modules

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the five core data modules — Customers, Buildings, Elevators, Maintenance Schedule, and Jobs — each with full list, create, and detail views wired to Supabase.

**Architecture:** Each module is a self-contained set of pages under `src/pages/<module>/`. A shared `src/lib/api.js` file contains all Supabase query functions. React Router nested routes under the existing `ProtectedLayout` in `App.jsx`. No global state manager — data is fetched per page with `useState` + `useEffect`. Forms use controlled inputs.

**Tech Stack:** React 18, React Router v6, Supabase JS v2, Tailwind CSS v3, Vitest, React Testing Library

---

## File Structure

```
src/
  lib/
    api.js                         # All Supabase query functions (new)
    api.test.js                    # Tests for api functions (new)
  pages/
    customers/
      CustomerList.jsx             # Table of all customers (new)
      CustomerList.test.jsx
      CustomerForm.jsx             # Create / edit customer (new)
      CustomerForm.test.jsx
      CustomerDetail.jsx           # Customer + their buildings (new)
      CustomerDetail.test.jsx
    buildings/
      BuildingForm.jsx             # Create / edit building (new)
      BuildingForm.test.jsx
    elevators/
      ElevatorList.jsx             # Table of all elevators (new)
      ElevatorList.test.jsx
      ElevatorForm.jsx             # Create / edit elevator (new)
      ElevatorForm.test.jsx
      ElevatorDetail.jsx           # Elevator info + maintenance schedule (new)
      ElevatorDetail.test.jsx
    maintenance/
      MaintenanceList.jsx          # All schedules, overdue highlighted (new)
      MaintenanceList.test.jsx
      MaintenanceForm.jsx          # Create / edit schedule (new)
      MaintenanceForm.test.jsx
    jobs/
      JobList.jsx                  # All jobs with status filter (new)
      JobList.test.jsx
      JobForm.jsx                  # Create / edit job (new)
      JobForm.test.jsx
  App.jsx                          # Add new routes (modify)
```

---

## Task 1: Shared API Layer

**Files:**
- Create: `src/lib/api.js`
- Create: `src/lib/api.test.js`

All Supabase queries live here. Pages import functions from this file — never call `supabase` directly from a page.

- [ ] **Step 1: Write the tests**

Create `src/lib/api.test.js`:

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd elevator-app && npm test -- src/lib/api.test.js
```

Expected: FAIL — `Cannot find module './api'`

- [ ] **Step 3: Create `src/lib/api.js`**

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- src/lib/api.test.js
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/api.js src/lib/api.test.js
git commit -m "feat: add api layer for all supabase queries"
```

---

## Task 2: Customers — List Page

**Files:**
- Create: `src/pages/customers/CustomerList.jsx`
- Create: `src/pages/customers/CustomerList.test.jsx`

- [ ] **Step 1: Write the test**

Create `src/pages/customers/CustomerList.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CustomerList from './CustomerList'

vi.mock('../../lib/api', () => ({
  getCustomers: vi.fn(),
}))

import { getCustomers } from '../../lib/api'

describe('CustomerList', () => {
  it('shows customers after loading', async () => {
    getCustomers.mockResolvedValue({
      data: [
        { id: '1', name: 'Acme Corp', contact_person: 'Juan dela Cruz', phone: '09171234567' },
        { id: '2', name: 'BuildCo', contact_person: 'Maria Santos', phone: '09181234567' },
      ],
      error: null,
    })
    render(<MemoryRouter><CustomerList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
      expect(screen.getByText('BuildCo')).toBeInTheDocument()
    })
  })

  it('shows empty state when no customers', async () => {
    getCustomers.mockResolvedValue({ data: [], error: null })
    render(<MemoryRouter><CustomerList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText(/no customers/i)).toBeInTheDocument()
    })
  })

  it('shows Add Customer button', async () => {
    getCustomers.mockResolvedValue({ data: [], error: null })
    render(<MemoryRouter><CustomerList /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /add customer/i })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/pages/customers/CustomerList.test.jsx
```

Expected: FAIL — `Cannot find module './CustomerList'`

- [ ] **Step 3: Create `src/pages/customers/CustomerList.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCustomers } from '../../lib/api'

export default function CustomerList() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCustomers().then(({ data }) => {
      setCustomers(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="text-gray-500">Loading...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
        <Link
          to="/customers/new"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
        >
          Add Customer
        </Link>
      </div>

      {customers.length === 0 ? (
        <p className="text-gray-500">No customers yet.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Person</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                  <td className="px-6 py-4 text-gray-600">{c.contact_person || '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{c.phone || '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{c.email || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/customers/${c.id}`} className="text-blue-600 hover:underline text-sm">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- src/pages/customers/CustomerList.test.jsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/customers/CustomerList.jsx src/pages/customers/CustomerList.test.jsx
git commit -m "feat: add customer list page"
```

---

## Task 3: Customers — Create/Edit Form

**Files:**
- Create: `src/pages/customers/CustomerForm.jsx`
- Create: `src/pages/customers/CustomerForm.test.jsx`

- [ ] **Step 1: Write the test**

Create `src/pages/customers/CustomerForm.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import CustomerForm from './CustomerForm'

vi.mock('../../lib/api', () => ({
  createCustomer: vi.fn(),
  getCustomer: vi.fn(),
  updateCustomer: vi.fn(),
}))

import { createCustomer, getCustomer } from '../../lib/api'

describe('CustomerForm (new)', () => {
  it('renders all fields', () => {
    render(
      <MemoryRouter initialEntries={['/customers/new']}>
        <Routes>
          <Route path="/customers/new" element={<CustomerForm />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contact person/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
  })

  it('calls createCustomer on submit', async () => {
    createCustomer.mockResolvedValue({ data: { id: '1' }, error: null })
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/customers/new']}>
        <Routes>
          <Route path="/customers/new" element={<CustomerForm />} />
          <Route path="/customers/:id" element={<div>detail</div>} />
        </Routes>
      </MemoryRouter>
    )
    await user.type(screen.getByLabelText(/company name/i), 'Acme Corp')
    await user.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(createCustomer).toHaveBeenCalledWith(expect.objectContaining({ name: 'Acme Corp' }))
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/pages/customers/CustomerForm.test.jsx
```

Expected: FAIL — `Cannot find module './CustomerForm'`

- [ ] **Step 3: Create `src/pages/customers/CustomerForm.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createCustomer, getCustomer, updateCustomer } from '../../lib/api'

export default function CustomerForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({ name: '', contact_person: '', phone: '', email: '', address: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEdit) {
      getCustomer(id).then(({ data }) => {
        if (data) setForm({ name: data.name, contact_person: data.contact_person || '', phone: data.phone || '', email: data.email || '', address: data.address || '' })
      })
    }
  }, [id, isEdit])

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const { data, error } = isEdit
      ? await updateCustomer(id, form)
      : await createCustomer(form)
    setSaving(false)
    if (error) { setError(error.message); return }
    navigate(`/customers/${data.id}`)
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Edit Customer' : 'New Customer'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
          <input id="name" name="name" value={form.name} onChange={handleChange} required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
          <input id="contact_person" name="contact_person" value={form.contact_person} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input id="phone" name="phone" value={form.phone} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea id="address" name="address" value={form.address} onChange={handleChange} rows={2}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button type="button" onClick={() => navigate(-1)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- src/pages/customers/CustomerForm.test.jsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/customers/CustomerForm.jsx src/pages/customers/CustomerForm.test.jsx
git commit -m "feat: add customer create/edit form"
```

---

## Task 4: Customer Detail + Building List + Building Form

**Files:**
- Create: `src/pages/customers/CustomerDetail.jsx`
- Create: `src/pages/customers/CustomerDetail.test.jsx`
- Create: `src/pages/buildings/BuildingForm.jsx`
- Create: `src/pages/buildings/BuildingForm.test.jsx`

The CustomerDetail page shows the customer info, their buildings list, and a link to add a building. BuildingForm is a small form used when adding/editing a building — it always redirects back to the customer detail page.

- [ ] **Step 1: Write CustomerDetail test**

Create `src/pages/customers/CustomerDetail.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import CustomerDetail from './CustomerDetail'

vi.mock('../../lib/api', () => ({
  getCustomer: vi.fn(),
  getBuildings: vi.fn(),
}))

import { getCustomer, getBuildings } from '../../lib/api'

describe('CustomerDetail', () => {
  it('shows customer name and buildings', async () => {
    getCustomer.mockResolvedValue({ data: { id: '1', name: 'Acme Corp', contact_person: 'Juan', phone: '09171234567', email: 'juan@acme.com', address: 'Makati' }, error: null })
    getBuildings.mockResolvedValue({ data: [{ id: 'b1', name: 'Main Tower', address: 'Ayala Ave' }], error: null })

    render(
      <MemoryRouter initialEntries={['/customers/1']}>
        <Routes>
          <Route path="/customers/:id" element={<CustomerDetail />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
      expect(screen.getByText('Main Tower')).toBeInTheDocument()
    })
  })

  it('shows Add Building link', async () => {
    getCustomer.mockResolvedValue({ data: { id: '1', name: 'Acme Corp', contact_person: '', phone: '', email: '', address: '' }, error: null })
    getBuildings.mockResolvedValue({ data: [], error: null })

    render(
      <MemoryRouter initialEntries={['/customers/1']}>
        <Routes>
          <Route path="/customers/:id" element={<CustomerDetail />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /add building/i })).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Write BuildingForm test**

Create `src/pages/buildings/BuildingForm.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import BuildingForm from './BuildingForm'

vi.mock('../../lib/api', () => ({
  createBuilding: vi.fn(),
  getBuilding: vi.fn(),
  updateBuilding: vi.fn(),
}))

import { createBuilding } from '../../lib/api'

describe('BuildingForm (new)', () => {
  it('renders building name field', () => {
    render(
      <MemoryRouter initialEntries={['/customers/1/buildings/new']}>
        <Routes>
          <Route path="/customers/:customerId/buildings/new" element={<BuildingForm />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByLabelText(/building name/i)).toBeInTheDocument()
  })

  it('calls createBuilding on submit', async () => {
    createBuilding.mockResolvedValue({ data: { id: 'b1', customer_id: '1' }, error: null })
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/customers/1/buildings/new']}>
        <Routes>
          <Route path="/customers/:customerId/buildings/new" element={<BuildingForm />} />
          <Route path="/customers/:id" element={<div>customer</div>} />
        </Routes>
      </MemoryRouter>
    )
    await user.type(screen.getByLabelText(/building name/i), 'Main Tower')
    await user.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(createBuilding).toHaveBeenCalledWith(expect.objectContaining({ name: 'Main Tower', customer_id: '1' }))
    })
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npm test -- src/pages/customers/CustomerDetail.test.jsx src/pages/buildings/BuildingForm.test.jsx
```

Expected: FAIL — modules not found

- [ ] **Step 4: Create `src/pages/customers/CustomerDetail.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCustomer, getBuildings } from '../../lib/api'

export default function CustomerDetail() {
  const { id } = useParams()
  const [customer, setCustomer] = useState(null)
  const [buildings, setBuildings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getCustomer(id), getBuildings(id)]).then(([c, b]) => {
      setCustomer(c.data)
      setBuildings(b.data || [])
      setLoading(false)
    })
  }, [id])

  if (loading) return <p className="text-gray-500">Loading...</p>
  if (!customer) return <p className="text-red-500">Customer not found.</p>

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link to="/customers" className="text-sm text-blue-600 hover:underline">← Customers</Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">{customer.name}</h1>
        </div>
        <Link to={`/customers/${id}/edit`} className="text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200">
          Edit
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6 grid grid-cols-2 gap-4 text-sm">
        <div><span className="text-gray-500">Contact Person</span><p className="font-medium">{customer.contact_person || '—'}</p></div>
        <div><span className="text-gray-500">Phone</span><p className="font-medium">{customer.phone || '—'}</p></div>
        <div><span className="text-gray-500">Email</span><p className="font-medium">{customer.email || '—'}</p></div>
        <div><span className="text-gray-500">Address</span><p className="font-medium">{customer.address || '—'}</p></div>
      </div>

      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-700">Buildings</h2>
        <Link to={`/customers/${id}/buildings/new`}
          className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm">
          Add Building
        </Link>
      </div>

      {buildings.length === 0 ? (
        <p className="text-gray-500 text-sm">No buildings yet.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Building</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Floors</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {buildings.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{b.name}</td>
                  <td className="px-6 py-4 text-gray-600">{b.address || '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{b.floors || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/buildings/${b.id}/elevators`} className="text-blue-600 hover:underline text-sm">
                      View Elevators
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Create `src/pages/buildings/BuildingForm.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createBuilding, getBuilding, updateBuilding } from '../../lib/api'

export default function BuildingForm() {
  const { customerId, buildingId } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(buildingId)

  const [form, setForm] = useState({ name: '', address: '', floors: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEdit) {
      getBuilding(buildingId).then(({ data }) => {
        if (data) setForm({ name: data.name, address: data.address || '', floors: data.floors || '' })
      })
    }
  }, [buildingId, isEdit])

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const payload = { ...form, floors: form.floors ? parseInt(form.floors) : null }
    const cid = customerId
    const { data, error } = isEdit
      ? await updateBuilding(buildingId, payload)
      : await createBuilding({ ...payload, customer_id: cid })
    setSaving(false)
    if (error) { setError(error.message); return }
    navigate(`/customers/${data.customer_id}`)
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Edit Building' : 'New Building'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Building Name *</label>
          <input id="name" name="name" value={form.name} onChange={handleChange} required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea id="address" name="address" value={form.address} onChange={handleChange} rows={2}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="floors" className="block text-sm font-medium text-gray-700 mb-1">Number of Floors</label>
          <input id="floors" name="floors" type="number" min="1" value={form.floors} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button type="button" onClick={() => navigate(-1)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm test -- src/pages/customers/CustomerDetail.test.jsx src/pages/buildings/BuildingForm.test.jsx
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/pages/customers/CustomerDetail.jsx src/pages/customers/CustomerDetail.test.jsx src/pages/buildings/BuildingForm.jsx src/pages/buildings/BuildingForm.test.jsx
git commit -m "feat: add customer detail, building list, and building form"
```

---

## Task 5: Elevators

**Files:**
- Create: `src/pages/elevators/ElevatorList.jsx`
- Create: `src/pages/elevators/ElevatorList.test.jsx`
- Create: `src/pages/elevators/ElevatorForm.jsx`
- Create: `src/pages/elevators/ElevatorForm.test.jsx`
- Create: `src/pages/elevators/ElevatorDetail.jsx`
- Create: `src/pages/elevators/ElevatorDetail.test.jsx`

ElevatorList is accessible from a building — shows all elevators in that building. ElevatorForm creates/edits an elevator. ElevatorDetail shows the elevator's info and its maintenance schedules.

When turnover_date is set, the form auto-calculates and sets `warranty_expiry` and `free_maintenance_end` to exactly 1 year after turnover.

- [ ] **Step 1: Write ElevatorList test**

Create `src/pages/elevators/ElevatorList.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ElevatorList from './ElevatorList'

vi.mock('../../lib/api', () => ({
  getElevators: vi.fn(),
  getBuilding: vi.fn(),
}))

import { getElevators, getBuilding } from '../../lib/api'

describe('ElevatorList', () => {
  it('shows elevators after loading', async () => {
    getBuilding.mockResolvedValue({ data: { id: 'b1', name: 'Main Tower', customer_id: 'c1' }, error: null })
    getElevators.mockResolvedValue({
      data: [
        { id: 'e1', unit_number: 'EL-01', brand: 'Otis', status: 'active', turnover_date: null },
      ],
      error: null,
    })
    render(
      <MemoryRouter initialEntries={['/buildings/b1/elevators']}>
        <Routes>
          <Route path="/buildings/:buildingId/elevators" element={<ElevatorList />} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText('EL-01')).toBeInTheDocument()
    })
  })

  it('shows Add Elevator button', async () => {
    getBuilding.mockResolvedValue({ data: { id: 'b1', name: 'Main Tower', customer_id: 'c1' }, error: null })
    getElevators.mockResolvedValue({ data: [], error: null })
    render(
      <MemoryRouter initialEntries={['/buildings/b1/elevators']}>
        <Routes>
          <Route path="/buildings/:buildingId/elevators" element={<ElevatorList />} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /add elevator/i })).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Write ElevatorForm test**

Create `src/pages/elevators/ElevatorForm.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ElevatorForm from './ElevatorForm'

vi.mock('../../lib/api', () => ({
  createElevator: vi.fn(),
  getElevator: vi.fn(),
  updateElevator: vi.fn(),
}))

import { createElevator } from '../../lib/api'

describe('ElevatorForm (new)', () => {
  it('renders unit number field', () => {
    render(
      <MemoryRouter initialEntries={['/buildings/b1/elevators/new']}>
        <Routes>
          <Route path="/buildings/:buildingId/elevators/new" element={<ElevatorForm />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByLabelText(/unit number/i)).toBeInTheDocument()
  })

  it('calls createElevator on submit', async () => {
    createElevator.mockResolvedValue({ data: { id: 'e1', building_id: 'b1' }, error: null })
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/buildings/b1/elevators/new']}>
        <Routes>
          <Route path="/buildings/:buildingId/elevators/new" element={<ElevatorForm />} />
          <Route path="/elevators/:id" element={<div>detail</div>} />
        </Routes>
      </MemoryRouter>
    )
    await user.type(screen.getByLabelText(/unit number/i), 'EL-01')
    await user.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(createElevator).toHaveBeenCalledWith(expect.objectContaining({ unit_number: 'EL-01', building_id: 'b1' }))
    })
  })
})
```

- [ ] **Step 3: Write ElevatorDetail test**

Create `src/pages/elevators/ElevatorDetail.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ElevatorDetail from './ElevatorDetail'

vi.mock('../../lib/api', () => ({
  getElevator: vi.fn(),
  getMaintenanceSchedules: vi.fn(),
}))

import { getElevator, getMaintenanceSchedules } from '../../lib/api'

describe('ElevatorDetail', () => {
  it('shows elevator unit number and maintenance schedules', async () => {
    getElevator.mockResolvedValue({ data: { id: 'e1', unit_number: 'EL-01', brand: 'Otis', model: 'Gen2', serial_number: 'SN123', elevator_type: 'Passenger', status: 'active', turnover_date: null, warranty_expiry: null, free_maintenance_end: null, building_id: 'b1' }, error: null })
    getMaintenanceSchedules.mockResolvedValue({ data: [{ id: 'm1', visit_type: 'monthly', next_due_date: '2026-05-01' }], error: null })
    render(
      <MemoryRouter initialEntries={['/elevators/e1']}>
        <Routes>
          <Route path="/elevators/:id" element={<ElevatorDetail />} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText('EL-01')).toBeInTheDocument()
      expect(screen.getByText(/monthly/i)).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 4: Run tests to verify they fail**

```bash
npm test -- src/pages/elevators/
```

Expected: FAIL — modules not found

- [ ] **Step 5: Create `src/pages/elevators/ElevatorList.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getBuilding, getElevators } from '../../lib/api'

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  under_warranty: 'bg-blue-100 text-blue-800',
  under_free_maintenance: 'bg-yellow-100 text-yellow-800',
  inactive: 'bg-gray-100 text-gray-800',
}

export default function ElevatorList() {
  const { buildingId } = useParams()
  const [building, setBuilding] = useState(null)
  const [elevators, setElevators] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getBuilding(buildingId), getElevators(buildingId)]).then(([b, e]) => {
      setBuilding(b.data)
      setElevators(e.data || [])
      setLoading(false)
    })
  }, [buildingId])

  if (loading) return <p className="text-gray-500">Loading...</p>

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link to={`/customers/${building?.customer_id}`} className="text-sm text-blue-600 hover:underline">
            ← {building?.name}
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">Elevators</h1>
        </div>
        <Link to={`/buildings/${buildingId}/elevators/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
          Add Elevator
        </Link>
      </div>

      {elevators.length === 0 ? (
        <p className="text-gray-500">No elevators yet.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand / Model</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Warranty Expiry</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {elevators.map(e => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{e.unit_number}</td>
                  <td className="px-6 py-4 text-gray-600">{[e.brand, e.model].filter(Boolean).join(' ') || '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{e.elevator_type || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[e.status] || 'bg-gray-100 text-gray-800'}`}>
                      {e.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{e.warranty_expiry || '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/elevators/${e.id}`} className="text-blue-600 hover:underline text-sm">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 6: Create `src/pages/elevators/ElevatorForm.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createElevator, getElevator, updateElevator } from '../../lib/api'

function addOneYear(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  d.setFullYear(d.getFullYear() + 1)
  return d.toISOString().split('T')[0]
}

export default function ElevatorForm() {
  const { buildingId, elevatorId } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(elevatorId)

  const [form, setForm] = useState({
    unit_number: '', brand: '', model: '', serial_number: '',
    elevator_type: '', status: 'active', turnover_date: '',
    warranty_expiry: '', free_maintenance_end: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEdit) {
      getElevator(elevatorId).then(({ data }) => {
        if (data) setForm({
          unit_number: data.unit_number,
          brand: data.brand || '',
          model: data.model || '',
          serial_number: data.serial_number || '',
          elevator_type: data.elevator_type || '',
          status: data.status || 'active',
          turnover_date: data.turnover_date || '',
          warranty_expiry: data.warranty_expiry || '',
          free_maintenance_end: data.free_maintenance_end || '',
        })
      })
    }
  }, [elevatorId, isEdit])

  function handleChange(e) {
    const { name, value } = e.target
    if (name === 'turnover_date') {
      setForm(f => ({
        ...f,
        turnover_date: value,
        warranty_expiry: addOneYear(value),
        free_maintenance_end: addOneYear(value),
      }))
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const payload = {
      ...form,
      turnover_date: form.turnover_date || null,
      warranty_expiry: form.warranty_expiry || null,
      free_maintenance_end: form.free_maintenance_end || null,
    }
    const { data, error } = isEdit
      ? await updateElevator(elevatorId, payload)
      : await createElevator({ ...payload, building_id: buildingId })
    setSaving(false)
    if (error) { setError(error.message); return }
    navigate(`/elevators/${data.id}`)
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Edit Elevator' : 'New Elevator'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label htmlFor="unit_number" className="block text-sm font-medium text-gray-700 mb-1">Unit Number *</label>
          <input id="unit_number" name="unit_number" value={form.unit_number} onChange={handleChange} required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="brand" className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <input id="brand" name="brand" value={form.brand} onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">Model</label>
            <input id="model" name="model" value={form.model} onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label htmlFor="serial_number" className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
          <input id="serial_number" name="serial_number" value={form.serial_number} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="elevator_type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <input id="elevator_type" name="elevator_type" value={form.elevator_type} onChange={handleChange}
              placeholder="e.g. Passenger, Cargo"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select id="status" name="status" value={form.status} onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="active">Active</option>
              <option value="under_warranty">Under Warranty</option>
              <option value="under_free_maintenance">Under Free Maintenance</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="turnover_date" className="block text-sm font-medium text-gray-700 mb-1">
            Turnover Date <span className="text-gray-400 font-normal">(auto-sets warranty &amp; free maintenance)</span>
          </label>
          <input id="turnover_date" name="turnover_date" type="date" value={form.turnover_date} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {form.warranty_expiry && (
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 bg-gray-50 rounded p-3">
            <div><span className="font-medium">Warranty Expiry:</span> {form.warranty_expiry}</div>
            <div><span className="font-medium">Free Maintenance End:</span> {form.free_maintenance_end}</div>
          </div>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button type="button" onClick={() => navigate(-1)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 7: Create `src/pages/elevators/ElevatorDetail.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getElevator, getMaintenanceSchedules } from '../../lib/api'

export default function ElevatorDetail() {
  const { id } = useParams()
  const [elevator, setElevator] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getElevator(id), getMaintenanceSchedules(id)]).then(([e, s]) => {
      setElevator(e.data)
      setSchedules(s.data || [])
      setLoading(false)
    })
  }, [id])

  if (loading) return <p className="text-gray-500">Loading...</p>
  if (!elevator) return <p className="text-red-500">Elevator not found.</p>

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link to={`/buildings/${elevator.building_id}/elevators`} className="text-sm text-blue-600 hover:underline">
            ← Elevators
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">{elevator.unit_number}</h1>
        </div>
        <Link to={`/elevators/${id}/edit`}
          className="text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200">
          Edit
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6 grid grid-cols-2 gap-4 text-sm">
        <div><span className="text-gray-500">Brand</span><p className="font-medium">{elevator.brand || '—'}</p></div>
        <div><span className="text-gray-500">Model</span><p className="font-medium">{elevator.model || '—'}</p></div>
        <div><span className="text-gray-500">Serial Number</span><p className="font-medium">{elevator.serial_number || '—'}</p></div>
        <div><span className="text-gray-500">Type</span><p className="font-medium">{elevator.elevator_type || '—'}</p></div>
        <div><span className="text-gray-500">Status</span><p className="font-medium capitalize">{elevator.status?.replace(/_/g, ' ')}</p></div>
        <div><span className="text-gray-500">Turnover Date</span><p className="font-medium">{elevator.turnover_date || '—'}</p></div>
        <div><span className="text-gray-500">Warranty Expiry</span><p className="font-medium">{elevator.warranty_expiry || '—'}</p></div>
        <div><span className="text-gray-500">Free Maintenance End</span><p className="font-medium">{elevator.free_maintenance_end || '—'}</p></div>
      </div>

      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold text-gray-700">Maintenance Schedules</h2>
        <Link to={`/elevators/${id}/maintenance/new`}
          className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm">
          Add Schedule
        </Link>
      </div>

      {schedules.length === 0 ? (
        <p className="text-gray-500 text-sm">No schedules yet.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visit Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Due Date</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schedules.map(s => {
                const isOverdue = s.next_due_date && new Date(s.next_due_date) < new Date()
                return (
                  <tr key={s.id} className={isOverdue ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 font-medium text-gray-900 capitalize">{s.visit_type}</td>
                    <td className={`px-6 py-4 font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                      {s.next_due_date || '—'} {isOverdue && '(Overdue)'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/maintenance/${s.id}/edit`} className="text-blue-600 hover:underline text-sm">Edit</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
npm test -- src/pages/elevators/
```

Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/pages/elevators/
git commit -m "feat: add elevator list, form, and detail pages"
```

---

## Task 6: Maintenance Schedule

**Files:**
- Create: `src/pages/maintenance/MaintenanceList.jsx`
- Create: `src/pages/maintenance/MaintenanceList.test.jsx`
- Create: `src/pages/maintenance/MaintenanceForm.jsx`
- Create: `src/pages/maintenance/MaintenanceForm.test.jsx`

MaintenanceList shows all schedules across all elevators with overdue ones in red. MaintenanceForm creates/edits a schedule for a specific elevator — also updates `next_due_date` when a job is completed (handled in Jobs module).

- [ ] **Step 1: Write MaintenanceList test**

Create `src/pages/maintenance/MaintenanceList.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MaintenanceList from './MaintenanceList'

vi.mock('../../lib/api', () => ({
  getAllMaintenanceSchedules: vi.fn(),
}))

import { getAllMaintenanceSchedules } from '../../lib/api'

describe('MaintenanceList', () => {
  it('shows schedules with elevator and customer info', async () => {
    getAllMaintenanceSchedules.mockResolvedValue({
      data: [{
        id: 'm1',
        visit_type: 'monthly',
        next_due_date: '2026-05-01',
        elevators: { unit_number: 'EL-01', buildings: { name: 'Main Tower', customers: { name: 'Acme Corp' } } }
      }],
      error: null,
    })
    render(<MemoryRouter><MaintenanceList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('EL-01')).toBeInTheDocument()
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })
  })

  it('highlights overdue schedules in red', async () => {
    getAllMaintenanceSchedules.mockResolvedValue({
      data: [{
        id: 'm1',
        visit_type: 'monthly',
        next_due_date: '2025-01-01',
        elevators: { unit_number: 'EL-01', buildings: { name: 'Main Tower', customers: { name: 'Acme Corp' } } }
      }],
      error: null,
    })
    render(<MemoryRouter><MaintenanceList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText(/overdue/i)).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Write MaintenanceForm test**

Create `src/pages/maintenance/MaintenanceForm.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import MaintenanceForm from './MaintenanceForm'

vi.mock('../../lib/api', () => ({
  createMaintenanceSchedule: vi.fn(),
  getMaintenanceSchedules: vi.fn(),
  updateMaintenanceSchedule: vi.fn(),
}))

import { createMaintenanceSchedule } from '../../lib/api'

describe('MaintenanceForm (new)', () => {
  it('renders visit type and due date fields', () => {
    render(
      <MemoryRouter initialEntries={['/elevators/e1/maintenance/new']}>
        <Routes>
          <Route path="/elevators/:elevatorId/maintenance/new" element={<MaintenanceForm />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByLabelText(/visit type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/next due date/i)).toBeInTheDocument()
  })

  it('calls createMaintenanceSchedule on submit', async () => {
    createMaintenanceSchedule.mockResolvedValue({ data: { id: 'm1', elevator_id: 'e1' }, error: null })
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/elevators/e1/maintenance/new']}>
        <Routes>
          <Route path="/elevators/:elevatorId/maintenance/new" element={<MaintenanceForm />} />
          <Route path="/elevators/:id" element={<div>elevator</div>} />
        </Routes>
      </MemoryRouter>
    )
    await user.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(createMaintenanceSchedule).toHaveBeenCalledWith(expect.objectContaining({ elevator_id: 'e1' }))
    })
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npm test -- src/pages/maintenance/
```

Expected: FAIL — modules not found

- [ ] **Step 4: Create `src/pages/maintenance/MaintenanceList.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllMaintenanceSchedules } from '../../lib/api'

export default function MaintenanceList() {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllMaintenanceSchedules().then(({ data }) => {
      setSchedules(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="text-gray-500">Loading...</p>

  const today = new Date()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Maintenance Schedule</h1>

      {schedules.length === 0 ? (
        <p className="text-gray-500">No maintenance schedules found.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Building</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Elevator</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visit Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Due Date</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schedules.map(s => {
                const isOverdue = s.next_due_date && new Date(s.next_due_date) < today
                return (
                  <tr key={s.id} className={isOverdue ? 'bg-red-50' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 text-gray-900">{s.elevators?.buildings?.customers?.name || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{s.elevators?.buildings?.name || '—'}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{s.elevators?.unit_number || '—'}</td>
                    <td className="px-6 py-4 text-gray-600 capitalize">{s.visit_type}</td>
                    <td className={`px-6 py-4 font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                      {s.next_due_date || '—'} {isOverdue && <span className="text-xs">(Overdue)</span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/maintenance/${s.id}/edit`} className="text-blue-600 hover:underline text-sm">Edit</Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Create `src/pages/maintenance/MaintenanceForm.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createMaintenanceSchedule, updateMaintenanceSchedule, getAllMaintenanceSchedules } from '../../lib/api'
import { supabase } from '../../lib/supabase'

async function getMaintenanceSchedule(id) {
  return supabase.from('maintenance_schedules').select('*').eq('id', id).single()
}

export default function MaintenanceForm() {
  const { elevatorId, scheduleId } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(scheduleId)

  const [form, setForm] = useState({ visit_type: 'monthly', next_due_date: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEdit) {
      getMaintenanceSchedule(scheduleId).then(({ data }) => {
        if (data) setForm({ visit_type: data.visit_type, next_due_date: data.next_due_date || '' })
      })
    }
  }, [scheduleId, isEdit])

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const payload = { ...form, next_due_date: form.next_due_date || null }
    const { data, error } = isEdit
      ? await updateMaintenanceSchedule(scheduleId, payload)
      : await createMaintenanceSchedule({ ...payload, elevator_id: elevatorId })
    setSaving(false)
    if (error) { setError(error.message); return }
    navigate(`/elevators/${data.elevator_id}`)
  }

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Edit Schedule' : 'New Maintenance Schedule'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label htmlFor="visit_type" className="block text-sm font-medium text-gray-700 mb-1">Visit Type</label>
          <select id="visit_type" name="visit_type" value={form.visit_type} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annual">Annual</option>
            <option value="adhoc">Ad-hoc PM</option>
          </select>
        </div>
        <div>
          <label htmlFor="next_due_date" className="block text-sm font-medium text-gray-700 mb-1">Next Due Date</label>
          <input id="next_due_date" name="next_due_date" type="date" value={form.next_due_date} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button type="button" onClick={() => navigate(-1)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm test -- src/pages/maintenance/
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/pages/maintenance/
git commit -m "feat: add maintenance schedule list and form"
```

---

## Task 7: Jobs

**Files:**
- Create: `src/pages/jobs/JobList.jsx`
- Create: `src/pages/jobs/JobList.test.jsx`
- Create: `src/pages/jobs/JobForm.jsx`
- Create: `src/pages/jobs/JobForm.test.jsx`

JobList shows all jobs with a status filter. When a job is marked Completed, the form also updates the `next_due_date` on the linked maintenance schedule (advancing by 1 month for monthly, 3 months for quarterly, 12 months for annual). Ad-hoc jobs do not advance the schedule.

- [ ] **Step 1: Write JobList test**

Create `src/pages/jobs/JobList.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import JobList from './JobList'

vi.mock('../../lib/api', () => ({
  getJobs: vi.fn(),
}))

import { getJobs } from '../../lib/api'

const mockJobs = [
  { id: 'j1', scheduled_date: '2026-04-01', status: 'scheduled', technician_name: 'Pedro', elevators: { unit_number: 'EL-01', buildings: { name: 'Main Tower', customers: { name: 'Acme Corp' } } }, maintenance_schedules: { visit_type: 'monthly' } },
  { id: 'j2', scheduled_date: '2026-03-15', status: 'completed', technician_name: 'Juan', elevators: { unit_number: 'EL-02', buildings: { name: 'South Wing', customers: { name: 'BuildCo' } } }, maintenance_schedules: { visit_type: 'quarterly' } },
]

describe('JobList', () => {
  it('shows all jobs', async () => {
    getJobs.mockResolvedValue({ data: mockJobs, error: null })
    render(<MemoryRouter><JobList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('EL-01')).toBeInTheDocument()
      expect(screen.getByText('EL-02')).toBeInTheDocument()
    })
  })

  it('filters by status', async () => {
    getJobs.mockResolvedValue({ data: mockJobs, error: null })
    const user = userEvent.setup()
    render(<MemoryRouter><JobList /></MemoryRouter>)
    await waitFor(() => screen.getByText('EL-01'))
    await user.selectOptions(screen.getByRole('combobox'), 'completed')
    expect(screen.queryByText('EL-01')).not.toBeInTheDocument()
    expect(screen.getByText('EL-02')).toBeInTheDocument()
  })

  it('shows Add Job button', async () => {
    getJobs.mockResolvedValue({ data: [], error: null })
    render(<MemoryRouter><JobList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /add job/i })).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Write JobForm test**

Create `src/pages/jobs/JobForm.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import JobForm from './JobForm'

vi.mock('../../lib/api', () => ({
  createJob: vi.fn(),
  getJob: vi.fn(),
  updateJob: vi.fn(),
  updateMaintenanceSchedule: vi.fn(),
  getAllMaintenanceSchedules: vi.fn(),
}))

import { createJob, getAllMaintenanceSchedules } from '../../lib/api'

describe('JobForm (new)', () => {
  it('renders required fields', async () => {
    getAllMaintenanceSchedules.mockResolvedValue({ data: [], error: null })
    render(
      <MemoryRouter initialEntries={['/jobs/new']}>
        <Routes>
          <Route path="/jobs/new" element={<JobForm />} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByLabelText(/scheduled date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/technician/i)).toBeInTheDocument()
    })
  })

  it('calls createJob on submit', async () => {
    getAllMaintenanceSchedules.mockResolvedValue({
      data: [{ id: 's1', visit_type: 'monthly', elevators: { unit_number: 'EL-01', buildings: { name: 'Main Tower', customers: { name: 'Acme Corp' } } } }],
      error: null,
    })
    createJob.mockResolvedValue({ data: { id: 'j1' }, error: null })
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/jobs/new']}>
        <Routes>
          <Route path="/jobs/new" element={<JobForm />} />
          <Route path="/jobs" element={<div>jobs</div>} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => screen.getByLabelText(/scheduled date/i))
    await user.type(screen.getByLabelText(/scheduled date/i), '2026-04-10')
    await user.type(screen.getByLabelText(/technician/i), 'Pedro')
    await user.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(createJob).toHaveBeenCalled()
    })
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npm test -- src/pages/jobs/
```

Expected: FAIL — modules not found

- [ ] **Step 4: Create `src/pages/jobs/JobList.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getJobs } from '../../lib/api'

const STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
}

export default function JobList() {
  const [jobs, setJobs] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getJobs().then(({ data }) => {
      setJobs(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="text-gray-500">Loading...</p>

  const filtered = filter === 'all' ? jobs : jobs.filter(j => j.status === filter)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Jobs</h1>
        <div className="flex gap-3 items-center">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <Link to="/jobs/new"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
            Add Job
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500">No jobs found.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Elevator</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Visit Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Technician</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(j => (
                <tr key={j.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900">{j.scheduled_date}</td>
                  <td className="px-6 py-4 text-gray-600">{j.elevators?.buildings?.customers?.name || '—'}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{j.elevators?.unit_number || '—'}</td>
                  <td className="px-6 py-4 text-gray-600 capitalize">{j.maintenance_schedules?.visit_type || '—'}</td>
                  <td className="px-6 py-4 text-gray-600">{j.technician_name || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[j.status] || 'bg-gray-100 text-gray-800'}`}>
                      {j.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/jobs/${j.id}/edit`} className="text-blue-600 hover:underline text-sm">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Create `src/pages/jobs/JobForm.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createJob, getJob, updateJob, updateMaintenanceSchedule, getAllMaintenanceSchedules } from '../../lib/api'

function advanceDate(dateStr, visitType) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (visitType === 'monthly') d.setMonth(d.getMonth() + 1)
  else if (visitType === 'quarterly') d.setMonth(d.getMonth() + 3)
  else if (visitType === 'annual') d.setFullYear(d.getFullYear() + 1)
  else return null // adhoc — do not advance
  return d.toISOString().split('T')[0]
}

export default function JobForm() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(jobId)

  const [schedules, setSchedules] = useState([])
  const [form, setForm] = useState({
    schedule_id: '',
    elevator_id: '',
    technician_name: '',
    scheduled_date: '',
    completed_date: '',
    status: 'scheduled',
    notes: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getAllMaintenanceSchedules().then(({ data }) => setSchedules(data || []))
    if (isEdit) {
      getJob(jobId).then(({ data }) => {
        if (data) setForm({
          schedule_id: data.schedule_id || '',
          elevator_id: data.elevator_id || '',
          technician_name: data.technician_name || '',
          scheduled_date: data.scheduled_date || '',
          completed_date: data.completed_date || '',
          status: data.status || 'scheduled',
          notes: data.notes || '',
        })
      })
    }
  }, [jobId, isEdit])

  function handleChange(e) {
    const { name, value } = e.target
    if (name === 'schedule_id') {
      const s = schedules.find(s => s.id === value)
      setForm(f => ({ ...f, schedule_id: value, elevator_id: s?.elevator_id || '' }))
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const payload = {
      schedule_id: form.schedule_id || null,
      elevator_id: form.elevator_id || null,
      technician_name: form.technician_name,
      scheduled_date: form.scheduled_date,
      completed_date: form.completed_date || null,
      status: form.status,
      notes: form.notes || null,
    }

    const { data, error } = isEdit
      ? await updateJob(jobId, payload)
      : await createJob(payload)

    if (error) { setError(error.message); setSaving(false); return }

    // If completed and has a schedule, advance next_due_date
    if (form.status === 'completed' && form.schedule_id && form.completed_date) {
      const s = schedules.find(s => s.id === form.schedule_id)
      const nextDate = advanceDate(form.completed_date, s?.visit_type)
      if (nextDate) {
        await updateMaintenanceSchedule(form.schedule_id, { next_due_date: nextDate })
      }
    }

    setSaving(false)
    navigate('/jobs')
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Edit Job' : 'New Job'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label htmlFor="schedule_id" className="block text-sm font-medium text-gray-700 mb-1">
            Elevator / Schedule
          </label>
          <select id="schedule_id" name="schedule_id" value={form.schedule_id} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">— Select —</option>
            {schedules.map(s => (
              <option key={s.id} value={s.id}>
                {s.elevators?.buildings?.customers?.name} — {s.elevators?.buildings?.name} — {s.elevators?.unit_number} ({s.visit_type})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="technician_name" className="block text-sm font-medium text-gray-700 mb-1">Technician</label>
          <input id="technician_name" name="technician_name" value={form.technician_name} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="scheduled_date" className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date *</label>
          <input id="scheduled_date" name="scheduled_date" type="date" value={form.scheduled_date} onChange={handleChange} required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select id="status" name="status" value={form.status} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        {form.status === 'completed' && (
          <div>
            <label htmlFor="completed_date" className="block text-sm font-medium text-gray-700 mb-1">Completion Date</label>
            <input id="completed_date" name="completed_date" type="date" value={form.completed_date} onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        )}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea id="notes" name="notes" value={form.notes} onChange={handleChange} rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button type="button" onClick={() => navigate(-1)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npm test -- src/pages/jobs/
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/pages/jobs/
git commit -m "feat: add job list and form with schedule auto-advance"
```

---

## Task 8: Wire Up All Routes in App.jsx

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Replace `src/App.jsx` with all routes wired up**

```jsx
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CustomerList from './pages/customers/CustomerList'
import CustomerForm from './pages/customers/CustomerForm'
import CustomerDetail from './pages/customers/CustomerDetail'
import BuildingForm from './pages/buildings/BuildingForm'
import ElevatorList from './pages/elevators/ElevatorList'
import ElevatorForm from './pages/elevators/ElevatorForm'
import ElevatorDetail from './pages/elevators/ElevatorDetail'
import MaintenanceList from './pages/maintenance/MaintenanceList'
import MaintenanceForm from './pages/maintenance/MaintenanceForm'
import JobList from './pages/jobs/JobList'
import JobForm from './pages/jobs/JobForm'

function ProtectedLayout() {
  return (
    <PrivateRoute>
      <Layout>
        <Outlet />
      </Layout>
    </PrivateRoute>
  )
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/customers" element={<CustomerList />} />
        <Route path="/customers/new" element={<CustomerForm />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/customers/:id/edit" element={<CustomerForm />} />
        <Route path="/customers/:customerId/buildings/new" element={<BuildingForm />} />
        <Route path="/buildings/:buildingId/elevators" element={<ElevatorList />} />
        <Route path="/buildings/:buildingId/elevators/new" element={<ElevatorForm />} />
        <Route path="/elevators/:id" element={<ElevatorDetail />} />
        <Route path="/elevators/:id/edit" element={<ElevatorForm />} />
        <Route path="/elevators/:elevatorId/maintenance/new" element={<MaintenanceForm />} />
        <Route path="/maintenance" element={<MaintenanceList />} />
        <Route path="/maintenance/:scheduleId/edit" element={<MaintenanceForm />} />
        <Route path="/jobs" element={<JobList />} />
        <Route path="/jobs/new" element={<JobForm />} />
        <Route path="/jobs/:jobId/edit" element={<JobForm />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
```

- [ ] **Step 2: Run all tests**

```bash
npm test
```

Expected: All tests PASS

- [ ] **Step 3: Start the dev server and verify manually**

```bash
npm run dev
```

Open `http://localhost:5173` and verify:
- Login works
- Customers page loads at `/customers`
- Add Customer form works → saves → redirects to customer detail
- Customer detail shows buildings section with Add Building button
- Add Building → saves → back to customer detail
- View Elevators link on a building → shows elevator list
- Add Elevator → turnover date auto-fills warranty/free maintenance → saves → elevator detail
- Maintenance page at `/maintenance` shows all schedules, overdue in red
- Jobs page at `/jobs` shows all jobs, filter by status works
- Add Job → select a schedule → save as completed → schedule next_due_date advances

- [ ] **Step 4: Commit and push**

```bash
git add src/App.jsx
git commit -m "feat: wire up all routes for customers, elevators, maintenance, and jobs"
git push origin main
```

---

## Plan 2 Complete

At this point you have:
- Full CRUD for Customers, Buildings, Elevators, Maintenance Schedules, and Jobs
- Overdue maintenance highlighted in red
- Warranty/free maintenance auto-calculated from turnover date
- Completing a job auto-advances the next maintenance due date
- All routes connected and working in the live Vercel deployment

**Next:** Plan 3 adds Invoices, Payments, Installation Projects, and Financial Reports.
