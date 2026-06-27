'use client'

import { useState } from 'react'
import { Minus } from 'lucide-react'

interface ExitFormProps {
  onSubmit: (numberPlate: string) => void
}

export default function ExitForm({ onSubmit }: ExitFormProps) {
  const [numberPlate, setNumberPlate] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(numberPlate)
    setNumberPlate('')
  }

  return (
    <div className="max-w-2xl">
      <h3 className="text-2xl font-bold text-gray-900 mb-8">Vehicle Exit</h3>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">Number Plate</label>
          <input
            type="text"
            value={numberPlate}
            onChange={(e) => setNumberPlate(e.target.value)}
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
  )
}
