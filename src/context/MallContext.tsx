'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface Mall {
  id: string
  name: string
  location: string | null
  timezone: string
}

const MallContext = createContext<{
  currentMall: Mall | null
  malls: Mall[]
  setCurrentMall: (mall: Mall) => void
  loading: boolean
}>({ currentMall: null, malls: [], setCurrentMall: () => {}, loading: true })

export function MallProvider({ children }: { children: ReactNode }) {
  const [currentMall, setCurrentMall] = useState<Mall | null>(null)
  const [malls, setMalls] = useState<Mall[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMalls()
  }, [])

  const loadMalls = async () => {
    try {
      const res = await fetch('/api/malls')
      if (res.ok) {
        const data = await res.json()
        setMalls(data.malls)
        const stored = localStorage.getItem('currentMallId')
        const found = stored ? data.malls.find((m: Mall) => m.id === stored) : data.malls[0]
        setCurrentMall(found || data.malls[0])
      }
    } catch (e) {
      console.error('Error loading malls:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSetMall = (mall: Mall) => {
    setCurrentMall(mall)
    localStorage.setItem('currentMallId', mall.id)
  }

  return (
    <MallContext.Provider value={{ currentMall, malls, setCurrentMall: handleSetMall, loading }}>
      {children}
    </MallContext.Provider>
  )
}

export const useMall = () => useContext(MallContext)
