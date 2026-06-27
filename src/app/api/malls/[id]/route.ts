import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const operator = await prisma.operator.findUnique({ where: { id: decoded.operatorId } })
    if (operator?.role !== 'admin') return NextResponse.json({ error: 'Only admins can update malls' }, { status: 403 })

    const { id } = await params
    const { name, location, timezone, isActive } = await request.json()

    const mall = await prisma.mall.update({
      where: { id },
      data: { ...(name && { name }), ...(location !== undefined && { location }), ...(timezone && { timezone }), ...(isActive !== undefined && { isActive }) }
    })

    return NextResponse.json({ mall, message: 'Mall updated successfully' })
  } catch (error) {
    console.error('Error updating mall:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = request.cookies.get('token')?.value
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const decoded = verifyToken(token)
    if (!decoded) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

    const operator = await prisma.operator.findUnique({ where: { id: decoded.operatorId } })
    if (operator?.role !== 'admin') return NextResponse.json({ error: 'Only admins can delete malls' }, { status: 403 })

    const { id } = await params
    await prisma.mall.delete({ where: { id } })

    return NextResponse.json({ message: 'Mall deleted successfully' })
  } catch (error) {
    console.error('Error deleting mall:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
