import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getOpsProject, getOpsProjectUnits } from '../../lib/api'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

function fmt(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
}
function addOneYear(dateStr) {
  const base = dateStr || new Date().toISOString().split('T')[0]
  const d = new Date(base)
  d.setFullYear(d.getFullYear() + 1)
  return fmt(d.toISOString().split('T')[0])
}

// ── Shared styles ─────────────────────────────────────────────────────────────
const docStyle = {
  maxWidth: 720, margin: '0 auto', fontFamily: 'Arial, sans-serif',
  color: '#1A1A1A', backgroundColor: '#FFFFFF', padding: '40px 48px',
  fontSize: 13, lineHeight: 1.7,
}
const sectionLabel = {
  fontSize: 11, fontWeight: 700, color: '#888888', textTransform: 'uppercase',
  letterSpacing: '0.07em', borderBottom: '1px solid #D4AF37', paddingBottom: 4, marginBottom: 10,
}
const fieldRow = { display: 'flex', gap: 0, marginBottom: 6 }
const fieldKey = { width: 140, flexShrink: 0, color: '#555555', fontSize: 13 }
const fieldVal = { fontWeight: 600, fontSize: 13 }

function DocHeader({ title }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 28, borderBottom: '3px solid #D4AF37', paddingBottom: 20 }}>
      <p style={{ fontSize: 12, color: '#888888', letterSpacing: '0.1em', margin: '0 0 4px', textTransform: 'uppercase' }}>
        Fortnite Industrial Equipments Corporation
      </p>
      <p style={{ fontSize: 21, fontWeight: 700, color: '#2C2C2C', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {title}
      </p>
    </div>
  )
}

function ProjectInfoBlock({ fields }) {
  return (
    <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: '14px 18px', marginBottom: 24 }}>
      {fields.map(f => f.value ? (
        <div key={f.label} style={fieldRow}>
          <span style={fieldKey}>{f.label}</span>
          <span style={{ ...fieldVal, whiteSpace: 'pre-line' }}>{f.value}</span>
        </div>
      ) : null)}
    </div>
  )
}

function SignatureBlock() {
  return (
    <div style={{ marginTop: 40 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
        <div>
          <p style={{ fontSize: 11, color: '#888888', marginBottom: 48 }}>Noted by:</p>
          <div style={{ borderBottom: '1px solid #2C2C2C', marginBottom: 4 }} />
          <p style={{ fontSize: 12, color: '#555555', margin: '2px 0 0' }}>Business Development Manager</p>
        </div>
        <div>
          <p style={{ fontSize: 11, color: '#888888', marginBottom: 8 }}>Conformed and accepted by:</p>
          {['Signature:', 'Name:', 'Position:', 'Date:'].map(lbl => (
            <div key={lbl} style={{ ...fieldRow, marginTop: 12 }}>
              <span style={{ ...fieldKey, width: 90 }}>{lbl}</span>
              <div style={{ flex: 1, borderBottom: '1px solid #2C2C2C' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function DocFooter({ projectName }) {
  const today = new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })
  return (
    <div style={{ marginTop: 32, borderTop: '1px solid #D4AF37', paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
      <p style={{ fontSize: 10, color: '#AAAAAA', margin: 0 }}>FIEC — {projectName}</p>
      <p style={{ fontSize: 10, color: '#AAAAAA', margin: 0 }}>Printed: {today}</p>
    </div>
  )
}

// ── Build unit description string ─────────────────────────────────────────────
function buildUnitDesc(fields) {
  if (!fields.specs && !fields.capacity) return '—'
  const type = fields.specs || 'Elevator Unit'
  const brand = fields.brand ? ` — ${fields.brand}` : ''
  const parts = []
  if (fields.capacity) parts.push(`${fields.capacity} kgs`)
  if (fields.stops) parts.push(`${fields.stops} Stops`)
  if (fields.floors) parts.push(`${fields.floors} Floors`)
  if (fields.openings) parts.push(`${fields.openings} Openings`)
  const spec = parts.length > 0 ? ` (${parts.join(' / ')})` : ''
  return `One (1) Unit ${type}${brand}${spec}`
}

// ── Doc 1: Certificate of Completion ─────────────────────────────────────────
function CertCompletion({ fields }) {
  const unitDesc = buildUnitDesc(fields)
  const handoverDate = fields.handoverDate || fmt(new Date().toISOString().split('T')[0])
  const expiry = addOneYear(fields.handoverDate)
  return (
    <div style={docStyle}>
      <DocHeader title="Certificate of Completion" />
      <ProjectInfoBlock fields={[
        { label: 'PROJECT', value: fields.projectName },
        { label: 'LOCATION', value: fields.address },
        { label: 'UNIT', value: unitDesc },
        { label: 'DATE', value: handoverDate },
      ]} />
      <p style={{ marginBottom: 16, textAlign: 'justify' }}>
        This is to certify that <strong>Fortnite Industrial Equipments Corporation (FIEC)</strong> had
        satisfactorily completed the Supply, Installation, Testing and Commissioning for{' '}
        <strong>{fields.projectName || '—'}</strong> in accordance with the specifications,
        instructions and other provisions effective <strong>{handoverDate}</strong>.
      </p>
      <p style={{ textAlign: 'justify' }}>
        The above date refers to the commencement of Free Service Warranty for{' '}
        <strong>twelve (12) months</strong> which shall expire on <strong>{expiry}</strong>.
      </p>
      <SignatureBlock />
      <DocFooter projectName={fields.projectName} />
    </div>
  )
}

// ── Doc 2: Certificate of Turn Over ──────────────────────────────────────────
function CertTurnover({ fields }) {
  const unitDesc = buildUnitDesc(fields)
  const handoverDate = fields.handoverDate || fmt(new Date().toISOString().split('T')[0])
  return (
    <div style={docStyle}>
      <DocHeader title="Certificate of Turn Over" />
      <ProjectInfoBlock fields={[
        { label: 'PROJECT', value: fields.projectName },
        { label: 'LOCATION', value: fields.address },
        { label: 'UNIT', value: unitDesc },
        { label: 'DATE', value: handoverDate },
      ]} />
      <p style={{ marginBottom: 16, textAlign: 'justify' }}>
        For and in consideration of the conditions and provisions specified in the supply and
        installation agreement, <strong>Fortnite Industrial Equipments Corporation</strong> hereby
        certifies that the Elevator Installation Works are hereby completed in accordance with the
        contract plans, specifications and contract documents on the handover date stipulated above.
      </p>
      <p style={{ textAlign: 'justify' }}>
        With your request for handover of the elevator and to be used, we have reviewed and found
        the equipment to be completed with the best knowledge and information and is declared to be{' '}
        <strong>functional and safe for public use</strong> on the date specified herein above.
      </p>
      <SignatureBlock />
      <DocFooter projectName={fields.projectName} />
    </div>
  )
}

// ── Doc 3: Warranty Certificate ───────────────────────────────────────────────
function CertWarranty({ fields }) {
  const unitDesc = buildUnitDesc(fields)
  const handoverDate = fields.handoverDate || fmt(new Date().toISOString().split('T')[0])
  const expiry = addOneYear(fields.handoverDate)
  return (
    <div style={docStyle}>
      <DocHeader title="Warranty Certificate" />
      <ProjectInfoBlock fields={[
        { label: 'PROJECT', value: fields.projectName },
        { label: 'LOCATION', value: fields.address },
        { label: 'UNIT', value: unitDesc },
        { label: 'DATE', value: handoverDate },
      ]} />
      <p style={{ marginBottom: 14, textAlign: 'justify' }}>
        This is to certify that <strong>Fortnite Industrial Equipments Corporation</strong> has
        satisfactorily completed the installation and Testing/Commissioning of the elevator unit(s)
        for the above project in accordance with the specifications, instructions and other provisions.
      </p>
      <p style={{ marginBottom: 14, textAlign: 'justify' }}>
        That all discrepancies in accomplishments of the work have been checked and adjustments
        thereof have been made accordingly.
      </p>
      <p style={{ marginBottom: 14, textAlign: 'justify' }}>
        This certificate of warranty shall be treated as the reckoning period for warranty of{' '}
        <strong>twelve (12) months</strong> which shall expire on <strong>{expiry}</strong>.
      </p>
      <p style={{ textAlign: 'justify' }}>
        This Certificate also serves that the unit is in <strong>Good Running Condition</strong> and
        is hereby issued upon request of the building owner for whatever purpose it may serve.
      </p>
      <SignatureBlock />
      <DocFooter projectName={fields.projectName} />
    </div>
  )
}

// ── Doc 4: Load Test Certificate ──────────────────────────────────────────────
function LoadTestCert({ fields }) {
  const unitDesc = buildUnitDesc(fields)
  const handoverDate = fields.handoverDate || fmt(new Date().toISOString().split('T')[0])
  return (
    <div style={docStyle}>
      <DocHeader title="Load Test Certificate" />
      <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: '14px 18px', marginBottom: 24 }}>
        <p style={{ fontSize: 13, marginBottom: 6 }}>
          This is to certify that <strong>Fortnite Industrial Equipments Corporation</strong> has installed the following Mechanical Equipment:
        </p>
        <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 0 }}>{unitDesc}</p>
      </div>
      <p style={{ marginBottom: 16, textAlign: 'justify' }}>
        This is to certify that the load test of the project of{' '}
        <strong>{fields.projectName || '—'}</strong>,
        located at <strong>{fields.address || '—'}</strong> has been tested on{' '}
        <strong>{handoverDate}</strong> and passed the brake test and load test in accordance with
        the approved design and specification of the{' '}
        <strong>Philippine Mechanical Code for Elevators</strong> and it is in good running condition
        and is safe for public use.
      </p>
      <p style={{ textAlign: 'justify' }}>
        The certification is issued by the undersigned for whatever legal purpose it may serve.
        This certificate is signed and sealed.
      </p>
      <div style={{ marginTop: 32 }}>
        <p style={{ fontSize: 11, color: '#888888', marginBottom: 24 }}>WITNESSED BY:</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
          <div>
            <div style={{ borderBottom: '1px solid #2C2C2C', marginBottom: 4 }} />
            <p style={{ fontSize: 12, fontWeight: 700, margin: 0 }}>{fields.technicianName || ''}</p>
            <p style={{ fontSize: 11, color: '#555555', margin: '2px 0 0' }}>Testing and Commissioning</p>
          </div>
          <div>
            <div style={{ borderBottom: '1px solid #2C2C2C', marginBottom: 4 }} />
            <p style={{ fontSize: 12, color: '#555', margin: '2px 0 0' }}>Business Development Manager</p>
          </div>
        </div>
      </div>
      <DocFooter projectName={fields.projectName} />
    </div>
  )
}

// ── Doc 5: Internal Handover Summary ─────────────────────────────────────────
function HandoverInternal({ fields, project, units }) {
  const allUnits = []
  const hasMain = project.specs || project.unit_label || project.brand
  if (hasMain) allUnits.push({ unit_number: 1, unit_label: project.unit_label, specs: project.specs, brand: project.brand, drive_type: project.drive_type, use_type: project.use_type, stops: project.stops, openings: project.openings, floors: project.floors })
  ;(units || []).forEach(u => allUnits.push(u))
  const handoverDate = fields.handoverDate || fmt(new Date().toISOString().split('T')[0])

  return (
    <div style={docStyle}>
      <DocHeader title="Internal Handover Summary" />
      <div style={{ marginBottom: 20 }}>
        <p style={sectionLabel}>Project Details</p>
        {[
          ['Project', fields.projectName],
          ['Location', fields.address],
          ['PIC Engineer', project.pic],
          ['Subcontractor', project.subcon],
          ['Client Contact', project.contact_person],
          ['Handover Date', handoverDate],
          ['Install Start', project.project_start_date ? fmt(project.project_start_date) : null],
          ['Install End', project.project_end_date ? fmt(project.project_end_date) : null],
        ].filter(r => r[1]).map(([k, v]) => (
          <div key={k} style={fieldRow}><span style={fieldKey}>{k}</span><span style={fieldVal}>{v}</span></div>
        ))}
      </div>
      {allUnits.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={sectionLabel}>Elevator Unit{allUnits.length > 1 ? 's' : ''}</p>
          {allUnits.map((u, i) => (
            <div key={i} style={{ border: '1px solid #D4AF37', padding: '10px 14px', marginBottom: 8 }}>
              <p style={{ fontWeight: 700, margin: '0 0 6px' }}>Unit {u.unit_number || i + 1}{u.unit_label ? ` — ${u.unit_label}` : ''}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 24px', fontSize: 12 }}>
                {u.specs && <div><span style={{ color: '#555' }}>Type: </span><strong>{u.specs}</strong></div>}
                {u.brand && <div><span style={{ color: '#555' }}>Brand: </span><strong>{u.brand}</strong></div>}
                {u.drive_type && <div><span style={{ color: '#555' }}>Drive: </span><strong>{u.drive_type}</strong></div>}
                {u.use_type && <div><span style={{ color: '#555' }}>Use: </span><strong>{u.use_type}</strong></div>}
                {(u.stops || u.openings || u.floors) && (
                  <div style={{ gridColumn: '1/-1' }}><span style={{ color: '#555' }}>Stops/Openings/Floors: </span><strong>{u.stops || '?'}/{u.openings || '?'}/{u.floors || '?'}</strong></div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginBottom: 20 }}>
        <p style={sectionLabel}>QA Checkpoints</p>
        {[
          { done: project.qa_pre_install, label: 'Pre-Installation Inspection', date: project.qa_pre_install_date },
          { done: project.qa_mid, label: 'Mid-Installation Inspection', date: project.qa_mid_date },
          { done: project.qa_pre_handover, label: 'Pre-Handover Inspection', date: project.qa_pre_handover_date },
        ].map(q => (
          <div key={q.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 16, height: 16, border: '1.5px solid #2C2C2C', backgroundColor: q.done ? '#2C2C2C' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {q.done && <span style={{ color: '#fff', fontSize: 10 }}>✓</span>}
            </div>
            <span style={{ fontSize: 13 }}>{q.label}</span>
            {q.date && <span style={{ fontSize: 11, color: '#888888', marginLeft: 8 }}>{fmt(q.date)}</span>}
          </div>
        ))}
      </div>
      {project.concerns && (
        <div style={{ border: '1px solid #D4AF37', backgroundColor: '#FFFDF0', padding: 12, marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#888888', textTransform: 'uppercase', marginBottom: 6 }}>Notes / Concerns</p>
          <p style={{ margin: 0 }}>{project.concerns}</p>
        </div>
      )}
      <SignatureBlock />
      <DocFooter projectName={fields.projectName} />
    </div>
  )
}

// ── Client docs (for Download All) ────────────────────────────────────────────
const CLIENT_DOCS = [
  { key: 'completion', label: 'Certificate of Completion',  Component: CertCompletion },
  { key: 'turnover',   label: 'Certificate of Turn Over',   Component: CertTurnover },
  { key: 'warranty',   label: 'Warranty Certificate',       Component: CertWarranty },
  { key: 'loadtest',   label: 'Load Test Certificate',      Component: LoadTestCert },
]
const ALL_DOCS = [
  ...CLIENT_DOCS,
  { key: 'internal',   label: 'Internal Handover Summary',  Component: HandoverInternal, internal: true },
]

// ── Editable field ────────────────────────────────────────────────────────────
function EditField({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: '#888888', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder || label}
        style={{ width: '100%', border: '1px solid #D4AF37', padding: '7px 10px', fontSize: 13, color: '#2C2C2C', backgroundColor: '#FFFFFF', outline: 'none', boxSizing: 'border-box' }}
      />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HandoverSummary() {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [units, setUnits] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeDoc, setActiveDoc] = useState('completion')
  const [downloading, setDownloading] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  // Editable fields — pre-filled from project, overrideable here
  const [fields, setFields] = useState({
    projectName: '', address: '', specs: '', brand: '', capacity: '',
    stops: '', openings: '', floors: '', handoverDate: '', technicianName: '',
  })

  useEffect(() => {
    Promise.all([getOpsProject(id), getOpsProjectUnits(id)]).then(([{ data: p }, { data: u }]) => {
      setProject(p)
      setUnits(u || [])
      if (p) {
        setFields({
          projectName: p.project_name || '',
          address: p.address || '',
          specs: p.specs || '',
          brand: p.brand || '',
          capacity: '',
          stops: p.stops || '',
          openings: p.openings || '',
          floors: p.floors || '',
          handoverDate: p.handed_over_date || '',
          technicianName: '',
        })
      }
      setLoading(false)
    })
  }, [id])

  function setField(key, val) {
    setFields(prev => ({ ...prev, [key]: val }))
  }

  async function capturePDF(docKey) {
    setActiveDoc(docKey)
    await new Promise(r => setTimeout(r, 350))
    const el = document.getElementById('doc-print-area')
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
    return { canvas, label: ALL_DOCS.find(d => d.key === docKey)?.label || docKey }
  }

  async function handleDownloadThis() {
    setDownloading(true)
    try {
      const { canvas, label } = await capturePDF(activeDoc)
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgW = pageW
      const imgH = (canvas.height * pageW) / canvas.width
      let yPos = 0, remaining = imgH, first = true
      while (remaining > 0) {
        if (!first) pdf.addPage()
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, -yPos, imgW, imgH)
        remaining -= pageH; yPos += pageH; first = false
      }
      pdf.save(`${label} - ${fields.projectName || 'FIEC'}.pdf`)
    } catch { alert('PDF download failed. Use Print → Save as PDF instead.') }
    setDownloading(false)
  }

  async function handleDownloadAll() {
    setDownloading(true)
    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      let firstPage = true

      for (const doc of CLIENT_DOCS) {
        const { canvas } = await capturePDF(doc.key)
        const imgW = pageW
        const imgH = (canvas.height * pageW) / canvas.width
        let yPos = 0, remaining = imgH
        while (remaining > 0) {
          if (!firstPage) pdf.addPage()
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, -yPos, imgW, imgH)
          remaining -= pageH; yPos += pageH; firstPage = false
        }
      }
      pdf.save(`Handover Package - ${fields.projectName || 'FIEC'}.pdf`)
    } catch { alert('PDF download failed.') }
    setDownloading(false)
  }

  if (loading) return <p style={{ color: '#888888' }}>Loading…</p>
  if (!project) return <p style={{ color: '#8B0000' }}>Project not found.</p>

  const active = ALL_DOCS.find(d => d.key === activeDoc)
  const ActiveComponent = active?.Component
  const isInternal = active?.internal

  return (
    <div>
      {/* Nav */}
      <div className="no-print" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Link to={`/operations/${id}`} style={{ fontSize: 13, color: '#D4AF37', fontWeight: 600 }}>← Back to Project</Link>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {!isInternal && (
              <button onClick={handleDownloadAll} disabled={downloading}
                style={{ backgroundColor: '#2C2C2C', color: '#D4AF37', border: '1px solid #D4AF37', padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: downloading ? 'default' : 'pointer', opacity: downloading ? 0.6 : 1 }}>
                {downloading ? 'Generating…' : '⬇ Download All 4 Client Docs'}
              </button>
            )}
            <button onClick={handleDownloadThis} disabled={downloading}
              style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', border: 'none', padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: downloading ? 'default' : 'pointer', opacity: downloading ? 0.6 : 1 }}>
              {downloading ? 'Generating…' : `⬇ Download ${isInternal ? 'Internal Summary' : 'This Doc'}`}
            </button>
            <button onClick={() => window.print()}
              style={{ backgroundColor: 'transparent', color: '#888888', border: '1px solid #D4AF37', padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Print
            </button>
            <button onClick={() => setShowEdit(v => !v)}
              style={{ backgroundColor: showEdit ? '#D4AF37' : 'transparent', color: showEdit ? '#2C2C2C' : '#888888', border: '1px solid #D4AF37', padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              {showEdit ? 'Hide Edit' : '✏ Edit Fields'}
            </button>
          </div>
        </div>

        {/* Edit panel */}
        {showEdit && (
          <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 20, marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: '#888888', marginBottom: 16 }}>
              Edit fields here — changes apply to all documents instantly. These are for printing only and do not update the project record.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
              <EditField label="Project Name" value={fields.projectName} onChange={v => setField('projectName', v)} />
              <EditField label="Location / Address" value={fields.address} onChange={v => setField('address', v)} />
              <EditField label="Elevator Type / Specs" value={fields.specs} onChange={v => setField('specs', v)} placeholder="e.g. Passenger Elevator (MRL)" />
              <EditField label="Brand" value={fields.brand} onChange={v => setField('brand', v)} placeholder="e.g. KONE, Otis, FIEC" />
              <EditField label="Capacity (kgs)" value={fields.capacity} onChange={v => setField('capacity', v)} placeholder="e.g. 450" />
              <EditField label="Stops" value={fields.stops} onChange={v => setField('stops', v)} placeholder="e.g. 2" />
              <EditField label="Openings" value={fields.openings} onChange={v => setField('openings', v)} placeholder="e.g. 2" />
              <EditField label="Floors" value={fields.floors} onChange={v => setField('floors', v)} placeholder="e.g. 2" />
              <EditField label="Handover Date" value={fields.handoverDate} onChange={v => setField('handoverDate', v)} type="date" />
              <EditField label="T&C Technician Name (Load Test)" value={fields.technicianName} onChange={v => setField('technicianName', v)} placeholder="e.g. Juan dela Cruz" />
            </div>
          </div>
        )}

        {/* Doc tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #D4AF37', flexWrap: 'wrap' }}>
          {ALL_DOCS.map(d => (
            <button key={d.key} onClick={() => setActiveDoc(d.key)}
              style={{
                padding: '8px 14px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                borderBottom: activeDoc === d.key ? '2px solid #D4AF37' : '2px solid transparent',
                backgroundColor: 'transparent',
                color: activeDoc === d.key ? '#2C2C2C' : '#888888',
              }}>
              {d.label}{d.internal ? ' (Internal)' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Document preview */}
      <div id="doc-print-area" style={{ border: '1px solid #E8E0C8' }}>
        {ActiveComponent && (
          isInternal
            ? <ActiveComponent fields={fields} project={project} units={units} />
            : <ActiveComponent fields={fields} />
        )}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          #doc-print-area { border: none !important; }
        }
      `}</style>
    </div>
  )
}
