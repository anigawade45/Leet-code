'use client'

import { createContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  checkAuth: async () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)

        // Try to trigger daily checkin silently
        fetch('/api/points/checkin', { method: 'POST' }).catch(() => {})
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Check auth error:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAuth()
  }, [checkAuth])

  const login = async (data) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message || error.error || 'Login failed')
    }

    const result = await res.json()
    setUser(result.user)

    // Trigger daily checkin upon login
    fetch('/api/points/checkin', { method: 'POST' }).catch(() => {})

    return result
  }

  const register = async (data) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.message || error.error || 'Registration failed')
    }

    const result = await res.json()
    return result
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}
