'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Car, Bike, Zap, Accessibility, CheckCircle, Clock,
  Settings, ChevronLeft, ChevronRight, Building2, Layers
} from 'lucide-react'
import Notification, { useNotification } from '@/components/Notification'
import ConfirmDialog from '@/components/ConfirmDialog'

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

const FLOORS = ['1', '2', '3']
const SECTIONS = ['A', 'B', 'C', 'D']

const getVehicleIcon = (type: string, size: 'sm' | 'md' = 'sm') => {
  const sizeClass = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
  switch (type) {
    case 'Car': return <Car className={sizeClass} />
    case 'Bike': return <Bike className={sizeClass} />
    case 'EV': return <Zap className={sizeClass} />
    case 'Handicap': return <Accessibility className={sizeClass} />
    default: return <Car className={sizeClass} />
  }
}

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Available':
      return 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-green-200'
    case 'Occupied':
      return 'bg-gradient-to-br from-red-400 to-pink-500 text-white shadow-red-200'
    case 'Maintenance':
      return 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-yellow-200'
    default:
      return 'bg-gray-300 text-gray-600'
  }
}

const getStatusBorder = (status: string) => {
  switch (status) {
    case 'Available': return 'ring-2 ring-green-300'
    case 'Occupied': return 'ring-2 ring-red-300'
    case 'Maintenance': return 'ring-2 ring-yellow-300'
    default: return ''
  }
}

export default function ParkingMapPage() {
  const router = useRouter()
  const { notifications, showNotification } = useNotification()
  const [slots, setSlots] = useState<ParkingSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFloor, setSelectedFloor] = useState('1')

  const [selectedSlot, setSelectedSlot] = useState<ParkingSlot | null>(null)

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

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
      const response = await fetch('/api/slots')
      if (response.ok) {
        const data = await response.json()
        setSlots(data.slots)
      }
    } catch (error) {
      console.error('Error loading slots:', error)
    } finally {
      setLoading(false)
    }
  }

  const floorSlots = useMemo(() => {
    return slots.filter(slot => {
      const floor = slot.slotNumber.charAt(1)
      return floor === selectedFloor
    })
  }, [slots, selectedFloor])

  const sectionSlots = useMemo(() => {
    const grouped: Record<string, ParkingSlot[]> = {}
    SECTIONS.forEach(section => {
      grouped[section] = floorSlots.filter(slot => slot.slotNumber.startsWith(section))
    })
    return grouped
  }, [floorSlots])

  const floorStats = useMemo(() => {
    const total = floorSlots.length
    const available = floorSlots.filter(s => s.status === 'Available').length
    const occupied = floorSlots.filter(s => s.status === 'Occupied').length
    const maintenance = floorSlots.filter(s => s.status === 'Maintenance').length
    return { total, available, occupied, maintenance }
  }, [floorSlots])

  const handleSlotStatusChange = (slotId: string, newStatus: string) => {
    setConfirmDialog({
      isOpen: true,
      title: `Mark as ${newStatus}`,
      message: `Are you sure you want to mark this slot as ${newStatus.toLowerCase()}?`,
      onConfirm: async () => {
        try {
          const response = await fetch('/api/slots', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slotId, status: newStatus })
          })

          if (response.ok) {
            loadData()
            setSelectedSlot(null)
            showNotification(`Slot marked as ${newStatus.toLowerCase()}`, 'success')
          }
        } catch {
          showNotification('Failed to update slot', 'error')
        }
        setConfirmDialog({ ...confirmDialog, isOpen: false })
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 font-medium">Loading parking map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Notification notifications={notifications} />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Yes, Confirm"
        cancelText="Cancel"
        type="warning"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
      />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Parking Map</h1>
          <p className="text-gray-600 mt-1">Visual overview of parking slot status</p>
        </div>
      </div>

      {/* Floor Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-5 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Slots</p>
              <p className="text-2xl font-bold text-gray-900">{floorStats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <Building2 className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-5 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600">{floorStats.available}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-5 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Occupied</p>
              <p className="text-2xl font-bold text-red-600">{floorStats.occupied}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <Clock className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-5 border border-white/20 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Maintenance</p>
              <p className="text-2xl font-bold text-yellow-600">{floorStats.maintenance}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-xl">
              <Settings className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Floor Selector */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 border border-white/20 shadow-lg">
        <div className="flex items-center justify-center space-x-4">
          <Layers className="h-5 w-5 text-purple-600" />
          <span className="text-sm font-semibold text-gray-700">Select Floor:</span>
          {FLOORS.map(floor => (
            <button
              key={floor}
              onClick={() => setSelectedFloor(floor)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                selectedFloor === floor
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Floor {floor}
            </button>
          ))}
        </div>
      </div>

      {/* Occupancy Bar */}
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-4 border border-white/20 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-gray-700">Floor {selectedFloor} Occupancy</span>
          <span className="text-sm text-gray-600">
            {floorStats.available} available / {floorStats.total} total
          </span>
        </div>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
          <div className="flex h-full">
            <div
              className="bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
              style={{ width: `${(floorStats.available / floorStats.total) * 100}%` }}
            />
            <div
              className="bg-gradient-to-r from-red-400 to-pink-500 transition-all duration-500"
              style={{ width: `${(floorStats.occupied / floorStats.total) * 100}%` }}
            />
            <div
              className="bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
              style={{ width: `${(floorStats.maintenance / floorStats.total) * 100}%` }}
            />
          </div>
        </div>
        <div className="flex items-center justify-center mt-3 space-x-6">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2" />
            <span className="text-xs text-gray-600">Available ({floorStats.available})</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 mr-2" />
            <span className="text-xs text-gray-600">Occupied ({floorStats.occupied})</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
            <span className="text-xs text-gray-600">Maintenance ({floorStats.maintenance})</span>
          </div>
        </div>
      </div>

      {/* Parking Grid */}
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl p-6 border border-white/20 shadow-lg">
        <div className="flex items-center mb-6">
          <Building2 className="h-5 w-5 text-purple-600 mr-2" />
          <h2 className="text-lg font-bold text-gray-900">Floor {selectedFloor} Layout</h2>
        </div>

        <div className="space-y-6">
          {SECTIONS.map(section => (
            <div key={section}>
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-sm">{section}</span>
                </div>
                <span className="text-sm font-semibold text-gray-700">Section {section}</span>
              </div>

              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {sectionSlots[section]?.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(slot)}
                    className={`relative aspect-square rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all duration-200 cursor-pointer hover:scale-110 hover:z-10 shadow-md ${getStatusStyles(slot.status)} ${getStatusBorder(slot.status)}`}
                    title={`${slot.slotNumber} - ${slot.status}${slot.parkingSessions[0] ? ` (${slot.parkingSessions[0].vehicle.numberPlate})` : ''}`}
                  >
                    <span className="text-[10px] leading-none">{slot.slotNumber.split('-')[1]}</span>
                    {slot.status === 'Occupied' && slot.parkingSessions[0] && (
                      <div className="mt-0.5">
                        {getVehicleIcon(slot.parkingSessions[0].vehicle.type)}
                      </div>
                    )}
                    {slot.status === 'Available' && (
                      <CheckCircle className="h-3 w-3 mt-0.5 opacity-70" />
                    )}
                    {slot.status === 'Maintenance' && (
                      <Settings className="h-3 w-3 mt-0.5 opacity-70" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Entry/Exit indicators */}
        <div className="flex items-center justify-center mt-8 space-x-8">
          <div className="flex items-center px-4 py-2 bg-green-100 rounded-xl border-2 border-green-300 border-dashed">
            <ChevronLeft className="h-4 w-4 text-green-600 mr-1" />
            <span className="text-xs font-semibold text-green-700">ENTRY</span>
          </div>
          <div className="h-px w-20 bg-gray-300 border-dashed border-t-2" />
          <div className="flex items-center px-4 py-2 bg-red-100 rounded-xl border-2 border-red-300 border-dashed">
            <span className="text-xs font-semibold text-red-700">EXIT</span>
            <ChevronRight className="h-4 w-4 text-red-600 ml-1" />
          </div>
        </div>
      </div>

      {/* Slot Detail Panel */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-xl mr-3 ${getStatusStyles(selectedSlot.status)}`}>
                  {selectedSlot.status === 'Occupied' && selectedSlot.parkingSessions[0] ? (
                    getVehicleIcon(selectedSlot.parkingSessions[0].vehicle.type, 'md')
                  ) : selectedSlot.status === 'Available' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <Settings className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedSlot.slotNumber}</h3>
                  <p className="text-sm text-gray-600">{selectedSlot.slotType} Slot</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSlot(null)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
              >
                ✕
              </button>
            </div>

            <div className={`p-4 rounded-2xl mb-6 ${
              selectedSlot.status === 'Available' ? 'bg-green-50 border border-green-200' :
              selectedSlot.status === 'Occupied' ? 'bg-red-50 border border-red-200' :
              'bg-yellow-50 border border-yellow-200'
            }`}>
              <p className="text-sm font-semibold text-gray-700">Status</p>
              <p className={`text-lg font-bold ${
                selectedSlot.status === 'Available' ? 'text-green-600' :
                selectedSlot.status === 'Occupied' ? 'text-red-600' :
                'text-yellow-600'
              }`}>{selectedSlot.status}</p>
            </div>

            {selectedSlot.parkingSessions[0] && (
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">Vehicle</span>
                  <span className="font-semibold text-gray-900">{selectedSlot.parkingSessions[0].vehicle.numberPlate}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">Type</span>
                  <span className="font-semibold text-gray-900">{selectedSlot.parkingSessions[0].vehicle.type}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">Entry Time</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(selectedSlot.parkingSessions[0].entryTime).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm text-gray-600">Billing</span>
                  <span className="font-semibold text-gray-900">{selectedSlot.parkingSessions[0].billingType}</span>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              {selectedSlot.status === 'Available' && (
                <button
                  onClick={() => handleSlotStatusChange(selectedSlot.id, 'Maintenance')}
                  className="flex-1 px-4 py-3 text-sm font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all"
                >
                  Mark Maintenance
                </button>
              )}
              {selectedSlot.status === 'Maintenance' && (
                <button
                  onClick={() => handleSlotStatusChange(selectedSlot.id, 'Available')}
                  className="flex-1 px-4 py-3 text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all"
                >
                  Mark Available
                </button>
              )}
              {selectedSlot.status === 'Occupied' && (
                <button
                  onClick={() => {
                    const plate = selectedSlot.parkingSessions[0]?.vehicle.numberPlate
                    setSelectedSlot(null)
                    router.push(`/dashboard?exit=${encodeURIComponent(plate || '')}`)
                  }}
                  className="flex-1 px-4 py-3 text-sm font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Process Exit
                </button>
              )}
              <button
                onClick={() => setSelectedSlot(null)}
                className="px-4 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
