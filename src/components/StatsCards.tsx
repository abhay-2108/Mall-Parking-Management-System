'use client'

import { BarChart3, CheckCircle, Clock, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { CardSkeleton } from './Skeleton'

interface DashboardStats {
  totalSlots: number
  availableSlots: number
  occupiedSlots: number
  maintenanceSlots: number
  activeSessions: number
  floorOccupancy?: Array<{ floor: string; occupied: number; total: number }>
}

export default function StatsCards({ stats }: { stats: DashboardStats | null }) {
  if (!stats) return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8"><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>

  const cards = [
    {
      label: 'Total Slots',
      value: stats.totalSlots,
      icon: <BarChart3 className="h-8 w-8 text-white" />,
      gradient: 'from-blue-500 to-indigo-500',
      subtext: 'All Slots',
      subcolor: 'text-green-600'
    },
    {
      label: 'Available',
      value: stats.availableSlots,
      icon: <CheckCircle className="h-8 w-8 text-white" />,
      gradient: 'from-green-500 to-emerald-500',
      subtext: 'Ready',
      subcolor: 'text-green-600'
    },
    {
      label: 'Occupied',
      value: stats.occupiedSlots,
      icon: <Clock className="h-8 w-8 text-white" />,
      gradient: 'from-red-500 to-pink-500',
      subtext: 'In Use',
      subcolor: 'text-red-600'
    },
    {
      label: 'Maintenance',
      value: stats.maintenanceSlots,
      icon: <AlertTriangle className="h-8 w-8 text-white" />,
      gradient: 'from-yellow-500 to-orange-500',
      subtext: 'Under Repair',
      subcolor: 'text-yellow-600'
    }
  ]

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 hover:shadow-3xl transition-all duration-500 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">{card.label}</p>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                <div className={`flex items-center mt-2 ${card.subcolor}`}>
                  {card.subtext === 'In Use' ? (
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                  )}
                  <span className="text-sm font-medium">{card.subtext}</span>
                </div>
              </div>
              <div className={`p-4 bg-gradient-to-r ${card.gradient} rounded-2xl`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Floor Occupancy */}
      {stats.floorOccupancy && stats.floorOccupancy.length > 0 && (
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Floor Occupancy</h3>
          <div className="space-y-3">
            {stats.floorOccupancy.map((floor) => {
              const pct = floor.total > 0 ? Math.round((floor.occupied / floor.total) * 100) : 0
              return (
                <div key={floor.floor} className="flex items-center space-x-4">
                  <span className="text-sm font-semibold text-gray-700 w-20">Floor {floor.floor}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-24 text-right">{floor.occupied}/{floor.total}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
