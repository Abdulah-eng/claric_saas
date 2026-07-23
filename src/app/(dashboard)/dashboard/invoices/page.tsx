'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Eye, FileText } from 'lucide-react'
import { DataTable, PageHeader } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchInvoices = () => {
    setLoading(true)
    fetch(`/api/invoices?q=${searchQuery}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setInvoices(json.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const delay = setTimeout(fetchInvoices, 300)
    return () => clearTimeout(delay)
  }, [searchQuery])

  const columns = [
    {
      key: 'invoiceNumber',
      header: 'Invoice #',
      accessor: (row: any) => (
        <span className="font-semibold text-[hsl(222,47%,11%)] dark:text-white">
          {row.invoiceNumber}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      accessor: (row: any) => row.customer.companyName,
    },
    {
      key: 'issueDate',
      header: 'Date',
      accessor: (row: any) => formatDate(row.issueDate),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row: any) => {
        const colors: Record<string, string> = {
          DRAFT: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400',
          SENT: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
          PARTIALLY_PAID: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
          PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
          OVERDUE: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
          CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400',
        }
        const color = colors[row.status] || colors.DRAFT
        return (
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${color}`}>
            {row.status.replace('_', ' ')}
          </span>
        )
      },
    },
    {
      key: 'amountDue',
      header: 'Amount Due',
      accessor: (row: any) => (
        <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(row.amountDue)}</span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      accessor: (row: any) => (
        <span className="font-medium text-[hsl(215,16%,47%)]">{formatCurrency(row.total)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      accessor: (row: any) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/invoices/${row.id}`)}
            icon={<Eye className="h-4 w-4" />}
          >
            View
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="pb-10">
      <PageHeader
        title="Invoices"
        description="Manage customer invoices, payments, and credit notes."
      />

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(215,16%,47%)]" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-[hsl(214,32%,91%)] bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-[hsl(222,47%,11%)] dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]"
            />
          </div>
        </div>

        <DataTable columns={columns} data={invoices} loading={loading} />
      </div>
    </div>
  )
}
