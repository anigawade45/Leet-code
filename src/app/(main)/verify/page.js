'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import LoadingSpinner from '@/components/common/LoadingSpinner'

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('loading') // 'loading', 'success', 'error'

  useEffect(() => {
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('error')
      return
    }

    const verifyToken = async () => {
      try {
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })

        const data = await res.json()

        if (res.ok && data.success) {
          setStatus('success')
          toast.success('Email verified successfully!')
        } else {
          setStatus('error')
          toast.error(data.message || 'Verification failed')
        }
      } catch (err) {
        setStatus('error')
        toast.error('An unexpected error occurred')
      }
    }

    verifyToken()
  }, [token])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 text-center space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Email Verification</h1>
        
        {status === 'loading' && (
          <div className="flex flex-col items-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-gray-500">Verifying your email address...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <p className="text-gray-600">Your email has been verified successfully! You can now log into your account.</p>
            <Link 
              href="/login"
              className="mt-4 inline-flex justify-center w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#334155] hover:from-[#1E293B] hover:to-[#475569] transition"
            >
              Go to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <p className="text-gray-600">This verification link is invalid or has expired.</p>
            <Link 
              href="/login"
              className="mt-4 inline-flex justify-center w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
            >
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
