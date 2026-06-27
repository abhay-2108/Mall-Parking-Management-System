'use client'

import { Car, Bike, Zap, Accessibility, Clock, Calendar, Edit, Activity } from 'lucide-react'
import { formatISTTime } from '@/lib/time-utils'

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

interface ActiveSessionsProps {
  slots: ParkingSlot[]
  onEditTime: (slot: ParkingSlot) => void
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
    case 'Available': return <CheckCircleIcon />
    case 'Occupied': return <Clock className="h-4 w-4" />
    case 'Maintenance': return <AlertTriangleIcon />
    default: return <SettingsIcon />
  }
}

function CheckCircleIcon() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
}

function AlertTriangleIcon() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
}

function SettingsIcon() {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
}

export default function ActiveSessions({ slots, onEditTime }: ActiveSessionsProps) {
  const occupiedSlots = slots.filter(slot => slot.status === 'Occupied')

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">Active Sessions</h3>
        <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full">
          <Activity className="h-4 w-4" />
          <span className="text-sm font-semibold">{occupiedSlots.length} active vehicles</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {occupiedSlots.map(slot => (
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
                  onClick={() => onEditTime(slot)}
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
  )
}
