import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { calculateHourlyBilling, isOverstay } from '@/lib/pricing'
import { exitSchema, validateRequest } from '@/lib/validation'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await request.json()
    const validation = validateRequest(exitSchema, body)
    if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 })

    const { numberPlate } = validation.data

    const session = await prisma.parkingSession.findFirst({
      where: { vehicleNumberPlate: numberPlate, status: 'Active' },
      include: { vehicle: true, slot: true }
    })

    if (!session) {
      return NextResponse.json({ error: 'No active parking session found for this vehicle' }, { status: 404 })
    }

    const exitTime = new Date()
    let billingAmount = session.billingAmount

    if (session.billingType === 'Hourly') {
      billingAmount = calculateHourlyBilling(session.entryTime, exitTime)
    }

    const updatedSession = await prisma.parkingSession.update({
      where: { id: session.id },
      data: { exitTime, status: 'Completed', billingAmount },
      include: { vehicle: true, slot: true }
    })

    await prisma.parkingSlot.update({
      where: { id: session.slotId },
      data: { status: 'Available' }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        operatorId: decoded.operatorId,
        action: 'exit',
        details: `Vehicle ${numberPlate} (${session.vehicle.vehicleType}) exited from ${session.slot.slotNumber}. Amount: ₹${billingAmount}`
      }
    })

    const overstay = isOverstay(session.entryTime, exitTime)

    return NextResponse.json({
      message: 'Vehicle exit processed successfully',
      session: updatedSession,
      overstay,
      receipt: {
        vehicleNumber: session.vehicleNumberPlate,
        vehicleType: session.vehicle.vehicleType,
        slotNumber: session.slot.slotNumber,
        entryTime: session.entryTime,
        exitTime: exitTime,
        duration: Math.ceil((exitTime.getTime() - session.entryTime.getTime()) / (1000 * 60 * 60)),
        billingType: session.billingType,
        amount: billingAmount,
        overstay
      }
    })
  } catch (error) {
    console.error('Exit error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
