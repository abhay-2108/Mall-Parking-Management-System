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
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (startDate && endDate) {
      where.entryTime = { gte: new Date(startDate), lte: new Date(endDate + 'T23:59:59.999Z') }
    }

    const sessions = await prisma.parkingSession.findMany({
      where,
      include: { vehicle: true, slot: true },
      orderBy: { entryTime: 'desc' }
    })

    const header = 'Session ID,Vehicle Number,Vehicle Type,Slot,Entry Time,Exit Time,Duration (hrs),Billing Type,Amount,Status'
    const rows = sessions.map(s => {
      const duration = s.exitTime
        ? ((s.exitTime.getTime() - s.entryTime.getTime()) / (1000 * 60 * 60)).toFixed(1)
        : 'Active'
      return [
        s.id,
        s.vehicleNumberPlate,
        s.vehicle.vehicleType,
        s.slot.slotNumber,
        s.entryTime.toISOString(),
        s.exitTime?.toISOString() || '',
        duration,
        s.billingType,
        s.billingAmount || 0,
        s.status
      ].join(',')
    })

    const csv = '\uFEFF' + header + '\n' + rows.join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="parking-sessions-export.csv"'
      }
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
