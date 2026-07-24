'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, FileText, Download, Send, MoreHorizontal } from 'lucide-react'
import { DataTable, PageHeader, Pagination } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { QuoteStatusBadge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'

type Quote = any

export default function QuotesPage() {
  const router = useRouter()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const perPage = 20

  const fetchQuotes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), perPage: String(perPage), ...(search && { q: search }) })
      const res = await fetch(`/api/quotes?${params}`)
      const json = await res.json()
      if (json.success) {
        setQuotes(json.data)
        setTotal(json.meta?.total ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    const t = setTimeout(fetchQuotes, 300)
    return () => clearTimeout(t)
  }, [fetchQuotes])

  const columns = [
    {
      key: 'quoteNumber',
      header: 'Quote',
      render: (row: Quote) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 dark:bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{row.quoteNumber}</p>
            {row.title && <p className="text-xs text-[hsl(215,16%,47%)] line-clamp-1">{row.title}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (row: Quote) => (
        <div>
          <p className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{row.customer.companyName}</p>
          <p className="text-xs text-[hsl(215,16%,47%)]">{row.customer.email}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row: Quote) => <QuoteStatusBadge status={row.status} />
    },
    {
      key: 'total',
      header: 'Total',
      render: (row: Quote) => (
        <span className="font-semibold text-[hsl(222,47%,11%)] dark:text-white">{formatCurrency(row.total)}</span>
      ),
    },
    {
      key: 'dates',
      header: 'Dates',
      render: (row: Quote) => (
        <div className="text-xs text-[hsl(215,16%,47%)] space-y-0.5">
          <p>Created: {formatDate(row.createdAt)}</p>
          {row.expiresAt && <p>Expires: {formatDate(row.expiresAt)}</p>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row: Quote) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => window.open(`/api/quotes/${row.id}/pdf`, '_blank')}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[hsl(215,16%,47%)] hover:bg-[hsl(210,40%,96%)] hover:text-primary transition-colors"
            title="Download PDF"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ]

  return (
    <>
      <PageHeader
        title="Quotes"
        description="Manage price quotes and proposals"
        breadcrumbs={[{ label: 'Sales' }, { label: 'Quotes' }]}
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => router.push('/dashboard/quotes/new')}>
            Create Quote
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(215,16%,47%)]" />
          <input
            type="search"
            placeholder="Search quotes..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="h-9 w-full rounded-lg border border-[hsl(214,32%,91%)] bg-white pl-9 pr-3 text-sm text-[hsl(222,47%,11%)] outline-none focus:border-[hsl(var(--primary))] focus:ring-2 dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] dark:text-white"
          />
        </div>
      </div>

      <DataTable columns={columns} data={quotes} loading={loading} onRowClick={(row) => router.push(`/dashboard/quotes/${row.id}`)} />
      {total > perPage && <Pagination page={page} totalPages={Math.ceil(total / perPage)} total={total} perPage={perPage} onPageChange={setPage} />}
    </>
  )
}
