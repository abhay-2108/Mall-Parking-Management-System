'use client'

import { useMall } from '@/context/MallContext'
import { Building2, ChevronDown } from 'lucide-react'
import { useState } from 'react'

export default function MallSwitcher({ collapsed }: { collapsed: boolean }) {
  const { currentMall, malls, setCurrentMall } = useMall()
  const [open, setOpen] = useState(false)

  if (!currentMall || collapsed) {
    if (collapsed && currentMall) {
      return (
        <div className="px-3 py-2 border-b border-purple-100">
          <div className="p-2 bg-purple-100 rounded-xl flex items-center justify-center" title={currentMall.name}>
            <Building2 className="h-5 w-5 text-purple-600" />
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="relative px-3 py-2 border-b border-purple-100">
      <button onClick={() => setOpen(!open)} className="flex items-center w-full px-3 py-2 rounded-xl hover:bg-purple-50 transition-all">
        <Building2 className="h-5 w-5 text-purple-600 mr-3" />
        <div className="flex-1 text-left">
          <p className="text-xs text-gray-500">Mall</p>
          <p className="text-sm font-bold text-gray-900 truncate">{currentMall.name}</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-3 right-3 top-full mt-1 bg-white rounded-xl shadow-2xl border border-purple-100 z-50 overflow-hidden">
          {malls.map(mall => (
            <button
              key={mall.id}
              onClick={() => { setCurrentMall(mall); setOpen(false) }}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-purple-50 transition-all ${
                mall.id === currentMall.id ? 'bg-purple-50 text-purple-700 font-bold' : 'text-gray-700'
              }`}
            >
              {mall.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
