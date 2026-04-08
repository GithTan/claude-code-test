import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createAmcContract, getAmcContract, getCustomers, updateAmcContract } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import useIsMobile from '../../hooks/useIsMobile'
import { shouldHideContactNumbers } from '../../lib/trialMode'

const BILLING_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'twice_monthly', label: 'Twice a Month' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'by_call', label: 'By Call' },
]

const inputStyle = {
  width: '100%',
  border: '1px solid #D4AF37',
  backgroundColor: '#FFFFFF',
  color: '#2C2C2C',
  padding: '8px 12px',
  fontSize: 14,
  outline: 'none',
}

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#2C2C2C', marginBottom: 4 }

export default function AmcForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { role } = useAuth()
  const isEdit = Boolean(id)
  const isAdmin = role === 'admin'
  const hideContactNumbers = shouldHideContactNumbers()
  const isMobile = useIsMobile(900)

  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState({
    customer_id: '',
    contract_number: '',
    contact_name: '',
    contact_number: '',
    contract_type: 'comprehensive',
    start_date: '',
    end_date: '',
    monthly_fee: '',
    vat_inclusive: true,
    billing_frequency: 'monthly',
    coverage_notes: '',
    status: 'active',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getCustomers().then(({ data }) => setCustomers(data || []))
    if (!isEdit) return

    getAmcContract(id).then(({ data }) => {
      if (!data) return
      setForm({
        customer_id: data.customer_id,
        contract_number: data.contract_number,
        contact_name: data.contact_name || '',
        contact_number: data.contact_number || '',
        contract_type: data.contract_type,
        start_date: data.start_date,
        end_date: data.end_date,
        monthly_fee: String(data.monthly_fee || ''),
        vat_inclusive: data.vat_inclusive ?? true,
        billing_frequency: data.billing_frequency || 'monthly',
        coverage_notes: data.coverage_notes || '',
        status: data.status,
      })
    })
  }, [id, isEdit])

  function set(field, value) {
    setForm(current => ({ ...current, [field]: value }))
  }

  function handleChange(e) {
    set(e.target.name, e.target.value)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const payload = {
      customer_id: form.customer_id,
      contract_number: form.contract_number,
      contact_name: form.contact_name,
      contract_type: form.contract_type,
      start_date: form.start_date,
      end_date: form.end_date,
      vat_inclusive: form.vat_inclusive,
      billing_frequency: form.billing_frequency,
      coverage_notes: form.coverage_notes,
      status: form.status,
      ...(isAdmin ? {
        contact_number: form.contact_number,
        monthly_fee: parseFloat(form.monthly_fee) || 0,
      } : {}),
    }

    const { data, error: err } = isEdit
      ? await updateAmcContract(id, payload)
      : await createAmcContract(payload)

    setSaving(false)
    if (err) {
      setError(err.message)
      return
    }

    navigate(`/contracts/${data.id}`)
  }

  const cardStyle = { backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24 }

  return (
    <div style={{ maxWidth: 720 }}>
      <h1 className="text-2xl font-bold mb-6" style={{ color: '#2C2C2C' }}>
        {isEdit ? 'Edit Maintenance Contract' : 'New Maintenance Contract'}
      </h1>

      <form onSubmit={handleSubmit} style={cardStyle} className="space-y-4">
        <div>
          <label style={labelStyle}>Project Name *</label>
          <input
            name="contract_number"
            value={form.contract_number}
            onChange={handleChange}
            required
            placeholder="e.g. SM Aura Tower"
            style={inputStyle}
          />
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', marginBottom: 4, flexDirection: isMobile ? 'column' : 'row', gap: 8 }}>
            <label style={labelStyle}>Customer *</label>
            <Link to="/customers/new" style={{ color: '#D4AF37', fontSize: 12 }}>
              + Add New Customer
            </Link>
          </div>
          {customers.length === 0 ? (
            <div style={{ ...inputStyle, color: '#888888', backgroundColor: '#F5F5F5' }}>
              No customers yet - <Link to="/customers/new" style={{ color: '#D4AF37' }}>add one first</Link>
            </div>
          ) : (
            <select name="customer_id" value={form.customer_id} onChange={handleChange} required style={inputStyle}>
              <option value="">- Select customer -</option>
              {customers.map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Contact Person</label>
            <input
              name="contact_name"
              value={form.contact_name}
              onChange={handleChange}
              placeholder="e.g. John Santos"
              style={inputStyle}
            />
          </div>
          {isAdmin && !hideContactNumbers && (
            <div>
              <label style={labelStyle}>Contact Number</label>
              <input
                name="contact_number"
                value={form.contact_number}
                onChange={handleChange}
                placeholder="e.g. 09171234567"
                style={inputStyle}
              />
            </div>
          )}
          {hideContactNumbers && (
            <div>
              <label style={labelStyle}>Contact Number</label>
              <div style={{ ...inputStyle, color: '#CCCCCC', fontStyle: 'italic' }}>Hidden during trial</div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
          <div>
            <label style={labelStyle}>Start Date *</label>
            <input name="start_date" type="date" value={form.start_date} onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>End Date *</label>
            <input name="end_date" type="date" value={form.end_date} onChange={handleChange} required style={inputStyle} />
          </div>
        </div>

        {isAdmin && (
          <div>
            <label style={labelStyle}>Monthly Fee (₱)</label>
            <div style={{ display: 'flex', gap: 8, alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, width: isMobile ? '100%' : 'auto' }}>
                <span style={{ color: '#888888', fontSize: 14 }}>₱</span>
                <input
                  name="monthly_fee"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.monthly_fee}
                  onChange={handleChange}
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
              <div style={{ display: 'flex', overflow: 'hidden', border: '1px solid #D4AF37', fontSize: 13, width: isMobile ? '100%' : 'auto' }}>
                <button
                  type="button"
                  onClick={() => set('vat_inclusive', true)}
                  style={{ padding: '8px 12px', backgroundColor: form.vat_inclusive ? '#D4AF37' : '#FFFFFF', color: form.vat_inclusive ? '#2C2C2C' : '#888888', fontWeight: 600, flex: 1 }}
                >
                  VAT Inc.
                </button>
                <button
                  type="button"
                  onClick={() => set('vat_inclusive', false)}
                  style={{ padding: '8px 12px', backgroundColor: !form.vat_inclusive ? '#D4AF37' : '#FFFFFF', color: !form.vat_inclusive ? '#2C2C2C' : '#888888', fontWeight: 600, flex: 1 }}
                >
                  Non-VAT
                </button>
              </div>
            </div>
          </div>
        )}

        <div>
          <label style={labelStyle}>Billing Frequency</label>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 8 }}>
            {BILLING_FREQUENCIES.map(freq => (
              <button
                key={freq.value}
                type="button"
                onClick={() => set('billing_frequency', freq.value)}
                style={{
                  padding: '8px 12px',
                  fontSize: 13,
                  fontWeight: 500,
                  backgroundColor: form.billing_frequency === freq.value ? '#D4AF37' : '#FFFFFF',
                  color: form.billing_frequency === freq.value ? '#2C2C2C' : '#888888',
                  border: '1px solid #D4AF37',
                }}
              >
                {freq.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Coverage Notes</label>
          <textarea name="coverage_notes" value={form.coverage_notes} onChange={handleChange} rows={3} style={inputStyle} />
        </div>

        {isEdit && (
          <div>
            <label style={labelStyle}>Status</label>
            <select name="status" value={form.status} onChange={handleChange} style={inputStyle}>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}

        {error && <p style={{ color: '#8B0000', fontSize: 13 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 12, paddingTop: 8, flexDirection: isMobile ? 'column' : 'row' }}>
          <button
            type="submit"
            disabled={saving}
            style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', padding: '8px 20px', fontWeight: 600, fontSize: 14, opacity: saving ? 0.5 : 1, width: isMobile ? '100%' : 'auto' }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{ backgroundColor: '#FFFFFF', color: '#2C2C2C', padding: '8px 20px', border: '1px solid #D4AF37', fontSize: 14, width: isMobile ? '100%' : 'auto' }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
