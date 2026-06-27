import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!verifyToken(token)) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const malls = await prisma.mall.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })
    return NextResponse.json({ malls })
  } catch (error) {
    console.error('Error fetching malls:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const { name, location, timezone } = await request.json()
    if (!name) return NextResponse.json({ error: 'Mall name is required' }, { status: 400 })

    // Check if superadmin
    const operator = await prisma.operator.findUnique({ where: { id: decoded.operatorId } })
    if (operator?.role !== 'admin') return NextResponse.json({ error: 'Only admins can create malls' }, { status: 403 })

    const mall = await prisma.mall.create({
      data: { name, location, timezone: timezone || 'Asia/Kolkata' }
    })

    // Auto-create default pricing rates for the new mall
    await prisma.parkingRate.createMany({
      data: [
        { name: '0-1 hour', mallId: mall.id, minHours: 0, maxHours: 1, amount: 50, type: 'hourly' },
        { name: '1-3 hours', mallId: mall.id, minHours: 1, maxHours: 3, amount: 100, type: 'hourly' },
        { name: '3-6 hours', mallId: mall.id, minHours: 3, maxHours: 6, amount: 150, type: 'hourly' },
        { name: '6+ hours cap', mallId: mall.id, minHours: 6, amount: 200, type: 'hourly' },
        { name: 'Day Pass', mallId: mall.id, amount: 150, type: 'dayPass' },
      ]
    })

    return NextResponse.json({ mall, message: 'Mall created successfully' })
  } catch (error) {
    console.error('Error creating mall:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
