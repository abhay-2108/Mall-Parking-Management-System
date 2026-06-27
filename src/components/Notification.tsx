'use client'

import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

export interface NotificationItem {
  id: number
  message: string
  type: 'success' | 'error'
}

let notificationId = 0

export function useNotification() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const showNotification = (message: string, type: 'success' | 'error') => {
    const id = ++notificationId
    setNotifications(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 3000)
  }

  return { notifications, showNotification }
}

export default function Notification({ notifications }: { notifications: NotificationItem[] }) {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`p-4 rounded-2xl shadow-2xl transform transition-all duration-300 backdrop-blur-lg animate-slide-in ${
            notification.type === 'success'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border border-green-400/30'
              : 'bg-gradient-to-r from-red-500 to-pink-500 text-white border border-red-400/30'
          }`}
        >
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 mr-3 flex-shrink-0" />
            )}
            <span className="font-semibold">{notification.message}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
