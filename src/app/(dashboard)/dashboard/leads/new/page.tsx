'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { PageHeader } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/form'

export default function QuickAddLeadPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    source: 'Phone call',
    followUpOn: '',
    notes: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!form.firstName) return setError('First Name is required')
    if (!form.source) return setError('Source is required')

    setLoading(true)
    try {
      const res = await fetch('/api/leads/quick-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.success) {
        // Redirect to the newly created client's details page
        router.push(`/dashboard/customers/${json.data.id}`)
      } else {
        setError(json.error || 'Failed to save lead')
      }
    } catch (err) {
      console.error(err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="mb-4">
        <button
          type="button"
          onClick={() => router.push('/dashboard/customers')}
          className="flex items-center gap-1.5 text-sm text-[hsl(215,16%,47%)] hover:text-[hsl(222,47%,11%)] dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Clients
        </button>
      </div>

      <PageHeader
        title="Quick Add Lead"
        description="Capture a lead in one screen. The client, contact and first activity are all created together."
      />

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Who is it? */}
        <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
          <h3 className="text-base font-bold text-[hsl(222,47%,11%)] dark:text-white mb-4">Who is it?</h3>
          <div className="space-y-4">
            <Input
              label="Company"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              placeholder="Leave blank for an individual"
              hint="With no company, this is recorded as an individual rather than a business."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="First Name *"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
              />
              <Input
                label="Last Name"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
              />
              <Input
                label="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone number"
                hint="Email or phone — at least one."
              />
            </div>
          </div>
        </div>

        {/* Where did they come from? */}
        <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
          <h3 className="text-base font-bold text-[hsl(222,47%,11%)] dark:text-white mb-4">Where did they come from?</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Source *"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                options={[
                  { value: 'Phone call', label: 'Phone call' },
                  { value: 'Email', label: 'Email' },
                  { value: 'Website', label: 'Website' },
                  { value: 'Referral', label: 'Referral' },
                  { value: 'Other', label: 'Other' },
                ]}
                required
              />
              <Input
                label="Follow up on"
                type="date"
                value={form.followUpOn}
                onChange={(e) => setForm({ ...form, followUpOn: e.target.value })}
                hint="Optional. Creates a task assigned to you."
              />
            </div>
            <Textarea
              label="Note"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="What did they ask for?"
              rows={3}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            icon={<Save className="h-4 w-4" />}
            className="bg-orange-600 hover:bg-orange-700 text-white border-none rounded-lg px-6 font-semibold"
          >
            Create Lead
          </Button>
        </div>
      </form>
    </div>
  )
}
