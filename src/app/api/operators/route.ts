import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, hashPassword } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const operators = await prisma.operator.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ operators })
  } catch (error) {
    console.error('Error fetching operators:', error)
    return NextResponse.json({ error: 'Failed to fetch operators' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { username, name, password, role } = await request.json()

    if (!username || !name || !password) {
      return NextResponse.json({ error: 'Username, name, and password are required' }, { status: 400 })
    }

    const existingOperator = await prisma.operator.findUnique({
      where: { username }
    })

    if (existingOperator) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)

    const operator = await prisma.operator.create({
      data: {
        username,
        name,
        password: hashedPassword,
        role: role || 'operator'
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json({ operator }, { status: 201 })
  } catch (error) {
    console.error('Error creating operator:', error)
    return NextResponse.json({ error: 'Failed to create operator' }, { status: 500 })
  }
}
