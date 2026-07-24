'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Eye } from 'lucide-react'
import { DataTable, PageHeader } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchOrders = () => {
    setLoading(true)
    fetch(`/api/orders?q=${searchQuery}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setOrders(json.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const delay = setTimeout(fetchOrders, 300)
    return () => clearTimeout(delay)
  }, [searchQuery])

  const columns = [
    {
      key: 'orderNumber',
      header: 'Order #',
      accessor: (row: any) => (
        <span className="font-semibold text-[hsl(222,47%,11%)] dark:text-white">
          {row.orderNumber}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      accessor: (row: any) => row.customer.companyName,
    },
    {
      key: 'date',
      header: 'Date',
      accessor: (row: any) => formatDate(row.createdAt),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row: any) => {
        const colors: Record<string, string> = {
          CONFIRMED: 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-400',
          IN_PRODUCTION: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
          QUALITY_CHECK: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400',
          READY: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
          SHIPPED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
          DELIVERED: 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400',
          CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
        }
        const color = colors[row.status] || colors.CONFIRMED
        return (
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${color}`}>
            {row.status.replace('_', ' ')}
          </span>
        )
      },
    },
    {
      key: 'total',
      header: 'Total',
      accessor: (row: any) => (
        <span className="font-medium">{formatCurrency(row.total)}</span>
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
            onClick={() => router.push(`/dashboard/orders/${row.id}`)}
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
        title="Orders"
        description="Manage confirmed customer orders and track production."
      />

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(215,16%,47%)]" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-[hsl(214,32%,91%)] bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-[hsl(222,47%,11%)] dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]"
            />
          </div>
        </div>

        <DataTable columns={columns} data={orders} loading={loading} />
      </div>
    </div>
  )
}
