'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

interface BookingData {
  id: string
  customerId: string
  mallId: string
  slotType: string
  entryTime: string
  exitTime: string
  qrCode: string
  status: string
  amount: number
  customer: { name: string; phone: string }
  mall: { name: string; location: string | null }
}

export default function ConfirmPage() {
  const { id } = useParams()
  const [booking, setBooking] = useState<BookingData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (id) {
      fetch(`/api/bookings?id=${id}`)
        .then(r => r.json())
        .then(d => setBooking(d.booking))
        .catch(() => setError('Booking not found'))
    }
  }, [id])

  if (error) return <div className="min-h-screen flex items-center justify-center text-white">{error}</div>
  if (!booking) return <div className="min-h-screen flex items-center justify-center text-white"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white" /></div>

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full border border-white/20 text-center">
        <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-white mb-2">Booking Confirmed</h1>
        <p className="text-purple-200 mb-6">Your slot is reserved</p>
        <div className="bg-white/10 rounded-2xl p-6 space-y-3 text-left mb-6">
          <div className="flex justify-between text-sm"><span className="text-purple-200">ID</span><span className="text-white font-mono">{booking.id.slice(0, 10)}...</span></div>
          <div className="flex justify-between text-sm"><span className="text-purple-200">Amount</span><span className="text-white font-bold">₹{booking.amount}</span></div>
          <div className="flex justify-between text-sm"><span className="text-purple-200">Entry</span><span className="text-white">{new Date(booking.entryTime).toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between text-sm"><span className="text-purple-200">Exit</span><span className="text-white">{new Date(booking.exitTime).toLocaleString('en-IN')}</span></div>
        </div>
        <button onClick={() => window.print()} className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold">🖨️ Print</button>
      </div>
    </div>
  )
}
