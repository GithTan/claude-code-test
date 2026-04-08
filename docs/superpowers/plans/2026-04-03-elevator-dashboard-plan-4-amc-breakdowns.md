# Elevator Admin Dashboard — Plan 4: AMC Contracts & Breakdown Logging

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add AMC (Annual Maintenance Contract) tracking and breakdown/complaint logging — two of the highest-value features missing from the current app compared to competitors.

**Architecture:** Same pattern as previous plans — new pages under `src/pages/<module>/`, new Supabase tables, API functions in `src/lib/api.js`. AMC contracts link to customers. Breakdowns link to elevators and optionally to a technician. Both modules are accessible by all roles. Dashboard updated to show expiring AMCs and open breakdowns. Nav updated with two new items.

**Tech Stack:** React 18, React Router v6, Supabase JS v2, Tailwind CSS v3, Vitest, React Testing Library

---

## Database Setup (run in Supabase SQL Editor before implementing)

```sql
-- AMC Contracts
create table amc_contracts (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references customers on delete cascade not null,
  contract_number text not null,
  contract_type text not null check (contract_type in ('comprehensive', 'non_comprehensive', 'call_based')),
  start_date date not null,
  end_date date not null,
  monthly_fee numeric(12,2) default 0,
  coverage_notes text,
  status text default 'active' check (status in ('active', 'expired', 'cancelled')),
  created_at timestamptz default now()
);

-- Breakdowns
create table breakdowns (
  id uuid default gen_random_uuid() primary key,
  elevator_id uuid references elevators on delete cascade not null,
  reported_date date not null default current_date,
  reported_by text,
  priority text default 'medium' check (priority in ('high', 'medium', 'low')),
  description text,
  status text default 'open' check (status in ('open', 'in_progress', 'resolved')),
  technician_name text,
  resolved_date date,
  resolution_notes text,
  created_at timestamptz default now()
);

-- RLS
alter table amc_contracts enable row level security;
alter table breakdowns enable row level security;
create policy "auth_all" on amc_contracts for all to authenticated using (true) with check (true);
create policy "auth_all" on breakdowns for all to authenticated using (true) with check (true);
```

---

## File Structure

```
src/
  lib/
    api.js                                   # Add AMC + breakdown functions (modify)
  pages/
    contracts/
      AmcList.jsx                            # All AMC contracts with expiry warnings (new)
      AmcList.test.jsx
      AmcForm.jsx                            # Create/edit AMC contract (new)
      AmcForm.test.jsx
      AmcDetail.jsx                          # Contract detail view (new)
      AmcDetail.test.jsx
    breakdowns/
      BreakdownList.jsx                      # All breakdowns with priority + status filter (new)
      BreakdownList.test.jsx
      BreakdownForm.jsx                      # Log/edit breakdown call (new)
      BreakdownForm.test.jsx
  components/
    Layout.jsx                               # Add Contracts + Breakdowns to nav (modify)
  App.jsx                                    # Add new routes (modify)
  pages/
    Dashboard.jsx                            # Add expiring AMC + open breakdown stats (modify)
    Dashboard.test.jsx                       # Update tests (modify)
```

---

## Task 1: Extend API Layer

**Files:**
- Modify: `src/lib/api.js`

- [ ] **Step 1: Append to `src/lib/api.js`** after the Reports section:

```js
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
```

- [ ] **Step 2: Run existing tests to confirm nothing broke**

```bash
cd elevator-app && npm test -- src/lib/api.test.js
```

Expected: 5 tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/lib/api.js
git commit -m "feat: add amc contract and breakdown api functions"
```

---

## Task 2: AMC Contract List

**Files:**
- Create: `src/pages/contracts/AmcList.jsx`
- Create: `src/pages/contracts/AmcList.test.jsx`

Shows all AMC contracts. Contracts expiring within 60 days show an orange warning badge. Expired contracts show red.

- [ ] **Step 1: Write the test**

Create `src/pages/contracts/AmcList.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AmcList from './AmcList'

vi.mock('../../lib/api', () => ({
  getAmcContracts: vi.fn(),
}))

import { getAmcContracts } from '../../lib/api'

describe('AmcList', () => {
  it('shows contracts after loading', async () => {
    getAmcContracts.mockResolvedValue({
      data: [
        { id: 'c1', contract_number: 'AMC-001', contract_type: 'comprehensive', start_date: '2026-01-01', end_date: '2026-12-31', monthly_fee: 5000, status: 'active', customers: { name: 'Acme Corp' } },
      ],
      error: null,
    })
    render(<MemoryRouter><AmcList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('AMC-001')).toBeInTheDocument()
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })
  })

  it('shows empty state when no contracts', async () => {
    getAmcContracts.mockResolvedValue({ data: [], error: null })
    render(<MemoryRouter><AmcList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText(/no contracts/i)).toBeInTheDocument()
    })
  })

  it('shows New Contract button', async () => {
    getAmcContracts.mockResolvedValue({ data: [], error: null })
    render(<MemoryRouter><AmcList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /new contract/i })).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/pages/contracts/AmcList.test.jsx
```

Expected: FAIL

- [ ] **Step 3: Create `src/pages/contracts/AmcList.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAmcContracts } from '../../lib/api'

function fmt(amount) {
  return `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

function expiryBadge(endDate, status) {
  if (status === 'expired' || status === 'cancelled') {
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 capitalize">{status}</span>
  }
  const today = new Date()
  const end = new Date(endDate)
  const daysLeft = Math.ceil((end - today) / (1000 * 60 * 60 * 24))
  if (daysLeft <= 30) {
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Expires in {daysLeft}d</span>
  }
  if (daysLeft <= 60) {
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Expires in {daysLeft}d</span>
  }
  return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
}

export default function AmcList() {
  const [contracts, setContracts] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAmcContracts().then(({ data }) => {
      setContracts(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="text-gray-500">Loading...</p>

  const filtered = filter === 'all' ? contracts : contracts.filter(c => c.status === filter)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">AMC Contracts</h1>
        <div className="flex gap-3 items-center">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <Link to="/contracts/new"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
            New Contract
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500">No contracts yet.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contract #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monthly Fee</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{c.contract_number}</td>
                  <td className="px-6 py-4 text-gray-600">{c.customers?.name || '—'}</td>
                  <td className="px-6 py-4 text-gray-600 capitalize">{c.contract_type?.replace(/_/g, ' ')}</td>
                  <td className="px-6 py-4 text-gray-600">{c.start_date}</td>
                  <td className="px-6 py-4 text-gray-600">{c.end_date}</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">{fmt(c.monthly_fee)}</td>
                  <td className="px-6 py-4">{expiryBadge(c.end_date, c.status)}</td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/contracts/${c.id}`} className="text-blue-600 hover:underline text-sm">View</Link>
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
npm test -- src/pages/contracts/AmcList.test.jsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/contracts/AmcList.jsx src/pages/contracts/AmcList.test.jsx
git commit -m "feat: add AMC contract list page"
```

---

## Task 3: AMC Contract Form

**Files:**
- Create: `src/pages/contracts/AmcForm.jsx`
- Create: `src/pages/contracts/AmcForm.test.jsx`

- [ ] **Step 1: Write the test**

Create `src/pages/contracts/AmcForm.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AmcForm from './AmcForm'

vi.mock('../../lib/api', () => ({
  createAmcContract: vi.fn(),
  getAmcContract: vi.fn(),
  updateAmcContract: vi.fn(),
  getCustomers: vi.fn(),
}))

import { createAmcContract, getCustomers } from '../../lib/api'

describe('AmcForm (new)', () => {
  it('renders required fields', async () => {
    getCustomers.mockResolvedValue({ data: [{ id: 'c1', name: 'Acme Corp' }], error: null })
    render(
      <MemoryRouter initialEntries={['/contracts/new']}>
        <Routes>
          <Route path="/contracts/new" element={<AmcForm />} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByLabelText(/contract number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/customer/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/end date/i)).toBeInTheDocument()
    })
  })

  it('calls createAmcContract on submit', async () => {
    getCustomers.mockResolvedValue({ data: [{ id: 'c1', name: 'Acme Corp' }], error: null })
    createAmcContract.mockResolvedValue({ data: { id: 'a1' }, error: null })
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/contracts/new']}>
        <Routes>
          <Route path="/contracts/new" element={<AmcForm />} />
          <Route path="/contracts/:id" element={<div>detail</div>} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => screen.getByLabelText(/contract number/i))
    await user.type(screen.getByLabelText(/contract number/i), 'AMC-001')
    await user.selectOptions(screen.getByLabelText(/customer/i), 'c1')
    await user.type(screen.getByLabelText(/start date/i), '2026-01-01')
    await user.type(screen.getByLabelText(/end date/i), '2026-12-31')
    await user.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(createAmcContract).toHaveBeenCalledWith(expect.objectContaining({ contract_number: 'AMC-001' }))
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/pages/contracts/AmcForm.test.jsx
```

Expected: FAIL

- [ ] **Step 3: Create `src/pages/contracts/AmcForm.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createAmcContract, getAmcContract, getCustomers, updateAmcContract } from '../../lib/api'

export default function AmcForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState({
    customer_id: '', contract_number: '', contract_type: 'comprehensive',
    start_date: '', end_date: '', monthly_fee: '', coverage_notes: '', status: 'active',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getCustomers().then(({ data }) => setCustomers(data || []))
    if (isEdit) {
      getAmcContract(id).then(({ data }) => {
        if (data) setForm({
          customer_id: data.customer_id,
          contract_number: data.contract_number,
          contract_type: data.contract_type,
          start_date: data.start_date,
          end_date: data.end_date,
          monthly_fee: String(data.monthly_fee || ''),
          coverage_notes: data.coverage_notes || '',
          status: data.status,
        })
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
    const payload = { ...form, monthly_fee: parseFloat(form.monthly_fee) || 0 }
    const { data, error: err } = isEdit
      ? await updateAmcContract(id, payload)
      : await createAmcContract(payload)
    setSaving(false)
    if (err) { setError(err.message); return }
    navigate(`/contracts/${data.id}`)
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{isEdit ? 'Edit Contract' : 'New AMC Contract'}</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label htmlFor="contract_number" className="block text-sm font-medium text-gray-700 mb-1">Contract Number *</label>
          <input id="contract_number" name="contract_number" value={form.contract_number} onChange={handleChange} required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
          <select id="customer_id" name="customer_id" value={form.customer_id} onChange={handleChange} required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">— Select customer —</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="contract_type" className="block text-sm font-medium text-gray-700 mb-1">Contract Type *</label>
          <select id="contract_type" name="contract_type" value={form.contract_type} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="comprehensive">Comprehensive</option>
            <option value="non_comprehensive">Non-Comprehensive</option>
            <option value="call_based">Call-Based</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
            <input id="start_date" name="start_date" type="date" value={form.start_date} onChange={handleChange} required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
            <input id="end_date" name="end_date" type="date" value={form.end_date} onChange={handleChange} required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label htmlFor="monthly_fee" className="block text-sm font-medium text-gray-700 mb-1">Monthly Fee (₱)</label>
          <input id="monthly_fee" name="monthly_fee" type="number" min="0" step="0.01" value={form.monthly_fee} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="coverage_notes" className="block text-sm font-medium text-gray-700 mb-1">Coverage Notes</label>
          <textarea id="coverage_notes" name="coverage_notes" value={form.coverage_notes} onChange={handleChange} rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {isEdit && (
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select id="status" name="status" value={form.status} onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
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

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- src/pages/contracts/AmcForm.test.jsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/contracts/AmcForm.jsx src/pages/contracts/AmcForm.test.jsx
git commit -m "feat: add AMC contract create/edit form"
```

---

## Task 4: AMC Contract Detail

**Files:**
- Create: `src/pages/contracts/AmcDetail.jsx`
- Create: `src/pages/contracts/AmcDetail.test.jsx`

- [ ] **Step 1: Write the test**

Create `src/pages/contracts/AmcDetail.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import AmcDetail from './AmcDetail'

vi.mock('../../lib/api', () => ({
  getAmcContract: vi.fn(),
}))

import { getAmcContract } from '../../lib/api'

describe('AmcDetail', () => {
  it('shows contract details', async () => {
    getAmcContract.mockResolvedValue({
      data: {
        id: 'a1', contract_number: 'AMC-001', contract_type: 'comprehensive',
        start_date: '2026-01-01', end_date: '2026-12-31', monthly_fee: 5000,
        status: 'active', coverage_notes: 'All parts covered',
        customers: { name: 'Acme Corp' },
      },
      error: null,
    })
    render(
      <MemoryRouter initialEntries={['/contracts/a1']}>
        <Routes>
          <Route path="/contracts/:id" element={<AmcDetail />} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByText('AMC-001')).toBeInTheDocument()
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
      expect(screen.getByText('All parts covered')).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/pages/contracts/AmcDetail.test.jsx
```

Expected: FAIL

- [ ] **Step 3: Create `src/pages/contracts/AmcDetail.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAmcContract } from '../../lib/api'

function fmt(amount) {
  return `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

function daysUntilExpiry(endDate) {
  const today = new Date()
  const end = new Date(endDate)
  return Math.ceil((end - today) / (1000 * 60 * 60 * 24))
}

export default function AmcDetail() {
  const { id } = useParams()
  const [contract, setContract] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAmcContract(id).then(({ data }) => {
      setContract(data)
      setLoading(false)
    })
  }, [id])

  if (loading) return <p className="text-gray-500">Loading...</p>
  if (!contract) return <p className="text-red-500">Contract not found.</p>

  const days = daysUntilExpiry(contract.end_date)
  const isExpiringSoon = contract.status === 'active' && days <= 60

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link to="/contracts" className="text-sm text-blue-600 hover:underline">← Contracts</Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">{contract.contract_number}</h1>
        </div>
        <Link to={`/contracts/${id}/edit`}
          className="text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200">
          Edit
        </Link>
      </div>

      {isExpiringSoon && (
        <div className={`rounded-lg p-4 mb-4 ${days <= 30 ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'}`}>
          <p className={`font-medium text-sm ${days <= 30 ? 'text-red-800' : 'text-orange-800'}`}>
            This contract expires in {days} day{days !== 1 ? 's' : ''} — consider renewing
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div><span className="text-gray-500">Customer</span><p className="font-medium">{contract.customers?.name}</p></div>
          <div><span className="text-gray-500">Type</span><p className="font-medium capitalize">{contract.contract_type?.replace(/_/g, ' ')}</p></div>
          <div><span className="text-gray-500">Start Date</span><p className="font-medium">{contract.start_date}</p></div>
          <div><span className="text-gray-500">End Date</span><p className="font-medium">{contract.end_date}</p></div>
          <div><span className="text-gray-500">Monthly Fee</span><p className="font-medium">{fmt(contract.monthly_fee)}</p></div>
          <div><span className="text-gray-500">Status</span><p className="font-medium capitalize">{contract.status}</p></div>
        </div>
        {contract.coverage_notes && (
          <div>
            <span className="text-gray-500">Coverage Notes</span>
            <p className="font-medium mt-1">{contract.coverage_notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- src/pages/contracts/AmcDetail.test.jsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/contracts/AmcDetail.jsx src/pages/contracts/AmcDetail.test.jsx
git commit -m "feat: add AMC contract detail page"
```

---

## Task 5: Breakdown List

**Files:**
- Create: `src/pages/breakdowns/BreakdownList.jsx`
- Create: `src/pages/breakdowns/BreakdownList.test.jsx`

- [ ] **Step 1: Write the test**

Create `src/pages/breakdowns/BreakdownList.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BreakdownList from './BreakdownList'

vi.mock('../../lib/api', () => ({
  getBreakdowns: vi.fn(),
}))

import { getBreakdowns } from '../../lib/api'

describe('BreakdownList', () => {
  it('shows breakdowns after loading', async () => {
    getBreakdowns.mockResolvedValue({
      data: [
        { id: 'b1', reported_date: '2026-04-03', priority: 'high', status: 'open', description: 'Elevator stuck', technician_name: null, elevators: { unit_number: 'E-01', buildings: { name: 'Tower 1', customers: { name: 'Acme Corp' } } } },
      ],
      error: null,
    })
    render(<MemoryRouter><BreakdownList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('Elevator stuck')).toBeInTheDocument()
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })
  })

  it('shows empty state when no breakdowns', async () => {
    getBreakdowns.mockResolvedValue({ data: [], error: null })
    render(<MemoryRouter><BreakdownList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText(/no breakdown/i)).toBeInTheDocument()
    })
  })

  it('shows Log Breakdown button', async () => {
    getBreakdowns.mockResolvedValue({ data: [], error: null })
    render(<MemoryRouter><BreakdownList /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByRole('link', { name: /log breakdown/i })).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/pages/breakdowns/BreakdownList.test.jsx
```

Expected: FAIL

- [ ] **Step 3: Create `src/pages/breakdowns/BreakdownList.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBreakdowns } from '../../lib/api'

const PRIORITY_COLORS = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-gray-100 text-gray-700',
}

const STATUS_COLORS = {
  open: 'bg-red-100 text-red-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
}

export default function BreakdownList() {
  const [breakdowns, setBreakdowns] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getBreakdowns().then(({ data }) => {
      setBreakdowns(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="text-gray-500">Loading...</p>

  const filtered = filter === 'all' ? breakdowns : breakdowns.filter(b => b.status === filter)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Breakdowns</h1>
        <div className="flex gap-3 items-center">
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <Link to="/breakdowns/new"
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm">
            Log Breakdown
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500">No breakdown calls logged.</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Elevator</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Technician</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map(b => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900">{b.reported_date}</td>
                  <td className="px-6 py-4 text-gray-600">{b.elevators?.buildings?.customers?.name || '—'}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{b.elevators?.unit_number || '—'}</td>
                  <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{b.description || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITY_COLORS[b.priority] || 'bg-gray-100 text-gray-800'}`}>
                      {b.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{b.technician_name || '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[b.status] || 'bg-gray-100 text-gray-800'}`}>
                      {b.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/breakdowns/${b.id}/edit`} className="text-blue-600 hover:underline text-sm">Edit</Link>
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
npm test -- src/pages/breakdowns/BreakdownList.test.jsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/breakdowns/BreakdownList.jsx src/pages/breakdowns/BreakdownList.test.jsx
git commit -m "feat: add breakdown list page"
```

---

## Task 6: Breakdown Form

**Files:**
- Create: `src/pages/breakdowns/BreakdownForm.jsx`
- Create: `src/pages/breakdowns/BreakdownForm.test.jsx`

- [ ] **Step 1: Write the test**

Create `src/pages/breakdowns/BreakdownForm.test.jsx`:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import BreakdownForm from './BreakdownForm'

vi.mock('../../lib/api', () => ({
  createBreakdown: vi.fn(),
  getBreakdown: vi.fn(),
  updateBreakdown: vi.fn(),
  getAllElevators: vi.fn(),
}))

import { createBreakdown, getAllElevators } from '../../lib/api'

describe('BreakdownForm (new)', () => {
  it('renders required fields', async () => {
    getAllElevators.mockResolvedValue({ data: [{ id: 'e1', unit_number: 'E-01', buildings: { name: 'Tower 1', customers: { name: 'Acme Corp' } } }], error: null })
    render(
      <MemoryRouter initialEntries={['/breakdowns/new']}>
        <Routes>
          <Route path="/breakdowns/new" element={<BreakdownForm />} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => {
      expect(screen.getByLabelText(/elevator/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument()
    })
  })

  it('calls createBreakdown on submit', async () => {
    getAllElevators.mockResolvedValue({ data: [{ id: 'e1', unit_number: 'E-01', buildings: { name: 'Tower 1', customers: { name: 'Acme Corp' } } }], error: null })
    createBreakdown.mockResolvedValue({ data: { id: 'b1' }, error: null })
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/breakdowns/new']}>
        <Routes>
          <Route path="/breakdowns/new" element={<BreakdownForm />} />
          <Route path="/breakdowns" element={<div>list</div>} />
        </Routes>
      </MemoryRouter>
    )
    await waitFor(() => screen.getByLabelText(/elevator/i))
    await user.selectOptions(screen.getByLabelText(/elevator/i), 'e1')
    await user.type(screen.getByLabelText(/description/i), 'Door not closing')
    await user.click(screen.getByRole('button', { name: /save/i }))
    await waitFor(() => {
      expect(createBreakdown).toHaveBeenCalledWith(expect.objectContaining({ description: 'Door not closing' }))
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test -- src/pages/breakdowns/BreakdownForm.test.jsx
```

Expected: FAIL

- [ ] **Step 3: Create `src/pages/breakdowns/BreakdownForm.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createBreakdown, getAllElevators, getBreakdown, updateBreakdown } from '../../lib/api'

export default function BreakdownForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [elevators, setElevators] = useState([])
  const [form, setForm] = useState({
    elevator_id: '', reported_date: new Date().toISOString().split('T')[0],
    reported_by: '', priority: 'medium', description: '',
    status: 'open', technician_name: '', resolved_date: '', resolution_notes: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getAllElevators().then(({ data }) => setElevators(data || []))
    if (isEdit) {
      getBreakdown(id).then(({ data }) => {
        if (data) setForm({
          elevator_id: data.elevator_id,
          reported_date: data.reported_date,
          reported_by: data.reported_by || '',
          priority: data.priority,
          description: data.description || '',
          status: data.status,
          technician_name: data.technician_name || '',
          resolved_date: data.resolved_date || '',
          resolution_notes: data.resolution_notes || '',
        })
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
    const payload = {
      ...form,
      resolved_date: form.resolved_date || null,
    }
    const { data, error: err } = isEdit
      ? await updateBreakdown(id, payload)
      : await createBreakdown(payload)
    setSaving(false)
    if (err) { setError(err.message); return }
    navigate('/breakdowns')
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{isEdit ? 'Edit Breakdown' : 'Log Breakdown Call'}</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label htmlFor="elevator_id" className="block text-sm font-medium text-gray-700 mb-1">Elevator *</label>
          <select id="elevator_id" name="elevator_id" value={form.elevator_id} onChange={handleChange} required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">— Select elevator —</option>
            {elevators.map(e => (
              <option key={e.id} value={e.id}>
                {e.buildings?.customers?.name} — {e.buildings?.name} — {e.unit_number}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="reported_date" className="block text-sm font-medium text-gray-700 mb-1">Date Reported *</label>
            <input id="reported_date" name="reported_date" type="date" value={form.reported_date} onChange={handleChange} required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select id="priority" name="priority" value={form.priority} onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="reported_by" className="block text-sm font-medium text-gray-700 mb-1">Reported By</label>
          <input id="reported_by" name="reported_by" value={form.reported_by} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea id="description" name="description" value={form.description} onChange={handleChange} rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="technician_name" className="block text-sm font-medium text-gray-700 mb-1">Assigned Technician</label>
          <input id="technician_name" name="technician_name" value={form.technician_name} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select id="status" name="status" value={form.status} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        {form.status === 'resolved' && (
          <>
            <div>
              <label htmlFor="resolved_date" className="block text-sm font-medium text-gray-700 mb-1">Resolved Date</label>
              <input id="resolved_date" name="resolved_date" type="date" value={form.resolved_date} onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="resolution_notes" className="block text-sm font-medium text-gray-700 mb-1">Resolution Notes</label>
              <textarea id="resolution_notes" name="resolution_notes" value={form.resolution_notes} onChange={handleChange} rows={2}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </>
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

- [ ] **Step 4: Run test to verify it passes**

```bash
npm test -- src/pages/breakdowns/BreakdownForm.test.jsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/breakdowns/BreakdownForm.jsx src/pages/breakdowns/BreakdownForm.test.jsx
git commit -m "feat: add breakdown log/edit form"
```

---

## Task 7: Update Dashboard

**Files:**
- Modify: `src/pages/Dashboard.jsx`
- Modify: `src/pages/Dashboard.test.jsx`

Add two new stat cards: open breakdowns count (red, links to /breakdowns) and AMCs expiring within 60 days count (orange, links to /contracts).

- [ ] **Step 1: Update the test** — open `src/pages/Dashboard.test.jsx` and replace the entire file:

```jsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from './Dashboard'

vi.mock('../lib/api', () => ({
  getOverdueMaintenance: vi.fn(),
  getJobs: vi.fn(),
  getAllMaintenanceSchedules: vi.fn(),
  getUnpaidInvoices: vi.fn(),
  getOpenBreakdowns: vi.fn(),
  getExpiringAmcContracts: vi.fn(),
}))

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

import { getOverdueMaintenance, getJobs, getAllMaintenanceSchedules, getUnpaidInvoices, getOpenBreakdowns, getExpiringAmcContracts } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

function mockAll() {
  getOverdueMaintenance.mockResolvedValue({ data: [], error: null })
  getJobs.mockResolvedValue({ data: [], error: null })
  getAllMaintenanceSchedules.mockResolvedValue({ data: [], error: null })
  getUnpaidInvoices.mockResolvedValue({ data: [], error: null })
  getOpenBreakdowns.mockResolvedValue({ data: [], error: null })
  getExpiringAmcContracts.mockResolvedValue({ data: [], error: null })
}

describe('Dashboard', () => {
  it('shows overdue maintenance count', async () => {
    useAuth.mockReturnValue({ role: 'admin' })
    mockAll()
    getOverdueMaintenance.mockResolvedValue({ data: [{ id: 'm1' }, { id: 'm2' }], error: null })
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getAllByText(/overdue/i).length).toBeGreaterThan(0)
    })
  })

  it('shows unpaid invoices total for admin', async () => {
    useAuth.mockReturnValue({ role: 'admin' })
    mockAll()
    getUnpaidInvoices.mockResolvedValue({
      data: [{ id: 'i1', total_amount: 10000 }, { id: 'i2', total_amount: 5000 }],
      error: null,
    })
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText(/unpaid/i)).toBeInTheDocument()
    })
  })

  it('hides financial stats from operations_manager', async () => {
    useAuth.mockReturnValue({ role: 'operations_manager' })
    mockAll()
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.queryByText(/unpaid invoices/i)).not.toBeInTheDocument()
    })
  })

  it('shows open breakdowns count', async () => {
    useAuth.mockReturnValue({ role: 'operations_manager' })
    mockAll()
    getOpenBreakdowns.mockResolvedValue({ data: [{ id: 'b1' }, { id: 'b2' }, { id: 'b3' }], error: null })
    render(<MemoryRouter><Dashboard /></MemoryRouter>)
    await waitFor(() => {
      expect(screen.getByText(/open breakdown/i)).toBeInTheDocument()
    })
  })
})
```

- [ ] **Step 2: Run test to verify the new test fails**

```bash
npm test -- src/pages/Dashboard.test.jsx
```

Expected: 1 new test FAILs (open breakdowns), 3 existing pass

- [ ] **Step 3: Replace `src/pages/Dashboard.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  getAllMaintenanceSchedules, getExpiringAmcContracts, getJobs,
  getOpenBreakdowns, getOverdueMaintenance, getUnpaidInvoices,
} from '../lib/api'

function fmt(amount) {
  return `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

function StatCard({ label, value, sublabel, color, to }) {
  const content = (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${color}`}>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      <p className="text-sm font-medium text-gray-700 mt-1">{label}</p>
      {sublabel && <p className="text-xs text-gray-500 mt-1">{sublabel}</p>}
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : content
}

export default function Dashboard() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'

  const [overdue, setOverdue] = useState([])
  const [jobs, setJobs] = useState([])
  const [schedules, setSchedules] = useState([])
  const [unpaidInvoices, setUnpaidInvoices] = useState([])
  const [openBreakdowns, setOpenBreakdowns] = useState([])
  const [expiringContracts, setExpiringContracts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetches = [
      getOverdueMaintenance().then(({ data }) => setOverdue(data || [])),
      getJobs().then(({ data }) => setJobs(data || [])),
      getAllMaintenanceSchedules().then(({ data }) => setSchedules(data || [])),
      getOpenBreakdowns().then(({ data }) => setOpenBreakdowns(data || [])),
      getExpiringAmcContracts().then(({ data }) => setExpiringContracts(data || [])),
    ]
    if (isAdmin) {
      fetches.push(getUnpaidInvoices().then(({ data }) => setUnpaidInvoices(data || [])))
    }
    Promise.all(fetches).then(() => setLoading(false))
  }, [isAdmin])

  if (loading) return <p className="text-gray-500">Loading...</p>

  const today = new Date().toISOString().split('T')[0]
  const oneWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const inProgressToday = jobs.filter(j => j.status === 'in_progress').length
  const upcomingThisWeek = schedules.filter(s => s.next_due_date && s.next_due_date >= today && s.next_due_date <= oneWeek).length

  const unpaidTotal = unpaidInvoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0)
  const dueThisMonth = unpaidInvoices.filter(inv => inv.due_date && inv.due_date.slice(0, 7) === today.slice(0, 7)).length

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 mb-6 lg:grid-cols-3">
        <StatCard
          label="Overdue Maintenance"
          value={overdue.length}
          color="border-red-500"
          sublabel={overdue.length > 0 ? 'Needs attention' : 'All up to date'}
          to="/maintenance"
        />
        <StatCard
          label="Upcoming This Week"
          value={upcomingThisWeek}
          color="border-blue-500"
          sublabel="Scheduled visits"
          to="/maintenance"
        />
        <StatCard
          label="Jobs In Progress"
          value={inProgressToday}
          color="border-yellow-500"
          sublabel="Currently active"
          to="/jobs"
        />
        <StatCard
          label="Open Breakdowns"
          value={openBreakdowns.length}
          color="border-red-600"
          sublabel={openBreakdowns.length > 0 ? 'Needs response' : 'None open'}
          to="/breakdowns"
        />
        <StatCard
          label="Contracts Expiring"
          value={expiringContracts.length}
          color="border-orange-400"
          sublabel="Within 60 days"
          to="/contracts"
        />
        {isAdmin && (
          <StatCard
            label="Unpaid Invoices"
            value={fmt(unpaidTotal)}
            color="border-orange-500"
            sublabel={`${unpaidInvoices.length} invoice${unpaidInvoices.length !== 1 ? 's' : ''}`}
            to="/invoices"
          />
        )}
      </div>

      {isAdmin && dueThisMonth > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <p className="text-orange-800 font-medium text-sm">
            {dueThisMonth} invoice{dueThisMonth !== 1 ? 's' : ''} due this month
          </p>
        </div>
      )}

      {openBreakdowns.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-base font-semibold text-red-600 mb-3">Open Breakdowns</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Elevator</th>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {openBreakdowns.slice(0, 5).map(b => (
                <tr key={b.id} className="text-sm">
                  <td className="py-2 text-gray-900">{b.reported_date}</td>
                  <td className="py-2 text-gray-600">{b.elevators?.buildings?.customers?.name}</td>
                  <td className="py-2 font-medium text-gray-900">{b.elevators?.unit_number}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${b.priority === 'high' ? 'bg-red-100 text-red-800' : b.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-700'}`}>
                      {b.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link to="/breakdowns" className="text-blue-600 hover:underline text-sm mt-2 block">
            View all breakdowns →
          </Link>
        </div>
      )}

      {overdue.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-base font-semibold text-red-600 mb-3">Overdue Maintenance</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Elevator</th>
                <th className="py-2 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {overdue.slice(0, 5).map(s => (
                <tr key={s.id} className="text-sm">
                  <td className="py-2 text-gray-900">{s.elevators?.buildings?.customers?.name}</td>
                  <td className="py-2 font-medium text-gray-900">{s.elevators?.unit_number}</td>
                  <td className="py-2 text-red-600 font-medium">{s.next_due_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {overdue.length > 5 && (
            <Link to="/maintenance" className="text-blue-600 hover:underline text-sm mt-2 block">
              View all {overdue.length} overdue →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests**

```bash
npm test -- src/pages/Dashboard.test.jsx
```

Expected: 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard.jsx src/pages/Dashboard.test.jsx
git commit -m "feat: add open breakdowns and expiring AMC stats to dashboard"
```

---

## Task 8: Wire Up Routes and Nav

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/Layout.jsx`

- [ ] **Step 1: Update `src/components/Layout.jsx`** — replace the `navItems` array:

```js
const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Customers', to: '/customers' },
  { label: 'Elevators', to: '/elevators' },
  { label: 'Contracts', to: '/contracts' },
  { label: 'Maintenance', to: '/maintenance' },
  { label: 'Jobs', to: '/jobs' },
  { label: 'Breakdowns', to: '/breakdowns' },
  { label: 'Invoices', to: '/invoices', adminOnly: true },
  { label: 'Projects', to: '/projects', adminOnly: true },
  { label: 'Reports', to: '/reports' },
]
```

- [ ] **Step 2: Update `src/App.jsx`** — add imports and routes. Add these imports after the existing import block:

```js
import AmcList from './pages/contracts/AmcList'
import AmcForm from './pages/contracts/AmcForm'
import AmcDetail from './pages/contracts/AmcDetail'
import BreakdownList from './pages/breakdowns/BreakdownList'
import BreakdownForm from './pages/breakdowns/BreakdownForm'
```

Then add these routes inside the `<Route element={<ProtectedLayout />}>` block, after the `/jobs` routes:

```jsx
<Route path="/contracts" element={<AmcList />} />
<Route path="/contracts/new" element={<AmcForm />} />
<Route path="/contracts/:id" element={<AmcDetail />} />
<Route path="/contracts/:id/edit" element={<AmcForm />} />
<Route path="/breakdowns" element={<BreakdownList />} />
<Route path="/breakdowns/new" element={<BreakdownForm />} />
<Route path="/breakdowns/:id/edit" element={<BreakdownForm />} />
```

- [ ] **Step 3: Run all tests**

```bash
npm test
```

Expected: All tests PASS

- [ ] **Step 4: Commit and push**

```bash
git add src/App.jsx src/components/Layout.jsx
git commit -m "feat: wire up AMC contracts and breakdowns routes and nav"
git push origin main
```

---

## SQL to Run in Supabase Before Testing in Production

Before the app can work end-to-end, run this in Supabase SQL Editor:

```sql
create table if not exists amc_contracts (
  id uuid default gen_random_uuid() primary key,
  customer_id uuid references customers on delete cascade not null,
  contract_number text not null,
  contract_type text not null check (contract_type in ('comprehensive', 'non_comprehensive', 'call_based')),
  start_date date not null,
  end_date date not null,
  monthly_fee numeric(12,2) default 0,
  coverage_notes text,
  status text default 'active' check (status in ('active', 'expired', 'cancelled')),
  created_at timestamptz default now()
);

create table if not exists breakdowns (
  id uuid default gen_random_uuid() primary key,
  elevator_id uuid references elevators on delete cascade not null,
  reported_date date not null default current_date,
  reported_by text,
  priority text default 'medium' check (priority in ('high', 'medium', 'low')),
  description text,
  status text default 'open' check (status in ('open', 'in_progress', 'resolved')),
  technician_name text,
  resolved_date date,
  resolution_notes text,
  created_at timestamptz default now()
);

alter table amc_contracts enable row level security;
alter table breakdowns enable row level security;
create policy "auth_all" on amc_contracts for all to authenticated using (true) with check (true);
create policy "auth_all" on breakdowns for all to authenticated using (true) with check (true);
```
