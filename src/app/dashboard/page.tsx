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
  X,
  MapPin,
  Sparkles,
  Activity,
  Users,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
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
    slotId: '',
    manualSlotSelection: false
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
        setEntryForm({ 
          numberPlate: '', 
          vehicleType: 'Car', 
          billingType: 'Hourly', 
          slotId: '',
          manualSlotSelection: false
        })
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
    notification.className = `fixed top-4 right-4 p-4 rounded-2xl shadow-2xl z-50 transform transition-all duration-300 backdrop-blur-lg ${
      type === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border border-green-400/30' : 'bg-gradient-to-r from-red-500 to-pink-500 text-white border border-red-400/30'
    }`
    notification.innerHTML = `
      <div class="flex items-center">
        ${type === 'success' ? '<CheckCircle class="h-5 w-5 mr-3" />' : '<XCircle class="h-5 w-5 mr-3" />'}
        <span class="font-semibold">${message}</span>
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
      case 'Available': return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
      case 'Occupied': return 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
      case 'Maintenance': return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
      default: return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white'
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

  // Get available slots for manual selection
  const getAvailableSlots = () => {
    return slots.filter(slot => slot.status === 'Available')
  }

  // Get compatible slots based on vehicle type
  const getCompatibleSlots = (vehicleType: string) => {
    const availableSlots = getAvailableSlots()
    
    switch (vehicleType) {
      case 'Car':
        return availableSlots.filter(slot => 
          slot.slotType === 'Regular' || slot.slotType === 'Compact'
        )
      case 'Bike':
        return availableSlots.filter(slot => slot.slotType === 'Compact')
      case 'EV':
        return availableSlots.filter(slot => slot.slotType === 'EV')
      case 'Handicap':
        return availableSlots.filter(slot => slot.slotType === 'Handicap')
      default:
        return availableSlots
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-6"></div>
          <p className="text-2xl text-white font-semibold">Loading dashboard...</p>
          <div className="mt-4 flex space-x-2 justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-2xl border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                <Car className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Mall Parking System
                </h1>
                <p className="text-sm text-gray-600">Welcome back, {operatorName}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center px-6 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 hover:shadow-3xl transition-all duration-500 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Total Slots</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalSlots}</p>
                <div className="flex items-center mt-2 text-green-600">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">All Slots</span>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 hover:shadow-3xl transition-all duration-500 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Available</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.availableSlots}</p>
                <div className="flex items-center mt-2 text-green-600">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Ready</span>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 hover:shadow-3xl transition-all duration-500 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Occupied</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.occupiedSlots}</p>
                <div className="flex items-center mt-2 text-red-600">
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">In Use</span>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl">
                <Clock className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 hover:shadow-3xl transition-all duration-500 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Maintenance</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.maintenanceSlots}</p>
                <div className="flex items-center mt-2 text-yellow-600">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Under Repair</span>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl">
                <Settings className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Card */}
        {revenue && (
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 mb-8 border border-white/20">
            <div className="flex items-center mb-8">
              <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl mr-6">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Today's Revenue</h3>
                <p className="text-gray-600">Real-time financial overview</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                <DollarSign className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-2">Total Revenue</p>
                <p className="text-4xl font-bold text-green-600">₹{revenue.today}</p>
                <div className="flex items-center justify-center mt-2 text-green-600">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Today</span>
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
        )}

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20">
          <div className="border-b border-gray-200/50">
            <nav className="-mb-px flex space-x-8 px-8">
              {[
                { id: 'overview', name: 'Overview', icon: <BarChart3 className="h-5 w-5" /> },
                { id: 'entry', name: 'Vehicle Entry', icon: <Plus className="h-5 w-5" /> },
                { id: 'exit', name: 'Vehicle Exit', icon: <Minus className="h-5 w-5" /> },
                { id: 'slots', name: 'Slot Management', icon: <Settings className="h-5 w-5" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-6 px-1 border-b-2 font-semibold text-sm flex items-center space-x-3 transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600 bg-purple-50/50 rounded-t-2xl'
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
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900">Active Sessions</h3>
                  <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full">
                    <Activity className="h-4 w-4" />
                    <span className="text-sm font-semibold">
                      {slots.filter(slot => slot.status === 'Occupied').length} active vehicles
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {slots
                    .filter(slot => slot.status === 'Occupied')
                    .map(slot => (
                      <div key={slot.id} className="bg-gradient-to-r from-white to-purple-50 rounded-3xl p-8 border border-purple-200/50 hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h4 className="text-xl font-bold text-gray-900">{slot.slotNumber}</h4>
                            <p className="text-sm text-gray-600">{slot.slotType}</p>
                          </div>
                          <span className={`px-4 py-2 text-xs font-bold rounded-full flex items-center ${getStatusColor(slot.status)}`}>
                            {getStatusIcon(slot.status)}
                            <span className="ml-2">{slot.status}</span>
                          </span>
                        </div>
                        
                        {slot.parkingSessions[0] && (
                          <div className="space-y-4">
                            <div className="flex items-center p-4 bg-white rounded-2xl border border-purple-200/50 shadow-lg">
                              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mr-4">
                                {getVehicleIcon(slot.parkingSessions[0].vehicle.type)}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{slot.parkingSessions[0].vehicle.numberPlate}</p>
                                <p className="text-sm text-gray-600">{slot.parkingSessions[0].vehicle.type}</p>
                              </div>
                            </div>
                            
                            <div className="text-sm text-gray-600 space-y-2">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-2 text-purple-500" />
                                <span className="font-medium">Entry:</span>
                                <span className="ml-2">{formatISTTime(new Date(slot.parkingSessions[0].entryTime))}</span>
                              </div>
                              {slot.parkingSessions[0].exitTime && (
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-2 text-purple-500" />
                                  <span className="font-medium">Exit:</span>
                                  <span className="ml-2">{formatISTTime(new Date(slot.parkingSessions[0].exitTime))}</span>
                                </div>
                              )}
                            </div>
                            
                            <button
                              onClick={() => openTimeEditModal(slot)}
                              className="w-full flex items-center justify-center px-4 py-3 text-sm font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                            >
                              <Edit className="h-4 w-4 mr-2" />
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
              <div className="max-w-2xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-8">Vehicle Entry</h3>
                <form onSubmit={handleEntry} className="space-y-8">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Number Plate</label>
                    <input
                      type="text"
                      value={entryForm.numberPlate}
                      onChange={(e) => setEntryForm({...entryForm, numberPlate: e.target.value})}
                      className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 text-gray-900 bg-white transition-all duration-300 placeholder-gray-500"
                      placeholder="Enter vehicle number plate"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Vehicle Type</label>
                    <select
                      value={entryForm.vehicleType}
                      onChange={(e) => setEntryForm({...entryForm, vehicleType: e.target.value})}
                      className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 text-gray-900 bg-white transition-all duration-300"
                    >
                      <option value="Car">Car</option>
                      <option value="Bike">Bike</option>
                      <option value="EV">EV</option>
                      <option value="Handicap">Handicap</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Billing Type</label>
                    <select
                      value={entryForm.billingType}
                      onChange={(e) => setEntryForm({...entryForm, billingType: e.target.value})}
                      className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 text-gray-900 bg-white transition-all duration-300"
                    >
                      <option value="Hourly">Hourly</option>
                      <option value="DayPass">Day Pass (₹150)</option>
                    </select>
                  </div>

                  {/* Manual Slot Selection */}
                  <div className="space-y-6">
                    <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                      <input
                        type="checkbox"
                        id="manualSlotSelection"
                        checked={entryForm.manualSlotSelection}
                        onChange={(e) => setEntryForm({...entryForm, manualSlotSelection: e.target.checked, slotId: ''})}
                        className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <label htmlFor="manualSlotSelection" className="ml-3 block text-sm font-semibold text-gray-700">
                        Manually select parking slot
                      </label>
                    </div>

                    {entryForm.manualSlotSelection && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                          Select Parking Slot
                        </label>
                        <select
                          value={entryForm.slotId}
                          onChange={(e) => setEntryForm({...entryForm, slotId: e.target.value})}
                          className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 text-gray-900 bg-white transition-all duration-300"
                          required={entryForm.manualSlotSelection}
                        >
                          <option value="">Choose a slot...</option>
                          {getCompatibleSlots(entryForm.vehicleType).map(slot => (
                            <option key={slot.id} value={slot.id}>
                              {slot.slotNumber} ({slot.slotType})
                            </option>
                          ))}
                        </select>
                        <p className="mt-2 text-sm text-purple-600 font-medium">
                          Available compatible slots for {entryForm.vehicleType}: {getCompatibleSlots(entryForm.vehicleType).length}
                        </p>
                      </div>
                    )}

                    {!entryForm.manualSlotSelection && (
                      <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
                        <MapPin className="h-5 w-5 text-blue-600 mr-3" />
                        <span className="text-sm text-blue-700 font-medium">
                          Automatic slot assignment will be used
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full flex justify-center items-center py-4 px-6 border-2 border-transparent rounded-2xl shadow-2xl text-lg font-bold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-500/50 transition-all duration-300 transform hover:scale-105"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Record Entry
                  </button>
                </form>
              </div>
            )}

            {/* Exit Tab */}
            {activeTab === 'exit' && (
              <div className="max-w-2xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-8">Vehicle Exit</h3>
                <form onSubmit={handleExit} className="space-y-8">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Number Plate</label>
                    <input
                      type="text"
                      value={exitForm.numberPlate}
                      onChange={(e) => setExitForm({...exitForm, numberPlate: e.target.value})}
                      className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-red-500/50 focus:border-red-400 text-gray-900 bg-white transition-all duration-300 placeholder-gray-500"
                      placeholder="Enter vehicle number plate"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex justify-center items-center py-4 px-6 border-2 border-transparent rounded-2xl shadow-2xl text-lg font-bold text-white bg-gradient-to-r from-red-600 via-pink-600 to-red-600 hover:from-red-700 hover:via-pink-700 hover:to-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/50 transition-all duration-300 transform hover:scale-105"
                  >
                    <Minus className="h-5 w-5 mr-2" />
                    Process Exit
                  </button>
                </form>
              </div>
            )}

            {/* Slots Tab */}
            {activeTab === 'slots' && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold text-gray-900">Slot Management</h3>
                  <div className="flex space-x-4">
                    <select
                      value={filters.slotType}
                      onChange={(e) => setFilters({...filters, slotType: e.target.value})}
                      className="px-6 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 bg-white"
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
                      className="px-6 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 bg-white"
                    >
                      <option value="">All Status</option>
                      <option value="Available">Available</option>
                      <option value="Occupied">Occupied</option>
                      <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {slots
                    .filter(slot => 
                      (!filters.slotType || slot.slotType === filters.slotType) &&
                      (!filters.status || slot.status === filters.status)
                    )
                    .map(slot => (
                      <div key={slot.id} className="bg-gradient-to-r from-white to-purple-50 rounded-3xl p-6 border border-purple-200/50 hover:shadow-2xl transition-all duration-500 transform hover:scale-105">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-xl font-bold text-gray-900">{slot.slotNumber}</h4>
                          <span className={`px-3 py-2 text-xs font-bold rounded-full flex items-center ${getStatusColor(slot.status)}`}>
                            {getStatusIcon(slot.status)}
                            <span className="ml-2">{slot.status}</span>
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">{slot.slotType}</p>
                        
                        {slot.parkingSessions[0] && (
                          <div className="mb-6 p-4 bg-white rounded-2xl border border-purple-200/50 shadow-lg">
                            <div className="flex items-center">
                              <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl mr-4">
                                {getVehicleIcon(slot.parkingSessions[0].vehicle.type)}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900">{slot.parkingSessions[0].vehicle.numberPlate}</p>
                                <p className="text-sm text-gray-600">{slot.parkingSessions[0].vehicle.type}</p>
                              </div>
                            </div>
                            <div className="mt-3 text-xs text-gray-600 space-y-1">
                              <p>Entry: {formatISTTime(new Date(slot.parkingSessions[0].entryTime))}</p>
                              {slot.parkingSessions[0].exitTime && (
                                <p>Exit: {formatISTTime(new Date(slot.parkingSessions[0].exitTime))}</p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="flex space-x-3">
                          {slot.status === 'Available' && (
                            <button
                              onClick={() => updateSlotStatus(slot.id, 'Maintenance')}
                              className="flex-1 px-4 py-3 text-xs font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                            >
                              Mark Maintenance
                            </button>
                          )}
                          {slot.status === 'Maintenance' && (
                            <button
                              onClick={() => updateSlotStatus(slot.id, 'Available')}
                              className="flex-1 px-4 py-3 text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                            >
                              Mark Available
                            </button>
                          )}
                          {slot.status === 'Occupied' && (
                            <button
                              onClick={() => openTimeEditModal(slot)}
                              className="flex-1 px-4 py-3 text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 border border-white/20">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Edit Slot Time</h3>
              <button
                onClick={() => setTimeEditModal({ ...timeEditModal, isOpen: false })}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
                <p className="text-sm font-semibold text-gray-700 mb-2">Slot: {timeEditModal.slotNumber}</p>
                {timeEditModal.vehicleInfo && (
                  <p className="text-sm text-gray-600">
                    Vehicle: {timeEditModal.vehicleInfo.numberPlate} ({timeEditModal.vehicleInfo.type})
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Entry Time (IST)</label>
                <input
                  type="datetime-local"
                  value={timeEditModal.newEntryTime.replace(' ', 'T')}
                  onChange={(e) => setTimeEditModal({
                    ...timeEditModal,
                    newEntryTime: e.target.value.replace('T', ' ')
                  })}
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 text-gray-900 bg-white transition-all duration-300"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Exit Time (IST) - Optional</label>
                <input
                  type="datetime-local"
                  value={timeEditModal.newExitTime ? timeEditModal.newExitTime.replace(' ', 'T') : ''}
                  onChange={(e) => setTimeEditModal({
                    ...timeEditModal,
                    newExitTime: e.target.value ? e.target.value.replace('T', ' ') : ''
                  })}
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 text-gray-900 bg-white transition-all duration-300"
                />
              </div>

              <div className="flex space-x-4 pt-6">
                <button
                  onClick={() => setTimeEditModal({ ...timeEditModal, isOpen: false })}
                  className="flex-1 px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTimeUpdate}
                  className="flex-1 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
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