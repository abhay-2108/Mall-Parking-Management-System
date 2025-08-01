'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Car, 
  Bike, 
  Zap, 
  Accessibility, 
  LogOut, 
  Plus, 
  Minus,
  Search,
  Settings,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit,
  Calendar,
  X
} from 'lucide-react'
import { formatISTTime, getCurrentIST } from '@/lib/time-utils'

interface DashboardStats {
  totalSlots: number
  availableSlots: number
  occupiedSlots: number
  maintenanceSlots: number
  activeSessions: number
}

interface Revenue {
  today: number
  hourly: number
  dayPass: number
}

interface ParkingSlot {
  id: string
  slotNumber: string
  slotType: string
  status: string
  parkingSessions: Array<{
    id: string
    entryTime: string
    exitTime?: string
    billingAmount?: number
    billingType: string
    vehicle: {
      numberPlate: string
      type: string
    }
  }>
}

export default function Dashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [revenue, setRevenue] = useState<Revenue | null>(null)
  const [slots, setSlots] = useState<ParkingSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [operatorName, setOperatorName] = useState('Operator')
  
  // Entry form state
  const [entryForm, setEntryForm] = useState({
    numberPlate: '',
    vehicleType: 'Car',
    billingType: 'Hourly',
    slotId: ''
  })
  
  // Exit form state
  const [exitForm, setExitForm] = useState({
    numberPlate: ''
  })
  
  // Filters
  const [filters, setFilters] = useState({
    slotType: '',
    status: '',
    search: ''
  })

  // Time editing modal state
  const [timeEditModal, setTimeEditModal] = useState({
    isOpen: false,
    slotId: '',
    slotNumber: '',
    currentEntryTime: '',
    currentExitTime: '',
    newEntryTime: '',
    newExitTime: '',
    vehicleInfo: null as any
  })

  useEffect(() => {
    loadDashboardData()
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check')
      if (!response.ok) {
        router.push('/')
      }
    } catch (error) {
      router.push('/')
    }
  }

  const loadDashboardData = async () => {
    try {
      const [statsResponse, slotsResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/slots')
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData.stats)
        setRevenue(statsData.revenue)
      }

      if (slotsResponse.ok) {
        const slotsData = await slotsResponse.json()
        setSlots(slotsData.slots)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/parking/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entryForm)
      })

      if (response.ok) {
        setEntryForm({ numberPlate: '', vehicleType: 'Car', billingType: 'Hourly', slotId: '' })
        loadDashboardData()
        showNotification('Vehicle entry recorded successfully!', 'success')
      } else {
        const data = await response.json()
        showNotification(data.error || 'Entry failed', 'error')
      }
    } catch (error) {
      showNotification('Network error', 'error')
    }
  }

  const handleExit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/parking/exit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exitForm)
      })

      if (response.ok) {
        const data = await response.json()
        setExitForm({ numberPlate: '' })
        loadDashboardData()
        showNotification(`Exit processed! Amount: ₹${data.receipt.amount}`, 'success')
      } else {
        const data = await response.json()
        showNotification(data.error || 'Exit failed', 'error')
      }
    } catch (error) {
      showNotification('Network error', 'error')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const updateSlotStatus = async (slotId: string, status: string) => {
    try {
      const response = await fetch('/api/slots', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId, status })
      })

      if (response.ok) {
        loadDashboardData()
        showNotification('Slot status updated successfully!', 'success')
      }
    } catch (error) {
      console.error('Error updating slot status:', error)
      showNotification('Failed to update slot status', 'error')
    }
  }

  const openTimeEditModal = (slot: ParkingSlot) => {
    const activeSession = slot.parkingSessions[0]
    if (activeSession) {
      setTimeEditModal({
        isOpen: true,
        slotId: slot.id,
        slotNumber: slot.slotNumber,
        currentEntryTime: formatISTTime(new Date(activeSession.entryTime)),
        currentExitTime: activeSession.exitTime ? formatISTTime(new Date(activeSession.exitTime)) : '',
        newEntryTime: formatISTTime(new Date(activeSession.entryTime)),
        newExitTime: activeSession.exitTime ? formatISTTime(new Date(activeSession.exitTime)) : '',
        vehicleInfo: activeSession.vehicle
      })
    }
  }

  const handleTimeUpdate = async () => {
    try {
      const response = await fetch('/api/slots/update-time', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: timeEditModal.slotId,
          newEntryTime: timeEditModal.newEntryTime,
          newExitTime: timeEditModal.newExitTime
        })
      })

      if (response.ok) {
        setTimeEditModal({ ...timeEditModal, isOpen: false })
        loadDashboardData()
        showNotification('Slot time updated successfully!', 'success')
      } else {
        const data = await response.json()
        showNotification(data.error || 'Failed to update time', 'error')
      }
    } catch (error) {
      showNotification('Network error', 'error')
    }
  }

  const showNotification = (message: string, type: 'success' | 'error') => {
    // Create notification element
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`
    notification.innerHTML = `
      <div class="flex items-center">
        ${type === 'success' ? '<CheckCircle class="h-5 w-5 mr-2" />' : '<XCircle class="h-5 w-5 mr-2" />'}
        <span>${message}</span>
      </div>
    `
    document.body.appendChild(notification)

    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove()
    }, 3000)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800'
      case 'Occupied': return 'bg-red-100 text-red-800'
      case 'Maintenance': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Available': return <CheckCircle className="h-4 w-4" />
      case 'Occupied': return <Clock className="h-4 w-4" />
      case 'Maintenance': return <AlertTriangle className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mr-4">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Mall Parking System</h1>
                <p className="text-sm text-gray-600">Welcome back, {operatorName}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Slots</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalSlots}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Plus className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.availableSlots}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <Minus className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Occupied</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.occupiedSlots}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Settings className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Maintenance</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.maintenanceSlots}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Card */}
        {revenue && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-green-100 rounded-lg mr-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Today's Revenue</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600">₹{revenue.today}</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Hourly Revenue</p>
                <p className="text-2xl font-semibold text-blue-600">₹{revenue.hourly}</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Day Pass Revenue</p>
                <p className="text-2xl font-semibold text-purple-600">₹{revenue.dayPass}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: <Car className="h-4 w-4" /> },
                { id: 'entry', name: 'Vehicle Entry', icon: <Plus className="h-4 w-4" /> },
                { id: 'exit', name: 'Vehicle Exit', icon: <Minus className="h-4 w-4" /> },
                { id: 'slots', name: 'Slot Management', icon: <Settings className="h-4 w-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Active Sessions</h3>
                  <div className="text-sm text-gray-500">
                    {slots.filter(slot => slot.status === 'Occupied').length} active vehicles
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {slots
                    .filter(slot => slot.status === 'Occupied')
                    .map(slot => (
                      <div key={slot.id} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-semibold text-gray-900">{slot.slotNumber}</h4>
                            <p className="text-sm text-gray-600">{slot.slotType}</p>
                          </div>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center ${getStatusColor(slot.status)}`}>
                            {getStatusIcon(slot.status)}
                            <span className="ml-1">{slot.status}</span>
                          </span>
                        </div>
                        
                        {slot.parkingSessions[0] && (
                          <div className="space-y-3">
                            <div className="flex items-center p-3 bg-white rounded-lg border border-gray-200">
                              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                {getVehicleIcon(slot.parkingSessions[0].vehicle.type)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{slot.parkingSessions[0].vehicle.numberPlate}</p>
                                <p className="text-sm text-gray-600">{slot.parkingSessions[0].vehicle.type}</p>
                              </div>
                            </div>
                            
                            <div className="text-sm text-gray-600">
                              <p><span className="font-medium">Entry:</span> {formatISTTime(new Date(slot.parkingSessions[0].entryTime))}</p>
                              {slot.parkingSessions[0].exitTime && (
                                <p><span className="font-medium">Exit:</span> {formatISTTime(new Date(slot.parkingSessions[0].exitTime))}</p>
                              )}
                            </div>
                            
                            <button
                              onClick={() => openTimeEditModal(slot)}
                              className="w-full flex items-center justify-center px-3 py-2 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit Time
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Entry Tab */}
            {activeTab === 'entry' && (
              <div className="max-w-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Vehicle Entry</h3>
                <form onSubmit={handleEntry} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Number Plate</label>
                    <input
                      type="text"
                      value={entryForm.numberPlate}
                      onChange={(e) => setEntryForm({...entryForm, numberPlate: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white transition-all duration-200"
                      placeholder="Enter vehicle number plate"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Vehicle Type</label>
                    <select
                      value={entryForm.vehicleType}
                      onChange={(e) => setEntryForm({...entryForm, vehicleType: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white transition-all duration-200"
                    >
                      <option value="Car">Car</option>
                      <option value="Bike">Bike</option>
                      <option value="EV">EV</option>
                      <option value="Handicap">Handicap</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Billing Type</label>
                    <select
                      value={entryForm.billingType}
                      onChange={(e) => setEntryForm({...entryForm, billingType: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white transition-all duration-200"
                    >
                      <option value="Hourly">Hourly</option>
                      <option value="DayPass">Day Pass (₹150)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105"
                  >
                    Record Entry
                  </button>
                </form>
              </div>
            )}

            {/* Exit Tab */}
            {activeTab === 'exit' && (
              <div className="max-w-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Vehicle Exit</h3>
                <form onSubmit={handleExit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Number Plate</label>
                    <input
                      type="text"
                      value={exitForm.numberPlate}
                      onChange={(e) => setExitForm({...exitForm, numberPlate: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-gray-900 bg-white transition-all duration-200"
                      placeholder="Enter vehicle number plate"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 transform hover:scale-105"
                  >
                    Process Exit
                  </button>
                </form>
              </div>
            )}

            {/* Slots Tab */}
            {activeTab === 'slots' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Slot Management</h3>
                  <div className="flex space-x-3">
                    <select
                      value={filters.slotType}
                      onChange={(e) => setFilters({...filters, slotType: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Types</option>
                      <option value="Regular">Regular</option>
                      <option value="Compact">Compact</option>
                      <option value="EV">EV</option>
                      <option value="Handicap">Handicap</option>
                    </select>
                    <select
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value})}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Status</option>
                      <option value="Available">Available</option>
                      <option value="Occupied">Occupied</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {slots
                    .filter(slot => 
                      (!filters.slotType || slot.slotType === filters.slotType) &&
                      (!filters.status || slot.status === filters.status)
                    )
                    .map(slot => (
                      <div key={slot.id} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900">{slot.slotNumber}</h4>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full flex items-center ${getStatusColor(slot.status)}`}>
                            {getStatusIcon(slot.status)}
                            <span className="ml-1">{slot.status}</span>
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{slot.slotType}</p>
                        
                        {slot.parkingSessions[0] && (
                          <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                            <div className="flex items-center">
                              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                                {getVehicleIcon(slot.parkingSessions[0].vehicle.type)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{slot.parkingSessions[0].vehicle.numberPlate}</p>
                                <p className="text-sm text-gray-600">{slot.parkingSessions[0].vehicle.type}</p>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-600">
                              <p>Entry: {formatISTTime(new Date(slot.parkingSessions[0].entryTime))}</p>
                              {slot.parkingSessions[0].exitTime && (
                                <p>Exit: {formatISTTime(new Date(slot.parkingSessions[0].exitTime))}</p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex space-x-2">
                          {slot.status === 'Available' && (
                            <button
                              onClick={() => updateSlotStatus(slot.id, 'Maintenance')}
                              className="flex-1 px-3 py-2 text-xs bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors duration-200"
                            >
                              Mark Maintenance
                            </button>
                          )}
                          {slot.status === 'Maintenance' && (
                            <button
                              onClick={() => updateSlotStatus(slot.id, 'Available')}
                              className="flex-1 px-3 py-2 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"
                            >
                              Mark Available
                            </button>
                          )}
                          {slot.status === 'Occupied' && (
                            <button
                              onClick={() => openTimeEditModal(slot)}
                              className="flex-1 px-3 py-2 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                            >
                              Edit Time
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Time Edit Modal */}
      {timeEditModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Edit Slot Time</h3>
              <button
                onClick={() => setTimeEditModal({ ...timeEditModal, isOpen: false })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Slot: {timeEditModal.slotNumber}</p>
                {timeEditModal.vehicleInfo && (
                  <p className="text-sm text-gray-600">
                    Vehicle: {timeEditModal.vehicleInfo.numberPlate} ({timeEditModal.vehicleInfo.type})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Entry Time (IST)</label>
                <input
                  type="datetime-local"
                  value={timeEditModal.newEntryTime.replace(' ', 'T')}
                  onChange={(e) => setTimeEditModal({
                    ...timeEditModal,
                    newEntryTime: e.target.value.replace('T', ' ')
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Exit Time (IST) - Optional</label>
                <input
                  type="datetime-local"
                  value={timeEditModal.newExitTime ? timeEditModal.newExitTime.replace(' ', 'T') : ''}
                  onChange={(e) => setTimeEditModal({
                    ...timeEditModal,
                    newExitTime: e.target.value ? e.target.value.replace('T', ' ') : ''
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setTimeEditModal({ ...timeEditModal, isOpen: false })}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTimeUpdate}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Update Time
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 