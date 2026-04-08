// elevator-app/src/pages/pipeline/PipelineList.jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPipelines, PIPELINE_STAGES, PIPELINE_STEPS } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { maskProjectName } from '../../lib/trialMode'

const ELEVATOR_TYPES = [
  { value: 'passenger', label: 'Passenger Elevator' },
  { value: 'home_elevator', label: 'Home Elevator' },
  { value: 'escalator', label: 'Escalator' },
]
const STEP_LABELS = Object.fromEntries(PIPELINE_STEPS.map(s => [s.number, s.label]))
const STEP_ROLES = Object.fromEntries(PIPELINE_STEPS.map(s => [s.number, s.role]))

function daysSince(dateStr) {
  if (!dateStr) return 0
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000)
}

function getStageIndex(currentStep) {
  return PIPELINE_STAGES.findIndex(s => s.steps.includes(currentStep))
}

function urgencyDot(days) {
  if (days >= 7) return { color: '#8B0000' }
  if (days >= 3) return { color: '#D4AF37' }
  return { color: '#D4AF37' }
}

function PipelineCard({ pipeline }) {
  const step = pipeline.pipeline_steps?.find(s => s.step_number === pipeline.current_step)
  const days = step ? daysSince(step.unlocked_at) : 0
  const dot = urgencyDot(days)

  return (
    <Link to={`/pipeline/${pipeline.id}`}
      style={{
        display: 'block', padding: '12px', marginBottom: 8,
        backgroundColor: '#FFFFFF', border: '1px solid #D4AF37',
        textDecoration: 'none',
      }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FAFAF0'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: dot.color, flexShrink: 0 }} />
        <p style={{ fontWeight: 600, fontSize: 13, color: '#2C2C2C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {maskProjectName(pipeline.installation_projects?.project_name, 'Project')}
        </p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
        {pipeline.elevator_type && (
          <span style={{ fontSize: 11, backgroundColor: '#F5F5DC', color: '#2C2C2C', border: '1px solid #E8E0C8', padding: '1px 6px' }}>
            {pipeline.elevator_type.replace(/_/g, ' ')}
          </span>
        )}
        {pipeline.unit_count > 1 && (
          <span style={{ fontSize: 11, backgroundColor: '#F5F5DC', color: '#2C2C2C', border: '1px solid #E8E0C8', padding: '1px 6px' }}>
            {pipeline.unit_count} units
          </span>
        )}
      </div>
      <p style={{ fontSize: 12, color: '#888888' }}>
        Step {pipeline.current_step}: {STEP_LABELS[pipeline.current_step] || 'Complete'}
      </p>
      {days >= 3 && (
        <p style={{ fontSize: 12, fontWeight: 700, color: dot.color, marginTop: 4 }}>
          {days}d waiting
        </p>
      )}
    </Link>
  )
}

export default function PipelineList() {
  const { role } = useAuth()
  const [pipelines, setPipelines] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFetchError('Request timed out. Check your connection.')
      setLoading(false)
    }, 8000)
    getPipelines().then(({ data, error }) => {
      clearTimeout(timeout)
      if (error) setFetchError(error.message)
      setPipelines(data || [])
      setLoading(false)
    }).catch(err => {
      clearTimeout(timeout)
      setFetchError(err.message || 'Unknown error')
      setLoading(false)
    })
  }, [])

  if (loading) return <p style={{ color: '#888888' }}>Loading…</p>
  if (fetchError) return <p style={{ color: '#8B0000', padding: 16 }}>Error: {fetchError}</p>

  const active = pipelines.filter(p => p.status !== 'completed')
  const filtered = filterType === 'all' ? active : active.filter(p => p.elevator_type === filterType)
  const completed = pipelines.filter(p => p.status === 'completed')

  const mySteps = active.flatMap(p =>
    (p.pipeline_steps || [])
      .filter(s => s.status === 'unlocked' && (role === 'admin' || STEP_ROLES[s.step_number] === role))
      .map(s => ({ ...s, pipeline: p }))
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <h1 className="text-2xl font-bold" style={{ color: '#2C2C2C' }}>New Installations</h1>
        <div className="flex gap-3 items-center">
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            style={{ border: '1px solid #D4AF37', backgroundColor: '#F5F5DC', color: '#2C2C2C', padding: '7px 12px', fontSize: 13 }}>
            <option value="all">All Types</option>
            {ELEVATOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {role === 'admin' && (
            <Link to="/pipeline/new"
              style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', padding: '8px 16px', fontSize: 13, fontWeight: 600 }}>
              + New Pipeline
            </Link>
          )}
        </div>
      </div>
      <p className="text-sm mb-5" style={{ color: '#888888' }}>
        Track every new elevator project from client confirmation to turnover — 12 steps, all in one view.
      </p>

      {/* Needs Your Action */}
      {mySteps.length > 0 && (
        <div style={{ backgroundColor: '#2C2C2C', border: '1px solid #D4AF37', padding: 16, marginBottom: 24 }}>
          <p style={{ color: '#D4AF37', fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
            Needs Your Action ({mySteps.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {mySteps.map(s => (
              <Link key={s.id} to={`/pipeline/${s.pipeline.id}`}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#3D3D3D', padding: '10px 14px', border: '1px solid #4D4D4D', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#D4AF37'}
                onMouseLeave={e => e.currentTarget.style.borderColor = '#4D4D4D'}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#F5F5DC' }}>
                    {maskProjectName(s.pipeline.installation_projects?.project_name, 'Project')} — Step {s.step_number}: {STEP_LABELS[s.step_number]}
                  </p>
                  <p style={{ fontSize: 12, color: '#888888' }}>Waiting {daysSince(s.unlocked_at)}d</p>
                </div>
                <span style={{ color: '#D4AF37', fontSize: 12, fontWeight: 600 }}>Open →</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Kanban columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        {PIPELINE_STAGES.map((stage, idx) => {
          const stageProjects = filtered.filter(p => getStageIndex(p.current_step) === idx)
          return (
            <div key={stage.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stage.label}</p>
                <span style={{ fontSize: 11, backgroundColor: '#F5F5DC', color: '#2C2C2C', border: '1px solid #D4AF37', padding: '1px 6px', fontWeight: 700 }}>{stageProjects.length}</span>
              </div>
              <div>
                {stageProjects.map(p => <PipelineCard key={p.id} pipeline={p} />)}
                {stageProjects.length === 0 && (
                  <p style={{ fontSize: 12, color: '#CCCCCC', textAlign: 'center', padding: '16px 0' }}>Empty</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Completed */}
      {completed.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#2C2C2C', marginBottom: 12 }}>
            Completed ({completed.length})
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {completed.map(p => (
              <Link key={p.id} to={`/pipeline/${p.id}`}
                style={{ display: 'block', border: '1px solid #D4AF37', backgroundColor: '#F5F5DC', padding: 12, textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#EDE8CC'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#F5F5DC'}>
                <p style={{ fontWeight: 600, fontSize: 13, color: '#2C2C2C' }}>{maskProjectName(p.installation_projects?.project_name, 'Project')}</p>
                <p style={{ fontSize: 12, color: '#D4AF37', fontWeight: 600, marginTop: 4 }}>All {PIPELINE_STEPS.length} steps complete ✓</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
