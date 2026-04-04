// elevator-app/src/pages/pipeline/PipelineDetail.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getPipeline, completeStep, unlockNextStep, updatePipelineCurrentStep,
  overrideGate, uploadPipelineFile, logActivity, getPipelineActivity,
  PIPELINE_STEPS,
} from '../../lib/api'
import { supabase } from '../../lib/supabase'
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
  const [activeForm, setActiveForm] = useState(null)
  const [overrideStep, setOverrideStep] = useState(null)
  const [overrideReason, setOverrideReason] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await supabase.from('pipelines').delete().eq('id', id)
    navigate('/pipeline')
  }

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
  const projectLabel = pipeline.installation_projects?.project_name || '—'
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
        <div className="flex items-center gap-3 mt-2">
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
            pipeline.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {pipeline.status === 'completed' ? 'Completed' : `Step ${pipeline.current_step} of 12`}
          </span>
          {role === 'admin' && (
            <button onClick={() => setConfirmDelete(true)}
              className="text-xs text-red-600 border border-red-300 px-2 py-1 rounded hover:bg-red-50">
              Delete Pipeline
            </button>
          )}
        </div>
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

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="font-bold text-gray-800 mb-2">Delete Pipeline?</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will permanently delete <strong>{projectLabel}</strong> and all its steps, attachments, and activity logs. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={deleting}
                className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50">
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
              <button onClick={() => setConfirmDelete(false)}
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
