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
    <div className="animate-in">
      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(221,83%,53%)] to-[hsl(262,83%,58%)] shadow-lg shadow-blue-500/30">
          <Zap className="h-6 w-6 text-white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-[hsl(215,20%,65%)]">Sign in to your Claric account</p>
        </div>
      </div>

      {/* Card */}
      <div className="glass rounded-2xl p-8 shadow-2xl">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Global error */}
          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-[hsl(215,20%,75%)]">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full rounded-lg border bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-[hsl(215,20%,45%)] transition-all outline-none focus:border-[hsl(221,83%,53%)] focus:ring-2 focus:ring-[hsl(221,83%,53%)]/20 ${
                fieldErrors.email ? 'border-red-500/50' : 'border-white/10'
              }`}
              placeholder="you@company.com"
            />
            {fieldErrors.email && (
              <p className="text-xs text-red-400">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[hsl(215,20%,75%)]"
              >
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-[hsl(221,83%,70%)] hover:text-[hsl(221,83%,80%)] transition-colors"
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
                className={`w-full rounded-lg border bg-white/5 px-4 py-2.5 pr-10 text-sm text-white placeholder:text-[hsl(215,20%,45%)] transition-all outline-none focus:border-[hsl(221,83%,53%)] focus:ring-2 focus:ring-[hsl(221,83%,53%)]/20 ${
                  fieldErrors.password ? 'border-red-500/50' : 'border-white/10'
                }`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(215,20%,50%)] hover:text-[hsl(215,20%,75%)] transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-xs text-red-400">{fieldErrors.password}</p>
            )}
          </div>

          {/* Submit */}
          <button
            id="btn-sign-in"
            type="submit"
            disabled={isLoading}
            className="w-full rounded-lg bg-gradient-to-r from-[hsl(221,83%,53%)] to-[hsl(262,83%,58%)] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-[hsl(221,83%,53%)] focus:ring-offset-2 focus:ring-offset-[hsl(222,47%,11%)]"
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
      <p className="mt-6 text-center text-xs text-[hsl(215,20%,45%)]">
        Protected by end-to-end encryption &middot;{' '}
        <Link href="/privacy" className="hover:text-[hsl(215,20%,65%)] transition-colors">
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
