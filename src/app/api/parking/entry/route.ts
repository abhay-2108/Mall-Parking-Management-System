import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { entrySchema, validateRequest } from '@/lib/validation'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

async function createAuditLog(operatorId: string | undefined, action: string, details: string) {
  if (!operatorId) return
  await prisma.auditLog.create({ data: { operatorId, action, details } })
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = checkRateLimit(`entry:${ip}`, { windowMs: 60000, maxRequests: 30 })
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }

    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await request.json()
    const validation = validateRequest(entrySchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { numberPlate, vehicleType, billingType, slotId, manualSlotSelection } = validation.data

    // Check if vehicle already has an active session
    const existingSession = await prisma.parkingSession.findFirst({
      where: { vehicleNumberPlate: numberPlate, status: 'Active' }
    })
    if (existingSession) {
      return NextResponse.json({ error: 'Vehicle already has an active parking session' }, { status: 400 })
    }

    // Ensure vehicle exists
    await prisma.vehicle.upsert({
      where: { numberPlate },
      create: { numberPlate, vehicleType },
      update: { vehicleType }
    })

    let selectedSlotId = slotId

    if (manualSlotSelection && slotId) {
      const selectedSlot = await prisma.parkingSlot.findUnique({ where: { id: slotId } })
      if (!selectedSlot) return NextResponse.json({ error: 'Selected slot not found' }, { status: 404 })
      if (selectedSlot.status !== 'Available') return NextResponse.json({ error: 'Selected slot is not available' }, { status: 400 })

      const isCompatible = checkVehicleSlotCompatibility(vehicleType, selectedSlot.slotType)
      if (!isCompatible) {
        return NextResponse.json({ error: `${vehicleType} cannot be parked in ${selectedSlot.slotType} slot` }, { status: 400 })
      }
    } else {
      selectedSlotId = await findBestAvailableSlot(vehicleType) ?? undefined
      if (!selectedSlotId) return NextResponse.json({ error: 'No suitable parking slot available' }, { status: 400 })
    }

    const finalSlotId = selectedSlotId as string

    const session = await prisma.parkingSession.create({
      data: {
        vehicleNumberPlate: numberPlate,
        slotId: finalSlotId,
        billingType,
        billingAmount: billingType === 'DayPass' ? 150 : undefined,
        operatorId: decoded.operatorId
      }
    })

    await prisma.parkingSlot.update({
      where: { id: finalSlotId },
      data: { status: 'Occupied' }
    })

    await createAuditLog(decoded.operatorId, 'entry', `Vehicle ${numberPlate} (${vehicleType}) entered at slot ${(await prisma.parkingSlot.findUnique({ where: { id: finalSlotId } }))?.slotNumber}`)

    return NextResponse.json({
      message: 'Vehicle entry recorded successfully',
      session: {
        id: session.id,
        entryTime: session.entryTime,
        slotId: finalSlotId,
        billingType: session.billingType,
        billingAmount: session.billingAmount
      }
    })
  } catch (error) {
    console.error('Entry error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function checkVehicleSlotCompatibility(vehicleType: string, slotType: string): boolean {
  switch (vehicleType) {
    case 'Car': return slotType === 'Regular' || slotType === 'Compact'
    case 'Bike': return slotType === 'Compact'
    case 'EV': return slotType === 'EV'
    case 'Handicap': return slotType === 'Handicap'
    default: return false
  }
}

async function findBestAvailableSlot(vehicleType: string): Promise<string | null> {
  let slotTypes: string[] = []
  switch (vehicleType) {
    case 'Car': slotTypes = ['Regular', 'Compact']; break
    case 'Bike': slotTypes = ['Compact']; break
    case 'EV': slotTypes = ['EV']; break
    case 'Handicap': slotTypes = ['Handicap']; break
    default: return null
  }

  for (const slotType of slotTypes) {
    const availableSlot = await prisma.parkingSlot.findFirst({
      where: {
        slotType: slotType as 'Regular' | 'Compact' | 'EV' | 'Handicap',
        status: 'Available'
      },
      orderBy: { createdAt: 'asc' }
    })
    if (availableSlot) return availableSlot.id
  }

  return null
}
