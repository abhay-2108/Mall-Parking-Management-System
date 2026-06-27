'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Minus, Settings, BarChart3, AlertTriangle } from 'lucide-react'
import { formatISTTime } from '@/lib/time-utils'
import Notification, { useNotification } from '@/components/Notification'
import StatsCards from '@/components/StatsCards'
import RevenueCard from '@/components/RevenueCard'
import ActiveSessions from '@/components/ActiveSessions'
import EntryForm from '@/components/EntryForm'
import ExitForm from '@/components/ExitForm'
import SlotGrid from '@/components/SlotGrid'
import TimeEditModal from '@/components/TimeEditModal'

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
  const { notifications, showNotification } = useNotification()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [revenue, setRevenue] = useState<Revenue | null>(null)
  const [slots, setSlots] = useState<ParkingSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [overstayedVehicles, setOverstayedVehicles] = useState<string[]>([])

  const [filters, setFilters] = useState({ slotType: '', status: '' })

  const [timeEditModal, setTimeEditModal] = useState({
    isOpen: false,
    slotId: '',
    slotNumber: '',
    newEntryTime: '',
    newExitTime: '',
    vehicleInfo: null as { numberPlate: string; type: string } | null
  })

  useEffect(() => {
    loadDashboardData()
    checkAuth()

    const interval = setInterval(() => {
      loadDashboardData()
      checkOverstayedVehicles()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check')
      if (!response.ok) router.push('/')
    } catch {
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

  const checkOverstayedVehicles = () => {
    const now = Date.now()
    const sixHoursMs = 6 * 60 * 60 * 1000
    const overstayed: string[] = []

    slots.forEach(slot => {
      if (slot.status === 'Occupied' && slot.parkingSessions[0]) {
        const entryTime = new Date(slot.parkingSessions[0].entryTime).getTime()
        if (now - entryTime > sixHoursMs) {
          overstayed.push(slot.parkingSessions[0].vehicle.numberPlate)
        }
      }
    })

    setOverstayedVehicles(overstayed)
  }

  const handleEntry = async (data: { numberPlate: string; vehicleType: string; billingType: string; slotId: string; manualSlotSelection: boolean }) => {
    try {
      const response = await fetch('/api/parking/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        loadDashboardData()
        showNotification('Vehicle entry recorded successfully!', 'success')
      } else {
        const result = await response.json()
        showNotification(result.error || 'Entry failed', 'error')
      }
    } catch {
      showNotification('Network error', 'error')
    }
  }

  const handleExit = async (numberPlate: string) => {
    try {
      const response = await fetch('/api/parking/exit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numberPlate })
      })

      if (response.ok) {
        const data = await response.json()
        loadDashboardData()
        showNotification(`Exit processed! Amount: ₹${data.receipt.amount}`, 'success')
      } else {
        const data = await response.json()
        showNotification(data.error || 'Exit failed', 'error')
      }
    } catch {
      showNotification('Network error', 'error')
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
    } catch {
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
    } catch {
      showNotification('Network error', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <Notification notifications={notifications} />

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Overview of your parking operations</p>
      </div>

      <StatsCards stats={stats} />
      <RevenueCard revenue={revenue} onDateRangeChange={() => loadDashboardData()} />

      {overstayedVehicles.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl text-white shadow-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-6 w-6 mr-3" />
            <div>
              <p className="font-bold">Overstay Alert</p>
              <p className="text-sm">
                {overstayedVehicles.length} vehicle(s) parked for more than 6 hours: {overstayedVehicles.join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

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
          {activeTab === 'overview' && <ActiveSessions slots={slots} onEditTime={openTimeEditModal} />}
          {activeTab === 'entry' && <EntryForm slots={slots} onSubmit={handleEntry} />}
          {activeTab === 'exit' && <ExitForm onSubmit={handleExit} />}
          {activeTab === 'slots' && (
            <SlotGrid
              slots={slots}
              filters={filters}
              onFilterChange={setFilters}
              onUpdateStatus={updateSlotStatus}
              onEditTime={openTimeEditModal}
            />
          )}
        </div>
      </div>

      <TimeEditModal
        isOpen={timeEditModal.isOpen}
        slotNumber={timeEditModal.slotNumber}
        slotId={timeEditModal.slotId}
        currentEntryTime={timeEditModal.newEntryTime}
        currentExitTime={timeEditModal.newExitTime}
        newEntryTime={timeEditModal.newEntryTime}
        newExitTime={timeEditModal.newExitTime}
        vehicleInfo={timeEditModal.vehicleInfo}
        onEntryTimeChange={(time) => setTimeEditModal({ ...timeEditModal, newEntryTime: time })}
        onExitTimeChange={(time) => setTimeEditModal({ ...timeEditModal, newExitTime: time })}
        onUpdate={handleTimeUpdate}
        onClose={() => setTimeEditModal({ ...timeEditModal, isOpen: false })}
      />
    </div>
  )
}
