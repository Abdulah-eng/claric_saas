'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, Download, FileText, Send, XCircle, Clock, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER')
  const [paymentNotes, setPaymentNotes] = useState('')

  const fetchInvoice = () => {
    fetch(`/api/invoices/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setInvoice(json.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchInvoice()
  }, [id])

  async function handleStatusChange(status: string) {
    await fetch(`/api/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchInvoice()
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault()
    await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invoiceId: id,
        amount: Number(paymentAmount),
        method: paymentMethod,
        notes: paymentNotes
      }),
    })
    setShowPaymentModal(false)
    setPaymentAmount('')
    setPaymentNotes('')
    fetchInvoice()
  }

  if (loading) return <div className="animate-pulse h-96 rounded-xl bg-[hsl(210,40%,93%)] dark:bg-[hsl(217,33%,17%)]" />
  if (!invoice) return <div className="py-20 text-center">Invoice not found</div>

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400',
    SENT: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    PARTIALLY_PAID: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
    PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
    OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
    CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400',
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={() => router.push('/dashboard/invoices')} className="flex items-center gap-1.5 text-sm text-[hsl(215,16%,47%)] hover:text-[hsl(222,47%,11%)] dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Invoices
        </button>
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(222,47%,11%)] dark:text-white flex items-center gap-3">
            {invoice.invoiceNumber}
            <span className={`text-sm px-2.5 py-1 rounded-full font-medium ${statusColors[invoice.status] || statusColors.DRAFT}`}>
              {invoice.status.replace('_', ' ')}
            </span>
          </h1>
          {invoice.orderId && (
            <p className="text-sm text-[hsl(215,16%,47%)] mt-2">
              Related to Order: <span className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{invoice.order?.orderNumber}</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {invoice.status === 'DRAFT' && (
            <Button size="sm" onClick={() => handleStatusChange('SENT')} icon={<Send className="h-4 w-4" />}>
              Mark as Sent
            </Button>
          )}
          {invoice.status === 'SENT' && (
            <Button size="sm" onClick={() => handleStatusChange('PAID')} icon={<CheckCircle className="h-4 w-4" />}>
              Mark as Paid
            </Button>
          )}
          {Number(invoice.amountDue) > 0 && invoice.status !== 'CANCELLED' && (
            <Button size="sm" onClick={() => setShowPaymentModal(true)} icon={<CreditCard className="h-4 w-4" />}>
              Record Payment
            </Button>
          )}
          {(invoice.status === 'DRAFT' || invoice.status === 'SENT' || invoice.status === 'OVERDUE') && (
            <Button size="sm" variant="destructive" onClick={() => handleStatusChange('CANCELLED')} icon={<XCircle className="h-4 w-4" />}>
              Cancel Invoice
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => window.open(`/api/invoices/${invoice.id}/pdf`, '_blank')} icon={<Download className="h-4 w-4" />}>
            Download PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(215,16%,47%)] mb-2">Billed To</p>
                <p className="font-bold text-[hsl(222,47%,11%)] dark:text-white">{invoice.customer.companyName}</p>
                {invoice.customer.email && <p className="text-sm text-[hsl(215,16%,47%)]">{invoice.customer.email}</p>}
                {invoice.customer.billingAddress && <p className="text-sm text-[hsl(215,16%,47%)] mt-1">{invoice.customer.billingAddress}</p>}
                {(invoice.customer.billingCity || invoice.customer.billingCountry) && (
                  <p className="text-sm text-[hsl(215,16%,47%)]">
                    {[invoice.customer.billingCity, invoice.customer.billingState, invoice.customer.billingCountry].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(215,16%,47%)]">Issue Date</p>
                  <p className="text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white">{formatDate(invoice.issueDate)}</p>
                </div>
                {invoice.dueDate && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(215,16%,47%)]">Due Date</p>
                    <p className="text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white">{formatDate(invoice.dueDate)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white shadow-sm overflow-hidden dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
            <div className="p-4 border-b border-[hsl(214,32%,91%)] dark:border-[hsl(217,33%,17%)]">
              <h3 className="font-semibold text-[hsl(222,47%,11%)] dark:text-white">Items</h3>
            </div>
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
                  {invoice.items.map((li: any) => (
                    <tr key={li.id}>
                      <td className="px-4 py-3 font-medium text-[hsl(222,47%,11%)] dark:text-white">{li.description}</td>
                      <td className="px-4 py-3 text-right text-[hsl(215,16%,47%)]">{Number(li.quantity)}</td>
                      <td className="px-4 py-3 text-right text-[hsl(215,16%,47%)]">{formatCurrency(li.unitPrice)}</td>
                      <td className="px-4 py-3 text-right font-medium text-[hsl(222,47%,11%)] dark:text-white">{formatCurrency(li.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Summary */}
          <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-[hsl(210,40%,98%)] p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(217,33%,17%)]">
            <h3 className="mb-4 font-semibold text-[hsl(222,47%,11%)] dark:text-white">Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[hsl(215,16%,47%)]">Subtotal</span>
                <span className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {Number(invoice.discountAmount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-[hsl(215,16%,47%)]">Discount</span>
                  <span className="text-red-500">-{formatCurrency(invoice.discountAmount)}</span>
                </div>
              )}
              {Number(invoice.taxAmount) > 0 && (
                <div className="flex justify-between border-b border-[hsl(214,32%,91%)] pb-3 dark:border-[hsl(217,33%,17%)]">
                  <span className="text-[hsl(215,16%,47%)]">Tax</span>
                  <span className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2">
                <span className="font-bold text-base text-[hsl(222,47%,11%)] dark:text-white">Total</span>
                <span className="font-bold text-lg text-[hsl(222,47%,11%)] dark:text-white">{formatCurrency(invoice.total)}</span>
              </div>
              
              <div className="flex justify-between pt-4 border-t border-[hsl(214,32%,91%)] dark:border-[hsl(217,33%,17%)] mt-2">
                <span className="font-semibold text-[hsl(215,16%,47%)]">Amount Paid</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatCurrency(invoice.amountPaid)}</span>
              </div>
              <div className="flex justify-between p-3 mt-2 bg-red-50 dark:bg-red-500/10 rounded-lg">
                <span className="font-bold text-red-600 dark:text-red-400">Amount Due</span>
                <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(invoice.amountDue)}</span>
              </div>
            </div>
          </div>
          
          {invoice.payments?.length > 0 && (
            <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] mt-6">
              <div className="p-4 border-b border-[hsl(214,32%,91%)] dark:border-[hsl(217,33%,17%)]">
                <h3 className="font-semibold text-[hsl(222,47%,11%)] dark:text-white">Payments</h3>
              </div>
              <div className="divide-y divide-[hsl(214,32%,91%)] dark:divide-[hsl(217,33%,17%)]">
                {invoice.payments.map((pmt: any) => (
                  <div key={pmt.id} className="p-4 flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{pmt.method.replace('_', ' ')}</p>
                      <p className="text-xs text-[hsl(215,16%,47%)]">{formatDate(pmt.createdAt)} {pmt.notes && `- ${pmt.notes}`}</p>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(pmt.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showPaymentModal && (
        <Modal open={showPaymentModal} title="Record Payment" onClose={() => setShowPaymentModal(false)}>
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-1">Amount</label>
              <input
                type="number"
                step="0.01"
                max={invoice.amountDue}
                required
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
                className="w-full rounded-md border border-[hsl(214,32%,91%)] bg-white px-3 py-2 text-sm outline-none dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]"
                placeholder={invoice.amountDue.toString()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-1">Method</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full rounded-md border border-[hsl(214,32%,91%)] bg-white px-3 py-2 text-sm outline-none dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]"
              >
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="STRIPE">Credit Card (Stripe)</option>
                <option value="SQUARE">Credit Card (Square)</option>
                <option value="CASH">Cash</option>
                <option value="CHECK">Check</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-1">Notes (Optional)</label>
              <textarea
                value={paymentNotes}
                onChange={e => setPaymentNotes(e.target.value)}
                className="w-full rounded-md border border-[hsl(214,32%,91%)] bg-white px-3 py-2 text-sm outline-none dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowPaymentModal(false)}>Cancel</Button>
              <Button type="submit">Record Payment</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
