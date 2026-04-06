// elevator-app/src/pages/pipeline/PipelineDetail.jsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  getPipeline, completeStep, unlockNextStep, updatePipelineCurrentStep,
  overrideGate, uploadPipelineFile, getPipelineFileUrl, logActivity, getPipelineActivity,
  PIPELINE_STEPS, deletePipeline, resetPipelineToStep, createOpsProject,
} from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

const STEP_LABELS = Object.fromEntries(PIPELINE_STEPS.map(s => [s.number, s.label]))
const STEP_GATES = Object.fromEntries(PIPELINE_STEPS.map(s => [s.number, s.gate]))
const STEP_ROLES = Object.fromEntries(PIPELINE_STEPS.map(s => [s.number, s.role]))

// Required document label per step — null means generic "file required"
const STEP_DOCUMENT_LABEL = {
  3: 'Client Signature',
  4: 'Engineer Confirmation to Supplier',
}

function canCompleteStep(stepNumber, userRole) {
  if (userRole === 'admin') return true
  return STEP_ROLES[stepNumber] === userRole
}

function daysSince(dateStr) {
  if (!dateStr) return 0
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000)
}

function StatusBadge({ status, unlockedAt }) {
  const base = { padding: '3px 10px', fontSize: 11, fontWeight: 700 }
  if (status === 'completed') return <span style={{ ...base, backgroundColor: '#D4AF37', color: '#2C2C2C' }}>Completed</span>
  if (status === 'locked')    return <span style={{ ...base, backgroundColor: '#E8E0C8', color: '#888888' }}>Locked</span>
  const days = daysSince(unlockedAt)
  if (days >= 7) return <span style={{ ...base, backgroundColor: '#8B0000', color: '#FFFFFF' }}>Overdue ({days}d)</span>
  if (days >= 3) return <span style={{ ...base, backgroundColor: '#8B4500', color: '#F5F5DC' }}>Waiting ({days}d)</span>
  return <span style={{ ...base, backgroundColor: '#2C2C2C', color: '#D4AF37' }}>In Progress</span>
}

async function openFile(attachment) {
  const { data, error } = await getPipelineFileUrl(attachment.file_path)
  if (error || !data?.signedUrl) { alert('Could not get download link.'); return }
  window.open(data.signedUrl, '_blank')
}

function FileList({ attachments }) {
  if (!attachments?.length) return null
  const sorted = [...attachments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {sorted.map((a, i) => (
        <button key={a.id} onClick={() => openFile(a)}
          className={`flex items-center gap-1.5 text-xs rounded px-2 py-1 border transition-colors ${
            i === 0
              ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
              : 'bg-white text-blue-700 border-gray-300 hover:bg-blue-50 hover:border-blue-400'
          }`}>
          <span>📎</span>
          <span className="max-w-[160px] truncate">{a.file_name}</span>
          {i === 0 && <span className="ml-1 text-xs opacity-80">Latest</span>}
        </button>
      ))}
    </div>
  )
}

function UploadRevisionForm({ step, pipelineId, onDone, onCancel }) {
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleUpload() {
    if (!file) { setError('Please choose a file.'); return }
    setSaving(true)
    const { error: fErr } = await uploadPipelineFile(step.id, file)
    if (fErr) { setError(fErr.message); setSaving(false); return }
    await resetPipelineToStep(pipelineId, 2)
    await logActivity(pipelineId, step.id, 'drawing_revised', `Revision uploaded: ${file.name}`, {})
    onDone()
  }

  return (
    <div style={{ marginTop: 12, padding: 16, backgroundColor: '#FFF8E8', border: '1px solid #D4AF37' }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#2C2C2C', marginBottom: 4 }}>Upload drawing revision</p>
      <p style={{ fontSize: 12, color: '#8B4500', marginBottom: 12 }}>Uploading a revision will reset the process back to Step 2 and lock steps 3 onwards.</p>
      <input type="file" onChange={e => setFile(e.target.files[0])} style={{ fontSize: 13, marginBottom: 8, width: '100%' }} />
      {error && <p style={{ color: '#8B0000', fontSize: 12, marginBottom: 8 }}>{error}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleUpload} disabled={saving || !file}
          style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', padding: '6px 14px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: (!file || saving) ? 0.5 : 1 }}>
          {saving ? 'Uploading…' : 'Upload & Reset to Step 2'}
        </button>
        <button onClick={onCancel}
          style={{ background: 'none', border: '1px solid #CCCCCC', color: '#888888', padding: '6px 14px', fontSize: 12, cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

const inputStyle = { width: '100%', border: '1px solid #D4AF37', backgroundColor: '#FFFFFF', color: '#2C2C2C', padding: '7px 10px', fontSize: 13, outline: 'none' }
const labelStyle = { fontSize: 12, fontWeight: 600, color: '#2C2C2C', marginBottom: 4, display: 'block' }

function StepCompleteForm({ step, pipeline, onDone, onCancel, role }) {
  const gate = STEP_GATES[step.step_number]
  const docLabel = STEP_DOCUMENT_LABEL[step.step_number]
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState(null)
  const [productionEndDate, setProductionEndDate] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [shippingDate, setShippingDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleComplete() {
    setSaving(true)
    setError(null)

    if (gate === 'file_required' && !file && step.pipeline_attachments?.length === 0) {
      const doc = STEP_DOCUMENT_LABEL[step.step_number]
      setError(doc ? `You must upload the ${doc} before this step can be completed.` : 'A file attachment is required to complete this step.')
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

    if (file) {
      const { error: fErr } = await uploadPipelineFile(step.id, file)
      if (fErr) { setError(fErr.message); setSaving(false); return }
    }

    const data = {}
    if (gate === 'date_entry') data.production_end_date = productionEndDate
    if (gate === 'tracking_entry') { data.tracking_number = trackingNumber; data.shipping_date = shippingDate }

    const { error: cErr } = await completeStep(step.id, { notes, data })
    if (cErr) { setError(cErr.message); setSaving(false); return }

    const nextNum = step.step_number + 1
    if (nextNum <= PIPELINE_STEPS.length) {
      await unlockNextStep(pipeline.id, nextNum)
      await updatePipelineCurrentStep(pipeline.id, nextNum)
    } else {
      await updatePipelineCurrentStep(pipeline.id, PIPELINE_STEPS.length + 1)
    }

    // Step 5 = Payment to Supplier — auto-add to Project Status as On-Going Production
    if (step.step_number === 5) {
      const proj = pipeline.installation_projects
      const today = new Date().toISOString().split('T')[0]
      const specParts = [
        pipeline.elevator_type?.replace(/_/g, ' '),
        pipeline.home_elevator_type,
        pipeline.unit_count > 1 ? `${pipeline.unit_count} units` : null,
      ].filter(Boolean).join(' · ')
      await createOpsProject({
        project_name: proj?.project_name || 'New Installation',
        status: 'on_going_production',
        production_start_date: today,
        specs: specParts || null,
        concerns: 'Auto-added from Pipeline after supplier payment.',
      })
    }

    await logActivity(pipeline.id, step.id, 'step_completed', notes, data)
    onDone()
  }

  const proj = pipeline.installation_projects

  return (
    <div style={{ marginTop: 12, padding: 16, backgroundColor: '#F5F5DC', border: '1px solid #D4AF37' }}>

      {gate === 'confirm_with_data' && (
        <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#FFFFFF', border: '1px solid #E8E0C8' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#2C2C2C', marginBottom: 4 }}>{proj?.project_name}</p>
          <p style={{ fontSize: 13, color: '#888888', textTransform: 'capitalize' }}>
            {[pipeline.elevator_type?.replace(/_/g, ' '), pipeline.home_elevator_type,
              pipeline.with_structure === true ? 'with structure' : pipeline.with_structure === false ? 'no structure' : null,
              pipeline.unit_count > 1 ? `${pipeline.unit_count} units` : '1 unit',
            ].filter(Boolean).join(' · ')}
          </p>
          {role === 'admin' && proj?.contract_amount && (
            <p style={{ fontSize: 13, color: '#2C2C2C', marginTop: 4 }}>
              ₱{Number(proj.contract_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              <span style={{ fontSize: 11, color: '#888888', marginLeft: 8 }}>{proj.vat_inclusive ? 'VAT Inclusive' : 'Non-VAT'}</span>
            </p>
          )}
        </div>
      )}

      {gate === 'date_entry' && (
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Expected production completion date</label>
          <input type="date" value={productionEndDate} onChange={e => setProductionEndDate(e.target.value)} style={inputStyle} />
        </div>
      )}

      {gate === 'tracking_entry' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Tracking number</label>
            <input value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Shipping date</label>
            <input type="date" value={shippingDate} onChange={e => setShippingDate(e.target.value)} style={inputStyle} />
          </div>
        </div>
      )}

      {(gate === 'file_required' || gate === 'confirm_optional_file') && (
        <div style={{ marginBottom: 12 }}>
          {docLabel ? (
            <div style={{ backgroundColor: '#2C2C2C', padding: '10px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Required document</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#FFFFFF' }}>{docLabel}</span>
              <span style={{ fontSize: 11, color: '#888888', marginLeft: 'auto' }}>Step cannot be completed without this file</span>
            </div>
          ) : null}
          <label style={labelStyle}>
            {gate === 'file_required'
              ? (docLabel ? `Upload: ${docLabel}` : 'Attach file (required)')
              : 'Attach file (optional)'}
          </label>
          <input type="file" onChange={e => setFile(e.target.files[0])} style={{ fontSize: 13, width: '100%', marginBottom: 8 }} />
          <FileList attachments={step.pipeline_attachments} />
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Notes (optional)</label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} style={inputStyle} />
      </div>

      {error && <p style={{ color: '#8B0000', fontSize: 12, marginBottom: 10 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleComplete} disabled={saving}
          style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', padding: '8px 20px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
          {saving ? 'Saving…' : 'Mark complete'}
        </button>
        <button onClick={onCancel}
          style={{ background: 'none', border: '1px solid #CCCCCC', color: '#888888', padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}>
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
  const [showRevision, setShowRevision] = useState(false)
  const [overrideStep, setOverrideStep] = useState(null)
  const [overrideReason, setOverrideReason] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    await deletePipeline(id)
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

  const descLine = [
    customerLabel !== '—' ? customerLabel : null,
    pipeline.elevator_type?.replace(/_/g, ' '),
    pipeline.home_elevator_type,
    pipeline.with_structure === true ? 'with structure' : pipeline.with_structure === false ? 'no structure' : null,
    pipeline.unit_count > 1 ? `${pipeline.unit_count} units` : null,
  ].filter(Boolean).join(' · ')

  return (
    <div className="max-w-3xl mx-auto">

      {/* PRINT-ONLY status summary */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; }
        }
        .print-only { display: none; }
      `}</style>

      <div className="print-only" style={{ padding: 32, fontFamily: 'Georgia, serif' }}>
        <p style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>FIEC Elevator — Project Status Report</p>
        <p style={{ fontSize: 11, color: '#888', marginBottom: 20 }}>Printed: {new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#2C2C2C', marginBottom: 4 }}>{projectLabel}</h1>
        <p style={{ fontSize: 13, color: '#555', marginBottom: 16 }}>{descLine}</p>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2C', marginBottom: 20 }}>
          Status: {pipeline.status === 'completed' ? 'All 12 Steps Complete' : `Step ${pipeline.current_step} of 12 — ${STEP_LABELS[pipeline.current_step] || ''}`}
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #D4AF37' }}>
              <th style={{ textAlign: 'left', padding: '6px 8px', width: 40 }}>#</th>
              <th style={{ textAlign: 'left', padding: '6px 8px' }}>Step</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', width: 100 }}>Status</th>
              <th style={{ textAlign: 'left', padding: '6px 8px', width: 120 }}>Completed</th>
            </tr>
          </thead>
          <tbody>
            {steps.map(step => {
              const def = PIPELINE_STEPS[step.step_number - 1]
              return (
                <tr key={step.id} style={{ borderBottom: '1px solid #eee', backgroundColor: step.status === 'unlocked' ? '#FFFDE8' : 'transparent' }}>
                  <td style={{ padding: '6px 8px', color: '#888' }}>{step.step_number}</td>
                  <td style={{ padding: '6px 8px', fontWeight: step.status === 'unlocked' ? 700 : 400 }}>{def.label}</td>
                  <td style={{ padding: '6px 8px', color: step.status === 'completed' ? '#2a7a2a' : step.status === 'unlocked' ? '#b8860b' : '#999' }}>
                    {step.status === 'completed' ? '✓ Done' : step.status === 'unlocked' ? '→ In Progress' : '○ Pending'}
                  </td>
                  <td style={{ padding: '6px 8px', color: '#555' }}>
                    {step.completed_at ? new Date(step.completed_at).toLocaleDateString('en-PH') : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {activity.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Activity Log</p>
            {activity.slice(0, 10).map(a => (
              <p key={a.id} style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>
                {new Date(a.performed_at).toLocaleDateString('en-PH')} — {a.action.replace(/_/g, ' ')}{a.notes ? `: ${a.notes}` : ''}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Header */}
      <div className="no-print mb-6">
        <button onClick={() => navigate('/pipeline')} style={{ fontSize: 13, color: '#D4AF37', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 8 }}>
          ← Back to Pipeline
        </button>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#2C2C2C' }}>{projectLabel}</h1>
            <p style={{ color: '#888888', fontSize: 13, marginTop: 2 }}>{descLine}</p>
            {role === 'admin' && pipeline.installation_projects?.contract_amount && (
              <p style={{ fontSize: 13, color: '#2C2C2C', marginTop: 4 }}>
                ₱{Number(pipeline.installation_projects.contract_amount).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                <span style={{ marginLeft: 8, fontSize: 12, color: '#888888' }}>
                  {pipeline.installation_projects.vat_inclusive ? 'VAT Inclusive' : 'Non-VAT'}
                </span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()}
              style={{ border: '1px solid #D4AF37', backgroundColor: '#F5F5DC', color: '#2C2C2C', padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Print Status
            </button>
            {role === 'admin' && (
              <button onClick={() => setConfirmDelete(true)}
                style={{ fontSize: 12, color: '#8B0000', border: '1px solid #8B0000', padding: '6px 12px', background: 'none', cursor: 'pointer' }}>
                Delete
              </button>
            )}
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <span style={{
            display: 'inline-block', padding: '3px 10px', fontSize: 12, fontWeight: 700,
            backgroundColor: pipeline.status === 'completed' ? '#D4AF37' : '#2C2C2C',
            color: pipeline.status === 'completed' ? '#2C2C2C' : '#D4AF37',
          }}>
            {pipeline.status === 'completed' ? 'Completed' : `Step ${pipeline.current_step} of 12`}
          </span>
        </div>
      </div>

      {/* Steps */}
      <div className="no-print space-y-2">
        {steps.map(step => {
          const def = PIPELINE_STEPS[step.step_number - 1]
          const isOpen = activeForm === step.step_number
          const canComplete = step.status === 'unlocked' && canCompleteStep(step.step_number, role)

          return (
            <div key={step.id} className={`border rounded-lg p-4 ${
              step.status === 'completed' ? 'bg-yellow-50 border-yellow-200' :
              step.status === 'unlocked' ? 'bg-white border-blue-300' :
              'bg-gray-50 border-gray-200 opacity-60'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                    step.status === 'completed' ? 'bg-yellow-400 text-gray-900' :
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
                    <FileList attachments={step.pipeline_attachments} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Step 3: always-visible download button if files exist */}
                  {step.step_number === 3 && step.pipeline_attachments?.length > 0 && (
                    <button onClick={() => {
                      const sorted = [...step.pipeline_attachments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                      openFile(sorted[0])
                    }}
                      style={{ fontSize: 12, backgroundColor: '#D4AF37', color: '#2C2C2C', padding: '4px 12px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                      Download Drawing
                    </button>
                  )}
                  <StatusBadge status={step.status} unlockedAt={step.unlocked_at} />
                  {canComplete && !isOpen && (
                    <button onClick={() => setActiveForm(step.step_number)}
                      className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                      Complete
                    </button>
                  )}
                  {/* Step 2: upload revision button when completed */}
                  {step.step_number === 2 && step.status === 'completed' && !showRevision && (
                    <button onClick={() => setShowRevision(true)}
                      className="text-xs text-yellow-700 border border-yellow-400 px-2 py-1 rounded hover:bg-yellow-50">
                      Upload Revision
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

              {step.step_number === 2 && showRevision && (
                <UploadRevisionForm
                  step={step}
                  pipelineId={pipeline.id}
                  onDone={async () => { setShowRevision(false); await reload() }}
                  onCancel={() => setShowRevision(false)}
                />
              )}

              {isOpen && (
                <StepCompleteForm
                  step={step}
                  pipeline={pipeline}
                  role={role}
                  onDone={async () => { setActiveForm(null); await reload() }}
                  onCancel={() => setActiveForm(null)}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Activity log */}
      {activity.length > 0 && (
        <div className="no-print mt-8">
          <p style={{ fontSize: 14, fontWeight: 700, color: '#2C2C2C', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activity Log</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {activity.map(a => (
              <div key={a.id} style={{ fontSize: 13, color: '#2C2C2C', display: 'flex', gap: 12, borderBottom: '1px solid #E8E0C8', paddingBottom: 6 }}>
                <span style={{ color: '#888888', whiteSpace: 'nowrap', minWidth: 90 }}>
                  {new Date(a.performed_at).toLocaleDateString('en-PH')}
                </span>
                <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{a.action.replace(/_/g, ' ')}</span>
                {a.notes && <span style={{ color: '#666666' }}>— {a.notes}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Boss override modal */}
      {overrideStep && (
        <div className="no-print fixed inset-0 bg-black/40 flex items-center justify-center z-50">
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
        <div className="no-print fixed inset-0 bg-black/40 flex items-center justify-center z-50">
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

    </div>
  )
}
