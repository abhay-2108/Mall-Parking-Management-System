'use client'

import { useState } from 'react'
import { TrendingUp, DollarSign, Activity, Users, ArrowUpRight, Clock, Calendar, Filter } from 'lucide-react'

interface Revenue {
  today: number
  hourly: number
  dayPass: number
}

interface RevenueCardProps {
  revenue: Revenue | null
  onDateRangeChange?: (startDate: string, endDate: string) => void
}

export default function RevenueCard({ revenue, onDateRangeChange }: RevenueCardProps) {
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' })
  const [showDatePicker, setShowDatePicker] = useState(false)

  if (!revenue) return null

  const handleDateChange = () => {
    if (dateRange.startDate && dateRange.endDate && onDateRangeChange) {
      onDateRangeChange(dateRange.startDate, dateRange.endDate)
    }
  }

  const handleReset = () => {
    setDateRange({ startDate: '', endDate: '' })
    if (onDateRangeChange) {
      onDateRangeChange('', '')
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-8 border border-white/20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl mr-6">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Revenue</h3>
            <p className="text-gray-600">
              {dateRange.startDate && dateRange.endDate
                ? `${dateRange.startDate} to ${dateRange.endDate}`
                : 'Today\'s overview'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-300"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </button>
      </div>

      {showDatePicker && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400 bg-white"
              />
            </div>
            <button
              onClick={handleDateChange}
              disabled={!dateRange.startDate || !dateRange.endDate}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-xl hover:bg-gray-300 transition-all duration-300"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
          <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-2">Total Revenue</p>
          <p className="text-4xl font-bold text-green-600">₹{revenue.today}</p>
          <div className="flex items-center justify-center mt-2 text-green-600">
            <ArrowUpRight className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">{dateRange.startDate ? 'Selected Period' : 'Today'}</span>
          </div>
        </div>
        <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
          <Activity className="h-8 w-8 text-blue-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-2">Hourly Revenue</p>
          <p className="text-3xl font-bold text-blue-600">₹{revenue.hourly}</p>
          <div className="flex items-center justify-center mt-2 text-blue-600">
            <Clock className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">Hourly</span>
          </div>
        </div>
        <div className="text-center p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
          <Users className="h-8 w-8 text-purple-600 mx-auto mb-3" />
          <p className="text-sm text-gray-600 mb-2">Day Pass Revenue</p>
          <p className="text-3xl font-bold text-purple-600">₹{revenue.dayPass}</p>
          <div className="flex items-center justify-center mt-2 text-purple-600">
            <Calendar className="h-4 w-4 mr-1" />
            <span className="text-sm font-medium">Day Pass</span>
          </div>
        </div>
      </div>
    </div>
  )
}
