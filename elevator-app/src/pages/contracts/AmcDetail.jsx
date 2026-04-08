import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAmcActivity, getAmcContract, logAmcActivity, updateAmcRenewal } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { shouldHideContactNumbers } from '../../lib/trialMode'

function fmt(amount) {
  return `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

function daysUntilExpiry(endDate) {
  const today = new Date()
  const end = new Date(endDate)
  return Math.ceil((end - today) / (1000 * 60 * 60 * 24))
}

const FREQ_LABELS = {
  monthly: 'Monthly',
  twice_monthly: 'Twice a Month',
  quarterly: 'Quarterly',
  by_call: 'By Call',
}

const RENEWAL_STATUSES = [
  { value: 'none',          label: 'Not started',      color: '#888888' },
  { value: 'contacted',     label: 'Client contacted',  color: '#5C4A00' },
  { value: 'in_negotiation',label: 'In negotiation',    color: '#8B4500' },
  { value: 'proposal_sent', label: 'Proposal sent',     color: '#D4AF37' },
  { value: 'renewed',       label: 'Renewed ✓',         color: '#2C6E2C' },
  { value: 'not_renewing',  label: 'Not renewing',      color: '#8B0000' },
]

const labelStyle = { fontSize: 12, color: '#888888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }
const valueStyle = { fontSize: 14, color: '#2C2C2C', fontWeight: 500 }

export default function AmcDetail() {
  const { id } = useParams()
  const { role, user } = useAuth()
  const hideContactNumbers = shouldHideContactNumbers()
  const [contract, setContract] = useState(null)
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  // Renewal state
  const [renewalStatus, setRenewalStatus] = useState('none')
  const [renewalNotes, setRenewalNotes] = useState('')
  const [savingRenewal, setSavingRenewal] = useState(false)
  const [renewalSaved, setRenewalSaved] = useState(false)

  useEffect(() => {
    Promise.all([getAmcContract(id), getAmcActivity(id)]).then(([contractRes, activityRes]) => {
      const data = contractRes.data
      setContract(data)
      setActivity(activityRes.data || [])
      if (data) {
        setRenewalStatus(data.renewal_status || 'none')
        setRenewalNotes(data.renewal_notes || '')
      }
      setLoading(false)
    })
  }, [id])

  async function handleSaveRenewal() {
    setSavingRenewal(true)
    const previousStatus = contract?.renewal_status || 'none'
    await updateAmcRenewal(id, renewalStatus, renewalNotes)
    await logAmcActivity(
      id,
      'renewal_updated',
      `Renewal status changed from ${previousStatus} to ${renewalStatus}.${renewalNotes ? ` Notes: ${renewalNotes}` : ''}`,
      user?.email || role || 'staff'
    )
    const { data } = await getAmcActivity(id)
    setActivity(data || [])
    setContract(current => current ? { ...current, renewal_status: renewalStatus, renewal_notes: renewalNotes } : current)
    setSavingRenewal(false)
    setRenewalSaved(true)
    setTimeout(() => setRenewalSaved(false), 2000)
  }

  if (loading) return <p style={{ color: '#888888' }}>Loading…</p>
  if (!contract) return <p style={{ color: '#8B0000' }}>Contract not found.</p>

  const days = daysUntilExpiry(contract.end_date)
  const isExpired = days < 0
  const isExpiringSoon = contract.status === 'active' && days <= 60
  const showRenewal = isExpired || isExpiringSoon

  const statusColors = {
    active: { bg: '#D4AF37', color: '#2C2C2C' },
    expired: { bg: '#8B0000', color: '#FFFFFF' },
    cancelled: { bg: '#2C2C2C', color: '#888888' },
  }
  const s = statusColors[contract.status] || { bg: '#F5F5DC', color: '#888888' }

  const currentRenewalInfo = RENEWAL_STATUSES.find(r => r.value === renewalStatus)

  const inputStyle = {
    width: '100%', border: '1px solid #D4AF37', backgroundColor: '#FFFFFF',
    color: '#2C2C2C', padding: '8px 12px', fontSize: 14, outline: 'none',
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <Link to="/contracts" style={{ fontSize: 13, color: '#D4AF37', fontWeight: 600 }}>← Maintenance Contracts</Link>

      <div className="flex justify-between items-start mt-3 mb-5">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#2C2C2C' }}>{contract.contract_number}</h1>
          <p style={{ fontSize: 13, color: '#888888', marginTop: 2 }}>{contract.customers?.name}</p>
        </div>
        <div className="flex gap-2 items-center">
          <span style={{ backgroundColor: s.bg, color: s.color, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>
            {contract.status?.toUpperCase()}
          </span>
          <Link to={`/contracts/${id}/edit`}
            style={{ border: '1px solid #D4AF37', color: '#2C2C2C', padding: '6px 14px', fontSize: 13, fontWeight: 600 }}>
            Edit
          </Link>
        </div>
      </div>

      {/* Expiry warning */}
      {isExpired ? (
        <div style={{ backgroundColor: '#8B0000', border: '1px solid #D4AF37', padding: '12px 16px', marginBottom: 20 }}>
          <p style={{ color: '#D4AF37', fontWeight: 700, fontSize: 14 }}>
            ⚠ Contract expired {Math.abs(days)} day{Math.abs(days) !== 1 ? 's' : ''} ago — renewal follow-up needed
          </p>
        </div>
      ) : isExpiringSoon && (
        <div style={{ backgroundColor: days <= 30 ? '#8B0000' : '#2C2C2C', border: '1px solid #D4AF37', padding: '12px 16px', marginBottom: 20 }}>
          <p style={{ color: '#D4AF37', fontWeight: 700, fontSize: 14 }}>
            ⚠ Expiring in {days} day{days !== 1 ? 's' : ''} — consider renewing
          </p>
        </div>
      )}

      {/* Details card */}
      <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24, marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#2C2C2C', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contract Details</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <p style={labelStyle}>Start Date</p>
            <p style={valueStyle}>{contract.start_date}</p>
          </div>
          <div>
            <p style={labelStyle}>End Date</p>
            <p style={{ ...valueStyle, color: isExpired ? '#8B0000' : isExpiringSoon ? '#8B4500' : '#2C2C2C', fontWeight: (isExpired || isExpiringSoon) ? 700 : 500 }}>
              {contract.end_date}
            </p>
          </div>
          {role === 'admin' && (
            <>
              <div>
                <p style={labelStyle}>Monthly Fee</p>
                <p style={valueStyle}>{fmt(contract.monthly_fee)} {contract.vat_inclusive ? '(VAT Inc.)' : '(Non-VAT)'}</p>
              </div>
              <div>
                <p style={labelStyle}>Billing Frequency</p>
                <p style={valueStyle}>{FREQ_LABELS[contract.billing_frequency] || contract.billing_frequency || '—'}</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contact */}
      {(contract.contact_name || contract.contact_number) && (
        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24, marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2C2C2C', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {contract.contact_name && (
              <div>
                <p style={labelStyle}>Contact Person</p>
                <p style={valueStyle}>{contract.contact_name}</p>
              </div>
            )}
            {contract.contact_number && role === 'admin' && !hideContactNumbers && (
              <div>
                <p style={labelStyle}>Contact Number</p>
                <p style={valueStyle}>{contract.contact_number}</p>
              </div>
            )}
            {contract.contact_number && hideContactNumbers && (
              <div>
                <p style={labelStyle}>Contact Number</p>
                <p style={{ ...valueStyle, color: '#CCCCCC', fontStyle: 'italic' }}>Hidden during trial</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Coverage notes */}
      {contract.coverage_notes && (
        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24, marginBottom: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2C2C2C', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coverage Notes</p>
          <p style={{ fontSize: 14, color: '#2C2C2C', lineHeight: 1.6 }}>{contract.coverage_notes}</p>
        </div>
      )}

      {/* ── Renewal Tracking ── */}
      {showRenewal && (
        <div style={{ backgroundColor: '#2C2C2C', border: '1px solid #D4AF37', padding: 24, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Renewal Tracking
            </p>
            {/* Current status pill */}
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px',
              backgroundColor: currentRenewalInfo?.value === 'renewed' ? '#2C6E2C' : currentRenewalInfo?.value === 'not_renewing' ? '#8B0000' : '#3D3D3D',
              color: currentRenewalInfo?.color || '#888888',
              border: `1px solid ${currentRenewalInfo?.color || '#555555'}`,
            }}>
              {currentRenewalInfo?.label || 'Not started'}
            </span>
          </div>

          {/* Status buttons */}
          <p style={{ fontSize: 12, color: '#888888', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Negotiation Status</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 16 }}>
            {RENEWAL_STATUSES.map(opt => (
              <button
                key={opt.value}
                onClick={() => setRenewalStatus(opt.value)}
                style={{
                  padding: '7px 8px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  backgroundColor: renewalStatus === opt.value ? opt.color : '#3D3D3D',
                  color: renewalStatus === opt.value ? '#FFFFFF' : '#888888',
                  border: `1px solid ${renewalStatus === opt.value ? opt.color : '#555555'}`,
                  textAlign: 'center', lineHeight: 1.3,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Renewal notes */}
          <p style={{ fontSize: 12, color: '#888888', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Notes</p>
          <textarea
            value={renewalNotes}
            onChange={e => setRenewalNotes(e.target.value)}
            rows={3}
            placeholder="e.g. Waiting for client to sign new contract, quoted ₱X,XXX/month..."
            style={{ ...inputStyle, backgroundColor: '#3D3D3D', color: '#FFFFFF', border: '1px solid #555555', marginBottom: 12 }}
          />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={handleSaveRenewal}
              disabled={savingRenewal}
              style={{
                backgroundColor: '#D4AF37', color: '#2C2C2C', padding: '8px 20px',
                fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
                opacity: savingRenewal ? 0.5 : 1,
              }}
            >
              {savingRenewal ? 'Saving…' : 'Save Renewal Status'}
            </button>
            {renewalSaved && (
              <span style={{ fontSize: 12, color: '#D4AF37', fontWeight: 600 }}>✓ Saved</span>
            )}
          </div>
        </div>
      )}

      <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24, marginBottom: 16 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#2C2C2C', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Activity Log</p>
        {activity.length === 0 ? (
          <p style={{ fontSize: 12, color: '#888888' }}>No activity yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, maxHeight: 260, overflowY: 'auto' }}>
            {activity.map((item, index) => (
              <div key={item.id} style={{ padding: '10px 0', borderBottom: index < activity.length - 1 ? '1px solid #D4AF37' : 'none' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#2C2C2C' }}>{item.action?.replace(/_/g, ' ')}</span>
                  {item.performed_by && <span style={{ fontSize: 11, color: '#D4AF37' }}>{item.performed_by}</span>}
                  <span style={{ fontSize: 11, color: '#888888', marginLeft: 'auto' }}>{new Date(item.performed_at).toLocaleString('en-PH')}</span>
                </div>
                {item.details && <p style={{ fontSize: 12, color: '#666666' }}>{item.details}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
