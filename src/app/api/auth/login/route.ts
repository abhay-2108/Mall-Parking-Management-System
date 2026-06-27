import { NextRequest, NextResponse } from 'next/server'
import { authenticateOperator, generateToken } from '@/lib/auth'
import { loginSchema, validateRequest } from '@/lib/validation'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitResult = checkRateLimit(`login:${ip}`, { windowMs: 900000, maxRequests: 10 })

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      )
    }

    const body = await request.json()
    const validation = validateRequest(loginSchema, body)

    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { username, password } = validation.data

    const operator = await authenticateOperator(username, password)
    if (!operator) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const token = generateToken(operator.id)
    
    const response = NextResponse.json({
      message: 'Login successful',
      operator: {
        id: operator.id,
        username: operator.username,
        name: operator.name
      }
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 // 24 hours
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 