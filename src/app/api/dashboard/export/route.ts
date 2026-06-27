import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const dateFilter: Record<string, unknown> = {}
    if (startDate && endDate) {
      dateFilter.gte = new Date(startDate)
      dateFilter.lte = new Date(endDate + 'T23:59:59.999Z')
    }

    const sessions = await prisma.parkingSession.findMany({
      where: {
        status: 'Completed',
        ...(startDate && endDate ? { exitTime: dateFilter } : {})
      },
      include: { vehicle: true, slot: true },
      orderBy: { exitTime: 'desc' }
    })

    const header = 'Date,Vehicle Number,Vehicle Type,Slot,Entry Time,Exit Time,Duration (hrs),Billing Type,Amount'
    const rows = sessions.map(s => {
      const duration = s.exitTime
        ? ((s.exitTime.getTime() - s.entryTime.getTime()) / (1000 * 60 * 60)).toFixed(1)
        : ''
      return [
        s.exitTime?.toISOString().split('T')[0] || '',
        s.vehicleNumberPlate,
        s.vehicle.vehicleType,
        s.slot.slotNumber,
        s.entryTime.toISOString(),
        s.exitTime?.toISOString() || '',
        duration,
        s.billingType,
        s.billingAmount || 0
      ].join(',')
    })

    const csv = '\uFEFF' + header + '\n' + rows.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="revenue-export.csv"'
      }
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
