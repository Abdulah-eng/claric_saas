'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Box, Receipt, ExternalLink, Activity } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function CustomerPortalPage({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = use(params)
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/portal/${customerId}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setCustomer(json.data)
      })
      .finally(() => setLoading(false))
  }, [customerId])

  if (loading) return <div className="min-h-screen bg-[hsl(210,40%,98%)] p-8 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
  if (!customer) return <div className="min-h-screen bg-[hsl(210,40%,98%)] p-8 text-center text-red-500 font-medium">Customer portal not found.</div>

  return (
    <div className="min-h-screen bg-[hsl(210,40%,98%)] dark:bg-[hsl(222,47%,8%)]">
      <header className="bg-white dark:bg-[hsl(222,47%,11%)] border-b border-[hsl(214,32%,91%)] dark:border-white/5 py-4 px-8 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
              {customer.companyName.charAt(0)}
            </div>
            <div>
              <h1 className="font-bold text-xl text-[hsl(222,47%,11%)] dark:text-white">{customer.companyName}</h1>
              <p className="text-xs text-[hsl(215,16%,47%)]">Customer Portal</p>
            </div>
          </div>
          <a href={`mailto:${customer.email}`} className="text-sm text-blue-600 hover:underline">Contact Support</a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8 space-y-8">
        
        {/* Active Orders Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[hsl(217,33%,17%)] p-6 rounded-2xl shadow-sm border border-[hsl(214,32%,91%)] dark:border-white/5">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-blue-100 dark:bg-blue-500/20 p-3 rounded-xl text-blue-600 dark:text-blue-400">
                <Box className="h-6 w-6" />
              </div>
            </div>
            <h3 className="text-[hsl(215,16%,47%)] text-sm font-medium mb-1">Active Orders</h3>
            <p className="text-3xl font-bold text-[hsl(222,47%,11%)] dark:text-white">
              {customer.orders.filter((o: any) => !['DELIVERED', 'CANCELLED'].includes(o.status)).length}
            </p>
          </div>

          <div className="bg-white dark:bg-[hsl(217,33%,17%)] p-6 rounded-2xl shadow-sm border border-[hsl(214,32%,91%)] dark:border-white/5">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-orange-100 dark:bg-orange-500/20 p-3 rounded-xl text-orange-600 dark:text-orange-400">
                <FileText className="h-6 w-6" />
              </div>
            </div>
            <h3 className="text-[hsl(215,16%,47%)] text-sm font-medium mb-1">Pending Quotes</h3>
            <p className="text-3xl font-bold text-[hsl(222,47%,11%)] dark:text-white">
              {customer.quotes.filter((q: any) => q.status === 'SENT').length}
            </p>
          </div>

          <div className="bg-white dark:bg-[hsl(217,33%,17%)] p-6 rounded-2xl shadow-sm border border-[hsl(214,32%,91%)] dark:border-white/5">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-red-100 dark:bg-red-500/20 p-3 rounded-xl text-red-600 dark:text-red-400">
                <Receipt className="h-6 w-6" />
              </div>
            </div>
            <h3 className="text-[hsl(215,16%,47%)] text-sm font-medium mb-1">Unpaid Invoices</h3>
            <p className="text-3xl font-bold text-[hsl(222,47%,11%)] dark:text-white">
              {customer.invoices.filter((i: any) => Number(i.amountDue) > 0 && i.status !== 'CANCELLED').length}
            </p>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-[hsl(217,33%,17%)] rounded-2xl shadow-sm border border-[hsl(214,32%,91%)] dark:border-white/5 overflow-hidden">
          <div className="p-6 border-b border-[hsl(214,32%,91%)] dark:border-white/5 flex justify-between items-center">
            <h2 className="text-lg font-bold text-[hsl(222,47%,11%)] dark:text-white flex items-center gap-2">
              <Box className="h-5 w-5 text-blue-500" /> Recent Orders
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[hsl(210,40%,98%)] dark:bg-black/20 text-[hsl(215,16%,47%)] font-medium">
                <tr>
                  <th className="px-6 py-4">Order #</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(214,32%,91%)] dark:divide-white/5">
                {customer.orders.length > 0 ? customer.orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-[hsl(210,40%,98%)] dark:hover:bg-black/10 transition-colors">
                    <td className="px-6 py-4 font-semibold text-[hsl(222,47%,11%)] dark:text-white">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-[hsl(215,16%,47%)]">{formatDate(order.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400">
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-[hsl(222,47%,11%)] dark:text-white">{formatCurrency(order.total)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-[hsl(215,16%,47%)]">No recent orders found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Quotes */}
          <div className="bg-white dark:bg-[hsl(217,33%,17%)] rounded-2xl shadow-sm border border-[hsl(214,32%,91%)] dark:border-white/5 overflow-hidden">
            <div className="p-6 border-b border-[hsl(214,32%,91%)] dark:border-white/5">
              <h2 className="text-lg font-bold text-[hsl(222,47%,11%)] dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-orange-500" /> Recent Quotes
              </h2>
            </div>
            <div className="divide-y divide-[hsl(214,32%,91%)] dark:divide-white/5">
              {customer.quotes.length > 0 ? customer.quotes.map((quote: any) => (
                <div key={quote.id} className="p-4 px-6 flex justify-between items-center hover:bg-[hsl(210,40%,98%)] dark:hover:bg-black/10 transition-colors">
                  <div>
                    <p className="font-semibold text-[hsl(222,47%,11%)] dark:text-white">{quote.quoteNumber}</p>
                    <p className="text-xs text-[hsl(215,16%,47%)]">{formatDate(quote.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{formatCurrency(quote.total)}</span>
                    <a href={`/quote/${quote.id}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-500/10">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-[hsl(215,16%,47%)]">No quotes found.</div>
              )}
            </div>
          </div>

          {/* Invoices */}
          <div className="bg-white dark:bg-[hsl(217,33%,17%)] rounded-2xl shadow-sm border border-[hsl(214,32%,91%)] dark:border-white/5 overflow-hidden">
            <div className="p-6 border-b border-[hsl(214,32%,91%)] dark:border-white/5">
              <h2 className="text-lg font-bold text-[hsl(222,47%,11%)] dark:text-white flex items-center gap-2">
                <Receipt className="h-5 w-5 text-red-500" /> Recent Invoices
              </h2>
            </div>
            <div className="divide-y divide-[hsl(214,32%,91%)] dark:divide-white/5">
              {customer.invoices.length > 0 ? customer.invoices.map((inv: any) => (
                <div key={inv.id} className="p-4 px-6 flex justify-between items-center hover:bg-[hsl(210,40%,98%)] dark:hover:bg-black/10 transition-colors">
                  <div>
                    <p className="font-semibold text-[hsl(222,47%,11%)] dark:text-white">{inv.invoiceNumber}</p>
                    <p className={`text-xs font-semibold ${Number(inv.amountDue) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {Number(inv.amountDue) > 0 ? `Due: ${formatCurrency(inv.amountDue)}` : 'Paid'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{formatCurrency(inv.total)}</span>
                    <button className="text-blue-600 hover:text-blue-700 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-500/10">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-[hsl(215,16%,47%)]">No invoices found.</div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
