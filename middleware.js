import { NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt'

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : ['http://localhost:3000']

function getAllowedOrigin(origin) {
  if (!origin) return null
  return allowedOrigins.includes(origin) ? origin : null
}

function applySecurityHeaders(response, origin) {
  const allowedOrigin = getAllowedOrigin(origin)
  if (allowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', allowedOrigin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
    response.headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With')
    response.headers.set('Vary', 'Origin')
  }

  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  response.headers.set('X-XSS-Protection', '0')

  const contentSecurityPolicy = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://res.cloudinary.com https:",
    "connect-src 'self' http://localhost:3001 ws://localhost:3001 wss://leet-code-9v9m.onrender.com https://leet-code-9v9m.onrender.com https://api.resend.com wss://*.onrender.com ws: wss: http: https:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ].join('; ')
  response.headers.set('Content-Security-Policy', contentSecurityPolicy)

  return response
}

export async function middleware(request) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  const publicRoutes = ['/', '/login', '/register']
  const authRoutes = ['/login', '/register']
  const protectedRoutes = [
    '/submissions',
    '/profile',
    '/settings',
    '/admin',
  ]
  const isAuthRoute = authRoutes.includes(pathname)
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  if (isAuthRoute && token) {
    const verified = verifyToken(token)
    if (verified) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isProtectedRoute && token) {
    const verified = verifyToken(token)
    if (!verified) {
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('token')
      return applySecurityHeaders(response, request.headers.get('origin'))
    }

    if (pathname.startsWith('/admin') && verified.role !== 'ADMIN') {
      return applySecurityHeaders(NextResponse.redirect(new URL('/', request.url)), request.headers.get('origin'))
    }
  }

  const response = NextResponse.next()
  return applySecurityHeaders(response, request.headers.get('origin'))
}

export const config = {
  matcher: ['/:path*'],
}
