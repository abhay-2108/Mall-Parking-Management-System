import { NextResponse } from 'next/server'

export interface ApiError {
  code: string
  message: string
  details?: unknown
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: ApiError
  timestamp: string
}

export function successResponse<T>(data: T, status: number = 200): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString()
  }
  return NextResponse.json(response, { status })
}

export function errorResponse(
  code: string,
  message: string,
  status: number = 400,
  details?: unknown
): NextResponse {
  const response: ApiResponse = {
    success: false,
    error: { code, message, details },
    timestamp: new Date().toISOString()
  }
  return NextResponse.json(response, { status })
}

export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return errorResponse('UNAUTHORIZED', message, 401)
}

export function forbiddenResponse(message: string = 'Forbidden'): NextResponse {
  return errorResponse('FORBIDDEN', message, 403)
}

export function notFoundResponse(message: string = 'Resource not found'): NextResponse {
  return errorResponse('NOT_FOUND', message, 404)
}

export function validationErrorResponse(message: string, details?: unknown): NextResponse {
  return errorResponse('VALIDATION_ERROR', message, 400, details)
}

export function rateLimitResponse(): NextResponse {
  return errorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.', 429)
}

export function internalErrorResponse(message: string = 'Internal server error'): NextResponse {
  return errorResponse('INTERNAL_ERROR', message, 500)
}

export function logError(context: string, error: unknown): void {
  const timestamp = new Date().toISOString()
  const errorMessage = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined

  console.error(`[${timestamp}] ${context}:`, {
    message: errorMessage,
    stack,
    ...(process.env.NODE_ENV === 'development' && { fullError: error })
  })
}
