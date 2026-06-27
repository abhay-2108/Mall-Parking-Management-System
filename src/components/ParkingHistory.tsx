'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, ChevronLeft, ChevronRight, Car, Bike, Zap, Accessibility, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { formatISTTime } from '@/lib/time-utils'

interface Session {
  id: string
  vehicleNumberPlate: string
  vehicleType: string
  slotNumber: string
  slotType: string
  entryTime: string
  exitTime: string | null
  status: string
  billingType: string
  billingAmount: number | null
  duration: number
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface Filters {
  status: string
  vehicleType: string
  billingType: string
  search: string
}

const getVehicleIcon = (type: string) => {
  switch (type) {
    case 'Car': return <Car className="h-4 w-4" />
    case 'Bike': return <Bike className="h-4 w-4" />
    case 'EV': return <Zap className="h-4 w-4" />
    case 'Handicap': return <Accessibility className="h-4 w-4" />
    default: return <Car className="h-4 w-4" />
  }
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Active': return (
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white flex items-center">
        <Clock className="h-3 w-3 mr-1" />
        Active
      </span>
    )
    case 'Completed': return (
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white flex items-center">
        <CheckCircle className="h-3 w-3 mr-1" />
        Completed
      </span>
    )
    default: return (
      <span className="px-3 py-1 text-xs font-semibold rounded-full bg-gray-500 text-white">
        {status}
      </span>
    )
  }
}

export default function ParkingHistory() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [filters, setFilters] = useState<Filters>({ status: '', vehicleType: '', billingType: '', search: '' })
  const [loading, setLoading] = useState(true)

  const loadSessions = async (page: number = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (filters.status) params.set('status', filters.status)
      if (filters.vehicleType) params.set('vehicleType', filters.vehicleType)
      if (filters.billingType) params.set('billingType', filters.billingType)
      if (filters.search) params.set('search', filters.search)

      const response = await fetch(`/api/sessions?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessions(1)
  }, [filters])

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">Parking History</h3>
        <span className="text-sm text-gray-600">{pagination.total} total sessions</span>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by number plate..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 bg-white"
            />
          </div>
        </div>

        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 bg-white"
        >
          <option value="">All Status</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
        </select>

        <select
          value={filters.vehicleType}
          onChange={(e) => handleFilterChange('vehicleType', e.target.value)}
          className="px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 bg-white"
        >
          <option value="">All Vehicles</option>
          <option value="Car">Car</option>
          <option value="Bike">Bike</option>
          <option value="EV">EV</option>
          <option value="Handicap">Handicap</option>
        </select>

        <select
          value={filters.billingType}
          onChange={(e) => handleFilterChange('billingType', e.target.value)}
          className="px-4 py-3 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 bg-white"
        >
          <option value="">All Billing</option>
          <option value="Hourly">Hourly</option>
          <option value="DayPass">Day Pass</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-12 bg-white/80 rounded-3xl border border-gray-200">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No sessions found</p>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Vehicle</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Slot</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Entry Time</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Exit Time</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Duration</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Billing</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sessions.map(session => (
                  <tr key={session.id} className="hover:bg-purple-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg mr-3">
                          {getVehicleIcon(session.vehicleType)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{session.vehicleNumberPlate}</p>
                          <p className="text-xs text-gray-600">{session.vehicleType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{session.slotNumber}</p>
                      <p className="text-xs text-gray-600">{session.slotType}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{session.entryTime}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{session.exitTime || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{session.duration}h</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{session.billingType}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">
                      {session.billingAmount ? `₹${session.billingAmount}` : '-'}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(session.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-6 py-4 bg-gray-50/50 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => loadSessions(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm font-medium text-gray-700">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => loadSessions(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
