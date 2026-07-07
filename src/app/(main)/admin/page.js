'use client'

import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AdminPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && user.role !== 'ADMIN') {
      router.push('/')
    }
  }, [user, loading, router])

  if (loading || !user || user.role !== 'ADMIN') {
    return (
      <div className="flex-1 bg-background min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#2a2e35] border-t-[#2a9d8f] rounded-full animate-spin"></div>
      </div>
    )
  }

  return <AdminDashboard />
}
