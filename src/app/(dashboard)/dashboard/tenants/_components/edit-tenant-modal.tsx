'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Building2, Link as LinkIcon, Loader2 } from 'lucide-react'

export function EditTenantModal({ tenant, onClose }: { tenant: any, onClose: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const formData = new FormData(e.currentTarget)
    const payload = Object.fromEntries(formData.entries())
    
    try {
      const res = await fetch(`/api/tenants/${tenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update company')
      
      router.refresh()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl dark:bg-[hsl(222,47%,11%)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[hsl(214,32%,91%)] px-6 py-4 dark:border-[hsl(217,33%,17%)]">
          <h2 className="text-lg font-semibold text-[hsl(222,47%,11%)] dark:text-white">Edit Company</h2>
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
                  defaultValue={tenant.name}
                  required
                  className="w-full rounded-lg border border-[hsl(214,32%,91%)] bg-transparent py-2.5 pl-10 pr-4 text-sm text-[hsl(222,47%,11%)] outline-none focus:border-[hsl(221,83%,53%)] focus:ring-1 focus:ring-[hsl(221,83%,53%)] dark:border-[hsl(217,33%,17%)] dark:text-white"
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
                  defaultValue={tenant.slug}
                  required
                  className="w-full rounded-lg border border-[hsl(214,32%,91%)] bg-transparent py-2.5 pl-10 pr-4 text-sm text-[hsl(222,47%,11%)] outline-none focus:border-[hsl(221,83%,53%)] focus:ring-1 focus:ring-[hsl(221,83%,53%)] dark:border-[hsl(217,33%,17%)] dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white">
                Subscription Plan
              </label>
              <select
                name="plan"
                defaultValue={tenant.plan}
                className="w-full rounded-lg border border-[hsl(214,32%,91%)] bg-transparent py-2.5 px-4 text-sm text-[hsl(222,47%,11%)] outline-none focus:border-[hsl(221,83%,53%)] focus:ring-1 focus:ring-[hsl(221,83%,53%)] dark:border-[hsl(217,33%,17%)] dark:text-white"
              >
                <option value="STARTER">Starter</option>
                <option value="PROFESSIONAL">Professional</option>
                <option value="ENTERPRISE">Enterprise</option>
                <option value="CUSTOM">Custom</option>
              </select>
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
              className="flex items-center gap-2 rounded-lg bg-[hsl(221,83%,53%)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[hsl(221,83%,48%)] disabled:opacity-70"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
