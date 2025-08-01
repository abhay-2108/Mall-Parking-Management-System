import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slotType = searchParams.get('slotType')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const where: any = {}

    if (slotType) {
      where.slotType = slotType
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { slotNumber: { contains: search, mode: 'insensitive' } },
        {
          parkingSessions: {
            some: {
              vehicle: {
                numberPlate: { contains: search, mode: 'insensitive' }
              }
            }
          }
        }
      ]
    }

    const slots = await prisma.parkingSlot.findMany({
      where,
      include: {
        parkingSessions: {
          where: { status: 'Active' },
          include: {
            vehicle: true
          }
        }
      },
      orderBy: { slotNumber: 'asc' }
    })

    return NextResponse.json({ slots })
  } catch (error) {
    console.error('Slots error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { slotId, status } = await request.json()

    if (!slotId || !status) {
      return NextResponse.json(
        { error: 'Slot ID and status are required' },
        { status: 400 }
      )
    }

    const slot = await prisma.parkingSlot.update({
      where: { id: slotId },
      data: { status }
    })

    return NextResponse.json({ slot })
  } catch (error) {
    console.error('Slot update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 