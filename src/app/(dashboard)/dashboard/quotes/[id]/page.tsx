'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, Send, CheckCircle, XCircle, FileText, Edit, Copy, Box } from 'lucide-react'
import { PageHeader } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { QuoteStatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [quote, setQuote] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchQuote = () => {
    fetch(`/api/quotes/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setQuote(json.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchQuote()
  }, [id])

  async function handleStatusChange(status: string) {
    await fetch(`/api/quotes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchQuote()
  }

  async function handleCreateOrder() {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: id }),
    })
    const json = await res.json()
    if (json.success) {
      router.push(`/dashboard/orders/${json.data.id}`)
    }
  }

  if (loading) return <div className="animate-pulse h-96 rounded-xl bg-[hsl(210,40%,93%)] dark:bg-[hsl(217,33%,17%)]" />
  if (!quote) return <div className="py-20 text-center">Quote not found</div>

  const publicLink = `${window.location.origin}/quote/${quote.id}`

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-4">
        <button type="button" onClick={() => router.push('/dashboard/quotes')} className="flex items-center gap-1.5 text-sm text-[hsl(215,16%,47%)] hover:text-[hsl(222,47%,11%)] dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Quotes
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-[hsl(222,47%,11%)] dark:text-white">{quote.quoteNumber}</h1>
            <QuoteStatusBadge status={quote.status} />
          </div>
          {quote.title && <p className="text-sm text-[hsl(215,16%,47%)]">{quote.title}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {quote.status === 'DRAFT' && (
            <Button size="sm" onClick={() => handleStatusChange('SENT')} icon={<Send className="h-4 w-4" />}>
              Mark as Sent
            </Button>
          )}
          {['SENT', 'VIEWED'].includes(quote.status) && (
            <>
              <Button size="sm" variant="outline" onClick={() => handleStatusChange('APPROVED')} icon={<CheckCircle className="h-4 w-4 text-emerald-500" />}>
                Approve
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleStatusChange('REJECTED')} icon={<XCircle className="h-4 w-4 text-red-500" />}>
                Reject
              </Button>
            </>
          )}
          {quote.status === 'APPROVED' && !quote.order && (
            <Button size="sm" onClick={handleCreateOrder} icon={<Box className="h-4 w-4" />}>
              Create Order
            </Button>
          )}
          {quote.order && (
            <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/orders/${quote.order.id}`)} icon={<Box className="h-4 w-4" />}>
              View Order
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => window.open(`/api/quotes/${quote.id}/pdf`, '_blank')} icon={<Download className="h-4 w-4" />}>
            Download PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Details */}
          <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(215,16%,47%)] mb-2">Prepared For</p>
                <p className="font-bold text-[hsl(222,47%,11%)] dark:text-white">{quote.customer.companyName}</p>
                {quote.customer.email && <p className="text-sm text-[hsl(215,16%,47%)]">{quote.customer.email}</p>}
                {quote.customer.billingAddress && <p className="text-sm text-[hsl(215,16%,47%)] mt-1">{quote.customer.billingAddress}</p>}
                {(quote.customer.billingCity || quote.customer.billingCountry) && (
                  <p className="text-sm text-[hsl(215,16%,47%)]">
                    {[quote.customer.billingCity, quote.customer.billingState, quote.customer.billingCountry].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(215,16%,47%)]">Created Date</p>
                  <p className="text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white">{formatDate(quote.createdAt)}</p>
                </div>
                {quote.validUntil && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(215,16%,47%)]">Valid Until</p>
                    <p className="text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white">{formatDate(quote.validUntil)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white shadow-sm overflow-hidden dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(214,32%,91%)] bg-[hsl(210,40%,98%)] dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(217,33%,17%)]">
                    <th className="px-4 py-3 text-left font-semibold text-[hsl(215,16%,47%)]">Description</th>
                    <th className="px-4 py-3 text-right font-semibold text-[hsl(215,16%,47%)] w-24">Qty</th>
                    <th className="px-4 py-3 text-right font-semibold text-[hsl(215,16%,47%)] w-32">Price</th>
                    <th className="px-4 py-3 text-right font-semibold text-[hsl(215,16%,47%)] w-32">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(214,32%,91%)] dark:divide-[hsl(217,33%,17%)]">
                  {quote.items.map((li: any) => (
                    <tr key={li.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {(li.imageUrl || li.product?.imageUrls?.[0]) ? (
                            <img src={li.imageUrl || li.product.imageUrls[0]} alt="Product" className="h-10 w-10 shrink-0 rounded-xl object-cover bg-[hsl(210,40%,96%)] dark:bg-[hsl(217,33%,17%)] border border-[hsl(214,32%,91%)] dark:border-white/10" />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(210,40%,96%)] dark:bg-[hsl(217,33%,17%)] border border-[hsl(214,32%,91%)] dark:border-white/10">
                              <Box className="h-4 w-4 text-[hsl(215,16%,47%)]" />
                            </div>
                          )}
                          <div>
                            {li.product && <p className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{li.product.name}</p>}
                            <p className={li.product ? "text-xs text-[hsl(215,16%,47%)]" : "font-medium text-[hsl(222,47%,11%)] dark:text-white"}>{li.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-[hsl(215,16%,47%)]">{li.quantity}</td>
                      <td className="px-4 py-3 text-right text-[hsl(215,16%,47%)]">{formatCurrency(li.unitPrice)}</td>
                      <td className="px-4 py-3 text-right font-medium text-[hsl(222,47%,11%)] dark:text-white">{formatCurrency(li.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {(quote.notes || quote.terms) && (
            <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] space-y-6">
              {quote.notes && (
                <div>
                  <h4 className="text-sm font-semibold text-[hsl(222,47%,11%)] dark:text-white mb-2">Notes</h4>
                  <p className="text-sm text-[hsl(215,16%,47%)] whitespace-pre-wrap">{quote.notes}</p>
                </div>
              )}
              {quote.terms && (
                <div>
                  <h4 className="text-sm font-semibold text-[hsl(222,47%,11%)] dark:text-white mb-2">Terms and Conditions</h4>
                  <p className="text-sm text-[hsl(215,16%,47%)] whitespace-pre-wrap">{quote.terms}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Link Sharing */}
          <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-5 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
            <h3 className="mb-3 text-sm font-semibold text-[hsl(222,47%,11%)] dark:text-white">Customer Portal Link</h3>
            <p className="text-xs text-[hsl(215,16%,47%)] mb-3">Share this link with your customer so they can view and approve the quote online.</p>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly 
                value={publicLink} 
                className="w-full rounded-md border border-[hsl(214,32%,91%)] bg-[hsl(210,40%,98%)] px-3 py-1.5 text-xs text-[hsl(215,16%,47%)] outline-none dark:border-[hsl(217,33%,17%)] dark:bg-black/20"
              />
              <Button size="sm" variant="outline" onClick={() => {
                navigator.clipboard.writeText(publicLink)
                alert('Link copied to clipboard')
              }} icon={<Copy className="h-3.5 w-3.5" />}>Copy</Button>
            </div>
          </div>

          {/* Totals */}
          <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-[hsl(210,40%,98%)] p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(217,33%,17%)]">
            <h3 className="mb-4 font-semibold text-[hsl(222,47%,11%)] dark:text-white">Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[hsl(215,16%,47%)]">Subtotal</span>
                <span className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{formatCurrency(quote.subtotal)}</span>
              </div>
              {Number(quote.discountAmount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-[hsl(215,16%,47%)]">Discount</span>
                  <span className="text-red-500">-{formatCurrency(quote.discountAmount)}</span>
                </div>
              )}
              {Number(quote.taxAmount) > 0 && (
                <div className="flex justify-between border-b border-[hsl(214,32%,91%)] pb-3 dark:border-[hsl(217,33%,17%)]">
                  <span className="text-[hsl(215,16%,47%)]">Tax</span>
                  <span className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{formatCurrency(quote.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2">
                <span className="font-bold text-base text-[hsl(222,47%,11%)] dark:text-white">Total</span>
                <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{formatCurrency(quote.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
