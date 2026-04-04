import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { createAmcContract, getAmcContract, getCustomers, updateAmcContract } from '../../lib/api'

const BILLING_FREQUENCIES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'twice_monthly', label: 'Twice a Month' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'by_call', label: 'By Call' },
]

const inputStyle = {
  width: '100%', border: '1px solid #D4AF37', backgroundColor: '#FFFFFF',
  color: '#2C2C2C', padding: '8px 12px', fontSize: 14, outline: 'none',
}
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#2C2C2C', marginBottom: 4 }

export default function AmcForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState({
    customer_id: '',
    contract_number: '',
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
    if (isEdit) {
      getAmcContract(id).then(({ data }) => {
        if (data) setForm({
          customer_id: data.customer_id,
          contract_number: data.contract_number,
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
    }
  }, [id, isEdit])

  function set(field, value) { setForm(f => ({ ...f, [field]: value })) }
  function handleChange(e) { set(e.target.name, e.target.value) }

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

  const cardStyle = { backgroundColor: '#F5F5DC', border: '1px solid #D4AF37', padding: 24 }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-6" style={{ color: '#2C2C2C' }}>
        {isEdit ? 'Edit Maintenance Contract' : 'New Maintenance Contract'}
      </h1>

      <form onSubmit={handleSubmit} style={cardStyle} className="space-y-4">

        {/* Contract Name */}
        <div>
          <label style={labelStyle}>Contract Name *</label>
          <input name="contract_number" value={form.contract_number} onChange={handleChange} required
            placeholder="e.g. SM Aura Tower — Annual Maintenance"
            style={inputStyle} />
        </div>

        {/* Customer */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label style={labelStyle}>Customer *</label>
            <Link to="/customers/new" className="text-xs" style={{ color: '#D4AF37' }}>
              + Add New Customer
            </Link>
          </div>
          {customers.length === 0 ? (
            <div style={{ ...inputStyle, color: '#888888', backgroundColor: '#F5F5F5' }}>
              No customers yet —{' '}
              <Link to="/customers/new" style={{ color: '#D4AF37' }}>add one first</Link>
            </div>
          ) : (
            <select name="customer_id" value={form.customer_id} onChange={handleChange} required style={inputStyle}>
              <option value="">— Select customer —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>

        {/* Contract Type */}
        <div>
          <label style={labelStyle}>Contract Type</label>
          <select name="contract_type" value={form.contract_type} onChange={handleChange} style={inputStyle}>
            <option value="comprehensive">Comprehensive</option>
            <option value="non_comprehensive">Non-Comprehensive</option>
            <option value="call_based">Call-Based</option>
          </select>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label style={labelStyle}>Start Date *</label>
            <input name="start_date" type="date" value={form.start_date} onChange={handleChange} required style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>End Date *</label>
            <input name="end_date" type="date" value={form.end_date} onChange={handleChange} required style={inputStyle} />
          </div>
        </div>

        {/* Monthly Fee + VAT */}
        <div>
          <label style={labelStyle}>Monthly Fee (₱)</label>
          <div className="flex gap-2 items-center">
            <span style={{ color: '#888888', fontSize: 14 }}>₱</span>
            <input name="monthly_fee" type="number" min="0" step="0.01" placeholder="0.00"
              value={form.monthly_fee} onChange={handleChange}
              style={{ ...inputStyle, flex: 1 }} />
            <div className="flex overflow-hidden" style={{ border: '1px solid #D4AF37', fontSize: 13 }}>
              <button type="button" onClick={() => set('vat_inclusive', true)}
                style={{ padding: '8px 12px', backgroundColor: form.vat_inclusive ? '#D4AF37' : '#FFFFFF', color: form.vat_inclusive ? '#2C2C2C' : '#888888', fontWeight: 600 }}>
                VAT Inc.
              </button>
              <button type="button" onClick={() => set('vat_inclusive', false)}
                style={{ padding: '8px 12px', backgroundColor: !form.vat_inclusive ? '#D4AF37' : '#FFFFFF', color: !form.vat_inclusive ? '#2C2C2C' : '#888888', fontWeight: 600 }}>
                Non-VAT
              </button>
            </div>
          </div>
        </div>

        {/* Billing Frequency */}
        <div>
          <label style={labelStyle}>Billing Frequency</label>
          <div className="grid grid-cols-2 gap-2">
            {BILLING_FREQUENCIES.map(f => (
              <button key={f.value} type="button" onClick={() => set('billing_frequency', f.value)}
                style={{
                  padding: '8px 12px', fontSize: 13, fontWeight: 500,
                  backgroundColor: form.billing_frequency === f.value ? '#D4AF37' : '#FFFFFF',
                  color: form.billing_frequency === f.value ? '#2C2C2C' : '#888888',
                  border: '1px solid #D4AF37',
                }}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Coverage Notes */}
        <div>
          <label style={labelStyle}>Coverage Notes</label>
          <textarea name="coverage_notes" value={form.coverage_notes} onChange={handleChange} rows={3}
            style={inputStyle} />
        </div>

        {/* Status (edit only) */}
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

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', padding: '8px 20px', fontWeight: 600, fontSize: 14, opacity: saving ? 0.5 : 1 }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button type="button" onClick={() => navigate(-1)}
            style={{ backgroundColor: '#FFFFFF', color: '#2C2C2C', padding: '8px 20px', border: '1px solid #D4AF37', fontSize: 14 }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
