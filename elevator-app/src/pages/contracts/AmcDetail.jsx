import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAmcContract } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'

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

const labelStyle = { fontSize: 12, color: '#888888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }
const valueStyle = { fontSize: 14, color: '#2C2C2C', fontWeight: 500 }

export default function AmcDetail() {
  const { id } = useParams()
  const { role } = useAuth()
  const [contract, setContract] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAmcContract(id).then(({ data }) => {
      setContract(data)
      setLoading(false)
    })
  }, [id])

  if (loading) return <p style={{ color: '#888888' }}>Loading…</p>
  if (!contract) return <p style={{ color: '#8B0000' }}>Contract not found.</p>

  const days = daysUntilExpiry(contract.end_date)
  const isExpiringSoon = contract.status === 'active' && days <= 60

  const statusColors = {
    active: { bg: '#D4AF37', color: '#2C2C2C' },
    expired: { bg: '#8B0000', color: '#FFFFFF' },
    cancelled: { bg: '#2C2C2C', color: '#888888' },
  }
  const s = statusColors[contract.status] || { bg: '#F5F5DC', color: '#888888' }

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

      {isExpiringSoon && (
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
            <p style={{ ...valueStyle, color: isExpiringSoon ? '#8B0000' : '#2C2C2C', fontWeight: isExpiringSoon ? 700 : 500 }}>{contract.end_date}</p>
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
            {contract.contact_number && role === 'admin' && (
              <div>
                <p style={labelStyle}>Contact Number</p>
                <p style={valueStyle}>{contract.contact_number}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Coverage notes */}
      {contract.coverage_notes && (
        <div style={{ backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#2C2C2C', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Coverage Notes</p>
          <p style={{ fontSize: 14, color: '#2C2C2C', lineHeight: 1.6 }}>{contract.coverage_notes}</p>
        </div>
      )}
    </div>
  )
}
