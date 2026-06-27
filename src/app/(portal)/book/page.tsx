'use client'

import { useState, useEffect } from 'react'
import { Car, Bike, Zap, Accessibility, ArrowRight, Building2, Sparkles } from 'lucide-react'

interface Mall {
  id: string
  name: string
  location: string | null
}

export default function BookPage() {
  const [step, setStep] = useState(1)
  const [malls, setMalls] = useState<Mall[]>([])
  const [form, setForm] = useState({
    mallId: '',
    slotType: 'Regular',
    entryDate: '',
    entryTime: '',
    exitDate: '',
    exitTime: '',
    phone: '',
    name: ''
  })
  const [amount, setAmount] = useState(150)
  const [bookingResult, setBookingResult] = useState<{ id: string; qrCode: string; amount: number; entryTime: string; exitTime: string; slotType: string; mallId: string; status: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/malls')
      .then(r => r.json())
      .then(d => { setMalls(d.malls); if (d.malls[0]) setForm(f => ({ ...f, mallId: d.malls[0].id })) })
      .catch(() => {})
  }, [])

  const calculateAmount = () => {
    if (form.entryDate && form.entryTime && form.exitDate && form.exitTime) {
      const entry = new Date(`${form.entryDate}T${form.entryTime}`)
      const exit = new Date(`${form.exitDate}T${form.exitTime}`)
      const hours = Math.ceil((exit.getTime() - entry.getTime()) / (1000 * 60 * 60))
      setAmount(Math.max(150, hours * 50))
    }
  }

  useEffect(() => { calculateAmount() }, [form.entryDate, form.entryTime, form.exitDate, form.exitTime, form.slotType])

  const handleBook = async () => {
    setLoading(true)
    setError('')
    try {
      // Register customer
      const custRes = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: form.phone, name: form.name })
      })
      if (!custRes.ok) { setError('Invalid phone number'); setLoading(false); return }
      const { customer } = await custRes.json()

      // Create booking
      const bookRes = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.id,
          mallId: form.mallId,
          slotType: form.slotType,
          entryTime: `${form.entryDate}T${form.entryTime}:00`,
          exitTime: `${form.exitDate}T${form.exitTime}:00`,
          amount
        })
      })
      if (!bookRes.ok) {
        const err = await bookRes.json()
        setError(err.error || 'Booking failed')
        setLoading(false)
        return
      }
      const { booking } = await bookRes.json()
      setBookingResult(booking)
      setStep(3)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  if (step === 3 && bookingResult) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full border border-white/20 text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-3xl font-bold text-white mb-2">Booking Confirmed!</h2>
          <p className="text-purple-200 mb-6">Your parking slot has been reserved</p>
          <div className="bg-white/10 rounded-2xl p-6 mb-6 space-y-3 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-purple-200">Booking ID</span>
              <span className="text-white font-bold">{bookingResult.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-purple-200">QR Code</span>
              <span className="text-white font-mono text-xs break-all">{bookingResult.qrCode}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-purple-200">Amount</span>
              <span className="text-white font-bold">₹{bookingResult.amount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-purple-200">Entry</span>
              <span className="text-white">{new Date(bookingResult.entryTime).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-purple-200">Exit</span>
              <span className="text-white">{new Date(bookingResult.exitTime).toLocaleString('en-IN')}</span>
            </div>
          </div>
          <div className="bg-white/10 rounded-2xl p-4 mb-6 border-2 border-dashed border-purple-400">
            <p className="text-sm text-purple-200 mb-2">Show this QR code at entry</p>
            <div className="w-32 h-32 bg-white mx-auto rounded-xl flex items-center justify-center">
              <span className="text-6xl">📱</span>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            🖨️ Print Confirmation
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-lg w-full border border-white/20">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Book Parking</h1>
          <p className="text-purple-200 mt-1">Reserve your slot in advance</p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? 'bg-purple-500 text-white' : 'bg-white/20 text-white/50'}`}>{s}</div>
              {s < 2 && <div className={`w-12 h-1 ${step > s ? 'bg-purple-500' : 'bg-white/20'}`} />}
            </div>
          ))}
        </div>

        {error && (
          <div className="p-3 bg-red-500/20 border border-red-400/30 rounded-xl text-red-200 text-sm mb-4">{error}</div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-purple-200 mb-2">Mall</label>
              <select value={form.mallId} onChange={e => setForm(f => ({ ...f, mallId: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                {malls.map(m => <option key={m.id} value={m.id} className="text-black">{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-purple-200 mb-2">Vehicle Type</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'Regular', label: 'Car', icon: <Car className="h-5 w-5" /> },
                  { value: 'Compact', label: 'Bike', icon: <Bike className="h-5 w-5" /> },
                  { value: 'EV', label: 'EV', icon: <Zap className="h-5 w-5" /> },
                  { value: 'Handicap', label: 'Handicap', icon: <Accessibility className="h-5 w-5" /> },
                ].map(opt => (
                  <button key={opt.value} onClick={() => setForm(f => ({ ...f, slotType: opt.value }))}
                    className={`p-3 rounded-xl border-2 flex items-center justify-center space-x-2 transition-all ${
                      form.slotType === opt.value ? 'border-purple-500 bg-purple-500/20 text-white' : 'border-white/20 text-purple-200 hover:bg-white/10'
                    }`}>
                    {opt.icon}<span className="text-sm font-semibold">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-2">Entry Date</label>
                <input type="date" value={form.entryDate} onChange={e => setForm(f => ({ ...f, entryDate: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-2">Entry Time</label>
                <input type="time" value={form.entryTime} onChange={e => setForm(f => ({ ...f, entryTime: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-2">Exit Date</label>
                <input type="date" value={form.exitDate} onChange={e => setForm(f => ({ ...f, exitDate: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-purple-200 mb-2">Exit Time</label>
                <input type="time" value={form.exitTime} onChange={e => setForm(f => ({ ...f, exitTime: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
            </div>
            <button onClick={() => setStep(2)}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center">
              Continue <ArrowRight className="h-5 w-5 ml-2" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="bg-white/10 rounded-2xl p-4 space-y-2">
              <p className="text-sm text-purple-200">Booking Summary</p>
              <div className="flex justify-between text-white text-sm"><span>Slot Type</span><span className="font-bold">{form.slotType}</span></div>
              <div className="flex justify-between text-white text-sm"><span>Entry</span><span>{form.entryDate} {form.entryTime}</span></div>
              <div className="flex justify-between text-white text-sm"><span>Exit</span><span>{form.exitDate} {form.exitTime}</span></div>
              <div className="flex justify-between text-white text-lg font-bold border-t border-white/20 pt-2 mt-2">
                <span>Amount</span><span>₹{amount}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-purple-200 mb-2">Phone Number</label>
              <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="+91 98765 43210" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-purple-200 mb-2">Name (optional)</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-3 bg-white/10 border-2 border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Your name" />
            </div>

            <button onClick={handleBook} disabled={loading || !form.phone}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-lg hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 flex items-center justify-center">
              {loading ? 'Booking...' : <><Sparkles className="h-5 w-5 mr-2" />Confirm Booking - ₹{amount}</>}
            </button>
          </div>
        )}

        <p className="text-center text-xs text-purple-300 mt-6">
          No payment required now. Pay at the mall on arrival.
        </p>
      </div>
    </div>
  )
}
