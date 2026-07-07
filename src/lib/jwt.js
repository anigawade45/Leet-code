import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_ISSUER = process.env.JWT_ISSUER || 'leetcode-app'
const JWT_AUD = process.env.JWT_AUD || 'leetcode-users'

if (process.env.NODE_ENV === 'production' && (!JWT_SECRET || JWT_SECRET.trim() === '')) {
  throw new Error('JWT_SECRET must be set in production')
}

const secret = JWT_SECRET || 'development-secret-change-me'

export function generateToken(payload) {
  return jwt.sign(payload, secret, {
    expiresIn: '7d',
    issuer: JWT_ISSUER,
    audience: JWT_AUD,
  })
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') {
    return null
  }

  try {
    return jwt.verify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUD,
    })
  } catch (error) {
    return null
  }
}

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 60 * 60 * 24 * 7,
  path: '/',
}
