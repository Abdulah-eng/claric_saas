'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Building2, User, Mail, Link as LinkIcon, KeyRound, Loader2, Check } from 'lucide-react'

export function CreateTenantModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<{ password?: string, tenantName: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const payload = Object.fromEntries(formData.entries())
    
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create company')
      }
      
      setSuccessData({
        password: data.data.generatedPassword,
        tenantName: data.data.tenant.name
      })
      
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (successData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-[hsl(222,47%,11%)]">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Check className="h-6 w-6" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-[hsl(222,47%,11%)] dark:text-white">
              Company Created!
            </h2>
            <p className="mb-6 text-sm text-[hsl(215,16%,47%)]">
              {successData.tenantName} has been successfully registered. The administrator account is ready.
            </p>
            
            {successData.password && (
              <div className="mb-6 w-full rounded-lg bg-[hsl(210,40%,96%)] p-4 text-left dark:bg-[hsl(217,33%,17%)]">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[hsl(215,16%,47%)]">Generated Admin Password</p>
                <div className="flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-[hsl(215,16%,47%)]" />
                  <code className="text-sm font-mono text-[hsl(222,47%,11%)] dark:text-white">{successData.password}</code>
                </div>
                <p className="mt-2 text-xs text-[hsl(215,16%,47%)]">Please copy this password and share it securely with the company admin.</p>
              </div>
            )}
            
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[hsl(var(--primary))]"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl dark:bg-[hsl(222,47%,11%)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[hsl(214,32%,91%)] px-6 py-4 dark:border-[hsl(217,33%,17%)]">
          <h2 className="text-lg font-semibold text-[hsl(222,47%,11%)] dark:text-white">Register New Company</h2>
          <button onClick={onClose} className="rounded-md p-1 text-[hsl(215,16%,47%)] hover:bg-[hsl(214,32%,91%)] dark:hover:bg-[hsl(217,33%,17%)]">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white">
                Company Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(215,16%,47%)]" />
                <input
                  name="name"
                  required
                  className="w-full rounded-lg border border-[hsl(214,32%,91%)] bg-transparent py-2.5 pl-10 pr-4 text-sm text-[hsl(222,47%,11%)] outline-none focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))] dark:border-[hsl(217,33%,17%)] dark:text-white"
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white">
                Company Slug (Unique ID)
              </label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(215,16%,47%)]" />
                <input
                  name="slug"
                  required
                  className="w-full rounded-lg border border-[hsl(214,32%,91%)] bg-transparent py-2.5 pl-10 pr-4 text-sm text-[hsl(222,47%,11%)] outline-none focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))] dark:border-[hsl(217,33%,17%)] dark:text-white"
                  placeholder="acme-corp"
                />
              </div>
            </div>

            <div className="my-6 border-t border-[hsl(214,32%,91%)] dark:border-[hsl(217,33%,17%)]" />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white">
                Admin Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(215,16%,47%)]" />
                <input
                  name="adminName"
                  required
                  className="w-full rounded-lg border border-[hsl(214,32%,91%)] bg-transparent py-2.5 pl-10 pr-4 text-sm text-[hsl(222,47%,11%)] outline-none focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))] dark:border-[hsl(217,33%,17%)] dark:text-white"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(215,16%,47%)]" />
                <input
                  name="adminEmail"
                  type="email"
                  required
                  className="w-full rounded-lg border border-[hsl(214,32%,91%)] bg-transparent py-2.5 pl-10 pr-4 text-sm text-[hsl(222,47%,11%)] outline-none focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))] dark:border-[hsl(217,33%,17%)] dark:text-white"
                  placeholder="john@acme.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white">
                Admin Password (Optional)
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(215,16%,47%)]" />
                <input
                  name="adminPassword"
                  type="password"
                  className="w-full rounded-lg border border-[hsl(214,32%,91%)] bg-transparent py-2.5 pl-10 pr-4 text-sm text-[hsl(222,47%,11%)] outline-none focus:border-[hsl(var(--primary))] focus:ring-1 focus:ring-[hsl(var(--primary))] dark:border-[hsl(217,33%,17%)] dark:text-white"
                  placeholder="Leave blank to auto-generate"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-[hsl(215,16%,47%)] hover:bg-[hsl(214,32%,91%)] dark:hover:bg-[hsl(217,33%,17%)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[hsl(var(--primary))] disabled:opacity-70"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Company
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
