'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Box, CheckCircle, Package, Truck, FileText, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchOrder = () => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setOrder(json.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchOrder()
  }, [id])

  async function handleStatusChange(status: string) {
    await fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchOrder()
  }

  async function handleGenerateInvoice() {
    const res = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: id }),
    })
    const json = await res.json()
    if (json.success) {
      router.push(`/dashboard/invoices/${json.data.id}`)
    }
  }

  if (loading) return <div className="animate-pulse h-96 rounded-xl bg-[hsl(210,40%,93%)] dark:bg-[hsl(217,33%,17%)]" />
  if (!order) return <div className="py-20 text-center">Order not found</div>

  const statusList = [
    { value: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle },
    { value: 'IN_PRODUCTION', label: 'In Production', icon: Box },
    { value: 'QUALITY_CHECK', label: 'Quality Check', icon: Package },
    { value: 'READY', label: 'Ready', icon: Package },
    { value: 'SHIPPED', label: 'Shipped', icon: Truck },
    { value: 'DELIVERED', label: 'Delivered', icon: CheckCircle },
  ]

  const currentStatusIndex = statusList.findIndex(s => s.value === order.status)

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={() => router.push('/dashboard/orders')} className="flex items-center gap-1.5 text-sm text-[hsl(215,16%,47%)] hover:text-[hsl(222,47%,11%)] dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </button>
        {order.quoteId && (
          <Button variant="outline" size="sm" onClick={() => router.push(`/dashboard/quotes/${order.quoteId}`)} icon={<FileText className="h-4 w-4" />}>
            View Original Quote
          </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(222,47%,11%)] dark:text-white flex items-center gap-3">
            {order.orderNumber}
            <span className="text-sm px-2.5 py-1 bg-primary/10 text-primary rounded-full dark:bg-primary/20 dark:text-blue-400 font-medium">
              {order.status.replace('_', ' ')}
            </span>
          </h1>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleGenerateInvoice} icon={<Receipt className="h-4 w-4" />}>
            Generate Invoice
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8 rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] overflow-x-auto">
        <div className="min-w-[600px] flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-[hsl(214,32%,91%)] dark:bg-[hsl(217,33%,17%)] z-0 rounded" />
          {statusList.map((step, idx) => {
            const isCompleted = currentStatusIndex >= idx
            const isCurrent = currentStatusIndex === idx
            const Icon = step.icon
            return (
              <div key={step.value} className="relative z-10 flex flex-col items-center gap-2 group cursor-pointer" onClick={() => handleStatusChange(step.value)}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-colors ${isCompleted ? 'bg-primary border-white dark:border-[hsl(222,47%,11%)] text-white' : 'bg-[hsl(210,40%,98%)] border-[hsl(214,32%,91%)] dark:bg-[hsl(217,33%,17%)] dark:border-[hsl(217,33%,17%)] text-[hsl(215,16%,47%)]'} ${isCurrent ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-[hsl(222,47%,11%)]' : ''}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={`text-xs font-semibold ${isCompleted ? 'text-[hsl(222,47%,11%)] dark:text-white' : 'text-[hsl(215,16%,47%)]'}`}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(215,16%,47%)] mb-2">Customer Info</p>
                <p className="font-bold text-[hsl(222,47%,11%)] dark:text-white">{order.customer.companyName}</p>
                {order.customer.email && <p className="text-sm text-[hsl(215,16%,47%)]">{order.customer.email}</p>}
                {order.customer.billingAddress && <p className="text-sm text-[hsl(215,16%,47%)] mt-1">{order.customer.billingAddress}</p>}
                {(order.customer.billingCity || order.customer.billingCountry) && (
                  <p className="text-sm text-[hsl(215,16%,47%)]">
                    {[order.customer.billingCity, order.customer.billingCountry].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(215,16%,47%)]">Order Date</p>
                  <p className="text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white">{formatDate(order.createdAt)}</p>
                </div>
                {order.estimatedDelivery && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(215,16%,47%)]">Est. Delivery</p>
                    <p className="text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white">{formatDate(order.estimatedDelivery)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white shadow-sm overflow-hidden dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
            <div className="p-4 border-b border-[hsl(214,32%,91%)] dark:border-[hsl(217,33%,17%)]">
              <h3 className="font-semibold text-[hsl(222,47%,11%)] dark:text-white">Order Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[hsl(214,32%,91%)] bg-[hsl(210,40%,98%)] dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(217,33%,17%)]">
                    <th className="px-4 py-3 text-left font-semibold text-[hsl(215,16%,47%)]">Item</th>
                    <th className="px-4 py-3 text-right font-semibold text-[hsl(215,16%,47%)] w-24">Qty</th>
                    <th className="px-4 py-3 text-right font-semibold text-[hsl(215,16%,47%)] w-32">Price</th>
                    <th className="px-4 py-3 text-right font-semibold text-[hsl(215,16%,47%)] w-32">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(214,32%,91%)] dark:divide-[hsl(217,33%,17%)]">
                  {order.items.map((li: any) => (
                    <tr key={li.id}>
                      <td className="px-4 py-3">
                        {li.product && <p className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{li.product.name}</p>}
                        <p className={li.product ? "text-xs text-[hsl(215,16%,47%)]" : "font-medium text-[hsl(222,47%,11%)] dark:text-white"}>{li.description}</p>
                      </td>
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
                <span className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{formatCurrency(order.subtotal)}</span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between">
                  <span className="text-[hsl(215,16%,47%)]">Discount</span>
                  <span className="text-red-500">-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              {Number(order.taxAmount) > 0 && (
                <div className="flex justify-between border-b border-[hsl(214,32%,91%)] pb-3 dark:border-[hsl(217,33%,17%)]">
                  <span className="text-[hsl(215,16%,47%)]">Tax</span>
                  <span className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{formatCurrency(order.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2">
                <span className="font-bold text-base text-[hsl(222,47%,11%)] dark:text-white">Total</span>
                <span className="font-bold text-lg text-primary dark:text-blue-400">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
