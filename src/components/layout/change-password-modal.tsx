'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { KeyRound, Loader2 } from 'lucide-react'

export function ChangePasswordModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const currentPassword = formData.get('currentPassword') as string
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to change password')

      setSuccess(true)
      setTimeout(() => {
        onClose()
        setSuccess(false)
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[hsl(222,47%,11%)] dark:text-white">Change Password</h2>
            <p className="text-sm text-[hsl(215,16%,47%)]">Update your account password</p>
          </div>
        </div>

        {success ? (
          <div className="rounded-lg bg-emerald-50 p-4 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 text-center font-medium">
            Password successfully updated!
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
                {error}
              </div>
            )}
            
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white">Current Password</label>
              <input type="password" name="currentPassword" required className="w-full rounded-lg border border-[hsl(214,32%,91%)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))] dark:border-[hsl(217,33%,17%)] dark:text-white" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white">New Password</label>
              <input type="password" name="newPassword" required minLength={8} className="w-full rounded-lg border border-[hsl(214,32%,91%)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))] dark:border-[hsl(217,33%,17%)] dark:text-white" />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white">Confirm New Password</label>
              <input type="password" name="confirmPassword" required minLength={8} className="w-full rounded-lg border border-[hsl(214,32%,91%)] bg-transparent px-3 py-2 text-sm outline-none focus:border-[hsl(var(--primary))] dark:border-[hsl(217,33%,17%)] dark:text-white" />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-[hsl(215,16%,47%)] hover:bg-[hsl(214,32%,91%)] dark:hover:bg-[hsl(217,33%,17%)]">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white hover:bg-[hsl(var(--primary))] disabled:opacity-70">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Change Password
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  )
}
