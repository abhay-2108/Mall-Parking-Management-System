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

    const rules = await prisma.pricingRule.findMany({ where, orderBy: { priority: 'asc' } })
    return NextResponse.json({ rules })
  } catch (error) {
    console.error('Error fetching pricing rules:', error)
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
    const rule = await prisma.pricingRule.create({ data: { ...data, mallId: data.mallId || undefined } })
    return NextResponse.json({ rule, message: 'Pricing rule created' })
  } catch (error) {
    console.error('Error creating rule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
