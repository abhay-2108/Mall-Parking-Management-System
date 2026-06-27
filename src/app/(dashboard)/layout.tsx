import Sidebar from '@/components/Sidebar'
import { MallProvider } from '@/context/MallContext'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <MallProvider>
      <Sidebar>{children}</Sidebar>
    </MallProvider>
  )
}
