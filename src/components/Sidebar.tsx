'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Car, LayoutDashboard, Map, History, BarChart3, Settings,
  LogOut, Menu, X, ChevronRight, FileText, Moon, Sun, ShoppingCart, Zap
} from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import MallSwitcher from './MallSwitcher'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/parking-map', label: 'Parking Map', icon: Map },
  { href: '/history', label: 'History', icon: History },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/bookings', label: 'Bookings', icon: ShoppingCart },
  { href: '/pricing', label: 'Pricing', icon: Zap },
  { href: '/audit-log', label: 'Audit Log', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/')
  }

  const isActive = (href: string) => pathname === href

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`fixed lg:sticky top-0 left-0 h-screen z-50 flex flex-col bg-white/90 backdrop-blur-xl border-r border-purple-100 shadow-xl transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-purple-100">
          {!collapsed && (
            <div className="flex items-center">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <Car className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 font-bold text-gray-900 text-lg">Parking</span>
            </div>
          )}
          {collapsed && (
            <div className="h-10 w-10 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg mx-auto">
              <Car className="h-5 w-5 text-white" />
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:block p-2 rounded-lg hover:bg-purple-100 transition-colors">
            <ChevronRight className={`h-4 w-4 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
          </button>
          <button onClick={() => setMobileOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-purple-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mall Switcher */}
        <MallSwitcher collapsed={collapsed} />

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                  isActive(item.href) ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'text-gray-600 hover:bg-purple-100 hover:text-gray-900'
                }`}>
                <Icon className={`h-5 w-5 ${collapsed ? 'mx-auto' : ''}`} />
                {!collapsed && <span className="ml-3 font-medium">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-purple-100 space-y-1">
          {/* Public Booking Link */}
          <a href="/book" target="_blank" rel="noopener noreferrer"
            className="flex items-center w-full px-4 py-3 rounded-xl text-gray-600 hover:bg-purple-100 hover:text-gray-900 transition-all">
            <ShoppingCart className={`h-5 w-5 ${collapsed ? 'mx-auto' : ''}`} />
            {!collapsed && <span className="ml-3 font-medium">Public Booking</span>}
          </a>
          <button onClick={toggleTheme}
            className="flex items-center w-full px-4 py-3 rounded-xl text-gray-600 hover:bg-purple-100 hover:text-gray-900 transition-all">
            {theme === 'light' ? <Moon className={`h-5 w-5 ${collapsed ? 'mx-auto' : ''}`} /> : <Sun className={`h-5 w-5 ${collapsed ? 'mx-auto' : ''}`} />}
            {!collapsed && <span className="ml-3 font-medium">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>
          <button onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all">
            <LogOut className={`h-5 w-5 ${collapsed ? 'mx-auto' : ''}`} />
            {!collapsed && <span className="ml-3 font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-purple-100 lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-purple-100"><Menu className="h-5 w-5" /></button>
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-lg flex items-center justify-center"><Car className="h-4 w-4 text-white" /></div>
              <span className="ml-2 font-bold text-gray-900">Parking System</span>
            </div>
            <button onClick={toggleTheme} className="p-1.5 rounded-lg hover:bg-gray-100">{theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}</button>
          </div>
        </header>
        <main className="p-4 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
