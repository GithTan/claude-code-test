import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getAmcContract } from '../../lib/api'

function fmt(amount) {
  return `₱${Number(amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
}

function daysUntilExpiry(endDate) {
  const today = new Date()
  const end = new Date(endDate)
  return Math.ceil((end - today) / (1000 * 60 * 60 * 24))
}

export default function AmcDetail() {
  const { id } = useParams()
  const [contract, setContract] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAmcContract(id).then(({ data }) => {
      setContract(data)
      setLoading(false)
    })
  }, [id])

  if (loading) return <p className="text-gray-500">Loading...</p>
  if (!contract) return <p className="text-red-500">Contract not found.</p>

  const days = daysUntilExpiry(contract.end_date)
  const isExpiringSoon = contract.status === 'active' && days <= 60

  return (
    <div className="max-w-2xl">
      <div className="flex justify-between items-start mb-6">
        <div>
          <Link to="/contracts" className="text-sm text-blue-600 hover:underline">← Contracts</Link>
          <h1 className="text-2xl font-bold text-gray-800 mt-1">{contract.contract_number}</h1>
        </div>
        <Link to={`/contracts/${id}/edit`}
          className="text-sm bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200">
          Edit
        </Link>
      </div>

      {isExpiringSoon && (
        <div className={`rounded-lg p-4 mb-4 ${days <= 30 ? 'bg-red-50 border border-red-200' : 'bg-orange-50 border border-orange-200'}`}>
          <p className={`font-medium text-sm ${days <= 30 ? 'text-red-800' : 'text-orange-800'}`}>
            This contract expires in {days} day{days !== 1 ? 's' : ''} — consider renewing
          </p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div><span className="text-gray-500">Customer</span><p className="font-medium">{contract.customers?.name}</p></div>
          <div><span className="text-gray-500">Type</span><p className="font-medium capitalize">{contract.contract_type?.replace(/_/g, ' ')}</p></div>
          <div><span className="text-gray-500">Start Date</span><p className="font-medium">{contract.start_date}</p></div>
          <div><span className="text-gray-500">End Date</span><p className="font-medium">{contract.end_date}</p></div>
          <div><span className="text-gray-500">Monthly Fee</span><p className="font-medium">{fmt(contract.monthly_fee)}</p></div>
          <div><span className="text-gray-500">Status</span><p className="font-medium capitalize">{contract.status}</p></div>
        </div>
        {contract.coverage_notes && (
          <div>
            <span className="text-gray-500">Coverage Notes</span>
            <p className="font-medium mt-1">{contract.coverage_notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
