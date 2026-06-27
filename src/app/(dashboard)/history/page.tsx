'use client'

import ParkingHistory from '@/components/ParkingHistory'

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Parking History</h1>
        <p className="text-gray-600 mt-1">View all parking sessions and transaction records</p>
      </div>
      <ParkingHistory />
    </div>
  )
}
