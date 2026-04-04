# Project Pipeline Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a gate-based 12-step project pipeline tracker that prevents steps from being skipped, with a Kanban overview and step-by-step detail view.

**Architecture:** New pipeline layer wraps existing `installation_projects` table. Four new Supabase tables store pipeline state, step completions, file attachments, and activity logs. React pages follow existing patterns (list → detail → form). Role-based gate enforcement: `admin` role = Boss (full access), `coordinator` role = new Admin/procurement (steps 4–9), `operations` role = field operations (steps 10–11).

**Tech Stack:** React + Vite, Supabase (PostgreSQL + Storage), React Router, Tailwind CSS, Vitest

---

## Role Mapping (Pipeline Context)

| Spec Role | Supabase `profiles.role` | Default Step Ownership |
|-----------|--------------------------|----------------------|
| Boss | `admin` | Steps 1, 3, 5, 12 + overrides |
| Admin/Coordinator | `coordinator` (new) | Steps 4, 6, 7, 8, 9 |
| Engineer | `admin` or `coordinator` | Steps 2, 11 |
| Operations | `operations` | Steps 10 |

The `admin` role can complete ANY step. `coordinator` and `operations` can only complete their assigned steps (or steps Boss has reassigned to them).

---

## Step Gate Types

| Gate Type | Steps | Completion Requirement |
|-----------|-------|----------------------|
| `confirm_with_data` | 1 | Mark confirmed + choose project_type + supplier text |
| `file_required` | 2, 3, 4, 5, 11, 12 | Must upload at least one file |
| `date_entry` | 6 | Must enter `production_end_date` |
| `checkpoint` | 7 | System creates 3 checkpoints (40%/80%/100% of duration); each needs a log note |
| `tracking_entry` | 8 | Must enter `tracking_number` and `shipping_date` |
| `confirm_optional_file` | 9, 10 | Mark done + optional file |

---

## File Structure

**New files:**
- `elevator-app/src/pages/pipeline/PipelineList.jsx` — Kanban overview of all pipelines
- `elevator-app/src/pages/pipeline/PipelineDetail.jsx` — Step-by-step gate view for one pipeline
- `elevator-app/src/pages/pipeline/PipelineForm.jsx` — Create new pipeline linked to a project

**Modified files:**
- `elevator-app/src/lib/api.js` — Add pipeline API functions
- `elevator-app/src/lib/api.test.js` — Add pipeline API tests
- `elevator-app/src/App.jsx` — Add `/pipeline` routes
- `elevator-app/src/components/Layout.jsx` — Add "Pipeline" nav item

---

## Task 1: Database Schema

**Files:**
- Create: `elevator-app/supabase/pipeline-schema.sql`

- [ ] **Step 1: Create the SQL schema file**

```sql
-- elevator-app/supabase/pipeline-schema.sql

-- Add coordinator role to profiles (run in Supabase SQL editor)
-- Note: if profiles.role has a CHECK constraint, update it first:
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
-- ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
--   CHECK (role IN ('admin', 'operations', 'coordinator'));

CREATE TABLE IF NOT EXISTS pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES installation_projects(id) ON DELETE CASCADE,
  project_type TEXT NOT NULL CHECK (project_type IN (
    'new_installation', 'modernization', 'escalator', 'dismantle_install'
  )),
  supplier TEXT NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL CHECK (step_number BETWEEN 1 AND 12),
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'unlocked', 'completed')),
  assigned_role TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  data JSONB DEFAULT '{}',
  CONSTRAINT unique_pipeline_step UNIQUE (pipeline_id, step_number)
);

CREATE TABLE IF NOT EXISTS pipeline_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_step_id UUID REFERENCES pipeline_steps(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE CASCADE,
  pipeline_step_id UUID REFERENCES pipeline_steps(id),
  action TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Storage bucket for pipeline files (run in Supabase dashboard or SQL editor)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('pipeline-files', 'pipeline-files', false)
-- ON CONFLICT DO NOTHING;
```

- [ ] **Step 2: Run schema in Supabase SQL editor**

Open Supabase dashboard → SQL Editor → paste contents of `pipeline-schema.sql` → Run.

Also create the storage bucket manually:
- Go to Supabase → Storage → New bucket
- Name: `pipeline-files`
- Public: OFF (private files)

- [ ] **Step 3: Commit schema file**

```bash
cd elevator-app
git add supabase/pipeline-schema.sql
git commit -m "feat: add pipeline tracker database schema"
```

---

## Task 2: Pipeline API Functions

**Files:**
- Modify: `elevator-app/src/lib/api.js`
- Modify: `elevator-app/src/lib/api.test.js`

### Step definitions (used by API + UI)

- [ ] **Step 1: Write failing tests for pipeline API functions**

Add to `elevator-app/src/lib/api.test.js`:

```js
import {
  getPipelines, getPipeline, createPipeline,
  completeStep, overrideGate, uploadStepFile,
  logActivity, getPipelineActivity,
} from './api'

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
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd elevator-app
npm test -- --reporter=verbose api.test
```

Expected: FAIL — `getPipelines is not a function`

- [ ] **Step 3: Add pipeline constants and API functions to api.js**

Append to `elevator-app/src/lib/api.js`:

```js
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
    .select('*, installation_projects(name, customers(name)), pipeline_steps(*)')
    .order('created_at', { ascending: false })
}

export async function getPipeline(id) {
  return supabase
    .from('pipelines')
    .select('*, installation_projects(name, customers(name)), pipeline_steps(*, pipeline_attachments(*))')
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
  if (stepNumber > 12) updates.status = 'completed'
  return supabase.from('pipelines').update(updates).eq('id', pipelineId).select().single()
}

export async function overrideGate(pipelineId, stepId, reason) {
  await supabase
    .from('pipeline_steps')
    .update({ status: 'unlocked', unlocked_at: new Date().toISOString() })
    .eq('id', stepId)
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd elevator-app
npm test -- --reporter=verbose api.test
```

Expected: PASS for all pipeline tests

- [ ] **Step 5: Commit**

```bash
git add src/lib/api.js src/lib/api.test.js
git commit -m "feat: add pipeline API functions"
```

---

## Task 3: Pipeline Creation Form

**Files:**
- Create: `elevator-app/src/pages/pipeline/PipelineForm.jsx`

- [ ] **Step 1: Create PipelineForm.jsx**

```jsx
// elevator-app/src/pages/pipeline/PipelineForm.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getProjects, createPipeline, createPipelineSteps, logActivity,
  PROJECT_TYPES,
} from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

export default function PipelineForm() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [form, setForm] = useState({
    project_id: '',
    project_type: 'new_installation',
    supplier: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getProjects().then(({ data }) => setProjects(data || []))
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.project_id || !form.supplier.trim()) {
      setError('All fields are required.')
      return
    }
    setSaving(true)
    const { data: pipeline, error: pErr } = await createPipeline({
      ...form,
      created_by: user.id,
    })
    if (pErr) { setError(pErr.message); setSaving(false); return }

    const { error: sErr } = await createPipelineSteps(pipeline.id)
    if (sErr) { setError(sErr.message); setSaving(false); return }

    await logActivity(pipeline.id, null, 'pipeline_created', 'Pipeline created', {
      project_type: form.project_type,
      supplier: form.supplier,
    })

    navigate(`/pipeline/${pipeline.id}`)
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Start New Pipeline</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Installation Project
          </label>
          <select
            value={form.project_id}
            onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a project…</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Type
          </label>
          <select
            value={form.project_type}
            onChange={e => setForm(f => ({ ...f, project_type: e.target.value }))}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PROJECT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Supplier
          </label>
          <input
            type="text"
            value={form.supplier}
            onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
            placeholder="e.g. KONE Philippines"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 text-sm disabled:opacity-50"
          >
            {saving ? 'Creating…' : 'Start Pipeline'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/pipeline')}
            className="text-gray-600 px-5 py-2 rounded border border-gray-300 hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/pipeline/PipelineForm.jsx
git commit -m "feat: add pipeline creation form"
```

---

## Task 4: Pipeline Detail View (Gate Enforcement)

**Files:**
- Create: `elevator-app/src/pages/pipeline/PipelineDetail.jsx`

This is the core of the feature — the step-by-step view with gate enforcement.

- [ ] **Step 1: Create PipelineDetail.jsx**

```jsx
// elevator-app/src/pages/pipeline/PipelineDetail.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getPipeline, completeStep, unlockNextStep, updatePipelineCurrentStep,
  overrideGate, uploadPipelineFile, logActivity, getPipelineActivity,
  PIPELINE_STEPS,
} from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

const STEP_LABELS = Object.fromEntries(PIPELINE_STEPS.map(s => [s.number, s.label]))
const STEP_GATES = Object.fromEntries(PIPELINE_STEPS.map(s => [s.number, s.gate]))
const STEP_ROLES = Object.fromEntries(PIPELINE_STEPS.map(s => [s.number, s.role]))

function canCompleteStep(stepNumber, userRole) {
  if (userRole === 'admin') return true
  return STEP_ROLES[stepNumber] === userRole
}

function daysSince(dateStr) {
  if (!dateStr) return 0
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000)
}

function StatusBadge({ status, unlockedAt }) {
  if (status === 'completed') {
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Completed</span>
  }
  if (status === 'locked') {
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Locked</span>
  }
  const days = daysSince(unlockedAt)
  if (days >= 7) {
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Overdue ({days}d)</span>
  }
  if (days >= 3) {
    return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Waiting ({days}d)</span>
  }
  return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">In Progress</span>
}

function StepCompleteForm({ step, pipeline, onDone, onCancel }) {
  const { user } = useAuth()
  const gate = STEP_GATES[step.step_number]
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState(null)
  const [productionEndDate, setProductionEndDate] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [shippingDate, setShippingDate] = useState('')
  const [projectType, setProjectType] = useState(pipeline.project_type)
  const [supplier, setSupplier] = useState(pipeline.supplier)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleComplete() {
    setSaving(true)
    setError(null)

    // Validate gate requirements
    if ((gate === 'file_required') && !file && step.pipeline_attachments?.length === 0) {
      setError('A file attachment is required to complete this step.')
      setSaving(false)
      return
    }
    if (gate === 'date_entry' && !productionEndDate) {
      setError('Expected production completion date is required.')
      setSaving(false)
      return
    }
    if (gate === 'tracking_entry' && (!trackingNumber || !shippingDate)) {
      setError('Tracking number and shipping date are required.')
      setSaving(false)
      return
    }

    // Upload file if provided
    if (file) {
      const { error: fErr } = await uploadPipelineFile(step.id, file)
      if (fErr) { setError(fErr.message); setSaving(false); return }
    }

    // Gather step-specific data
    const data = {}
    if (gate === 'date_entry') data.production_end_date = productionEndDate
    if (gate === 'tracking_entry') { data.tracking_number = trackingNumber; data.shipping_date = shippingDate }
    if (gate === 'confirm_with_data') { data.project_type = projectType; data.supplier = supplier }

    // Complete the step
    const { error: cErr } = await completeStep(step.id, { notes, data })
    if (cErr) { setError(cErr.message); setSaving(false); return }

    // Unlock next step (if not last)
    const nextNum = step.step_number + 1
    if (nextNum <= 12) {
      await unlockNextStep(pipeline.id, nextNum)
      await updatePipelineCurrentStep(pipeline.id, nextNum)
    } else {
      await updatePipelineCurrentStep(pipeline.id, 13) // marks complete
    }

    await logActivity(pipeline.id, step.id, 'step_completed', notes, data)
    onDone()
  }

  return (
    <div className="mt-3 p-4 bg-gray-50 rounded border border-gray-200">
      {gate === 'confirm_with_data' && (
        <div className="space-y-3 mb-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Project Type</label>
            <select value={projectType} onChange={e => setProjectType(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-2 py-1 text-sm">
              <option value="new_installation">New Installation</option>
              <option value="modernization">Modernization</option>
              <option value="escalator">Escalator Installation</option>
              <option value="dismantle_install">Dismantle + Install New</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Supplier</label>
            <input value={supplier} onChange={e => setSupplier(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-2 py-1 text-sm" />
          </div>
        </div>
      )}

      {gate === 'date_entry' && (
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-600">Expected Production Completion Date</label>
          <input type="date" value={productionEndDate} onChange={e => setProductionEndDate(e.target.value)}
            className="w-full mt-1 border border-gray-300 rounded px-2 py-1 text-sm" />
        </div>
      )}

      {gate === 'tracking_entry' && (
        <div className="space-y-3 mb-3">
          <div>
            <label className="text-xs font-medium text-gray-600">Tracking Number</label>
            <input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-2 py-1 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Shipping Date</label>
            <input type="date" value={shippingDate} onChange={e => setShippingDate(e.target.value)}
              className="w-full mt-1 border border-gray-300 rounded px-2 py-1 text-sm" />
          </div>
        </div>
      )}

      {(gate === 'file_required' || gate === 'confirm_optional_file') && (
        <div className="mb-3">
          <label className="text-xs font-medium text-gray-600">
            {gate === 'file_required' ? 'Attach File (required)' : 'Attach File (optional)'}
          </label>
          <input type="file" onChange={e => setFile(e.target.files[0])}
            className="w-full mt-1 text-sm" />
          {step.pipeline_attachments?.length > 0 && (
            <p className="text-xs text-green-600 mt-1">
              {step.pipeline_attachments.length} file(s) already attached
            </p>
          )}
        </div>
      )}

      <div className="mb-3">
        <label className="text-xs font-medium text-gray-600">Notes (optional)</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
          className="w-full mt-1 border border-gray-300 rounded px-2 py-1 text-sm" />
      </div>

      {error && <p className="text-red-600 text-xs mb-3">{error}</p>}

      <div className="flex gap-2">
        <button onClick={handleComplete} disabled={saving}
          className="bg-green-600 text-white px-4 py-1.5 rounded text-sm hover:bg-green-700 disabled:opacity-50">
          {saving ? 'Saving…' : 'Mark Complete'}
        </button>
        <button onClick={onCancel}
          className="text-gray-500 px-4 py-1.5 rounded text-sm border border-gray-300 hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </div>
  )
}

export default function PipelineDetail() {
  const { id } = useParams()
  const { role, user } = useAuth()
  const navigate = useNavigate()
  const [pipeline, setPipeline] = useState(null)
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeForm, setActiveForm] = useState(null) // step_number of open form
  const [overrideStep, setOverrideStep] = useState(null)
  const [overrideReason, setOverrideReason] = useState('')

  async function reload() {
    const [{ data: p }, { data: a }] = await Promise.all([
      getPipeline(id),
      getPipelineActivity(id),
    ])
    setPipeline(p)
    setActivity(a || [])
  }

  useEffect(() => {
    reload().finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="text-gray-500">Loading…</p>
  if (!pipeline) return <p className="text-red-500">Pipeline not found.</p>

  const steps = [...(pipeline.pipeline_steps || [])].sort((a, b) => a.step_number - b.step_number)
  const projectLabel = pipeline.installation_projects?.name || '—'
  const customerLabel = pipeline.installation_projects?.customers?.name || '—'

  async function handleOverride() {
    if (!overrideReason.trim()) return
    await overrideGate(pipeline.id, overrideStep.id, overrideReason)
    setOverrideStep(null)
    setOverrideReason('')
    await reload()
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate('/pipeline')} className="text-sm text-blue-600 hover:underline mb-2">
          ← Back to Pipeline
        </button>
        <h1 className="text-2xl font-bold text-gray-800">{projectLabel}</h1>
        <p className="text-gray-500 text-sm">{customerLabel} · {pipeline.supplier} · {pipeline.project_type.replace(/_/g, ' ')}</p>
        <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs font-medium ${
          pipeline.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {pipeline.status === 'completed' ? 'Completed' : `Step ${pipeline.current_step} of 12`}
        </span>
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map(step => {
          const def = PIPELINE_STEPS[step.step_number - 1]
          const isOpen = activeForm === step.step_number
          const canComplete = step.status === 'unlocked' && canCompleteStep(step.step_number, role)

          return (
            <div key={step.id} className={`border rounded-lg p-4 ${
              step.status === 'completed' ? 'bg-green-50 border-green-200' :
              step.status === 'unlocked' ? 'bg-white border-blue-300' :
              'bg-gray-50 border-gray-200 opacity-60'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                    step.status === 'completed' ? 'bg-green-500 text-white' :
                    step.status === 'unlocked' ? 'bg-blue-500 text-white' :
                    'bg-gray-300 text-gray-600'
                  }`}>
                    {step.status === 'completed' ? '✓' : step.step_number}
                  </span>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{def.label}</p>
                    {step.status === 'completed' && step.notes && (
                      <p className="text-xs text-gray-500 mt-0.5">{step.notes}</p>
                    )}
                    {step.completed_at && (
                      <p className="text-xs text-gray-400">
                        Completed {new Date(step.completed_at).toLocaleDateString('en-PH')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={step.status} unlockedAt={step.unlocked_at} />
                  {canComplete && !isOpen && (
                    <button onClick={() => setActiveForm(step.step_number)}
                      className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                      Complete
                    </button>
                  )}
                  {role === 'admin' && step.status === 'locked' && (
                    <button onClick={() => setOverrideStep(step)}
                      className="text-xs text-orange-600 border border-orange-300 px-2 py-1 rounded hover:bg-orange-50">
                      Override
                    </button>
                  )}
                </div>
              </div>

              {isOpen && (
                <StepCompleteForm
                  step={step}
                  pipeline={pipeline}
                  onDone={async () => { setActiveForm(null); await reload() }}
                  onCancel={() => setActiveForm(null)}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Boss override modal */}
      {overrideStep && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="font-bold text-gray-800 mb-2">Override Gate</h3>
            <p className="text-sm text-gray-600 mb-4">
              You are unlocking Step {overrideStep.step_number} without completing the previous step. This will be logged.
            </p>
            <textarea
              value={overrideReason}
              onChange={e => setOverrideReason(e.target.value)}
              placeholder="Reason for override (required)…"
              rows={3}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-4"
            />
            <div className="flex gap-3">
              <button onClick={handleOverride} disabled={!overrideReason.trim()}
                className="bg-orange-600 text-white px-4 py-2 rounded text-sm hover:bg-orange-700 disabled:opacity-50">
                Override & Unlock
              </button>
              <button onClick={() => { setOverrideStep(null); setOverrideReason('') }}
                className="text-gray-600 px-4 py-2 rounded text-sm border border-gray-300 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity log */}
      {activity.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">Activity Log</h2>
          <div className="space-y-2">
            {activity.map(a => (
              <div key={a.id} className="text-sm text-gray-600 flex gap-2">
                <span className="text-gray-400 whitespace-nowrap">
                  {new Date(a.performed_at).toLocaleDateString('en-PH')}
                </span>
                <span className="font-medium capitalize">{a.action.replace(/_/g, ' ')}</span>
                {a.notes && <span>— {a.notes}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/pipeline/PipelineDetail.jsx
git commit -m "feat: add pipeline detail view with gate enforcement"
```

---

## Task 5: Pipeline Kanban Overview

**Files:**
- Create: `elevator-app/src/pages/pipeline/PipelineList.jsx`

- [ ] **Step 1: Create PipelineList.jsx**

```jsx
// elevator-app/src/pages/pipeline/PipelineList.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPipelines, PIPELINE_STAGES, PIPELINE_STEPS, PROJECT_TYPES } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

const PROJECT_TYPE_LABELS = Object.fromEntries(PROJECT_TYPES.map(t => [t.value, t.label]))
const STEP_LABELS = Object.fromEntries(PIPELINE_STEPS.map(s => [s.number, s.label]))
const STEP_ROLES = Object.fromEntries(PIPELINE_STEPS.map(s => [s.number, s.role]))

function daysSince(dateStr) {
  if (!dateStr) return 0
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000)
}

function getStageIndex(currentStep) {
  return PIPELINE_STAGES.findIndex(s => s.steps.includes(currentStep))
}

function cardColor(pipeline) {
  const step = pipeline.pipeline_steps?.find(s => s.step_number === pipeline.current_step)
  if (!step || step.status !== 'unlocked') return 'border-gray-200'
  const days = daysSince(step.unlocked_at)
  if (days >= 7) return 'border-red-400 bg-red-50'
  if (days >= 3) return 'border-yellow-400 bg-yellow-50'
  return 'border-blue-200 bg-white'
}

function PipelineCard({ pipeline }) {
  const step = pipeline.pipeline_steps?.find(s => s.step_number === pipeline.current_step)
  const days = step ? daysSince(step.unlocked_at) : 0

  return (
    <Link to={`/pipeline/${pipeline.id}`}
      className={`block border rounded-lg p-3 hover:shadow-md transition-shadow ${cardColor(pipeline)}`}>
      <p className="font-semibold text-gray-800 text-sm truncate">
        {pipeline.installation_projects?.name || '—'}
      </p>
      <p className="text-xs text-gray-500 truncate">
        {pipeline.installation_projects?.customers?.name || '—'}
      </p>
      <p className="text-xs text-gray-500 mt-1">{pipeline.supplier}</p>
      <div className="mt-2">
        <span className="text-xs font-medium text-gray-600">
          {PROJECT_TYPE_LABELS[pipeline.project_type] || pipeline.project_type}
        </span>
      </div>
      <div className="mt-2 text-xs text-gray-700 font-medium">
        Step {pipeline.current_step}: {STEP_LABELS[pipeline.current_step] || 'Complete'}
      </div>
      {days >= 3 && (
        <p className={`text-xs mt-1 font-semibold ${days >= 7 ? 'text-red-600' : 'text-yellow-600'}`}>
          {days}d waiting
        </p>
      )}
    </Link>
  )
}

export default function PipelineList() {
  const { role, user } = useAuth()
  const [pipelines, setPipelines] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    getPipelines().then(({ data }) => {
      setPipelines(data || [])
      setLoading(false)
    })
  }, [])

  if (loading) return <p className="text-gray-500">Loading…</p>

  const active = pipelines.filter(p => p.status !== 'completed')
  const filtered = filterType === 'all' ? active : active.filter(p => p.project_type === filterType)

  // "Needs Your Action" — steps unlocked and assigned to current user's role
  const mySteps = pipelines.flatMap(p =>
    (p.pipeline_steps || [])
      .filter(s => s.status === 'unlocked' && (role === 'admin' || STEP_ROLES[s.step_number] === role))
      .map(s => ({ ...s, pipeline: p }))
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Project Pipeline</h1>
        <div className="flex gap-3 items-center">
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Types</option>
            {PROJECT_TYPES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {role === 'admin' && (
            <Link to="/pipeline/new"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
              New Pipeline
            </Link>
          )}
        </div>
      </div>

      {/* Needs Your Action */}
      {mySteps.length > 0 && (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="font-semibold text-blue-800 mb-3">Needs Your Action ({mySteps.length})</h2>
          <div className="space-y-2">
            {mySteps.map(s => (
              <Link key={s.id} to={`/pipeline/${s.pipeline.id}`}
                className="flex items-center justify-between bg-white rounded p-3 border border-blue-100 hover:shadow-sm">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {s.pipeline.installation_projects?.name} — Step {s.step_number}: {STEP_LABELS[s.step_number]}
                  </p>
                  <p className="text-xs text-gray-500">Waiting {daysSince(s.unlocked_at)}d</p>
                </div>
                <span className="text-blue-600 text-xs font-medium">Open →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Kanban columns */}
      <div className="grid grid-cols-5 gap-4">
        {PIPELINE_STAGES.map((stage, idx) => {
          const stageProjects = filtered.filter(p => getStageIndex(p.current_step) === idx)
          return (
            <div key={stage.label} className="min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{stage.label}</h3>
                <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-2">{stageProjects.length}</span>
              </div>
              <div className="space-y-2">
                {stageProjects.map(p => <PipelineCard key={p.id} pipeline={p} />)}
                {stageProjects.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">Empty</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Completed */}
      {pipelines.filter(p => p.status === 'completed').length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            Completed ({pipelines.filter(p => p.status === 'completed').length})
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {pipelines.filter(p => p.status === 'completed').map(p => (
              <Link key={p.id} to={`/pipeline/${p.id}`}
                className="block border border-green-200 bg-green-50 rounded-lg p-3 hover:shadow-sm">
                <p className="font-semibold text-gray-800 text-sm">{p.installation_projects?.name}</p>
                <p className="text-xs text-green-700 font-medium mt-1">All 12 steps complete</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/pipeline/PipelineList.jsx
git commit -m "feat: add pipeline kanban overview"
```

---

## Task 6: Wire Routes and Navigation

**Files:**
- Modify: `elevator-app/src/App.jsx`
- Modify: `elevator-app/src/components/Layout.jsx`

- [ ] **Step 1: Add pipeline routes to App.jsx**

In `elevator-app/src/App.jsx`, add these imports after the existing imports:

```js
import PipelineList from './pages/pipeline/PipelineList'
import PipelineDetail from './pages/pipeline/PipelineDetail'
import PipelineForm from './pages/pipeline/PipelineForm'
```

Add these routes inside `<Route element={<ProtectedLayout />}>`, after the `/breakdowns` routes:

```jsx
<Route path="/pipeline" element={<PipelineList />} />
<Route path="/pipeline/new" element={<PrivateRoute adminOnly><PipelineForm /></PrivateRoute>} />
<Route path="/pipeline/:id" element={<PipelineDetail />} />
```

- [ ] **Step 2: Add Pipeline to nav in Layout.jsx**

In `elevator-app/src/components/Layout.jsx`, add to the `navItems` array after `{ label: 'Breakdowns', to: '/breakdowns' }`:

```js
{ label: 'Pipeline', to: '/pipeline' },
```

- [ ] **Step 3: Run dev server and smoke test**

```bash
cd elevator-app
npm run dev
```

- Open browser to `http://localhost:5173`
- Verify "Pipeline" appears in sidebar nav
- Navigate to `/pipeline` — should show empty kanban board
- Click "New Pipeline" — should show form
- Create a pipeline — should redirect to detail view
- Verify 12 steps appear, Step 1 is unlocked, Steps 2–12 are locked

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx src/components/Layout.jsx
git commit -m "feat: wire up pipeline routes and navigation"
git push origin main
```

---

## Self-Review

**Spec coverage check:**

| Spec Requirement | Covered By |
|-----------------|------------|
| Gate-based 12-step pipeline | Task 4 — StepCompleteForm enforces gate type per step |
| File upload required for steps 2,3,4,5,11,12 | Task 4 — `gate === 'file_required'` check |
| Production monitoring checkpoints at 40/80/100% | ⚠️ **GAP** — Step 7 has `checkpoint` gate type defined but no checkpoint auto-creation logic |
| Boss override with logged reason | Task 4 — `overrideGate()` + override modal |
| Role-based step access | Task 4 — `canCompleteStep()` function |
| Kanban overview with 5 columns | Task 5 — `PIPELINE_STAGES` drives column layout |
| "Needs Your Action" section | Task 5 — `mySteps` filter |
| Red/Yellow/Green status colors | Task 4 + 5 — `StatusBadge` + `cardColor` |
| Activity log | Task 4 — bottom of PipelineDetail |
| Create pipeline linked to project | Task 3 — PipelineForm |
| AMC prompt after Step 12 | ⚠️ **GAP** — not implemented (in spec as future item) |
| Filter by type/supplier/person | Task 5 — filter by type implemented; supplier/person filters deferred |

**GAP Fix — Production checkpoint auto-creation (Step 7):**

The `checkpoint` gate type requires checkpoints to be auto-created when Step 6 (Production Started) is completed with a `production_end_date`. Add this to the `completeStep` call in Task 4's `StepCompleteForm.handleComplete()`, after the step is completed and before unlocking the next step:

When `step.step_number === 6` and `data.production_end_date` is set, calculate 40%/80%/100% milestone dates and store them in the Step 7 `data` field via `updatePipelineStep`:

```js
// Add this block in handleComplete(), after completeStep() succeeds, when step.step_number === 6:
if (step.step_number === 6 && data.production_end_date) {
  const start = new Date()
  const end = new Date(data.production_end_date)
  const duration = end - start
  const checkpoints = [
    { pct: 40, date: new Date(start.getTime() + duration * 0.4).toISOString().split('T')[0] },
    { pct: 80, date: new Date(start.getTime() + duration * 0.8).toISOString().split('T')[0] },
    { pct: 100, date: end.toISOString().split('T')[0] },
  ]
  // Find step 7 and store checkpoint dates in its data field
  const step7 = pipeline.pipeline_steps.find(s => s.step_number === 7)
  if (step7) {
    await updatePipelineStep(step7.id, { data: { checkpoints, logs: [] } })
  }
}
```

This stores checkpoint dates in Step 7's `data.checkpoints`. Step 7 in `StepCompleteForm` should render these checkpoints and require a log entry for each before marking complete. This is a refinement that can be done inline during execution.

**AMC prompt:** The spec notes this as a future integration. Skip for this plan — it's a one-line prompt after Step 12 completes and links to `/contracts/new`. Can be added as a follow-up.

**Supplier/person filters:** Deferred. Type filter covers the most common use case. Supplier and person filters can be added in a follow-up PR.
