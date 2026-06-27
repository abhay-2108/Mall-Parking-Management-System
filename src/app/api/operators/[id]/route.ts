import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken, hashPassword } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id } = await params
    const { username, name, password, role } = await request.json()

    if (!username || !name) {
      return NextResponse.json({ error: 'Username and name are required' }, { status: 400 })
    }

    const existingOperator = await prisma.operator.findUnique({
      where: { id }
    })

    if (!existingOperator) {
      return NextResponse.json({ error: 'Operator not found' }, { status: 404 })
    }

    if (username !== existingOperator.username) {
      const duplicate = await prisma.operator.findUnique({
        where: { username }
      })
      if (duplicate) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 400 })
      }
    }

    const updateData: { username: string; name: string; role?: string; password?: string } = {
      username,
      name,
      role: role || 'operator'
    }

    if (password) {
      updateData.password = await hashPassword(password)
    }

    const operator = await prisma.operator.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json({ operator })
  } catch (error) {
    console.error('Error updating operator:', error)
    return NextResponse.json({ error: 'Failed to update operator' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id } = await params

    const operator = await prisma.operator.findUnique({
      where: { id }
    })

    if (!operator) {
      return NextResponse.json({ error: 'Operator not found' }, { status: 404 })
    }

    await prisma.operator.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Operator deleted successfully' })
  } catch (error) {
    console.error('Error deleting operator:', error)
    return NextResponse.json({ error: 'Failed to delete operator' }, { status: 500 })
  }
}
