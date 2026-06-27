import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { formatISTTime } from '@/lib/time-utils'
import { slotUpdateSchema, validateRequest } from '@/lib/validation'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const slotType = searchParams.get('slotType')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const whereClause: Record<string, unknown> = {}

    if (slotType) whereClause.slotType = slotType
    if (status) whereClause.status = status
    if (search) {
      whereClause.OR = [
        { slotNumber: { contains: search } },
        { parkingSessions: { some: { vehicle: { numberPlate: { contains: search } } } } }
      ]
    }

    const slots = await prisma.parkingSlot.findMany({
      where: whereClause,
      include: {
        parkingSessions: {
          where: { status: 'Active' },
          include: { vehicle: true },
          orderBy: { entryTime: 'desc' },
          take: 1
        }
      },
      orderBy: { slotNumber: 'asc' }
    })

    const formattedSlots = slots.map(slot => ({
      ...slot,
      parkingSessions: slot.parkingSessions.map(s => ({
        ...s,
        entryTime: formatISTTime(s.entryTime),
        exitTime: s.exitTime ? formatISTTime(s.exitTime) : null,
        createdAt: formatISTTime(s.createdAt),
        updatedAt: formatISTTime(s.updatedAt)
      }))
    }))

    return NextResponse.json({ slots: formattedSlots })
  } catch (error) {
    console.error('Error fetching slots:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await request.json()
    const validation = validateRequest(slotUpdateSchema, body)
    if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 })

    const { slotId, status } = validation.data

    const slot = await prisma.parkingSlot.findUnique({ where: { id: slotId } })
    if (!slot) return NextResponse.json({ error: 'Slot not found' }, { status: 404 })

    await prisma.parkingSlot.update({ where: { id: slotId }, data: { status } })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        operatorId: decoded.operatorId,
        action: 'update',
        details: `Slot ${slot.slotNumber} status changed from ${slot.status} to ${status}`
      }
    })

    return NextResponse.json({ message: 'Slot status updated successfully' })
  } catch (error) {
    console.error('Error updating slot:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
