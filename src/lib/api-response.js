import { NextResponse } from 'next/server'

/**
 * Standardize error responses across the API
 * @param {string} message - User friendly error message
 * @param {string} errorCode - Uppercase snake_case error code (e.g. UNAUTHORIZED, NOT_FOUND)
 * @param {number} status - HTTP status code
 * @returns {NextResponse}
 */
export function errorResponse(message, errorCode = 'INTERNAL_SERVER_ERROR', status = 500) {
  return NextResponse.json(
    {
      success: false,
      message,
      errorCode
    },
    { status }
  )
}
