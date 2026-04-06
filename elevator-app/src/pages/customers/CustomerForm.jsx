import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createCustomer, getCustomer, updateCustomer, deleteCustomer } from '../../lib/api'

export default function CustomerForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({ name: '', contact_person: '', phone: '', email: '', address: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (isEdit) {
      getCustomer(id).then(({ data }) => {
        if (data) setForm({ name: data.name, contact_person: data.contact_person || '', phone: data.phone || '', email: data.email || '', address: data.address || '' })
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
    const { data, error } = isEdit
      ? await updateCustomer(id, form)
      : await createCustomer(form)
    setSaving(false)
    if (error) { setError(error.message); return }
    navigate(`/customers/${data.id}`)
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        {isEdit ? 'Edit Customer' : 'New Customer'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
          <input id="name" name="name" value={form.name} onChange={handleChange} required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
          <input id="contact_person" name="contact_person" value={form.contact_person} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input id="phone" name="phone" value={form.phone} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input id="email" name="email" type="email" value={form.email} onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <textarea id="address" name="address" value={form.address} onChange={handleChange} rows={2}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex justify-between items-center pt-2">
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              style={{ backgroundColor: '#D4AF37', color: '#2C2C2C', padding: '8px 20px', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer', opacity: saving ? 0.5 : 1 }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button type="button" onClick={() => navigate(-1)}
              style={{ backgroundColor: '#FFFFFF', color: '#2C2C2C', padding: '8px 20px', border: '1px solid #D4AF37', fontSize: 14, cursor: 'pointer' }}>
              Cancel
            </button>
          </div>

          {isEdit && !confirmDelete && (
            <button type="button" onClick={() => setConfirmDelete(true)}
              style={{ fontSize: 12, color: '#8B0000', border: '1px solid #8B0000', padding: '6px 12px', background: 'none', cursor: 'pointer' }}>
              Delete Customer
            </button>
          )}
          {isEdit && confirmDelete && (
            <div className="flex gap-2 items-center">
              <span style={{ fontSize: 12, color: '#8B0000' }}>Sure? This cannot be undone.</span>
              <button type="button" onClick={async () => { await deleteCustomer(id); navigate('/customers') }}
                style={{ fontSize: 12, backgroundColor: '#8B0000', color: '#FFFFFF', padding: '6px 12px', border: 'none', cursor: 'pointer' }}>
                Yes, Delete
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)}
                style={{ fontSize: 12, color: '#888888', border: '1px solid #CCCCCC', padding: '6px 12px', background: 'none', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
