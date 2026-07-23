'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react'
import { PageHeader } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/form'
import { formatCurrency } from '@/lib/utils'

export default function NewQuotePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultCustomerId = searchParams.get('customerId')

  const [customers, setCustomers] = useState<{id:string; companyName:string}[]>([])
  const [products, setProducts] = useState<{id:string; name:string; basePrice:number}[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [form, setForm] = useState({
    customerId: defaultCustomerId ?? '',
    title: '',
    validUntil: '',
    discountAmount: 0,
    discountPercent: 0,
    discountType: 'PERCENTAGE',
    notes: '',
    terms: '',
  })

  const [items, setItems] = useState([
    { productId: '', description: '', quantity: 1, unitPrice: 0, taxRate: 0, imageUrl: '', id: Date.now().toString() }
  ])

  useEffect(() => {
    Promise.all([
      fetch('/api/customers?perPage=100').then(r => r.json()),
      fetch('/api/products?perPage=100').then(r => r.json()),
    ]).then(([cust, prod]) => {
      if (cust.success) setCustomers(cust.data)
      if (prod.success) setProducts(prod.data)
      setLoading(false)
    })
  }, [])

  const addLineItem = () => {
    setItems([...items, { productId: '', description: '', quantity: 1, unitPrice: 0, taxRate: 0, imageUrl: '', id: Date.now().toString() }])
  }

  const removeLineItem = (id: string) => {
    if (items.length === 1) return
    setItems(items.filter(li => li.id !== id))
  }

  const updateLineItem = (id: string, field: string, value: any) => {
    setItems(items.map(li => {
      if (li.id !== id) return li
      const updated = { ...li, [field]: value }
      if (field === 'productId' && value) {
        const prod = products.find(p => p.id === value)
        if (prod) {
          updated.description = prod.name
          updated.unitPrice = prod.basePrice
        }
      }
      return updated
    }))
  }

  // Calculations
  const subtotal = items.reduce((sum, li) => sum + (li.quantity * li.unitPrice), 0)
  const discountTotal = form.discountType === 'PERCENTAGE' ? subtotal * (form.discountPercent / 100) : form.discountAmount
  const tax = items.reduce((sum, li) => sum + ((li.quantity * li.unitPrice) * (li.taxRate / 100)), 0)
  const total = subtotal - discountTotal + tax

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')
    
    if (!form.customerId) return setFormError('Customer is required')
    if (items.some(li => !li.description || li.quantity < 1)) return setFormError('All items must have a description and valid quantity')

    setSaving(true)
    try {
      const payload: any = {
        customerId: form.customerId,
        title: form.title,
        notes: form.notes,
        terms: form.terms,
        items: items.map(li => ({
          productId: li.productId || undefined,
          description: li.description,
          imageUrl: li.imageUrl || undefined,
          quantity: Number(li.quantity),
          unitPrice: Number(li.unitPrice),
          taxRate: Number(li.taxRate),
        }))
      }
      if (form.validUntil) payload.validUntil = new Date(form.validUntil).toISOString()
      if (form.discountType === 'PERCENTAGE') {
        payload.discountPercent = form.discountPercent
      } else {
        payload.discountAmount = form.discountAmount
      }

      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (json.success) {
        router.push(`/dashboard/quotes/${json.data.id}`)
      } else {
        setFormError(json.error || 'Failed to create quote')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="animate-pulse h-96 rounded-xl bg-[hsl(210,40%,93%)]" />

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto pb-20">
      <div className="mb-4">
        <button type="button" onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-[hsl(215,16%,47%)] hover:text-[hsl(222,47%,11%)]">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      </div>

      <PageHeader
        title="Create Quote"
        actions={<Button type="submit" loading={saving} icon={<Save className="h-4 w-4" />}>Save Quote</Button>}
      />

      {formError && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {formError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-5 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
            <h3 className="mb-4 font-semibold text-[hsl(222,47%,11%)] dark:text-white">Quote Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Customer *"
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                options={customers.map(c => ({ value: c.id, label: c.companyName }))}
                placeholder="Select a customer"
              />
              <Input
                label="Quote Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Q3 Marketing Materials"
              />
              <Input
                label="Valid Until"
                type="date"
                value={form.validUntil}
                onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
              />
            </div>
          </div>

          {/* Line Items */}
          <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-5 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
            <h3 className="mb-4 font-semibold text-[hsl(222,47%,11%)] dark:text-white">Line Items</h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 px-2 text-xs font-semibold text-[hsl(215,16%,47%)] uppercase">
                <div className="col-span-3">Product / Description *</div>
                <div className="col-span-2 text-right">Qty *</div>
                <div className="col-span-2 text-right">Price *</div>
                <div className="col-span-2 text-right">Tax %</div>
                <div className="col-span-2 text-right">Total</div>
                <div className="col-span-1"></div>
              </div>
              
              {items.map((li) => (
                <div key={li.id} className="grid grid-cols-12 gap-2 items-start bg-[hsl(210,40%,98%)] p-2 rounded-lg border border-[hsl(214,32%,91%)] dark:bg-black/20 dark:border-[hsl(217,33%,17%)]">
                  <div className="col-span-3 space-y-2">
                    <select
                      className="w-full rounded-md border border-[hsl(214,32%,91%)] p-1.5 text-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] dark:text-white"
                      value={li.productId}
                      onChange={(e) => updateLineItem(li.id, 'productId', e.target.value)}
                    >
                      <option value="">Custom Item...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <input
                      type="text"
                      className="w-full rounded-md border border-[hsl(214,32%,91%)] p-1.5 text-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] dark:text-white"
                      placeholder="Description"
                      value={li.description}
                      onChange={(e) => updateLineItem(li.id, 'description', e.target.value)}
                    />
                    {!li.productId && (
                      <div className="space-y-1">
                        <input
                          type="text"
                          className="w-full rounded-md border border-[hsl(214,32%,91%)] p-1.5 text-xs text-[hsl(215,16%,47%)] dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] dark:text-white"
                          placeholder="Image URL (optional)"
                          value={li.imageUrl}
                          onChange={(e) => updateLineItem(li.id, 'imageUrl', e.target.value)}
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-[hsl(215,16%,47%)]">Or</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id={`file-${li.id}`}
                            onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              const formData = new FormData()
                              formData.append('file', file)
                              try {
                                const res = await fetch('/api/upload', {
                                  method: 'POST',
                                  body: formData
                                })
                                const json = await res.json()
                                if (json.success) {
                                  updateLineItem(li.id, 'imageUrl', json.data.url)
                                } else {
                                  alert(json.error || 'Upload failed')
                                }
                              } catch (err) {
                                console.error(err)
                                alert('Failed to upload image')
                              }
                            }}
                          />
                          <label
                            htmlFor={`file-${li.id}`}
                            className="inline-flex cursor-pointer items-center justify-center rounded border border-[hsl(214,32%,91%)] bg-white px-2 py-0.5 text-[10px] font-medium text-[hsl(222,47%,11%)] hover:bg-[hsl(210,40%,98%)] dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] dark:text-white dark:hover:bg-[hsl(217,33%,15%)]"
                          >
                            Upload Image
                          </label>
                          {li.imageUrl && (
                            <span className="text-[9px] text-green-500 font-medium truncate max-w-[120px]">
                              Uploaded!
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <input type="number" min="1" step="1" className="w-full rounded-md border border-[hsl(214,32%,91%)] p-1.5 text-sm text-right dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] dark:text-white" value={li.quantity} onChange={(e) => updateLineItem(li.id, 'quantity', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <input type="number" min="0" step="0.01" className="w-full rounded-md border border-[hsl(214,32%,91%)] p-1.5 text-sm text-right dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] dark:text-white" value={li.unitPrice} onChange={(e) => updateLineItem(li.id, 'unitPrice', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <input type="number" min="0" step="0.1" className="w-full rounded-md border border-[hsl(214,32%,91%)] p-1.5 text-sm text-right dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] dark:text-white" value={li.taxRate} onChange={(e) => updateLineItem(li.id, 'taxRate', e.target.value)} />
                  </div>
                  <div className="col-span-2 flex items-center justify-end h-9">
                    <span className="text-sm font-medium">{formatCurrency(li.quantity * li.unitPrice)}</span>
                  </div>
                  <div className="col-span-1 flex items-center justify-center h-9">
                    <button type="button" onClick={() => removeLineItem(li.id)} className="text-red-500 hover:text-red-600 disabled:opacity-30" disabled={items.length === 1}>
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <Button type="button" variant="outline" size="sm" className="mt-4" icon={<Plus className="h-3 w-3" />} onClick={addLineItem}>
              Add Line Item
            </Button>
          </div>

          <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-5 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
            <h3 className="mb-4 font-semibold text-[hsl(222,47%,11%)] dark:text-white">Notes & Terms</h3>
            <div className="space-y-4">
              <Textarea label="Notes to Customer" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
              <Textarea label="Terms and Conditions" value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} rows={3} />
            </div>
          </div>
        </div>

        {/* Totals Sidebar */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-[hsl(210,40%,98%)] p-5 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-black/20">
            <h3 className="mb-4 font-semibold text-[hsl(222,47%,11%)] dark:text-white">Summary</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[hsl(215,16%,47%)]">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex justify-between items-center gap-2">
                <span className="text-[hsl(215,16%,47%)]">Discount</span>
                <div className="flex items-center gap-1 w-32">
                  <input type="number" min="0" step="0.01" className="w-16 rounded border border-[hsl(214,32%,91%)] p-1 text-xs text-right dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] dark:text-white" value={form.discountType === 'PERCENTAGE' ? form.discountPercent : form.discountAmount} onChange={(e) => setForm({ ...form, [form.discountType === 'PERCENTAGE' ? 'discountPercent' : 'discountAmount']: Number(e.target.value) })} />
                  <select className="flex-1 rounded border border-[hsl(214,32%,91%)] p-1 text-xs dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] dark:text-white" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
                    <option value="PERCENTAGE">%</option>
                    <option value="FIXED">$</option>
                  </select>
                </div>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-end">
                  <span className="text-red-500 text-xs">-{formatCurrency(discountTotal)}</span>
                </div>
              )}

              <div className="flex justify-between border-b border-[hsl(214,32%,91%)] pb-3 dark:border-[hsl(217,33%,17%)]">
                <span className="text-[hsl(215,16%,47%)]">Tax</span>
                <span className="font-medium">{formatCurrency(tax)}</span>
              </div>

              <div className="flex justify-between pt-2">
                <span className="font-bold text-base text-[hsl(222,47%,11%)] dark:text-white">Total</span>
                <span className="font-bold text-base text-blue-600 dark:text-blue-400">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
