import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Parking Booking - Mall Parking System',
  description: 'Book your parking slot in advance'
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900">
      {children}
    </div>
  )
}
