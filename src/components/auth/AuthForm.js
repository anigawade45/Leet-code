'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { toast } from 'sonner'
import { Eye, EyeOff } from 'lucide-react'
import { FaGoogle, FaGithub, FaApple } from 'react-icons/fa'

const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Username or email is required').max(50),
  password: z.string().min(1, 'Password is required').max(128),
})

const registerSchema = z
  .object({
    username: z.string().trim().min(3, 'Username must be at least 3 characters').max(20).regex(/^\S+$/, 'Username cannot contain spaces'),
    email: z.string().trim().toLowerCase().email('Invalid email'),
    password: z
      .string()
      .min(8, 'Must be at least 8 characters')
      .max(128)
      .regex(/[A-Z]/, 'Must contain uppercase')
      .regex(/[a-z]/, 'Must contain lowercase')
      .regex(/[0-9]/, 'Must contain number')
      .regex(/[!@#$%^&*]/, 'Must contain special character'),
    confirmPassword: z.string().min(8, 'Must be at least 8 characters').max(128),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export function AuthForm({ type = 'login' }) {
  const { login, register } = useAuth()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register: registerField,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(type === 'login' ? loginSchema : registerSchema),
    defaultValues:
      type === 'login'
        ? {
          identifier: '',
          password: '',
        }
        : {
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
        },
  })

  const onSubmit = async (data) => {
    if (isSubmitting) return;

    try {
      if (type === 'login') {
        await login({ identifier: data.identifier, password: data.password })
        toast.success('Successfully logged in!')
        router.push('/')
      } else {
        const response = await register(data)
        toast.success(response.message || 'Please check your email to verify your account.')
        router.push('/login')
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
        err?.message ||
        'Something went wrong'
      )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md sm:max-w-lg space-y-8 bg-white rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl p-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <Image
              src="/logo.png"
              alt="LeetCode Logo"
              width={60}
              height={60}
              className="w-15 h-15"
            />
          </Link>
          <h2 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Typo Round, sans-serif' }}>
            LeetCode
          </h2>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {type === 'register' && (
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                disabled={isSubmitting}
                placeholder="Username"
                required
                autoFocus
                spellCheck={false}
                aria-invalid={!!errors.username}
                className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                {...registerField('username')}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>
          )}

          {type === 'register' && (
            <div>
              <label htmlFor="email" className="sr-only">
                E-mail address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                disabled={isSubmitting}
                placeholder="E-mail address"
                required
                inputMode="email"
                spellCheck={false}
                aria-invalid={!!errors.email}
                className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                {...registerField('email')}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
          )}

          {type === 'login' && (
            <div>
              <label htmlFor="identifier" className="sr-only">
                Username or E-mail
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                disabled={isSubmitting}
                placeholder="Username or E-mail"
                required
                autoFocus
                spellCheck={false}
                aria-invalid={!!errors.identifier}
                className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                {...registerField('identifier')}
              />
              {errors.identifier && (
                <p className="mt-1 text-sm text-red-600">{errors.identifier.message}</p>
              )}
            </div>
          )}

          <div className="relative">
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete={type === 'login' ? 'current-password' : 'new-password'}
              disabled={isSubmitting}
              placeholder="Password"
              required
              aria-invalid={!!errors.password}
              className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
              {...registerField('password')}
            />
            <button
              type="button"
              disabled={isSubmitting}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {type === 'login' && (
            <div className="text-right mt-1">
              <Link
                href="/forgot-password"
                className="text-sm text-teal-600 hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
          )}

          {type === 'register' && (
            <div className="relative">
              <label htmlFor="confirmPassword" className="sr-only">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                disabled={isSubmitting}
                placeholder="Confirm password"
                required
                aria-invalid={!!errors.confirmPassword}
                className="w-full px-4 py-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
                {...registerField('confirmPassword')}
              />
              <button
                type="button"
                disabled={isSubmitting}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#334155] hover:from-[#1E293B] hover:to-[#475569] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">{type === 'login' ? 'Signing In...' : 'Signing Up...'}</span>
              </>
            ) : (
              type === 'login' ? 'Sign In' : 'Sign Up'
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            By continuing, you agree to <Link href="/terms" className="text-blue-600 hover:text-blue-800">Terms</Link> &amp; <Link href="/privacy" className="text-blue-600 hover:text-blue-800">Privacy Policy</Link>.
          </p>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            {type === 'login' ? "Don't have an account?" : 'Have an account?'}
            <Link
              href={type === 'login' ? '/register' : '/login'}
              className="ml-1 font-medium text-teal-600 hover:text-teal-500"
            >
              {type === 'login' ? 'Sign Up' : 'Sign In'}
            </Link>
          </p>
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-400">or you can sign in with</p>
          <div className="flex justify-center gap-4 mt-4">
            <button type="button" className="w-12 h-12 rounded-full border flex items-center justify-center hover:bg-gray-100 transition text-gray-600">
              <FaGoogle size={20} />
            </button>
            <button type="button" className="w-12 h-12 rounded-full border flex items-center justify-center hover:bg-gray-100 transition text-gray-600">
              <FaGithub size={20} />
            </button>
            <button type="button" className="w-12 h-12 rounded-full border flex items-center justify-center hover:bg-gray-100 transition text-gray-600">
              <FaApple size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
