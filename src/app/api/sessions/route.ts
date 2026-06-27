import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { formatISTTime } from '@/lib/time-utils'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || undefined
    const vehicleType = searchParams.get('vehicleType') || undefined
    const billingType = searchParams.get('billingType') || undefined
    const search = searchParams.get('search') || undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined

    const skip = (page - 1) * limit

    const whereClause: Record<string, unknown> = {}

    if (status) {
      whereClause.status = status
    }

    if (billingType) {
      whereClause.billingType = billingType
    }

    if (startDate || endDate) {
      whereClause.entryTime = {}
      const entryTimeClause = whereClause.entryTime as Record<string, Date>
      if (startDate) {
        entryTimeClause.gte = new Date(startDate)
      }
      if (endDate) {
        entryTimeClause.lte = new Date(endDate)
      }
    }

    if (vehicleType || search) {
      whereClause.vehicle = {}
      const vehicleClause = whereClause.vehicle as Record<string, unknown>
      if (vehicleType) {
        vehicleClause.vehicleType = vehicleType
      }
      if (search) {
        vehicleClause.numberPlate = { contains: search }
      }
    }

    const [sessions, total] = await Promise.all([
      prisma.parkingSession.findMany({
        where: whereClause,
        include: {
          vehicle: true,
          slot: true
        },
        orderBy: { entryTime: 'desc' },
        skip,
        take: limit
      }),
      prisma.parkingSession.count({ where: whereClause })
    ])

    const sessionsWithIST = sessions.map(session => ({
      id: session.id,
      vehicleNumberPlate: session.vehicleNumberPlate,
      vehicleType: session.vehicle.vehicleType,
      slotNumber: session.slot.slotNumber,
      slotType: session.slot.slotType,
      entryTime: formatISTTime(new Date(session.entryTime)),
      exitTime: session.exitTime ? formatISTTime(new Date(session.exitTime)) : null,
      status: session.status,
      billingType: session.billingType,
      billingAmount: session.billingAmount,
      duration: session.exitTime
        ? Math.ceil((new Date(session.exitTime).getTime() - new Date(session.entryTime).getTime()) / (1000 * 60 * 60))
        : Math.ceil((Date.now() - new Date(session.entryTime).getTime()) / (1000 * 60 * 60))
    }))

    return NextResponse.json({
      sessions: sessionsWithIST,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}
