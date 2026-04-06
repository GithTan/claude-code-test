import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getOpsProject, getOpsProjectUnits } from '../../lib/api'

function fmt(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
}

function QARow({ done, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
      <div style={{
        width: 14, height: 14, border: '1.5px solid #2C2C2C',
        backgroundColor: done ? '#2C2C2C' : 'transparent',
        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {done && <span style={{ color: '#FFFFFF', fontSize: 10, lineHeight: 1 }}>✓</span>}
      </div>
      <span style={{ fontSize: 13 }}>{label}</span>
    </div>
  )
}

function UnitBlock({ unit, index }) {
  return (
    <div style={{ border: '1px solid #2C2C2C', padding: 12, marginBottom: 10 }}>
      <p style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Unit {unit.unit_number || index + 1}{unit.unit_label ? ` — ${unit.unit_label}` : ''}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px', fontSize: 13 }}>
        {unit.specs && <div><span style={{ color: '#555' }}>Type: </span>{unit.specs}</div>}
        {unit.brand && <div><span style={{ color: '#555' }}>Brand: </span>{unit.brand}</div>}
        {unit.drive_type && <div><span style={{ color: '#555' }}>Drive: </span>{unit.drive_type}</div>}
        {unit.use_type && <div><span style={{ color: '#555' }}>Use: </span>{unit.use_type}</div>}
        {(unit.stops || unit.openings || unit.floors) && (
          <div style={{ gridColumn: '1 / -1' }}>
            <span style={{ color: '#555' }}>Stops / Openings / Floors: </span>
            {unit.stops || '?'} / {unit.openings || '?'} / {unit.floors || '?'}
          </div>
        )}
      </div>
    </div>
  )
}

export default function HandoverSummary() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getOpsProject(id),
      getOpsProjectUnits(id),
    ]).then(([{ data: p }, { data: u }]) => {
      setProject(p)
      setUnits(u || [])
      setLoading(false)
    })
  }, [id])

  if (loading) return <p style={{ color: '#888888' }}>Loading…</p>
  if (!project) return <p style={{ color: '#8B0000' }}>Project not found.</p>

  const today = new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
  const handoverDate = project.handed_over_date ? fmt(project.handed_over_date) : today

  // Build unit rows: main unit first, then extras
  const mainUnit = {
    unit_number: 1,
    unit_label: project.unit_label,
    specs: project.specs,
    brand: project.brand,
    drive_type: project.drive_type,
    use_type: project.use_type,
    stops: project.stops,
    openings: project.openings,
    floors: project.floors,
  }
  const hasMainUnitData = mainUnit.specs || mainUnit.brand || mainUnit.unit_label
  const allUnits = hasMainUnitData ? [mainUnit, ...units] : units

  return (
    <div>
      {/* Screen-only nav bar */}
      <div className="no-print" style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link to={`/operations/${id}`} style={{ fontSize: 13, color: '#D4AF37', fontWeight: 600 }}>← Back to Project</Link>
        <button onClick={() => window.print()}
          style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', border: 'none', padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Print / Save as PDF
        </button>
        <span style={{ fontSize: 12, color: '#888888' }}>Use your browser's print dialog → Save as PDF</span>
      </div>

      {/* Printable area */}
      <div id="handover-print" style={{ maxWidth: 720, margin: '0 auto', fontFamily: 'Arial, sans-serif', color: '#1A1A1A', backgroundColor: '#FFFFFF', padding: 32 }}>

        {/* Header */}
        <div style={{ borderBottom: '3px solid #D4AF37', paddingBottom: 16, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.1em', color: '#2C2C2C', margin: 0 }}>FIEC ELEVATOR</p>
              <p style={{ fontSize: 11, color: '#888888', margin: '2px 0 0', letterSpacing: '0.05em' }}>PROJECT HANDOVER CERTIFICATE</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 12, color: '#888888', margin: 0 }}>Date of Handover</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#2C2C2C', margin: '2px 0 0' }}>{handoverDate}</p>
            </div>
          </div>
        </div>

        {/* Project name + address */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 22, fontWeight: 700, color: '#2C2C2C', margin: '0 0 4px' }}>{project.project_name}</p>
          {project.address && <p style={{ fontSize: 14, color: '#555555', margin: 0 }}>{project.address}</p>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

          {/* Project details */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, borderBottom: '1px solid #D4AF37', paddingBottom: 4 }}>Project Details</p>
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              <tbody>
                {project.pic && (
                  <tr>
                    <td style={{ color: '#555', paddingBottom: 5, width: 130 }}>PIC (Engineer)</td>
                    <td style={{ fontWeight: 600, paddingBottom: 5 }}>{project.pic}</td>
                  </tr>
                )}
                {project.subcon && (
                  <tr>
                    <td style={{ color: '#555', paddingBottom: 5 }}>Subcontractor</td>
                    <td style={{ fontWeight: 600, paddingBottom: 5 }}>{project.subcon}</td>
                  </tr>
                )}
                {project.contact_person && (
                  <tr>
                    <td style={{ color: '#555', paddingBottom: 5 }}>Client Contact</td>
                    <td style={{ fontWeight: 600, paddingBottom: 5 }}>{project.contact_person}</td>
                  </tr>
                )}
                {project.project_start_date && (
                  <tr>
                    <td style={{ color: '#555', paddingBottom: 5 }}>Installation Start</td>
                    <td style={{ fontWeight: 600, paddingBottom: 5 }}>{fmt(project.project_start_date)}</td>
                  </tr>
                )}
                {project.project_end_date && (
                  <tr>
                    <td style={{ color: '#555', paddingBottom: 5 }}>Installation End</td>
                    <td style={{ fontWeight: 600, paddingBottom: 5 }}>{fmt(project.project_end_date)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* QA Checkpoints */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, borderBottom: '1px solid #D4AF37', paddingBottom: 4 }}>QA Checkpoints</p>
            <QARow done={project.qa_pre_install} label="Pre-Installation Inspection" />
            <QARow done={project.qa_mid} label="Mid-Installation Inspection" />
            <QARow done={project.qa_pre_handover} label="Pre-Handover Inspection" />
            <div style={{ marginTop: 12 }}>
              {project.qa_pre_install && project.qa_mid && project.qa_pre_handover
                ? <p style={{ fontSize: 12, fontWeight: 700, color: '#2C6B2F' }}>All QA checkpoints passed ✓</p>
                : <p style={{ fontSize: 12, color: '#8B4500' }}>Pending QA checkpoints</p>
              }
            </div>
          </div>
        </div>

        {/* Elevator Unit Specs */}
        {allUnits.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, borderBottom: '1px solid #D4AF37', paddingBottom: 4 }}>
              Elevator Unit{allUnits.length > 1 ? 's' : ''} ({allUnits.length})
            </p>
            {allUnits.length === 1 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px', fontSize: 13 }}>
                {allUnits[0].specs && <div><span style={{ color: '#555' }}>Type: </span><strong>{allUnits[0].specs}</strong></div>}
                {allUnits[0].brand && <div><span style={{ color: '#555' }}>Brand: </span><strong>{allUnits[0].brand}</strong></div>}
                {allUnits[0].drive_type && <div><span style={{ color: '#555' }}>Drive: </span><strong>{allUnits[0].drive_type}</strong></div>}
                {allUnits[0].use_type && <div><span style={{ color: '#555' }}>Use: </span><strong>{allUnits[0].use_type}</strong></div>}
                {(allUnits[0].stops || allUnits[0].openings || allUnits[0].floors) && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <span style={{ color: '#555' }}>Stops / Openings / Floors: </span>
                    <strong>{allUnits[0].stops || '?'} / {allUnits[0].openings || '?'} / {allUnits[0].floors || '?'}</strong>
                  </div>
                )}
              </div>
            ) : (
              allUnits.map((u, i) => <UnitBlock key={i} unit={u} index={i} />)
            )}
          </div>
        )}

        {/* Concerns / Notes */}
        {project.concerns && (
          <div style={{ border: '1px solid #D4AF37', backgroundColor: '#FFFDF0', padding: 12, marginBottom: 24 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Notes / Concerns</p>
            <p style={{ fontSize: 13, color: '#2C2C2C', margin: 0 }}>{project.concerns}</p>
          </div>
        )}

        {/* Warranty notice */}
        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 14, marginBottom: 32 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#2C2C2C', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Warranty & Free Maintenance</p>
          <p style={{ fontSize: 13, color: '#555555', margin: 0 }}>
            This unit is covered by <strong>1-year free maintenance</strong> from the date of handover ({handoverDate}).
            A maintenance contract has been issued for the period ending{' '}
            <strong>{project.handed_over_date
              ? fmt(new Date(new Date(project.handed_over_date).setFullYear(new Date(project.handed_over_date).getFullYear() + 1)).toISOString().split('T')[0])
              : '—'
            }</strong>.
          </p>
        </div>

        {/* Signature block */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
          {[
            { label: 'Received by (Client)', sub: 'Signature over printed name / Date' },
            { label: 'Handed over by (FIEC)', sub: 'Engineer / Project Manager' },
          ].map(s => (
            <div key={s.label}>
              <div style={{ borderBottom: '1px solid #2C2C2C', marginBottom: 6, height: 50 }} />
              <p style={{ fontSize: 12, fontWeight: 700, color: '#2C2C2C', margin: 0 }}>{s.label}</p>
              <p style={{ fontSize: 11, color: '#888888', margin: '2px 0 0' }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Print footer */}
        <div style={{ marginTop: 40, borderTop: '1px solid #D4AF37', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
          <p style={{ fontSize: 10, color: '#AAAAAA', margin: 0 }}>FIEC Elevator — Project Handover Certificate</p>
          <p style={{ fontSize: 10, color: '#AAAAAA', margin: 0 }}>Printed: {today}</p>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          #handover-print { box-shadow: none !important; padding: 0 !important; max-width: 100% !important; }
        }
      `}</style>
    </div>
  )
}
