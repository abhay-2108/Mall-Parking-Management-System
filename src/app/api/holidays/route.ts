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
    const mallId = searchParams.get('mallId')

    const where: Record<string, unknown> = {}
    if (mallId) where.mallId = mallId

    const holidays = await prisma.holiday.findMany({ where, orderBy: { date: 'desc' } })
    return NextResponse.json({ holidays })
  } catch (error) {
    console.error('Error fetching holidays:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const data = await request.json()
    const holiday = await prisma.holiday.create({
      data: {
        name: data.name,
        date: new Date(data.date),
        multiplier: data.multiplier || 1.5,
        mallId: data.mallId || undefined,
        isActive: data.isActive ?? true
      }
    })
    return NextResponse.json({ holiday, message: 'Holiday added' })
  } catch (error) {
    console.error('Error creating holiday:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
