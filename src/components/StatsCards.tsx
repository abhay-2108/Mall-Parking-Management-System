'use client'

import { BarChart3, CheckCircle, Clock, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface DashboardStats {
  totalSlots: number
  availableSlots: number
  occupiedSlots: number
  maintenanceSlots: number
  activeSessions: number
}

export default function StatsCards({ stats }: { stats: DashboardStats | null }) {
  if (!stats) return null

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
  )
}
