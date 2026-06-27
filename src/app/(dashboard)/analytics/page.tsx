'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart3, TrendingUp, Clock, Car, Bike, Zap, Accessibility,
  DollarSign, Activity, Calendar
} from 'lucide-react'
import Notification, { useNotification } from '@/components/Notification'

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

interface AnalyticsData {
  totalSessions: number
  totalRevenue: number
  avgDuration: number
  peakHour: number
  vehicleTypeDistribution: Record<string, number>
  billingTypeDistribution: Record<string, number>
  hourlyDistribution: number[]
  statusDistribution: Record<string, number>
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { notifications } = useNotification()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check')
      if (!response.ok) router.push('/')
    } catch {
      router.push('/')
    }
  }

  const loadData = async () => {
    try {
      const response = await fetch('/api/sessions?limit=500')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const analytics = useMemo<AnalyticsData>(() => {
    const completedSessions = sessions.filter(s => s.status === 'Completed')

    const totalRevenue = completedSessions.reduce((sum, s) => sum + (s.billingAmount || 0), 0)
    const avgDuration = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + s.duration, 0) / completedSessions.length
      : 0

    // Vehicle type distribution
    const vehicleTypeDistribution: Record<string, number> = {}
    sessions.forEach(s => {
      vehicleTypeDistribution[s.vehicleType] = (vehicleTypeDistribution[s.vehicleType] || 0) + 1
    })

    // Billing type distribution
    const billingTypeDistribution: Record<string, number> = {}
    sessions.forEach(s => {
      billingTypeDistribution[s.billingType] = (billingTypeDistribution[s.billingType] || 0) + 1
    })

    // Hourly distribution (24 hours)
    const hourlyDistribution = new Array(24).fill(0)
    sessions.forEach(s => {
      const hour = new Date(s.entryTime).getHours()
      hourlyDistribution[hour]++
    })
    const peakHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution))

    // Status distribution
    const statusDistribution: Record<string, number> = {}
    sessions.forEach(s => {
      statusDistribution[s.status] = (statusDistribution[s.status] || 0) + 1
    })

    return {
      totalSessions: sessions.length,
      totalRevenue,
      avgDuration: Math.round(avgDuration * 10) / 10,
      peakHour,
      vehicleTypeDistribution,
      billingTypeDistribution,
      hourlyDistribution,
      statusDistribution
    }
  }, [sessions])

  const maxHourly = Math.max(...analytics.hourlyDistribution)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 font-medium">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Notification notifications={notifications} />

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-1">Insights and trends for your parking operations</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Sessions</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.totalSessions}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Activity className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-green-600">₹{analytics.totalRevenue}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Duration</p>
              <p className="text-3xl font-bold text-purple-600">{analytics.avgDuration}h</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Peak Hour</p>
              <p className="text-3xl font-bold text-orange-600">{analytics.peakHour}:00</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Hourly Distribution Chart */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-lg">
        <div className="flex items-center mb-6">
          <BarChart3 className="h-5 w-5 text-purple-600 mr-2" />
          <h2 className="text-lg font-bold text-gray-900">Hourly Entry Distribution</h2>
        </div>
        <div className="flex items-end justify-between h-48 gap-1">
          {analytics.hourlyDistribution.map((count, hour) => (
            <div key={hour} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full rounded-t-lg transition-all duration-300 ${
                  hour === analytics.peakHour
                    ? 'bg-gradient-to-t from-purple-600 to-pink-500'
                    : 'bg-gradient-to-t from-purple-200 to-purple-300'
                }`}
                style={{ height: `${maxHourly > 0 ? (count / maxHourly) * 100 : 0}%`, minHeight: count > 0 ? '4px' : '0' }}
              />
              {hour % 3 === 0 && (
                <span className="text-[10px] text-gray-500 mt-1">{hour}h</span>
              )}
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600 text-center mt-4">
          Peak hour: <span className="font-bold text-purple-600">{analytics.peakHour}:00</span> with{' '}
          <span className="font-bold text-purple-600">{analytics.hourlyDistribution[analytics.peakHour]}</span> entries
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Type Distribution */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-lg">
          <div className="flex items-center mb-6">
            <Car className="h-5 w-5 text-purple-600 mr-2" />
            <h2 className="text-lg font-bold text-gray-900">Vehicle Type Distribution</h2>
          </div>
          <div className="space-y-4">
            {Object.entries(analytics.vehicleTypeDistribution).map(([type, count]) => {
              const percentage = analytics.totalSessions > 0 ? (count / analytics.totalSessions) * 100 : 0
              const icons: Record<string, React.ReactNode> = {
                Car: <Car className="h-4 w-4" />,
                Bike: <Bike className="h-4 w-4" />,
                EV: <Zap className="h-4 w-4" />,
                Handicap: <Accessibility className="h-4 w-4" />
              }
              const colors: Record<string, string> = {
                Car: 'from-blue-500 to-indigo-500',
                Bike: 'from-green-500 to-emerald-500',
                EV: 'from-yellow-500 to-orange-500',
                Handicap: 'from-purple-500 to-pink-500'
              }
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center">
                      <div className={`p-1.5 rounded-lg bg-gradient-to-r ${colors[type] || 'from-gray-500 to-gray-600'} text-white mr-2`}>
                        {icons[type] || <Car className="h-4 w-4" />}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{type}</span>
                    </div>
                    <span className="text-sm text-gray-600">{count} ({Math.round(percentage)}%)</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${colors[type] || 'from-gray-500 to-gray-600'} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Billing Type Distribution */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-lg">
          <div className="flex items-center mb-6">
            <DollarSign className="h-5 w-5 text-purple-600 mr-2" />
            <h2 className="text-lg font-bold text-gray-900">Billing Type Distribution</h2>
          </div>
          <div className="flex items-center justify-center h-48">
            <div className="relative">
              {/* Simple pie chart using conic gradient */}
              <div
                className="w-40 h-40 rounded-full"
                style={{
                  background: `conic-gradient(
                    #8b5cf6 0% ${analytics.billingTypeDistribution['Hourly'] ? (analytics.billingTypeDistribution['Hourly'] / analytics.totalSessions) * 100 : 0}%,
                    #ec4899 ${analytics.billingTypeDistribution['Hourly'] ? (analytics.billingTypeDistribution['Hourly'] / analytics.totalSessions) * 100 : 0}% 100%
                  )`
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">{analytics.totalSessions}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-center mt-4 space-x-8">
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-purple-500 mr-2" />
              <span className="text-sm text-gray-600">
                Hourly ({analytics.billingTypeDistribution['Hourly'] || 0})
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full bg-pink-500 mr-2" />
              <span className="text-sm text-gray-600">
                Day Pass ({analytics.billingTypeDistribution['DayPass'] || 0})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-lg">
        <div className="flex items-center mb-6">
          <Calendar className="h-5 w-5 text-purple-600 mr-2" />
          <h2 className="text-lg font-bold text-gray-900">Recent Sessions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Vehicle</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Slot</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Entry</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Duration</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.slice(0, 10).map(session => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{session.vehicleNumberPlate}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{session.slotNumber}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(session.entryTime).toLocaleDateString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{session.duration}h</td>
                  <td className="px-4 py-3 font-medium text-green-600">
                    {session.billingAmount ? `₹${session.billingAmount}` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      session.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {session.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
