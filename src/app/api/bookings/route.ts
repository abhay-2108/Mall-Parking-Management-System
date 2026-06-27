import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import type { SlotType } from '@prisma/client'

function generateQR(id: string): string {
  return `PARKING-BOOKING-${id}-${Date.now().toString(36).toUpperCase()}`
}

export async function POST(request: NextRequest) {
  try {
    const { customerId, mallId, slotType, entryTime, exitTime, amount } = await request.json()

    if (!customerId || !mallId || !slotType || !entryTime || !exitTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const entry = new Date(entryTime)
    const exit = new Date(exitTime)

    // Check for overlapping bookings
    const overlapping = await prisma.booking.findFirst({
      where: {
        mallId,
        status: { in: ['Pending', 'Confirmed', 'CheckedIn'] },
        entryTime: { lt: exit },
        exitTime: { gt: entry }
      }
    })

    // Check slot availability
    const totalSlots = await prisma.parkingSlot.count({
      where: { mallId, slotType: slotType as SlotType }
    })
    const occupiedCount = await prisma.parkingSlot.count({
      where: { mallId, slotType: slotType as SlotType, status: 'Occupied' }
    })
    const bookedCount = await prisma.booking.count({
      where: {
        mallId,
        slotType: slotType as SlotType,
        status: { in: ['Confirmed', 'CheckedIn'] },
        entryTime: { lt: exit },
        exitTime: { gt: entry }
      }
    })
    const available = totalSlots - occupiedCount - bookedCount

    if (available <= 0) {
      return NextResponse.json({ error: 'No slots available for the selected time' }, { status: 400 })
    }

    if (overlapping) {
      return NextResponse.json({ error: 'Booking time conflict' }, { status: 409 })
    }

    const booking = await prisma.booking.create({
      data: {
        customerId,
        mallId,
        slotType: slotType as SlotType,
        entryTime: entry,
        exitTime: exit,
        amount: amount || 150,
        status: 'Confirmed',
        qrCode: generateQR(crypto.randomUUID())
      }
    })

    return NextResponse.json({ booking, message: 'Booking confirmed!' })
  } catch (error) {
    console.error('Booking error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const qrCode = searchParams.get('qrCode')
    const bookingId = searchParams.get('id')
    const mallId = searchParams.get('mallId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (qrCode) {
      const booking = await prisma.booking.findFirst({
        where: { qrCode },
        include: { customer: true, mall: true }
      })
      if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      return NextResponse.json({ booking })
    }

    if (bookingId) {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { customer: true, mall: true }
      })
      if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
      return NextResponse.json({ booking })
    }

    // List all bookings (admin)
    const where: Record<string, unknown> = {}
    if (mallId) where.mallId = mallId

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: { customer: true, mall: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ])

    return NextResponse.json({ bookings, total, page, limit })
  } catch (error) {
    console.error('Booking lookup error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
