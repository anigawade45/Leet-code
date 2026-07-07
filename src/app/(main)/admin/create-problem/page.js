'use client'

import { ProblemForm } from '@/components/problem/ProblemForm'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'

export default function AdminCreateProblemPage() {
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

  return (
    <div className="flex-1 bg-background min-h-screen">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/admin"
            className="text-[#72767d] hover:text-white transition-colors"
          >
            ← Back
          </Link>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-[#2a9d8f]/10 text-[#2a9d8f] text-xs font-semibold border border-[#2a9d8f]/20">
              ADMIN
            </span>
            <span className="text-[#72767d] text-sm">
              Problems created as admin are auto-approved
            </span>
          </div>
        </div>
      </div>
      <ProblemForm />
    </div>
  )
}
