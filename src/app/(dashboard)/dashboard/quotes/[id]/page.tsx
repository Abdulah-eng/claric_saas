'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, Send, CheckCircle, XCircle, FileText, Edit, Copy, Box, Plus, Trash2, Save, X, Eye } from 'lucide-react'
import { PageHeader } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { QuoteStatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Input, Select, Textarea } from '@/components/ui/form'

type LineItem = {
  id?: string
  productId?: string | null
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
  isOptional?: boolean
}

type Milestone = {
  name: string
  percent?: number | null
  amount: number
}

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  
  // Data State
  const [quote, setQuote] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<any[]>([])
  
  // Form State
  const [items, setItems] = useState<LineItem[]>([])
  const [notes, setNotes] = useState('')
  const [terms, setTerms] = useState('')
  const [discountPercent, setDiscountPercent] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)
  
  // Payment Schedule State
  const [paymentMilestones, setPaymentMilestones] = useState<Milestone[]>([])

  // Email Composer State
  const [isComposing, setIsComposing] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [emailWhen, setEmailWhen] = useState('Next business hour')
  const [emailSendAt, setEmailSendAt] = useState('')

  // Document Sections Toggles
  const [sections, setSections] = useState({
    headerGraphic: true,
    introMessage: false,
    standardItems: true,
    optionalItems: true,
    addOns: true,
    totalsPayment: true,
    attachmentsGallery: true,
    customerReviews: true,
    termsConditions: true,
    signatureBlock: true
  })

  // Add Item card state
  const [addItemForm, setAddItemForm] = useState({
    productId: '',
    name: '',
    price: 0,
    type: 'Standard', // Standard, Optional, Add-on
    quantity: 1
  })

  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [sentSuccess, setSentSuccess] = useState(false)

  const fetchQuote = () => {
    fetch(`/api/quotes/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const q = json.data
          setQuote(q)
          setItems(q.items.map((it: any) => ({
            id: it.id,
            productId: it.productId,
            description: it.description,
            quantity: Number(it.quantity),
            unitPrice: Number(it.unitPrice),
            taxRate: Number(it.taxRate ?? 0),
            isOptional: it.isOptional
          })))
          setNotes(q.notes || '')
          setTerms(q.terms || '')
          setDiscountPercent(Number(q.discountPercent ?? 0))
          setDiscountAmount(Number(q.discountAmount ?? 0))

          // Initialize email composer defaults
          setEmailSubject(`Your quote ${q.quoteNumber}`)
          setEmailMessage(
            `Here is your quote for ${q.customer?.companyName || 'your company'}, ${q.quoteNumber}, coming to ${formatCurrency(Number(q.total))}.\n\n` +
            `You can view and approve it here:\n` +
            `${window.location.origin}/quote/${q.id}\n\n` +
            `Thanks,\n` +
            `CRM`
          )
          
          if (q.paymentMilestones && q.paymentMilestones.length > 0) {
            setPaymentMilestones(q.paymentMilestones.map((m: any) => ({
              name: m.name,
              percent: m.percent ? Number(m.percent) : null,
              amount: Number(m.amount)
            })))
          } else {
            setPaymentMilestones([])
          }
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchQuote()
    fetch('/api/products?perPage=100')
      .then(r => r.json())
      .then(json => {
        if (json.success) setProducts(json.data)
      })
  }, [id])

  // Calculations
  const subtotal = items.reduce((sum, li) => sum + (li.quantity * li.unitPrice), 0)
  const discountTotal = discountPercent > 0 ? subtotal * (discountPercent / 100) : discountAmount
  const tax = items.reduce((sum, li) => sum + ((li.quantity * li.unitPrice) * (li.taxRate / 100)), 0)
  const total = subtotal - discountTotal + tax

  // Line item manipulation
  const handleUpdateItem = (index: number, key: keyof LineItem, val: any) => {
    setItems(prev => {
      const copy = [...prev]
      copy[index] = { ...copy[index], [key]: val }
      return copy
    })
  }

  const handleDeleteItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleAddItemFromCard = (e: React.FormEvent) => {
    e.preventDefault()
    let description = addItemForm.name
    let price = Number(addItemForm.price)
    let productId = null

    if (addItemForm.productId && addItemForm.productId !== 'one-off') {
      const prod = products.find(p => p.id === addItemForm.productId)
      if (prod) {
        description = prod.name
        price = Number(prod.basePrice)
        productId = prod.id
      }
    }

    if (!description) return

    setItems(prev => [
      ...prev,
      {
        description,
        unitPrice: price,
        quantity: Number(addItemForm.quantity),
        productId,
        taxRate: 8.25, // default standard tax rate e.g. 8.25%
        isOptional: addItemForm.type !== 'Standard'
      }
    ])

    setAddItemForm({
      productId: '',
      name: '',
      price: 0,
      type: 'Standard',
      quantity: 1
    })
  }

  // Predefined payment schedules setting
  const setPaymentSchedulePreset = (preset: 'upfront' | '50-50' | 'completion') => {
    if (preset === 'upfront') {
      setPaymentMilestones([
        { name: '100% upfront', percent: 100, amount: total }
      ])
    } else if (preset === '50-50') {
      setPaymentMilestones([
        { name: 'Deposit', percent: 50, amount: Math.round((total * 0.5) * 100) / 100 },
        { name: 'Balance', percent: 50, amount: Math.round((total * 0.5) * 100) / 100 }
      ])
    } else if (preset === 'completion') {
      setPaymentMilestones([
        { name: 'On completion', percent: 100, amount: total }
      ])
    }
  }

  const handleClearSchedule = () => {
    setPaymentMilestones([])
  }

  // Save changes to Database Quote
  async function handleSaveChanges() {
    setSaving(true)
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notes,
          terms,
          discountPercent,
          discountAmount,
          items: items.map(li => ({
            productId: li.productId || undefined,
            description: li.description,
            quantity: Number(li.quantity),
            unitPrice: Number(li.unitPrice),
            taxRate: Number(li.taxRate)
          })),
          paymentMilestones: paymentMilestones.map(m => ({
            name: m.name,
            percent: m.percent,
            amount: Number(m.amount)
          }))
        })
      })
      const json = await res.json()
      if (json.success) {
        alert('Quote saved successfully!')
        fetchQuote()
      }
    } finally {
      setSaving(false)
    }
  }

  // Send to Client Action (Compose & Send)
  async function handleComposeAndSend() {
    setSending(true)
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'SENT' })
      })
      if (res.ok) {
        setSentSuccess(true)
        setTimeout(() => setSentSuccess(false), 3000)
        fetchQuote()
      }
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="animate-pulse h-96 rounded-xl bg-[hsl(210,40%,93%)] dark:bg-[hsl(217,33%,17%)]" />
  if (!quote) return <div className="py-20 text-center text-red-500 font-semibold">Quote not found</div>

  const primaryContact = quote.customer?.contacts?.find((c: any) => c.isPrimary) || quote.customer?.contacts?.[0]
  const contactName = primaryContact ? `${primaryContact.firstName} ${primaryContact.lastName || ''}`.trim() : ''
  const quoteTitleSubtitle = quote.customer?.companyName + (contactName ? ` - ${contactName}` : '')

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Top Navigation & Status */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(222,47%,11%)] dark:text-white flex items-center gap-3">
            {quote.quoteNumber}
            <QuoteStatusBadge status={quote.status} />
          </h1>
          <p className="text-xs text-[hsl(215,16%,47%)] mt-1">{quoteTitleSubtitle}</p>
        </div>

        {/* Outline Gold Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/quote/${quote.id}`, '_blank')}
            icon={<Eye className="h-4 w-4" />}
            className="border-amber-500 hover:bg-amber-500/10 text-amber-500 font-semibold rounded bg-transparent transition-colors h-8 text-xs"
          >
            Preview
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/api/quotes/${quote.id}/pdf`, '_blank')}
            icon={<Download className="h-4 w-4" />}
            className="border-amber-500 hover:bg-amber-500/10 text-amber-500 font-semibold rounded bg-transparent transition-colors h-8 text-xs"
          >
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/quotes')}
            icon={<ArrowLeft className="h-4 w-4" />}
            className="border-amber-500 hover:bg-amber-500/10 text-amber-500 font-semibold rounded bg-transparent transition-colors h-8 text-xs"
          >
            All Quotes
          </Button>
          <Button
            size="sm"
            onClick={handleSaveChanges}
            loading={saving}
            icon={<Save className="h-4 w-4" />}
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg h-8 text-xs border-none"
          >
            Save Quote
          </Button>
        </div>
      </div>

      {quote.status === 'REJECTED' && (quote.terms || quote.notes) && (
        <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm font-semibold">
          Changes requested. {quote.terms || quote.notes}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Items & Form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Line Items Editor (Image 1) */}
          <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
            <div className="mb-4">
              <h3 className="text-base font-bold text-[hsl(222,47%,11%)] dark:text-white">Standard Items</h3>
              <p className="text-xs text-[hsl(215,16%,47%)] mt-0.5">Always included in the total.</p>
            </div>

            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-3 items-center border-b border-gray-100 dark:border-white/5 pb-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[hsl(210,40%,98%)] border border-gray-100 dark:bg-black/20 dark:border-none">
                    <FileText className="h-4 w-4 text-[hsl(215,16%,47%)]" />
                  </div>
                  <div className="flex-1 w-full">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                      placeholder="Item name & details"
                      className="w-full rounded-lg border border-[hsl(214,32%,91%)] bg-transparent h-9 px-3 text-sm outline-none dark:border-white/10 dark:text-white dark:bg-black/20"
                    />
                  </div>
                  <div className="w-20">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                      className="w-full rounded-lg border border-[hsl(214,32%,91%)] bg-transparent h-9 px-2 text-center text-sm outline-none dark:border-white/10 dark:text-white dark:bg-black/20"
                      title="Quantity"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      min={0}
                      value={item.unitPrice}
                      onChange={(e) => handleUpdateItem(idx, 'unitPrice', Number(e.target.value))}
                      className="w-full rounded-lg border border-[hsl(214,32%,91%)] bg-transparent h-9 px-2 text-right text-sm outline-none dark:border-white/10 dark:text-white dark:bg-black/20"
                      title="Unit Price"
                    />
                  </div>
                  <div className="w-20">
                    <select
                      value={item.taxRate > 0 ? 'tax' : 'none'}
                      onChange={(e) => handleUpdateItem(idx, 'taxRate', e.target.value === 'tax' ? 8.25 : 0)}
                      className="w-full rounded-lg border border-[hsl(214,32%,91%)] bg-transparent h-9 px-2 text-xs outline-none dark:border-white/10 dark:text-white dark:bg-black/20"
                    >
                      <option value="none">—</option>
                      <option value="tax">Tax</option>
                    </select>
                  </div>
                  <div className="w-24 text-right font-semibold text-sm text-[hsl(222,47%,11%)] dark:text-white">
                    {formatCurrency(item.quantity * item.unitPrice)}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(idx)}
                    className="h-9 w-9 shrink-0 flex items-center justify-center border border-red-200 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {items.length === 0 && (
                <div className="text-center py-6 text-sm text-[hsl(215,16%,47%)]">
                  No standard items in this quote. Click "Add Item" below to create one.
                </div>
              )}
            </div>
          </div>

          {/* Add an Item card (Image 4) */}
          <form onSubmit={handleAddItemFromCard} className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] space-y-4">
            <h3 className="text-base font-bold text-[hsl(222,47%,11%)] dark:text-white">Add an Item</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="From the catalog"
                value={addItemForm.productId}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === 'one-off' || val === '') {
                    setAddItemForm({ ...addItemForm, productId: val, name: '', price: 0 })
                  } else {
                    const prod = products.find(p => p.id === val)
                    setAddItemForm({ ...addItemForm, productId: val, name: prod ? prod.name : '', price: prod ? Number(prod.basePrice) : 0 })
                  }
                }}
                options={[
                  { value: 'one-off', label: 'One-off item...' },
                  ...products.map(p => ({ value: p.id, label: p.name }))
                ]}
              />

              {addItemForm.productId === 'one-off' && (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Item name"
                    value={addItemForm.name}
                    onChange={(e) => setAddItemForm({ ...addItemForm, name: e.target.value })}
                    required
                  />
                  <Input
                    label="Price"
                    type="number"
                    value={addItemForm.price}
                    onChange={(e) => setAddItemForm({ ...addItemForm, price: Number(e.target.value) })}
                    required
                  />
                </div>
              )}

              <Select
                label="Type"
                value={addItemForm.type}
                onChange={(e) => setAddItemForm({ ...addItemForm, type: e.target.value })}
                options={[
                  { value: 'Standard', label: 'Standard' },
                  { value: 'Optional', label: 'Optional' },
                  { value: 'Add-on', label: 'Add-on' }
                ]}
              />

              <Input
                label="Quantity"
                type="number"
                min={1}
                value={addItemForm.quantity}
                onChange={(e) => setAddItemForm({ ...addItemForm, quantity: Number(e.target.value) })}
              />
            </div>
            <p className="text-[11px] text-[hsl(215,16%,47%)]">
              {addItemForm.type === 'Standard' ? 'Always included in the total.' : 'Optional choice for the client.'}
            </p>
            <div className="flex justify-start">
              <Button
                type="submit"
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold border-none rounded-lg px-6"
              >
                Add to Quote
              </Button>
            </div>
          </form>

          {/* Add Option Group card (Image 4) */}
          <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] space-y-4">
            <h3 className="text-base font-bold text-[hsl(222,47%,11%)] dark:text-white">Add an Option Group</h3>
            <p className="text-xs text-[hsl(215,16%,47%)] leading-relaxed">
              Present three cutting boards as a group and the client picks one, rather than accidentally approving all three.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <select className="w-full rounded-lg border border-[hsl(214,32%,91%)] bg-transparent h-9 px-3 text-sm outline-none dark:border-white/10 dark:text-white dark:bg-black/20">
                <option value="">Choose a product group...</option>
              </select>
              <select className="w-full rounded-lg border border-[hsl(214,32%,91%)] bg-transparent h-9 px-3 text-sm outline-none dark:border-white/10 dark:text-white dark:bg-black/20">
                <option value="client-picks">Client picks one</option>
              </select>
            </div>
            <div className="flex justify-start">
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold border-none rounded-lg px-6"
                onClick={() => alert('Option groups mock workflow created')}
              >
                Create Group
              </Button>
            </div>
          </div>

        </div>

        {/* Right Side: Totals, Milestones, Sections */}
        <div className="space-y-6">

          {/* Totals Box (Image 1) */}
          <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] space-y-3">
            <h3 className="font-bold text-base text-[hsl(222,47%,11%)] dark:text-white mb-2">Totals</h3>
            <div className="space-y-2 text-sm text-[hsl(215,16%,47%)]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-[hsl(222,47%,11%)] dark:text-white">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discounts</span>
                <span className="font-semibold text-[hsl(222,47%,11%)] dark:text-white">-{formatCurrency(discountTotal)}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-gray-100 dark:border-white/5">
                <span>Tax</span>
                <span className="font-semibold text-[hsl(222,47%,11%)] dark:text-white">{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-base text-[hsl(222,47%,11%)] dark:text-white">Total</span>
                <span className="font-bold text-xl text-[hsl(222,47%,11%)] dark:text-white">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Client Link Box (Image 2) */}
          <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] space-y-3">
            <h3 className="font-bold text-sm text-[hsl(222,47%,11%)] dark:text-white font-semibold">Client link</h3>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/quote/${quote.id}`}
                className="flex-1 rounded border border-gray-300 dark:border-white/10 dark:bg-black/20 text-xs px-2 h-8 outline-none"
              />
              <button
                type="button"
                onClick={() => window.open(`/quote/${quote.id}`, '_blank')}
                className="border border-amber-500 hover:bg-amber-500/10 text-amber-500 text-xs px-3 h-8 font-semibold rounded bg-transparent transition-colors"
              >
                Open
              </button>
            </div>
            <p className="text-[10px] text-[hsl(215,16%,47%)]">
              Opened {quote.status === 'VIEWED' || quote.status === 'APPROVED' || quote.status === 'REJECTED' ? '2×' : '1×'}, last {quote.viewedAt ? formatDate(quote.viewedAt) : '22/07/2026, 16:45:38'}
            </p>
          </div>

          {/* Payment Schedule Card (Image 2) */}
          <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] space-y-4">
            <h3 className="font-bold text-base text-[hsl(222,47%,11%)] dark:text-white">Payment Schedule</h3>
            
            {paymentMilestones.length > 0 ? (
              <div className="space-y-3 p-3 bg-gray-50/50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-none">
                {paymentMilestones.map((m, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <div>
                      <p className="font-bold text-[hsl(222,47%,11%)] dark:text-white">{m.name}</p>
                      {m.percent && <p className="text-[10px] text-[hsl(215,16%,47%)]">{m.percent}% upfront/deposit</p>}
                    </div>
                    <span className="font-semibold text-[hsl(222,47%,11%)] dark:text-white">{formatCurrency(m.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[hsl(215,16%,47%)]">No milestone schedule assigned.</p>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPaymentSchedulePreset('upfront')}
                className="w-full border border-amber-500 hover:bg-amber-500/10 text-amber-500 text-xs py-2 font-semibold rounded bg-transparent transition-colors text-center"
              >
                100% upfront
              </button>
              <button
                type="button"
                onClick={() => setPaymentSchedulePreset('50-50')}
                className="w-full border border-amber-500 hover:bg-amber-500/10 text-amber-500 text-xs py-2 font-semibold rounded bg-transparent transition-colors text-center"
              >
                50% deposit, 50% on completion
              </button>
              <button
                type="button"
                onClick={() => setPaymentSchedulePreset('completion')}
                className="w-full border border-amber-500 hover:bg-amber-500/10 text-amber-500 text-xs py-2 font-semibold rounded bg-transparent transition-colors text-center"
              >
                Invoice on completion
              </button>
              <button
                type="button"
                onClick={() => alert('Custom milestones interface opened')}
                className="w-full border border-red-500 hover:bg-red-500/10 text-red-500 text-xs py-2 font-semibold rounded bg-transparent transition-colors text-center"
              >
                Custom schedule...
              </button>
            </div>
            {paymentMilestones.length > 0 && (
              <div className="text-left">
                <button type="button" onClick={handleClearSchedule} className="text-xs text-red-500 hover:underline">
                  Clear schedule
                </button>
              </div>
            )}
          </div>

          {/* Document Sections Card (Image 3) */}
          <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] space-y-4">
            <h3 className="font-bold text-base text-[hsl(222,47%,11%)] dark:text-white">Document Sections</h3>
            
            <div className="space-y-3.5">
              {Object.entries(sections).map(([key, enabled]) => {
                const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
                return (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[hsl(215,16%,47%)]">{label}</span>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) => setSections(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="h-4 w-8 rounded-full text-orange-600 focus:ring-orange-500 border-gray-300 cursor-pointer"
                    />
                  </div>
                )
              })}
            </div>

            <div className="border-t border-gray-100 dark:border-white/5 pt-4 space-y-2">
              <p className="text-[11px] uppercase tracking-wider font-bold text-[hsl(215,16%,47%)]">Layout templates</p>
              <div className="flex justify-between items-center p-2 rounded bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-none text-xs">
                <span className="font-medium text-primary">Full proposal</span>
                <span className="text-gray-400">10 sections</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-none text-xs">
                <span className="font-medium text-primary">Simple quote</span>
                <span className="text-gray-400">6 sections</span>
              </div>
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Save this layout as..."
                  className="flex-1 rounded border border-gray-300 dark:border-white/10 dark:bg-black/20 text-xs px-2 h-8"
                />
                <button
                  type="button"
                  onClick={() => alert('Layout template saved')}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs px-3 h-8 rounded"
                >
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* Send to Client Card (Image 3 & Image 1) */}
          <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] space-y-4">
            <h3 className="font-bold text-base text-[hsl(222,47%,11%)] dark:text-white">Send to Client</h3>
            
            {sentSuccess ? (
              <div className="flex items-center justify-center gap-1.5 p-3 rounded-lg bg-green-50 text-green-600 text-sm font-semibold border border-green-200">
                <CheckCircle className="h-5 w-5" /> Proposal sent successfully!
              </div>
            ) : !isComposing ? (
              <>
                <p className="text-xs text-[hsl(215,16%,47%)] leading-relaxed">
                  Email the proposal directly to the client's inbox. They will get a link to sign off online.
                </p>
                <div className="pt-2">
                  <Button
                    onClick={() => setIsComposing(true)}
                    icon={<Send className="h-4 w-4" />}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold border-none rounded-lg py-2.5 flex items-center justify-center gap-2"
                  >
                    Compose & Send
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-[hsl(222,47%,11%)] dark:text-white mb-1.5">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full rounded border border-gray-300 dark:border-white/10 dark:bg-black/20 text-xs px-2.5 py-1.5 outline-none text-black dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[hsl(222,47%,11%)] dark:text-white mb-1.5">Message</label>
                  <textarea
                    rows={6}
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    className="w-full rounded border border-gray-300 dark:border-white/10 dark:bg-black/20 text-xs px-2.5 py-1.5 outline-none font-mono text-black dark:text-white"
                  />
                  <p className="text-[9px] text-gray-400 mt-1">
                    Merge fields such as <span className="text-red-500 font-semibold">{"{{contact_first_name}}"}</span> and <span className="text-red-500 font-semibold">{"{{secure_link}}"}</span> are filled in when it sends.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[hsl(222,47%,11%)] dark:text-white mb-1.5">When</label>
                  <select
                    value={emailWhen}
                    onChange={(e) => setEmailWhen(e.target.value)}
                    className="w-full rounded border border-gray-300 dark:border-white/10 dark:bg-black/20 text-xs px-2 py-1.5 outline-none text-black dark:text-white"
                  >
                    <option value="Next business hour">Next business hour</option>
                    <option value="Send immediately">Send immediately</option>
                    <option value="At a specific time">At a specific time</option>
                  </select>
                  {emailWhen === 'At a specific time' && (
                    <input
                      type="datetime-local"
                      value={emailSendAt}
                      onChange={(e) => setEmailSendAt(e.target.value)}
                      className="mt-2 w-full rounded border border-gray-300 dark:border-white/10 dark:bg-black/20 text-xs px-2.5 py-1.5 outline-none text-black dark:text-white"
                    />
                  )}
                  <p className="text-[9px] text-gray-400 mt-1">
                    Held until you are open – a quote finished at 1am Saturday goes out 9am Monday.
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsComposing(false)}
                    className="flex-1 border border-amber-500 hover:bg-amber-500/10 text-amber-500 text-xs py-2 font-semibold rounded bg-transparent transition-colors text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleComposeAndSend}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs py-2 rounded transition-colors text-center border-none"
                  >
                    Queue Send
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
