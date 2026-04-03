import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createAmcContract, getAmcContract, getCustomers, updateAmcContract } from '../../lib/api'

export default function AmcForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState({
    customer_id: '', contract_number: '', contract_type: 'comprehensive',
    start_date: '', end_date: '', monthly_fee: '', coverage_notes: '', status: 'active',
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
          coverage_notes: data.coverage_notes || '',
          status: data.status,
        })
      })
    }
  }, [id, isEdit])

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

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

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{isEdit ? 'Edit Contract' : 'New AMC Contract'}</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label htmlFor="contract_number" className="block text-sm font-medium text-gray-700 mb-1">Contract Number *</label>
          <input id="contract_number" name="contract_number" value={form.contract_number} onChange={handleChange} required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
          <select id="customer_id" name="customer_id" value={form.customer_id} onChange={handleChange} required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">— Select customer —</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="contract_type" className="block text-sm font-medium text-gray-700 mb-1">Contract Type *</label>
          <select id="contract_type" name="contract_type" value={form.contract_type} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="comprehensive">Comprehensive</option>
            <option value="non_comprehensive">Non-Comprehensive</option>
            <option value="call_based">Call-Based</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
            <input id="start_date" name="start_date" type="date" value={form.start_date} onChange={handleChange} required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
            <input id="end_date" name="end_date" type="date" value={form.end_date} onChange={handleChange} required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label htmlFor="monthly_fee" className="block text-sm font-medium text-gray-700 mb-1">Monthly Fee (₱)</label>
          <input id="monthly_fee" name="monthly_fee" type="number" min="0" step="0.01" value={form.monthly_fee} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="coverage_notes" className="block text-sm font-medium text-gray-700 mb-1">Coverage Notes</label>
          <textarea id="coverage_notes" name="coverage_notes" value={form.coverage_notes} onChange={handleChange} rows={3}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {isEdit && (
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select id="status" name="status" value={form.status} onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button type="button" onClick={() => navigate(-1)}
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
