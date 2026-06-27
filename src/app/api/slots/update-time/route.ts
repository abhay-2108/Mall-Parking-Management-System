import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { calculateHourlyBilling } from '@/lib/pricing'
import { timeUpdateSchema, validateRequest } from '@/lib/validation'

export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await request.json()
    const validation = validateRequest(timeUpdateSchema, body)
    if (!validation.success) return NextResponse.json({ error: validation.error }, { status: 400 })

    const { slotId, newEntryTime, newExitTime } = validation.data

    const activeSession = await prisma.parkingSession.findFirst({
      where: { slotId, status: 'Active' },
      include: { slot: true, vehicle: true }
    })

    if (!activeSession) {
      return NextResponse.json({ error: 'No active session found for this slot' }, { status: 404 })
    }

    const entryTime = new Date(newEntryTime)
    entryTime.setHours(entryTime.getHours() + 5)
    entryTime.setMinutes(entryTime.getMinutes() + 30)

    let exitTime: Date | null = null
    if (newExitTime) {
      exitTime = new Date(newExitTime)
      exitTime.setHours(exitTime.getHours() + 5)
      exitTime.setMinutes(exitTime.getMinutes() + 30)
    }

    let billingAmount = activeSession.billingAmount
    if (exitTime && activeSession.billingType === 'Hourly') {
      billingAmount = calculateHourlyBilling(entryTime, exitTime!)
    }

    const updatedSession = await prisma.parkingSession.update({
      where: { id: activeSession.id },
      data: {
        entryTime,
        exitTime,
        status: exitTime ? 'Completed' : 'Active',
        billingAmount
      }
    })

    if (exitTime) {
      await prisma.parkingSlot.update({
        where: { id: slotId },
        data: { status: 'Available' }
      })
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        operatorId: decoded.operatorId,
        action: 'edit',
        details: `Session time updated for ${activeSession.vehicle.numberPlate} at ${activeSession.slot.slotNumber}. Entry: ${newEntryTime}, Exit: ${newExitTime || 'N/A'}`
      }
    })

    return NextResponse.json({
      message: 'Session time updated successfully',
      session: updatedSession
    })
  } catch (error) {
    console.error('Error updating session time:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
