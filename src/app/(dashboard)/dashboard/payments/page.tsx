'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/data-table'
import { DollarSign, TrendingUp, ArrowDownLeft, RefreshCw, Search, Filter } from 'lucide-react'

const METHOD_COLORS: Record<string, string> = {
  STRIPE: 'bg-[hsl(258,90%,66%)]/10 text-[hsl(258,90%,66%)]',
  SQUARE: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300',
  BANK_TRANSFER: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
  CASH: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300',
  CHECK: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300',
  OTHER: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400',
}

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  REFUNDED: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
  PARTIALLY_REFUNDED: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
}

function fmt(val: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PaymentsPage() {
  const [data, setData] = useState<any>({ payments: [], meta: {}, stats: {} })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterMethod, setFilterMethod] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const fetchPayments = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filterMethod) params.set('method', filterMethod)
    if (filterStatus) params.set('status', filterStatus)
    fetch(`/api/payments?${params}`)
      .then(r => r.json())
      .then(json => { if (json.success) setData(json.data) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPayments() }, [filterMethod, filterStatus])

  const filtered = (data.payments || []).filter((p: any) =>
    !search ||
    p.customer?.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    p.invoice?.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
    p.reference?.toLowerCase().includes(search.toLowerCase())
  )

  const stats = [
    {
      label: 'Collected This Month',
      value: fmt(Number(data.stats?.collectedThisMonth || 0)),
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Refunded This Month',
      value: fmt(Number(data.stats?.refundedThisMonth || 0)),
      icon: ArrowDownLeft,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
    },
    {
      label: 'Total Transactions',
      value: data.meta?.total ?? '—',
      icon: DollarSign,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
  ]

  return (
    <div className="pb-20 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <PageHeader title="Payments" description="Track all payment transactions across invoices." />
        <button
          onClick={fetchPayments}
          className="flex items-center gap-2 rounded-lg border border-[hsl(214,32%,91%)] px-3 py-2 text-sm text-[hsl(215,16%,47%)] hover:bg-[hsl(210,40%,96%)] dark:border-white/10 dark:hover:bg-white/5"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="rounded-2xl border border-[hsl(214,32%,91%)] bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[hsl(217,33%,17%)]">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-[hsl(215,16%,47%)]">{s.label}</p>
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.bg}`}>
                  <Icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-[hsl(222,47%,11%)] dark:text-white">{s.value}</p>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(215,16%,47%)]" />
          <input
            type="text"
            placeholder="Search by customer, invoice, reference..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[hsl(214,32%,91%)] bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-[hsl(222,47%,11%)] dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-[hsl(215,16%,47%)]" />
          <select
            value={filterMethod}
            onChange={e => setFilterMethod(e.target.value)}
            className="rounded-lg border border-[hsl(214,32%,91%)] bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-[hsl(222,47%,11%)] dark:text-white"
          >
            <option value="">All Methods</option>
            <option value="STRIPE">Stripe</option>
            <option value="SQUARE">Square</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CASH">Cash</option>
            <option value="CHECK">Check</option>
          </select>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="rounded-lg border border-[hsl(214,32%,91%)] bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-white/10 dark:bg-[hsl(222,47%,11%)] dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white shadow-sm overflow-hidden dark:border-white/5 dark:bg-[hsl(222,47%,11%)]">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-[hsl(215,16%,47%)]">
            <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading payments...
          </div>
        ) : filtered.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-[hsl(215,16%,47%)]">
            <DollarSign className="h-10 w-10 mb-3 opacity-30" />
            <p className="font-medium">No payments found</p>
            <p className="text-sm mt-1">Payments will appear here once invoices are paid.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-[hsl(214,32%,91%)] bg-[hsl(210,40%,96%)] text-xs font-medium uppercase tracking-wider text-[hsl(215,16%,47%)] dark:border-white/5 dark:bg-white/5">
                <tr>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Invoice</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Method</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(214,32%,91%)] dark:divide-white/5">
                {filtered.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-[hsl(210,40%,98%)] dark:hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-[hsl(215,16%,47%)] whitespace-nowrap">{fmtDate(payment.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-[hsl(222,47%,11%)] dark:text-white">
                        {payment.customer?.companyName || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-blue-600 dark:text-blue-400">
                        {payment.invoice?.invoiceNumber || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-[hsl(222,47%,11%)] dark:text-white">
                        {fmt(Number(payment.amount))}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${METHOD_COLORS[payment.method] || METHOD_COLORS.OTHER}`}>
                        {payment.method.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[payment.status] || ''}`}>
                        {payment.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[hsl(215,16%,47%)] font-mono text-xs">
                      {payment.reference || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
