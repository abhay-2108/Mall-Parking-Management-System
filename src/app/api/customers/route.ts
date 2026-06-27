import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { phone, name } = await request.json()
    if (!phone) return NextResponse.json({ error: 'Phone is required' }, { status: 400 })

    const customer = await prisma.customer.upsert({
      where: { phone },
      create: { phone, name: name || null },
      update: { ...(name && { name }) }
    })

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Customer error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
