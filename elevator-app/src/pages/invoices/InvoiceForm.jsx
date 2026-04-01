import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createInvoice, createInvoiceItem, deleteInvoiceItem, getCustomers, getInvoice, updateInvoice } from '../../lib/api'

function fmt(amount) {
  return `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

export default function InvoiceForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [customers, setCustomers] = useState([])
  const [form, setForm] = useState({
    customer_id: '', invoice_number: '', invoice_type: 'maintenance',
    issue_date: '', due_date: '', notes: '',
  })
  const [items, setItems] = useState([{ description: '', amount: '' }])
  const [existingItemIds, setExistingItemIds] = useState([])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getCustomers().then(({ data }) => setCustomers(data || []))
    if (isEdit) {
      getInvoice(id).then(({ data }) => {
        if (data) {
          setForm({
            customer_id: data.customer_id,
            invoice_number: data.invoice_number,
            invoice_type: data.invoice_type,
            issue_date: data.issue_date,
            due_date: data.due_date || '',
            notes: data.notes || '',
          })
          const existingItems = data.invoice_items || []
          setItems(existingItems.map(i => ({ id: i.id, description: i.description, amount: String(i.amount) })))
          setExistingItemIds(existingItems.map(i => i.id))
        }
      })
    }
  }, [id, isEdit])

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleItemChange(index, field, value) {
    setItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  function addItem() {
    setItems(prev => [...prev, { description: '', amount: '' }])
  }

  function removeItem(index) {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const total = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const payload = { ...form, total_amount: total }
    const { data: inv, error: invErr } = isEdit
      ? await updateInvoice(id, payload)
      : await createInvoice(payload)

    if (invErr) { setError(invErr.message); setSaving(false); return }

    // Delete removed items (edit mode)
    if (isEdit) {
      const currentIds = items.filter(i => i.id).map(i => i.id)
      const toDelete = existingItemIds.filter(eid => !currentIds.includes(eid))
      for (const did of toDelete) await deleteInvoiceItem(did)
    }

    // Create new line items
    for (const item of items) {
      if (!item.id && item.description) {
        await createInvoiceItem({ invoice_id: inv.id, description: item.description, amount: parseFloat(item.amount) || 0 })
      }
    }

    setSaving(false)
    navigate(`/invoices/${inv.id}`)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">{isEdit ? 'Edit Invoice' : 'New Invoice'}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="invoice_number" className="block text-sm font-medium text-gray-700 mb-1">Invoice Number *</label>
              <input id="invoice_number" name="invoice_number" value={form.invoice_number} onChange={handleChange} required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="invoice_type" className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select id="invoice_type" name="invoice_type" value={form.invoice_type} onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="maintenance">Maintenance</option>
                <option value="installation">Installation</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="customer_id" className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
            <select id="customer_id" name="customer_id" value={form.customer_id} onChange={handleChange} required
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Select customer —</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="issue_date" className="block text-sm font-medium text-gray-700 mb-1">Issue Date *</label>
              <input id="issue_date" name="issue_date" type="date" value={form.issue_date} onChange={handleChange} required
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input id="due_date" name="due_date" type="date" value={form.due_date} onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea id="notes" name="notes" value={form.notes} onChange={handleChange} rows={2}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Line Items</h2>
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex gap-3 items-start">
                <input
                  value={item.description} onChange={e => handleItemChange(i, 'description', e.target.value)}
                  placeholder="Description"
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input
                  value={item.amount} onChange={e => handleItemChange(i, 'amount', e.target.value)}
                  placeholder="Amount" type="number" min="0" step="0.01"
                  className="w-36 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)}
                    className="text-red-500 hover:text-red-700 text-sm px-2 py-2">✕</button>
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={addItem}
            className="mt-3 text-blue-600 hover:underline text-sm">+ Add line item</button>
          <div className="mt-4 text-right text-lg font-bold text-gray-800">
            Total: {fmt(total)}
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3">
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
