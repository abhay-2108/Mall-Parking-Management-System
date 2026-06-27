import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { id } = await params
    await prisma.holiday.delete({ where: { id } })
    return NextResponse.json({ message: 'Holiday deleted' })
  } catch (error) {
    console.error('Error deleting holiday:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
