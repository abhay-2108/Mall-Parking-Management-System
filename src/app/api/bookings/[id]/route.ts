import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { status, sessionId } = await request.json()

    const updateData: Record<string, unknown> = {}
    if (status) updateData.status = status
    if (sessionId) updateData.sessionId = sessionId

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: { customer: true, mall: true }
    })

    return NextResponse.json({ booking, message: 'Booking updated' })
  } catch (error) {
    console.error('Booking update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!verifyToken(token)) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { id } = await params
    await prisma.booking.update({ where: { id }, data: { status: 'Cancelled' } })
    return NextResponse.json({ message: 'Booking cancelled' })
  } catch (error) {
    console.error('Booking cancel error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
