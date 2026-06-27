'use client'

import { useState, useEffect } from 'react'
import { Sparkles, MapPin, IndianRupee, Zap } from 'lucide-react'
import { useMall } from '@/context/MallContext'

interface ParkingSlot {
  id: string
  slotNumber: string
  slotType: string
  status: string
}

interface EntryFormProps {
  slots: ParkingSlot[]
  onSubmit: (data: { numberPlate: string; vehicleType: string; billingType: string; slotId: string; manualSlotSelection: boolean }) => void
}

export default function EntryForm({ slots, onSubmit }: EntryFormProps) {
  const { currentMall } = useMall()
  const [rateInfo, setRateInfo] = useState<{ baseHourly: number; multiplier: number; effectiveHourly: number; dayPassAmount: number; isSurge: boolean; surgeReason: string | null } | null>(null)
  const [form, setForm] = useState({
    numberPlate: '',
    vehicleType: 'Car',
    billingType: 'Hourly',
    slotId: '',
    manualSlotSelection: false
  })

  useEffect(() => {
    if (currentMall?.id) {
      fetch(`/api/dashboard/stats?mallId=${currentMall.id}`)
        .then(r => r.json())
        .then(d => setRateInfo(d.rateInfo))
        .catch(() => {})
    }
  }, [currentMall])

  const getAvailableSlots = () => slots.filter(slot => slot.status === 'Available')
  const getCompatibleSlots = (vehicleType: string) => {
    const available = getAvailableSlots()
    switch (vehicleType) {
      case 'Car': return available.filter(s => s.slotType === 'Regular' || s.slotType === 'Compact')
      case 'Bike': return available.filter(s => s.slotType === 'Compact')
      case 'EV': return available.filter(s => s.slotType === 'EV')
      case 'Handicap': return available.filter(s => s.slotType === 'Handicap')
      default: return available
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
    setForm({ numberPlate: '', vehicleType: 'Car', billingType: 'Hourly', slotId: '', manualSlotSelection: false })
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold text-gray-900">Vehicle Entry</h3>
        {/* Current Rate Badge */}
        {rateInfo && (
          <div className={`px-4 py-2 rounded-2xl text-sm font-bold flex items-center ${
            rateInfo.isSurge ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white animate-pulse' : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
          }`}>
            <IndianRupee className="h-4 w-4 mr-1" />
            ₹{rateInfo.effectiveHourly}/hr
            {rateInfo.isSurge && <Zap className="h-4 w-4 ml-1" />}
          </div>
        )}
      </div>

      {/* Surge Alert */}
      {rateInfo?.isSurge && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-300 rounded-2xl">
          <div className="flex items-center text-red-700">
            <Zap className="h-5 w-5 mr-2" />
            <span className="font-semibold">Surge pricing active: {rateInfo.surgeReason} ({rateInfo.multiplier}x)</span>
          </div>
          <p className="text-sm text-red-600 mt-1">Base rate: ₹{rateInfo.baseHourly}/hr → Effective: ₹{rateInfo.effectiveHourly}/hr</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Number Plate</label>
          <input type="text" value={form.numberPlate} onChange={(e) => setForm({ ...form, numberPlate: e.target.value })}
            className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 text-gray-900 bg-white transition-all duration-300 placeholder-gray-500"
            placeholder="Enter vehicle number plate" required />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Vehicle Type</label>
          <select value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
            className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 text-gray-900 bg-white transition-all duration-300">
            <option value="Car">Car</option>
            <option value="Bike">Bike</option>
            <option value="EV">EV</option>
            <option value="Handicap">Handicap</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Billing Type</label>
          <select value={form.billingType} onChange={(e) => setForm({ ...form, billingType: e.target.value })}
            className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 text-gray-900 bg-white transition-all duration-300">
            <option value="Hourly">Hourly (₹{rateInfo?.effectiveHourly || 50}/hr)</option>
            <option value="DayPass">Day Pass (₹{rateInfo?.dayPassAmount || 150})</option>
          </select>
        </div>

        <div className="space-y-6">
          <div className="flex items-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200">
            <input type="checkbox" id="manualSlotSelection" checked={form.manualSlotSelection}
              onChange={(e) => setForm({ ...form, manualSlotSelection: e.target.checked, slotId: '' })}
              className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded" />
            <label htmlFor="manualSlotSelection" className="ml-3 block text-sm font-semibold text-gray-700">Manually select parking slot</label>
          </div>

          {form.manualSlotSelection && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Select Parking Slot</label>
              <select value={form.slotId} onChange={(e) => setForm({ ...form, slotId: e.target.value })}
                className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-purple-500/50 focus:border-purple-400 text-gray-900 bg-white transition-all duration-300"
                required={form.manualSlotSelection}>
                <option value="">Choose a slot...</option>
                {getCompatibleSlots(form.vehicleType).map(slot => (
                  <option key={slot.id} value={slot.id}>{slot.slotNumber} ({slot.slotType})</option>
                ))}
              </select>
              <p className="mt-2 text-sm text-purple-600 font-medium">Available compatible slots for {form.vehicleType}: {getCompatibleSlots(form.vehicleType).length}</p>
            </div>
          )}

          {!form.manualSlotSelection && (
            <div className="flex items-center p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
              <MapPin className="h-5 w-5 text-blue-600 mr-3" />
              <span className="text-sm text-blue-700 font-medium">Automatic slot assignment will be used</span>
            </div>
          )}
        </div>

        <button type="submit"
          className="w-full flex justify-center items-center py-4 px-6 border-2 border-transparent rounded-2xl shadow-2xl text-lg font-bold text-white bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-500/50 transition-all duration-300 transform hover:scale-105">
          <Sparkles className="h-5 w-5 mr-2" />Record Entry
        </button>
      </form>
    </div>
  )
}
