'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, Zap } from 'lucide-react'

import { Suspense } from 'react'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setFieldErrors({})

    const validation = loginSchema.safeParse({ email, password })
    if (!validation.success) {
      const errors: { email?: string; password?: string } = {}
      for (const issue of validation.error.issues) {
        const key = issue.path[0] as 'email' | 'password'
        errors[key] = issue.message
      }
      setFieldErrors(errors)
      return
    }

    setIsLoading(true)
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password. Please try again.')
        return
      }

      router.push(callbackUrl)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="animate-in" style={{ '--primary-rgb': '249, 115, 22' } as React.CSSProperties}>
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
            boxShadow: '0 0 30px rgba(249,115,22,0.4), 0 8px 24px rgba(0,0,0,0.3)',
          }}
        >
          <Zap className="h-7 w-7 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#fff' }}>
            Welcome back
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Sign in to your CRM account
          </p>
        </div>
      </div>

      {/* Card */}
      <div
        className="rounded-2xl p-8 shadow-2xl"
        style={{
          background: 'rgba(15, 10, 5, 0.6)',
          border: '1px solid rgba(249, 115, 22, 0.15)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Global error */}
          {error && (
            <div
              className="rounded-lg px-4 py-3 text-sm"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171',
              }}
            >
              {error}
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: fieldErrors.email
                  ? '1px solid rgba(239,68,68,0.5)'
                  : '1px solid rgba(249,115,22,0.2)',
                boxShadow: 'none',
              }}
              onFocus={(e) => {
                e.target.style.border = '1px solid rgba(249,115,22,0.6)'
                e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)'
              }}
              onBlur={(e) => {
                e.target.style.border = fieldErrors.email
                  ? '1px solid rgba(239,68,68,0.5)'
                  : '1px solid rgba(249,115,22,0.2)'
                e.target.style.boxShadow = 'none'
              }}
              placeholder="you@company.com"
            />
            {fieldErrors.email && (
              <p className="text-xs" style={{ color: '#f87171' }}>
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium"
                style={{ color: 'rgba(255,255,255,0.7)' }}
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-medium transition-colors hover:opacity-80"
                style={{ color: '#f97316' }}
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg px-4 py-3 pr-11 text-sm text-white placeholder-white/30 outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: fieldErrors.password
                    ? '1px solid rgba(239,68,68,0.5)'
                    : '1px solid rgba(249,115,22,0.2)',
                  boxShadow: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid rgba(249,115,22,0.6)'
                  e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)'
                }}
                onBlur={(e) => {
                  e.target.style.border = fieldErrors.password
                    ? '1px solid rgba(239,68,68,0.5)'
                    : '1px solid rgba(249,115,22,0.2)'
                  e.target.style.boxShadow = 'none'
                }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'rgba(255,255,255,0.4)' }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLElement).style.color = 'rgba(249,115,22,0.8)')
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.4)')
                }
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-xs" style={{ color: '#f87171' }}>
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            id="btn-sign-in"
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: isLoading
                ? 'linear-gradient(135deg, #c2410c, #9a3412)'
                : 'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%)',
              boxShadow: '0 4px 20px rgba(249,115,22,0.35)',
            }}
            onMouseEnter={(e) => {
              if (!isLoading)
                (e.currentTarget as HTMLElement).style.boxShadow =
                  '0 6px 28px rgba(249,115,22,0.55)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.boxShadow =
                '0 4px 20px rgba(249,115,22,0.35)'
            }}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </span>
            ) : (
              'Sign in'
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="mt-6 text-center text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
        Protected by end-to-end encryption &middot;{' '}
        <Link
          href="/privacy"
          className="transition-colors hover:opacity-80"
          style={{ color: 'rgba(249,115,22,0.7)' }}
        >
          Privacy Policy
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="py-10 text-center text-white">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
