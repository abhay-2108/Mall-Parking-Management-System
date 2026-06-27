'use client'

import { useState, useMemo } from 'react'
import { Car, Bike, Zap, Accessibility, CheckCircle, Clock, AlertTriangle, Settings, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatISTTime } from '@/lib/time-utils'
import ConfirmDialog from './ConfirmDialog'

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

interface SlotGridProps {
  slots: ParkingSlot[]
  filters: { slotType: string; status: string }
  onFilterChange: (filters: { slotType: string; status: string }) => void
  onUpdateStatus: (slotId: string, status: string) => void
  onEditTime: (slot: ParkingSlot) => void
}

const SLOTS_PER_PAGE = 24

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

export default function SlotGrid({ slots, filters, onFilterChange, onUpdateStatus, onEditTime }: SlotGridProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  const filteredSlots = useMemo(() => {
    return slots.filter(slot =>
      (!filters.slotType || slot.slotType === filters.slotType) &&
      (!filters.status || slot.status === filters.status)
    )
  }, [slots, filters])

  const totalPages = Math.ceil(filteredSlots.length / SLOTS_PER_PAGE)

  const paginatedSlots = useMemo(() => {
    const start = (currentPage - 1) * SLOTS_PER_PAGE
    return filteredSlots.slice(start, start + SLOTS_PER_PAGE)
  }, [filteredSlots, currentPage])

  const handleFilterChange = (key: string, value: string) => {
    onFilterChange({ ...filters, [key]: value })
    setCurrentPage(1)
  }

  const handleMaintenanceClick = (slotId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Mark as Maintenance',
      message: 'Are you sure you want to mark this slot as under maintenance? It will not be available for parking.',
      onConfirm: () => {
        onUpdateStatus(slotId, 'Maintenance')
        setConfirmDialog({ ...confirmDialog, isOpen: false })
      }
    })
  }

  const handleAvailableClick = (slotId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Mark as Available',
      message: 'Are you sure you want to mark this slot as available for parking?',
      onConfirm: () => {
        onUpdateStatus(slotId, 'Available')
        setConfirmDialog({ ...confirmDialog, isOpen: false })
      }
    })
  }

  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = []
    const maxVisible = 7

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)

      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }, [currentPage, totalPages])

  return (
    <div>
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

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Slot Management</h3>
          <p className="text-sm text-gray-600 mt-1">
            Showing {((currentPage - 1) * SLOTS_PER_PAGE) + 1}–{Math.min(currentPage * SLOTS_PER_PAGE, filteredSlots.length)} of {filteredSlots.length} slots
          </p>
        </div>
        <div className="flex space-x-4">
          <select
            value={filters.slotType}
            onChange={(e) => handleFilterChange('slotType', e.target.value)}
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
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-6 py-3 border-2 border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 bg-white"
          >
            <option value="">All Status</option>
            <option value="Available">Available</option>
            <option value="Occupied">Occupied</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>
      </div>

      {filteredSlots.length === 0 ? (
        <div className="text-center py-16 bg-white/80 rounded-3xl border border-gray-200">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No slots match the selected filters</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedSlots.map(slot => (
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
                      onClick={() => handleMaintenanceClick(slot.id)}
                      className="flex-1 px-4 py-3 text-xs font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Mark Maintenance
                    </button>
                  )}
                  {slot.status === 'Maintenance' && (
                    <button
                      onClick={() => handleAvailableClick(slot.id)}
                      className="flex-1 px-4 py-3 text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Mark Available
                    </button>
                  )}
                  {slot.status === 'Occupied' && (
                    <button
                      onClick={() => onEditTime(slot)}
                      className="flex-1 px-4 py-3 text-xs font-semibold bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                      Edit Time
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center mt-8 space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-3 rounded-xl hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronLeft className="h-5 w-5 text-gray-700" />
              </button>

              {pageNumbers.map((page, index) =>
                typeof page === 'string' ? (
                  <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">...</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      currentPage === page
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-purple-100'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-3 rounded-xl hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronRight className="h-5 w-5 text-gray-700" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
