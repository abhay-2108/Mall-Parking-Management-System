import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const rates = await prisma.parkingRate.findMany({ orderBy: [{ type: 'asc' }, { minHours: 'asc' }] })
    return NextResponse.json({ rates })
  } catch (error) {
    console.error('Error fetching rates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const body = await request.json()
    const { rates } = body

    if (!Array.isArray(rates)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }

    await prisma.$transaction(
      rates.map((rate: { id?: string; name: string; minHours?: number; maxHours?: number; amount: number; type: string; isActive?: boolean }) =>
        rate.id
          ? prisma.parkingRate.update({ where: { id: rate.id }, data: rate })
          : prisma.parkingRate.create({ data: rate as Parameters<typeof prisma.parkingRate.create>[0]['data'] })
      )
    )

    const updatedRates = await prisma.parkingRate.findMany({ orderBy: [{ type: 'asc' }, { minHours: 'asc' }] })
    return NextResponse.json({ rates: updatedRates, message: 'Rates updated successfully' })
  } catch (error) {
    console.error('Error updating rates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
