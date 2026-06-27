import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { getCurrentRateInfo } from '@/lib/dynamic-pricing'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const mallId = searchParams.get('mallId')

    const mallFilter: Record<string, unknown> = {}
    if (mallId) mallFilter.mallId = mallId

    const totalSlots = await prisma.parkingSlot.count({ where: mallFilter })
    const availableSlots = await prisma.parkingSlot.count({ where: { ...mallFilter, status: 'Available' } })
    const occupiedSlots = await prisma.parkingSlot.count({ where: { ...mallFilter, status: 'Occupied' } })
    const maintenanceSlots = await prisma.parkingSlot.count({ where: { ...mallFilter, status: 'Maintenance' } })

    const activeSessions = await prisma.parkingSession.count({ where: { ...mallFilter, status: 'Active' } })

    // Floor occupancy
    const allSlots = await prisma.parkingSlot.findMany({ where: mallFilter, select: { slotNumber: true, status: true } })
    const floorOccupancy = [1, 2, 3].map(floor => {
      const floorSlots = allSlots.filter(s => s.slotNumber.match(/[A-Z](\d)/) && parseInt(s.slotNumber.match(/[A-Z](\d)/)![1]) === floor)
      return { floor: String(floor), occupied: floorSlots.filter(s => s.status === 'Occupied').length, total: floorSlots.length }
    })

    let dateFilter: { gte?: Date; lte?: Date } = {}
    if (startDate && endDate) {
      const start = new Date(startDate); start.setHours(0, 0, 0, 0)
      const end = new Date(endDate); end.setHours(23, 59, 59, 999)
      dateFilter = { gte: start, lte: end }
    } else {
      const today = new Date(); today.setHours(0, 0, 0, 0)
      dateFilter = { gte: today }
    }

    const sessions = await prisma.parkingSession.findMany({ where: { ...mallFilter, status: 'Completed', exitTime: dateFilter } })
    const totalRevenue = sessions.reduce((s, ses) => s + (ses.billingAmount || 0), 0)
    const hourlyRevenue = sessions.filter(s => s.billingType === 'Hourly').reduce((s, ses) => s + (ses.billingAmount || 0), 0)
    const dayPassRevenue = sessions.filter(s => s.billingType === 'DayPass').reduce((s, ses) => s + (ses.billingAmount || 0), 0)

    // Dynamic pricing info
    let rateInfo = null
    if (mallId) {
      rateInfo = await getCurrentRateInfo(mallId)
    }

    return NextResponse.json({
      stats: { totalSlots, availableSlots, occupiedSlots, maintenanceSlots, activeSessions, floorOccupancy },
      revenue: { today: totalRevenue, hourly: hourlyRevenue, dayPass: dayPassRevenue },
      rateInfo
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
