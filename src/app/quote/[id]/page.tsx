'use client'

import { useState, useEffect, use } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { QuoteStatusBadge } from '@/components/ui/badge'
import { FileText, Download, CheckCircle, XCircle, MessageSquare, Landmark, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function PublicQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  
  const [quote, setQuote] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Interactive State
  const [showRequestChanges, setShowRequestChanges] = useState(false)
  const [changesReason, setChangesReason] = useState('')
  const [submittingAction, setSubmittingAction] = useState(false)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

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
    
    // Register viewed flag on public open
    fetch(`/api/quotes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'VIEWED' })
    }).catch(() => {})
  }, [id])

  async function handleApprove() {
    setSubmittingAction(true)
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' })
      })
      if (res.ok) {
        setActionSuccess('APPROVED')
        fetchQuote()
      }
    } finally {
      setSubmittingAction(false)
    }
  }

  async function handleDecline() {
    if (!confirm('Are you sure you want to decline this proposal?')) return
    setSubmittingAction(true)
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', notes: 'Client declined proposal.' })
      })
      if (res.ok) {
        setActionSuccess('DECLINED')
        fetchQuote()
      }
    } finally {
      setSubmittingAction(false)
    }
  }

  async function handleSendChangesRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!changesReason.trim()) return
    setSubmittingAction(true)
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'REJECTED',
          terms: changesReason
        })
      })
      if (res.ok) {
        setActionSuccess('CHANGES')
        setShowRequestChanges(false)
        setChangesReason('')
        fetchQuote()
      }
    } finally {
      setSubmittingAction(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(210,40%,98%)] dark:bg-[hsl(222,47%,11%)] flex items-center justify-center">
        <div className="animate-pulse w-full max-w-4xl h-[600px] rounded-2xl bg-white dark:bg-[hsl(217,33%,17%)]" />
      </div>
    )
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-[hsl(210,40%,98%)] dark:bg-[hsl(222,47%,11%)] flex items-center justify-center text-center p-4">
        <p className="text-red-500 font-semibold">Proposal not found or is inactive.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[hsl(210,40%,98%)] dark:bg-[hsl(222,47%,11%)] py-12 px-4 pb-32">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Bar with premium orange-red highlights */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-[hsl(217,33%,17%)] p-6 rounded-2xl shadow-sm border border-l-4 border-l-orange-500 border-[hsl(214,32%,91%)] dark:border-white/5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-500/10 text-orange-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[hsl(215,16%,47%)]">{quote.tenant?.name || 'CRM'}</p>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[hsl(222,47%,11%)] dark:text-white">{quote.quoteNumber}</h1>
                <QuoteStatusBadge status={quote.status} />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              className="flex-1 sm:flex-none border-orange-500 text-orange-500 hover:bg-orange-500/10 hover:text-orange-600 font-semibold"
              onClick={() => window.open(`/api/quotes/${quote.id}/pdf`, '_blank')}
            >
              <Download className="h-4 w-4 mr-2" /> PDF
            </Button>
          </div>
        </div>

        {/* Document Body with orange accents */}
        <div className="bg-white dark:bg-[hsl(217,33%,17%)] rounded-2xl shadow-sm border-t-4 border-orange-600 border border-[hsl(214,32%,91%)] dark:border-white/5 overflow-hidden">
          
          {/* Top Banner Accent */}
          <div className="bg-gradient-to-r from-orange-500/10 to-transparent px-8 sm:px-12 py-4 border-b border-orange-500/10 flex items-center justify-between">
            <span className="text-xs font-bold text-orange-700 dark:text-orange-400 tracking-widest uppercase">Proposal Agreement</span>
            <span className="text-xs text-[hsl(215,16%,47%)]">Status: {quote.status}</span>
          </div>

          <div className="p-8 sm:p-12">
            <div className="flex justify-between items-start mb-12">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(215,16%,47%)] mb-2">Prepared For</p>
                <p className="font-bold text-lg text-[hsl(222,47%,11%)] dark:text-white">{quote.customer?.companyName}</p>
                {quote.customer?.billingAddress && <p className="text-[hsl(215,16%,47%)]">{quote.customer.billingAddress}</p>}
                {(quote.customer?.billingCity || quote.customer?.billingCountry) && (
                  <p className="text-[hsl(215,16%,47%)]">
                    {[quote.customer.billingCity, quote.customer.billingState, quote.customer.billingCountry].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(215,16%,47%)] mb-2">Quote Details</p>
                <p className="text-[hsl(215,16%,47%)]"><span className="font-medium text-[hsl(222,47%,11%)] dark:text-white">Date:</span> {formatDate(quote.createdAt)}</p>
                {quote.validUntil && <p className="text-[hsl(215,16%,47%)] mt-1"><span className="font-medium text-[hsl(222,47%,11%)] dark:text-white">Valid Until:</span> {formatDate(quote.validUntil)}</p>}
              </div>
            </div>

            {/* Table Area */}
            <div className="mb-12 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-orange-500/20 dark:border-white/10 pb-3">
                    <th className="py-3 text-left font-semibold text-[hsl(215,16%,47%)]">Description</th>
                    <th className="py-3 text-right font-semibold text-[hsl(215,16%,47%)] w-24">Qty</th>
                    <th className="py-3 text-right font-semibold text-[hsl(215,16%,47%)] w-32">Unit Price</th>
                    <th className="py-3 text-right font-semibold text-[hsl(215,16%,47%)] w-32">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(214,32%,91%)] dark:divide-white/10">
                  {quote.items?.map((li: any) => (
                    <tr key={li.id}>
                      <td className="py-4">
                        <div className="flex items-center gap-4">
                          {(li.imageUrl || li.product?.imageUrls?.[0]) && (
                            <img src={li.imageUrl || li.product.imageUrls[0]} alt="Product" className="h-12 w-12 shrink-0 rounded-xl object-cover bg-[hsl(210,40%,96%)] dark:bg-[hsl(217,33%,17%)] border border-[hsl(214,32%,91%)] dark:border-white/10" />
                          )}
                          <div>
                            {li.product && <p className="font-semibold text-[hsl(222,47%,11%)] dark:text-white mb-1">{li.product.name}</p>}
                            <p className="text-[hsl(215,16%,47%)]">{li.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-right text-[hsl(215,16%,47%)]">
                        {Number(li.quantity)}
                      </td>
                      <td className="py-4 text-right text-[hsl(215,16%,47%)]">{formatCurrency(Number(li.unitPrice))}</td>
                      <td className="py-4 text-right font-semibold text-[hsl(222,47%,11%)] dark:text-white">{formatCurrency(Number(li.total))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Payment Milestones/Schedule Box inside Receipt */}
            {quote.paymentMilestones && quote.paymentMilestones.length > 0 && (
              <div className="mb-12 border-t border-orange-500/10 pt-8">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-[hsl(215,16%,47%)] mb-4 flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-orange-500" /> Payment Schedule
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quote.paymentMilestones.map((m: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-4 bg-orange-500/5 rounded-xl border border-orange-500/10 text-sm">
                      <div>
                        <p className="font-bold text-[hsl(222,47%,11%)] dark:text-white">{m.name}</p>
                        {m.percent && <p className="text-[10px] text-[hsl(215,16%,47%)]">{Number(m.percent)}% upfront</p>}
                      </div>
                      <span className="font-bold text-orange-600 dark:text-orange-400">{formatCurrency(Number(m.amount))}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Feedbacks Column */}
            <div className="flex flex-col sm:flex-row justify-between gap-12 border-t border-orange-500/10 pt-8">
              <div className="flex-1 space-y-8">
                {quote.notes && (
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-[hsl(215,16%,47%)] mb-2">Notes</h4>
                    <p className="text-[hsl(215,16%,47%)] whitespace-pre-wrap">{quote.notes}</p>
                  </div>
                )}
                {quote.terms && (
                  <div>
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-[hsl(215,16%,47%)] mb-2">Terms & Conditions</h4>
                    <p className="text-[hsl(215,16%,47%)] text-sm whitespace-pre-wrap">{quote.terms}</p>
                  </div>
                )}
              </div>

              {/* Totals Summary */}
              <div className="w-full sm:w-72 space-y-3 bg-orange-500/5 dark:bg-black/20 p-6 rounded-xl border border-orange-500/10">
                <div className="flex justify-between text-[hsl(215,16%,47%)]">
                  <span>Subtotal</span>
                  <span className="font-semibold text-[hsl(222,47%,11%)] dark:text-white">{formatCurrency(Number(quote.subtotal))}</span>
                </div>
                {Number(quote.discountAmount) > 0 && (
                  <div className="flex justify-between text-[hsl(215,16%,47%)]">
                    <span>Discount</span>
                    <span className="text-red-500">-{formatCurrency(Number(quote.discountAmount))}</span>
                  </div>
                )}
                {Number(quote.taxAmount) > 0 && (
                  <div className="flex justify-between text-[hsl(215,16%,47%)] border-b border-orange-500/10 pb-3">
                    <span>Tax</span>
                    <span className="font-semibold text-[hsl(222,47%,11%)] dark:text-white">{formatCurrency(Number(quote.taxAmount))}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2">
                  <span className="font-bold text-lg text-[hsl(222,47%,11%)] dark:text-white">Total</span>
                  <span className="font-extrabold text-xl text-orange-600 dark:text-orange-400">{formatCurrency(Number(quote.total))}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Sticky Bottom Actions Bar (Image 1) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg flex flex-col items-center gap-4 dark:bg-[hsl(222,47%,11%)] dark:border-white/10 z-50">
        <div className="max-w-4xl w-full flex items-center justify-between">
          <div className="flex gap-2">
            {['SENT', 'VIEWED', 'REJECTED'].includes(quote.status) && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={submittingAction}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors shadow-md"
                >
                  Approve this quote
                </button>
                <button
                  onClick={() => setShowRequestChanges(!showRequestChanges)}
                  className="border border-orange-500 hover:bg-orange-500/10 text-orange-500 font-semibold text-sm px-5 py-2.5 rounded-lg bg-transparent transition-colors"
                >
                  Request changes
                </button>
                <button
                  onClick={handleDecline}
                  disabled={submittingAction}
                  className="border border-gray-300 hover:bg-gray-50 text-gray-700 dark:text-white dark:hover:bg-white/5 font-semibold text-sm px-5 py-2.5 rounded-lg bg-transparent transition-colors"
                >
                  Decline
                </button>
              </>
            )}
            <button
              onClick={() => window.open(`/api/quotes/${quote.id}/pdf`, '_blank')}
              className="border border-orange-500 hover:bg-orange-500/10 text-orange-500 font-semibold text-sm px-5 py-2.5 rounded-lg bg-transparent transition-colors"
            >
              Download PDF
            </button>
          </div>

          <div className="text-right font-extrabold text-xl text-orange-600 dark:text-orange-400">
            Total {formatCurrency(Number(quote.total))}
          </div>
        </div>

        {/* Expandable Request Changes Form Panel */}
        {showRequestChanges && (
          <form onSubmit={handleSendChangesRequest} className="max-w-4xl w-full border-t border-gray-100 dark:border-white/5 pt-4 space-y-3">
            <h4 className="font-bold text-sm text-[hsl(222,47%,11%)] dark:text-white">Request changes</h4>
            <textarea
              required
              rows={3}
              value={changesReason}
              onChange={(e) => setChangesReason(e.target.value)}
              placeholder="Tell us what you would like changed..."
              className="w-full rounded-lg border border-[hsl(214,32%,91%)] bg-transparent px-3 py-2 text-sm outline-none focus:border-orange-500 dark:border-white/10 dark:text-white"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={submittingAction}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
              >
                {submittingAction ? 'Sending...' : 'Send request'}
              </button>
              <button
                type="button"
                onClick={() => setShowRequestChanges(false)}
                className="border border-gray-300 hover:bg-gray-50 text-gray-700 dark:text-white dark:hover:bg-white/5 font-semibold text-sm px-4 py-2 rounded-lg bg-transparent"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {actionSuccess && (
          <div className="text-xs font-semibold text-emerald-600 bg-green-50 px-4 py-1.5 rounded-full border border-green-200">
            {actionSuccess === 'APPROVED' ? 'Quote accepted! We are processing your request.' :
             actionSuccess === 'CHANGES' ? 'Changes request sent! We will update the proposal shortly.' :
             'Proposal declined.'}
          </div>
        )}
      </div>
    </div>
  )
}
