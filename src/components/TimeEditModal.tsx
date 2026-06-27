'use client'

import { X } from 'lucide-react'

interface TimeEditModalProps {
  isOpen: boolean
  slotNumber: string
  slotId: string
  currentEntryTime: string
  currentExitTime: string
  newEntryTime: string
  newExitTime: string
  vehicleInfo: { numberPlate: string; type: string } | null
  onEntryTimeChange: (time: string) => void
  onExitTimeChange: (time: string) => void
  onUpdate: () => void
  onClose: () => void
}

export default function TimeEditModal({
  isOpen,
  slotNumber,
  newEntryTime,
  newExitTime,
  vehicleInfo,
  onEntryTimeChange,
  onExitTimeChange,
  onUpdate,
  onClose
}: TimeEditModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 border border-white/20">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-bold text-gray-900">Edit Slot Time</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">Slot: {slotNumber}</p>
            {vehicleInfo && (
              <p className="text-sm text-gray-600">
                Vehicle: {vehicleInfo.numberPlate} ({vehicleInfo.type})
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Entry Time (IST)</label>
            <input
              type="datetime-local"
              value={newEntryTime.replace(' ', 'T')}
              onChange={(e) => onEntryTimeChange(e.target.value.replace('T', ' '))}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 text-gray-900 bg-white transition-all duration-300"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">Exit Time (IST) - Optional</label>
            <input
              type="datetime-local"
              value={newExitTime ? newExitTime.replace(' ', 'T') : ''}
              onChange={(e) => onExitTimeChange(e.target.value ? e.target.value.replace('T', ' ') : '')}
              className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 text-gray-900 bg-white transition-all duration-300"
            />
          </div>

          <div className="flex space-x-4 pt-6">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
            >
              Cancel
            </button>
            <button
              onClick={onUpdate}
              className="flex-1 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Update Time
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
