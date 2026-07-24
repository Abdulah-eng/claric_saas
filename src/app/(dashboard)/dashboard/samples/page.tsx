'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Package, Search, Truck, CheckCircle, XCircle, Clock, ArrowRight, Camera, X, PlusCircle, Calendar } from 'lucide-react'
import { DataTable, PageHeader, Pagination } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Select, Textarea } from '@/components/ui/form'
import { formatDate } from '@/lib/utils'

type SampleItem = {
  id?: string
  productId: string | null
  name: string
  quantity: number
}

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
  leadId: string | null
  customerId: string | null
  lead: { id: string; companyName: string } | null
  customer: {
    id: string
    companyName: string
    contacts: { firstName: string; lastName: string }[]
  } | null
  product: { id: string; name: string; sku: string | null } | null
  quoteId: string | null
  quote: { id: string; quoteNumber: string } | null
  items: SampleItem[]
}

export default function SamplesPage() {
  const router = useRouter()
  const [samples, setSamples] = useState<Sample[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [showCreateInline, setShowCreateInline] = useState(false)
  const [creating, setCreating] = useState(false)

  // Dropdown list data
  const [clients, setClients] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

  // New Sample Box Form State
  const [form, setForm] = useState({
    clientId: '', // Can be customer:cust_id or lead:lead_id
    deliveredBy: '',
    deliveryDate: new Date().toISOString().substring(0, 10),
    notes: '',
    items: [
      { productId: '', name: '', quantity: 1, type: 'one-off' } // type can be 'catalog' or 'one-off'
    ]
  })

  // Inline "Mark Delivered" status state
  const [expandedSampleId, setExpandedSampleId] = useState<string | null>(null)
  const [deliveryForm, setDeliveryForm] = useState({
    createFollowUp: true,
    followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10), // 1 week later
  })
  const [submittingDelivery, setSubmittingDelivery] = useState(false)

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

  useEffect(() => {
    // Fetch Customers and Leads
    Promise.all([
      fetch('/api/customers?perPage=100').then((r) => r.json()),
      fetch('/api/leads?perPage=100').then((r) => r.json()),
      fetch('/api/products?perPage=100').then((r) => r.json()),
    ]).then(([custJson, leadJson, prodJson]) => {
      const list: any[] = []
      if (custJson.success) {
        custJson.data.forEach((c: any) => {
          list.push({ id: `customer:${c.id}`, name: `${c.companyName} (Client)` })
        })
      }
      if (leadJson.success) {
        leadJson.data.forEach((l: any) => {
          list.push({ id: `lead:${l.id}`, name: `${l.companyName || `${l.firstName} ${l.lastName}`} (Lead)` })
        })
      }
      setClients(list)
      if (prodJson.success) {
        setProducts(prodJson.data)
      }
    })
  }, [])

  // Create Sample Box Submission
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!form.clientId) return
    setCreating(true)

    // Build items payload
    const finalItems = form.items
      .filter(item => item.type === 'catalog' ? !!item.productId : !!item.name)
      .map(item => {
        if (item.type === 'catalog') {
          const product = products.find(p => p.id === item.productId)
          return {
            productId: item.productId,
            name: product ? product.name : 'Catalog Item',
            quantity: item.quantity,
          }
        } else {
          return {
            productId: null,
            name: item.name,
            quantity: item.quantity,
          }
        }
      })

    const isCustomer = form.clientId.startsWith('customer:')
    const realId = form.clientId.split(':')[1]
    const description = finalItems.map(it => `${it.quantity}× ${it.name}`).join(', ') || 'Sample Box'

    try {
      const payload = {
        description,
        ...(isCustomer ? { customerId: realId } : { leadId: realId }),
        carrier: form.deliveredBy || null,
        deliveredAt: form.deliveryDate ? new Date(form.deliveryDate).toISOString() : null,
        notes: form.notes || null,
        totalValue: 0,
        items: finalItems,
      }

      const res = await fetch('/api/samples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        setShowCreateInline(false)
        fetchSamples()
        setForm({
          clientId: '',
          deliveredBy: '',
          deliveryDate: new Date().toISOString().substring(0, 10),
          notes: '',
          items: [{ productId: '', name: '', quantity: 1, type: 'one-off' }]
        })
      }
    } finally {
      setCreating(false)
    }
  }

  // Update Status Dropdown
  async function handleStatusChange(id: string, status: string) {
    setSamples((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)))
    await fetch(`/api/samples/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchSamples()
  }

  // Submit "Mark Delivered" Inline Form
  async function handleMarkDeliveredSubmit(sample: Sample) {
    setSubmittingDelivery(true)
    try {
      // 1. Update Sample Box to DELIVERED
      const res = await fetch(`/api/samples/${sample.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'DELIVERED',
          deliveredAt: new Date().toISOString(),
        }),
      })

      // 2. Create a follow-up task if checked
      if (deliveryForm.createFollowUp && deliveryForm.followUpDate) {
        await fetch('/api/follow-ups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Follow up on sample box - ${sample.description.substring(0, 30)}`,
            dueDate: new Date(deliveryForm.followUpDate).toISOString(),
            notes: 'Suggested follow-up checking if client liked the sample box.',
            customerId: sample.customerId || undefined,
            leadId: sample.leadId || undefined,
          }),
        })
      }

      if (res.ok) {
        setExpandedSampleId(null)
        fetchSamples()
      }
    } finally {
      setSubmittingDelivery(false)
    }
  }

  // Helpers for items inline listing
  function handleAddItemRow() {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { productId: '', name: '', quantity: 1, type: 'one-off' }]
    }))
  }

  function handleRemoveItemRow(index: number) {
    setForm((prev) => {
      const items = [...prev.items]
      items.splice(index, 1)
      return { ...prev, items }
    })
  }

  function handleUpdateItemRow(index: number, key: string, val: any) {
    setForm((prev) => {
      const items = [...prev.items]
      items[index] = { ...items[index], [key]: val }
      return { ...prev, items }
    })
  }

  // Dashboard calculations based on stats
  const preparedCount = samples.filter((s) => s.status === 'REQUESTED' || s.status === 'SHIPPED').length
  const deliveredCount = samples.filter((s) => s.status === 'DELIVERED').length
  const convertedCount = samples.filter((s) => s.status === 'CONVERTED').length
  const declinedCount = samples.filter((s) => s.status === 'DECLINED').length
  const followedUpCount = samples.filter((s) => s.followUpDate !== null && s.status !== 'CONVERTED').length

  const totalWithResult = convertedCount + declinedCount
  const conversionRate = totalWithResult > 0 ? Math.round((convertedCount / totalWithResult) * 100) : 0

  return (
    <div className="max-w-6xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(222,47%,11%)] dark:text-white">Sample Boxes</h1>
          <p className="text-sm text-[hsl(215,16%,47%)] mt-1">Who received what, and which boxes turned into business.</p>
        </div>
        <Button
          onClick={() => setShowCreateInline(!showCreateInline)}
          icon={<Plus className="h-4 w-4" />}
          className="bg-orange-600 hover:bg-orange-700 text-white border-none rounded-lg font-semibold"
        >
          {showCreateInline ? 'Close Panel' : 'New Sample Box'}
        </Button>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-6 mb-8">
        <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-4 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
          <p className="text-xs font-semibold text-[hsl(215,16%,47%)]">Prepared</p>
          <p className="mt-2 text-2xl font-bold text-[hsl(222,47%,11%)] dark:text-white">{preparedCount}</p>
        </div>
        <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-4 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
          <p className="text-xs font-semibold text-[hsl(215,16%,47%)]">Delivered</p>
          <p className="mt-2 text-2xl font-bold text-[hsl(222,47%,11%)] dark:text-white">{deliveredCount}</p>
        </div>
        <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-4 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
          <p className="text-xs font-semibold text-[hsl(215,16%,47%)]">Followed up</p>
          <p className="mt-2 text-2xl font-bold text-[hsl(222,47%,11%)] dark:text-white">{followedUpCount}</p>
        </div>
        <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-4 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
          <p className="text-xs font-semibold text-[hsl(215,16%,47%)]">Converted</p>
          <p className="mt-2 text-2xl font-bold text-[hsl(222,47%,11%)] dark:text-white">{convertedCount}</p>
        </div>
        <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-4 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
          <p className="text-xs font-semibold text-[hsl(215,16%,47%)]">No interest</p>
          <p className="mt-2 text-2xl font-bold text-[hsl(222,47%,11%)] dark:text-white">{declinedCount}</p>
        </div>
        <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-4 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
          <p className="text-xs font-semibold text-[hsl(215,16%,47%)]">Conversion</p>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-2xl font-bold text-green-600">{conversionRate}%</span>
            <span className="h-2 w-8 bg-green-200 rounded-full overflow-hidden block">
              <span className="h-full bg-green-500 block" style={{ width: `${conversionRate}%` }} />
            </span>
          </div>
        </div>
      </div>

      {/* New Sample Box Panel (Image 2) */}
      {showCreateInline && (
        <form onSubmit={handleCreate} className="mb-8 rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] space-y-6">
          <h3 className="text-base font-bold text-[hsl(222,47%,11%)] dark:text-white">New Sample Box</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Client *"
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              options={[
                { value: '', label: 'Choose a client' },
                ...clients.map(c => ({ value: c.id, label: c.name }))
              ]}
              required
            />
            <Input
              label="Delivered By"
              value={form.deliveredBy}
              onChange={(e) => setForm({ ...form, deliveredBy: e.target.value })}
              placeholder="Staff name or courier"
            />
            <Input
              label="Delivery Date"
              type="date"
              value={form.deliveryDate}
              onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
            />
          </div>

          {/* Contents line items list */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[hsl(215,16%,47%)]">Contents</label>
            {form.items.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-3 items-center">
                <div className="w-full sm:w-60">
                  <select
                    value={item.type}
                    onChange={(e) => handleUpdateItemRow(idx, 'type', e.target.value)}
                    className="w-full rounded-lg border border-[hsl(214,32%,91%)] bg-transparent h-9 px-3 text-sm outline-none dark:border-white/10 dark:text-white dark:bg-black/20"
                  >
                    <option value="one-off">One-off item (not in catalog)</option>
                    <option value="catalog">Catalog Product</option>
                  </select>
                </div>

                {item.type === 'catalog' ? (
                  <div className="flex-1 w-full">
                    <select
                      value={item.productId}
                      onChange={(e) => handleUpdateItemRow(idx, 'productId', e.target.value)}
                      className="w-full rounded-lg border border-[hsl(214,32%,91%)] bg-transparent h-9 px-3 text-sm outline-none dark:border-white/10 dark:text-white dark:bg-black/20"
                    >
                      <option value="">Select Catalog Product</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleUpdateItemRow(idx, 'name', e.target.value)}
                      placeholder="Describe the item"
                      className="w-full rounded-lg border border-[hsl(214,32%,91%)] bg-transparent h-9 px-3 text-sm outline-none dark:border-white/10 dark:text-white dark:bg-black/20"
                    />
                  </div>
                )}

                <div className="w-full sm:w-24">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => handleUpdateItemRow(idx, 'quantity', Number(e.target.value))}
                    className="w-full rounded-lg border border-[hsl(214,32%,91%)] bg-transparent h-9 px-3 text-sm outline-none dark:border-white/10 dark:text-white dark:bg-black/20"
                  />
                </div>

                {form.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(idx)}
                    className="h-9 w-9 shrink-0 flex items-center justify-center border border-red-200 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            <div className="pt-1.5">
              <button
                type="button"
                onClick={handleAddItemRow}
                className="inline-flex items-center gap-1 border border-amber-500 text-amber-500 hover:bg-amber-500/10 text-xs px-3 py-1.5 font-semibold rounded bg-transparent transition-colors"
              >
                + Add Item
              </button>
            </div>
            <p className="text-[11px] text-[hsl(215,16%,47%)] mt-1">
              Pick a catalog product, or leave it as a one-off and just describe it. The wording is stored with the box, so it still reads correctly if the product is later discontinued.
            </p>
          </div>

          <Textarea
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Any additional details..."
            rows={3}
          />

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateInline(false)}
              className="border border-amber-500 hover:bg-amber-500/10 text-amber-500 text-sm px-4 py-2 font-semibold rounded bg-transparent transition-colors"
            >
              Cancel
            </button>
            <Button
              type="submit"
              loading={creating}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold border-none rounded-lg px-6"
            >
              Create Sample Box
            </Button>
          </div>
        </form>
      )}

      {/* Filter and Headline (Image 1) */}
      <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white shadow-sm overflow-hidden dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
        <div className="flex items-center justify-between bg-white px-6 py-4 border-b border-[hsl(214,32%,91%)] dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
          <span className="text-base font-bold text-[hsl(222,47%,11%)] dark:text-white">All Sample Boxes</span>
          <div className="w-48">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="w-full rounded-lg border border-[hsl(214,32%,91%)] h-9 px-3 text-sm dark:border-white/10 dark:text-white dark:bg-black/20"
            >
              <option value="">All statuses</option>
              <option value="REQUESTED">Prepared</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CONVERTED">Converted</option>
              <option value="DECLINED">No interest</option>
            </select>
          </div>
        </div>

        {/* Custom Table render */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[hsl(215,16%,47%)]">
            <thead className="bg-[hsl(210,40%,98%)] text-xs uppercase text-[hsl(215,16%,47%)] dark:bg-[hsl(217,33%,17%)] border-b border-[hsl(214,32%,91%)] dark:border-none">
              <tr>
                <th className="px-6 py-3 font-semibold">Client</th>
                <th className="px-6 py-3 font-semibold">Contents</th>
                <th className="px-6 py-3 font-semibold">Delivered</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold">Photo</th>
                <th className="px-6 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(214,32%,91%)] dark:divide-[hsl(217,33%,17%)]">
              {samples.map((row) => {
                const clientName = row.customer?.companyName || row.lead?.companyName || '—'
                const primaryContact = row.customer?.contacts?.[0]
                const contactLabel = primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName}` : ''

                const formattedContents = row.items?.length > 0
                  ? row.items.map(it => `${it.quantity}× ${it.name}`).join(', ')
                  : `1× ${row.description}`

                const statusLabel = row.status === 'REQUESTED' || row.status === 'SHIPPED' ? 'Prepared' :
                                    row.status === 'DELIVERED' ? 'Delivered' :
                                    row.status === 'CONVERTED' ? 'Converted' :
                                    row.status === 'DECLINED' ? 'No interest' : row.status

                const statusColor = row.status === 'CONVERTED' ? 'text-green-600 bg-green-50' :
                                    row.status === 'DELIVERED' ? 'text-green-600 bg-green-50' :
                                    row.status === 'DECLINED' ? 'text-gray-600 bg-gray-100' :
                                    'text-amber-600 bg-amber-50'

                const isExpanded = expandedSampleId === row.id

                return (
                  <Fragment key={row.id}>
                    <tr className="hover:bg-gray-50/50 dark:hover:bg-white/5 cursor-pointer" onClick={() => router.push(`/dashboard/samples/${row.id}`)}>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-[hsl(222,47%,11%)] dark:text-white">{clientName}</p>
                        {contactLabel && <p className="text-xs text-[hsl(215,16%,47%)] mt-0.5">{contactLabel}</p>}
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate" title={formattedContents}>
                        {formattedContents}
                      </td>
                      <td className="px-6 py-4">
                        {row.deliveredAt ? (
                          <>
                            <p className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{formatDate(row.deliveredAt)}</p>
                            <p className="text-xs text-[hsl(215,16%,47%)] mt-0.5">by {row.carrier || 'Courier'}</p>
                          </>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <button className="border border-amber-500 bg-amber-50 text-amber-500 p-1.5 rounded-lg hover:bg-amber-100 transition-colors">
                          <Camera className="h-4 w-4" />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {/* Display QUO Badge if Converted */}
                          {row.status === 'CONVERTED' && (
                            <button
                              onClick={() => row.quoteId && router.push(`/dashboard/quotes/${row.quoteId}`)}
                              className="border border-green-500 hover:bg-green-500/10 text-green-600 bg-green-50 text-xs px-2.5 py-1 font-semibold rounded transition-colors"
                              disabled={!row.quoteId}
                            >
                              {row.quote?.quoteNumber || 'QUO-Badge'}
                            </button>
                          )}

                          {/* Display Create Quote if Delivered */}
                          {row.status === 'DELIVERED' && (
                            <button
                              onClick={() => router.push(`/dashboard/quotes/new?customerId=${row.customerId || ''}&leadId=${row.leadId || ''}&sampleId=${row.id}`)}
                              className="border border-red-500 hover:bg-red-500/10 text-red-500 text-xs px-2.5 py-1 font-semibold rounded bg-transparent transition-colors"
                            >
                              Create Quote
                            </button>
                          )}

                          {/* Display Mark Delivered + Create Quote if Prepared */}
                          {(row.status === 'REQUESTED' || row.status === 'SHIPPED') && (
                            <>
                              <button
                                onClick={() => setExpandedSampleId(isExpanded ? null : row.id)}
                                className="border border-red-500 hover:bg-red-500/10 text-red-500 text-xs px-2.5 py-1 font-semibold rounded bg-transparent transition-colors"
                              >
                                Mark Delivered
                              </button>
                              <button
                                onClick={() => router.push(`/dashboard/quotes/new?customerId=${row.customerId || ''}&leadId=${row.leadId || ''}&sampleId=${row.id}`)}
                                className="border border-red-500 hover:bg-red-500/10 text-red-500 text-xs px-2.5 py-1 font-semibold rounded bg-transparent transition-colors"
                              >
                                Create Quote
                              </button>
                            </>
                          )}

                          {/* Status dropdown */}
                          <div className="relative">
                            <select
                              value={row.status}
                              onChange={(e) => handleStatusChange(row.id, e.target.value)}
                              className="text-xs font-semibold rounded border border-gray-300 dark:border-white/10 dark:bg-[hsl(222,47%,11%)] h-7 px-2"
                            >
                              <option value="REQUESTED">Prepared</option>
                              <option value="DELIVERED">Delivered</option>
                              <option value="CONVERTED">Converted</option>
                              <option value="DECLINED">No interest</option>
                            </select>
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* Mark Delivered Inline Form Row (Image 3) */}
                    {isExpanded && (
                      <tr className="bg-[hsl(210,40%,98%)] dark:bg-[hsl(217,33%,17%)]">
                        <td colSpan={6} className="px-8 py-5 border-t border-[hsl(214,32%,91%)] dark:border-none">
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                              <h4 className="font-bold text-sm text-[hsl(222,47%,11%)] dark:text-white">
                                Mark delivered — {clientName}
                              </h4>
                              <p className="text-xs text-[hsl(215,16%,47%)] mt-1">
                                Delivery date is set to today unless it already has one.
                              </p>
                            </div>

                            <div className="flex flex-wrap items-center gap-6">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  id={`followup-${row.id}`}
                                  checked={deliveryForm.createFollowUp}
                                  onChange={(e) => setDeliveryForm({ ...deliveryForm, createFollowUp: e.target.checked })}
                                  className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                                />
                                <label htmlFor={`followup-${row.id}`} className="text-xs font-medium text-[hsl(222,47%,11%)] dark:text-white cursor-pointer">
                                  Create a follow-up task
                                </label>
                              </div>

                              {deliveryForm.createFollowUp && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-[hsl(215,16%,47%)]">Follow up on</span>
                                  <input
                                    type="date"
                                    value={deliveryForm.followUpDate}
                                    onChange={(e) => setDeliveryForm({ ...deliveryForm, followUpDate: e.target.value })}
                                    className="rounded border border-gray-300 dark:border-white/10 dark:bg-[hsl(222,47%,11%)] text-xs h-8 px-2"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setExpandedSampleId(null)}
                                className="border border-amber-500 hover:bg-amber-500/10 text-amber-500 text-xs px-3.5 py-1.5 font-semibold rounded bg-transparent transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMarkDeliveredSubmit(row)}
                                disabled={submittingDelivery}
                                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white font-semibold text-xs px-4 py-1.5 rounded transition-colors"
                              >
                                {submittingDelivery ? 'Saving...' : 'Mark Delivered'}
                              </button>
                            </div>
                          </div>
                          {deliveryForm.createFollowUp && (
                            <p className="text-[10px] text-[hsl(215,16%,47%)] text-right mt-1.5 pr-28">
                              Suggested: a week after delivery.
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
              {samples.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-[hsl(215,16%,47%)]">
                    No sample boxes tracked yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {total > perPage && (
        <div className="mt-4">
          <Pagination page={page} totalPages={Math.ceil(total / perPage)} total={total} perPage={perPage} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
