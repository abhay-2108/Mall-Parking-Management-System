'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Search, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMall } from '@/context/MallContext'
import Notification, { useNotification } from '@/components/Notification'

interface Booking {
  id: string
  customerId: string
  mallId: string
  slotType: string
  entryTime: string
  exitTime: string
  amount: number
  status: string
  qrCode: string | null
  createdAt: string
  customer: { name: string | null; phone: string }
  mall: { name: string; location: string | null }
}

export default function BookingsPage() {
  const router = useRouter()
  const { notifications, showNotification } = useNotification()
  const { currentMall } = useMall()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const limit = 20

  useEffect(() => {
    const token = document.cookie.includes('token=')
    if (!token) { router.push('/'); return }
    loadBookings()
  }, [currentMall, page, statusFilter])

  const loadBookings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (currentMall?.id) params.set('mallId', currentMall.id)
      const res = await fetch(`/api/bookings?${params}`)
      if (res.ok) {
        const data = await res.json()
        setBookings(data.bookings || [])
        setTotal(data.total || 0)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async (booking: Booking) => {
    try {
      // Create parking session and mark booking as CheckedIn
      const sessionRes = await fetch('/api/parking/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          numberPlate: `BK-${booking.id.slice(0, 6)}`,
          vehicleType: booking.slotType === 'Compact' ? 'Car' : booking.slotType === 'EV' ? 'EV' : 'Car',
          billingType: 'Hourly',
          mallId: booking.mallId,
          bookingId: booking.id,
          customerName: booking.customer.name || booking.customer.phone,
        }),
      })
      if (!sessionRes.ok) {
        const err = await sessionRes.json()
        showNotification(err.error || 'Check-in failed', 'error')
        return
      }
      const { session } = await sessionRes.json()
      await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CheckedIn', sessionId: session.id }),
      })
      showNotification('Customer checked in', 'success')
      loadBookings()
    } catch {
      showNotification('Check-in failed', 'error')
    }
  }

  const handleCancel = async (id: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' })
      if (res.ok) {
        showNotification('Booking cancelled', 'success')
        loadBookings()
      }
    } catch {
      showNotification('Cancel failed', 'error')
    }
  }

  const filtered = bookings.filter(b => {
    if (statusFilter && b.status !== statusFilter) return false
    if (search && !b.customer.phone.includes(search) && !b.id.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalPages = Math.ceil(total / limit)

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Confirmed: 'bg-blue-100 text-blue-800',
      CheckedIn: 'bg-green-100 text-green-800',
      Cancelled: 'bg-red-100 text-red-800',
      Completed: 'bg-gray-100 text-gray-800',
    }
    return styles[status] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div>
      <Notification notifications={notifications} />
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <ShoppingCart className="h-8 w-8 text-purple-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bookings</h1>
            <p className="text-gray-500 text-sm mt-1">Manage online reservations</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Search phone / ID..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 bg-white" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/50">
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="CheckedIn">Checked In</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Mall</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Slot Type</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Entry</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Exit</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">No bookings found</td></tr>
              ) : filtered.map(b => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{b.customer.name || 'Guest'}</p>
                    <p className="text-sm text-gray-500">{b.customer.phone}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{b.mall.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{b.slotType}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{new Date(b.entryTime).toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{new Date(b.exitTime).toLocaleString('en-IN')}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹{b.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${statusBadge(b.status)}`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      {b.status === 'Confirmed' && (
                        <button onClick={() => handleCheckIn(b)}
                          className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors" title="Check In">
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                      {(b.status === 'Pending' || b.status === 'Confirmed') && (
                        <button onClick={() => handleCancel(b.id)}
                          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors" title="Cancel">
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}</p>
          <div className="flex space-x-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
