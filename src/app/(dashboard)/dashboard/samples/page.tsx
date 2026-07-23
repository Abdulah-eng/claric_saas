'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Package, Search, Truck, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react'
import { DataTable, PageHeader, Pagination, EmptyState } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { SampleStatusBadge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/form'
import { formatDate, formatRelativeTime } from '@/lib/utils'

type Sample = {
  id: string
  description: string
  status: string
  carrier: string | null
  trackingNumber: string | null
  shippedAt: string | null
  deliveredAt: string | null
  followUpDate: string | null
  createdAt: string
  lead: { id: string; companyName: string } | null
  customer: { id: string; companyName: string } | null
  product: { id: string; name: string; sku: string | null } | null
}

const STATUS_FILTERS = [
  { value: '', label: 'All Statuses' },
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CONVERTED', label: 'Converted' },
  { value: 'DECLINED', label: 'Declined' },
]

const STATUS_OPTIONS = STATUS_FILTERS.slice(1)

export default function SamplesPage() {
  const router = useRouter()
  const [samples, setSamples] = useState<Sample[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    description: '',
    carrier: '',
    trackingNumber: '',
    notes: '',
    followUpDate: '',
  })
  const perPage = 20

  const fetchSamples = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
        ...(statusFilter && { status: statusFilter }),
      })
      const res = await fetch(`/api/samples?${params}`)
      const json = await res.json()
      if (json.success) {
        setSamples(json.data)
        setTotal(json.meta?.total ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter])

  useEffect(() => {
    fetchSamples()
  }, [fetchSamples])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/samples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          followUpDate: form.followUpDate ? new Date(form.followUpDate).toISOString() : undefined,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setShowCreate(false)
        fetchSamples()
      }
    } finally {
      setCreating(false)
    }
  }

  async function updateStatus(id: string, status: string) {
    setSamples((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)))
    await fetch(`/api/samples/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  // Stats
  const stats = [
    { label: 'Requested', count: samples.filter((s) => s.status === 'REQUESTED').length, icon: <Clock className="h-4 w-4" />, color: 'bg-sky-500' },
    { label: 'Shipped', count: samples.filter((s) => s.status === 'SHIPPED').length, icon: <Truck className="h-4 w-4" />, color: 'bg-purple-500' },
    { label: 'Delivered', count: samples.filter((s) => s.status === 'DELIVERED').length, icon: <Package className="h-4 w-4" />, color: 'bg-amber-500' },
    { label: 'Converted', count: samples.filter((s) => s.status === 'CONVERTED').length, icon: <CheckCircle className="h-4 w-4" />, color: 'bg-emerald-500' },
  ]

  const columns = [
    {
      key: 'description',
      header: 'Sample',
      render: (row: Sample) => (
        <div>
          <p className="font-medium text-[hsl(222,47%,11%)] dark:text-white line-clamp-1">{row.description}</p>
          {row.product && (
            <p className="text-xs text-[hsl(215,16%,47%)]">
              {row.product.name} {row.product.sku ? `(${row.product.sku})` : ''}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'for',
      header: 'For',
      render: (row: Sample) => (
        <div className="text-sm">
          {row.customer && (
            <p className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{row.customer.companyName}</p>
          )}
          {row.lead && !row.customer && (
            <p className="text-[hsl(215,16%,47%)]">{row.lead.companyName} <span className="text-[10px]">(lead)</span></p>
          )}
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (row: Sample) => <SampleStatusBadge status={row.status} /> },
    {
      key: 'tracking',
      header: 'Tracking',
      render: (row: Sample) => (
        <div className="text-xs text-[hsl(215,16%,47%)]">
          {row.carrier && <p>{row.carrier}</p>}
          {row.trackingNumber && <p className="font-mono">{row.trackingNumber}</p>}
          {!row.carrier && !row.trackingNumber && <span>—</span>}
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'Timeline',
      render: (row: Sample) => (
        <div className="text-xs text-[hsl(215,16%,47%)]">
          {row.shippedAt && <p>Shipped: {formatDate(row.shippedAt)}</p>}
          {row.deliveredAt && <p>Delivered: {formatDate(row.deliveredAt)}</p>}
          {row.followUpDate && <p className="text-amber-600 dark:text-amber-400">Follow up: {formatDate(row.followUpDate)}</p>}
          {!row.shippedAt && !row.deliveredAt && !row.followUpDate && (
            <span>{formatRelativeTime(row.createdAt)}</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row: Sample) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {row.status === 'REQUESTED' && (
            <button
              onClick={() => updateStatus(row.id, 'SHIPPED')}
              className="rounded-lg bg-purple-100 px-2 py-1 text-[10px] font-medium text-purple-700 hover:bg-purple-200 dark:bg-purple-500/15 dark:text-purple-400"
            >
              Mark Shipped
            </button>
          )}
          {row.status === 'SHIPPED' && (
            <button
              onClick={() => updateStatus(row.id, 'DELIVERED')}
              className="rounded-lg bg-amber-100 px-2 py-1 text-[10px] font-medium text-amber-700 hover:bg-amber-200 dark:bg-amber-500/15 dark:text-amber-400"
            >
              Mark Delivered
            </button>
          )}
          {row.status === 'DELIVERED' && (
            <button
              onClick={() => updateStatus(row.id, 'CONVERTED')}
              className="rounded-lg bg-emerald-100 px-2 py-1 text-[10px] font-medium text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400"
            >
              Converted
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Sample Tracking"
        description="Track product samples sent to leads and customers"
        breadcrumbs={[{ label: 'CRM' }, { label: 'Samples' }]}
        actions={
          <Button id="btn-new-sample" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
            New Sample
          </Button>
        }
      />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-4 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[hsl(215,16%,47%)]">{s.label}</p>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-white ${s.color}`}>
                {s.icon}
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-[hsl(222,47%,11%)] dark:text-white">{s.count}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="mb-4">
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                statusFilter === f.value
                  ? 'bg-[hsl(221,83%,53%)] text-white shadow-sm'
                  : 'border border-[hsl(214,32%,91%)] bg-white text-[hsl(215,16%,47%)] hover:bg-[hsl(210,40%,96%)] dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] dark:hover:bg-[hsl(217,33%,17%)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={samples}
        loading={loading}
        onRowClick={(row) => router.push(`/dashboard/samples/${row.id}`)}
        emptyMessage="No samples tracked yet."
      />

      {total > perPage && (
        <Pagination page={page} totalPages={Math.ceil(total / perPage)} total={total} perPage={perPage} onPageChange={setPage} />
      )}

      {/* Create Sample Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Sample Request"
        description="Track a new product sample"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button form="form-create-sample" type="submit" loading={creating}>Create Sample</Button>
          </>
        }
      >
        <form id="form-create-sample" onSubmit={handleCreate} className="space-y-4">
          <Textarea id="sampleDescription" label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required placeholder="e.g. Custom printed t-shirt - size L, navy blue" rows={2} />
          <div className="grid grid-cols-2 gap-4">
            <Input id="sampleCarrier" label="Carrier" value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} placeholder="FedEx, UPS, USPS..." />
            <Input id="sampleTracking" label="Tracking Number" value={form.trackingNumber} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} placeholder="1Z999..." />
          </div>
          <Input id="sampleFollowUp" label="Follow-up Date" type="date" value={form.followUpDate} onChange={(e) => setForm({ ...form, followUpDate: e.target.value })} />
          <Textarea id="sampleNotes" label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any additional notes..." rows={2} />
        </form>
      </Modal>
    </>
  )
}
