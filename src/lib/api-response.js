import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

/**
 * Generate a short correlation ID for error tracing.
 * This ID is safe to return to clients — it contains no internal info.
 * Use it to cross-reference client-reported errors with server logs.
 */
function generateCorrelationId() {
  return randomBytes(6).toString('hex') // 12-char hex string, e.g. "a3f2c1d0e4b9"
}

/**
 * Standardize error responses across the API.
 * - Never includes stack traces, file paths, or database details.
 * - Always includes a correlationId for client→log cross-referencing.
 *
 * @param {string} message   - User-friendly error message (never raw error.message from internals)
 * @param {string} errorCode - Uppercase snake_case code (e.g. UNAUTHORIZED, NOT_FOUND)
 * @param {number} status    - HTTP status code
 * @returns {NextResponse}
 */
export function errorResponse(message, errorCode = 'INTERNAL_SERVER_ERROR', status = 500) {
  const correlationId = generateCorrelationId()

  // For 500-class errors, log the correlationId server-side so ops can find
  // the corresponding console.error in the logs.
  if (status >= 500) {
    console.error(`[errorResponse] correlationId=${correlationId} status=${status} code=${errorCode}`)
  }

  return NextResponse.json(
    {
      success: false,
      message,
      errorCode,
      correlationId,
    },
    { status }
  )
}
