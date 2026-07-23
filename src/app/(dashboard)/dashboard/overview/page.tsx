'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Columns, List, Search, Clock, FileText, Factory } from 'lucide-react'
import { PageHeader } from '@/components/ui/data-table'
import { formatCurrency, formatDate } from '@/lib/utils'

const COLUMNS = [
  { id: 'quoting', label: 'Quoting', color: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'approved', label: 'Quote Approved', color: 'bg-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { id: 'job_pending', label: 'Job Pending', color: 'bg-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  { id: 'job_progress', label: 'Job In Progress', color: 'bg-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { id: 'done', label: 'Completed', color: 'bg-slate-500', bg: 'bg-slate-50 dark:bg-slate-900/20' },
]

export default function OverviewPage() {
  const router = useRouter()
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<any[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [quotesRes, jobsRes] = await Promise.all([
        fetch('/api/quotes'),
        fetch('/api/production-jobs')
      ])
      const quotesJson = await quotesRes.json()
      const jobsJson = await jobsRes.json()

      const combined = []

      // Map quotes
      if (quotesJson.success) {
        for (const q of quotesJson.data) {
          let stageId = 'quoting'
          if (q.status === 'APPROVED') stageId = 'approved'
          if (q.status === 'REJECTED') continue // skip rejected quotes

          combined.push({
            id: `quote_${q.id}`,
            realId: q.id,
            type: 'QUOTE',
            title: q.number,
            subtitle: q.customer?.companyName || 'Unknown Customer',
            value: q.total,
            date: q.createdAt,
            stageId,
            status: q.status
          })
        }
      }

      // Map jobs
      if (jobsJson.success) {
        for (const j of jobsJson.data) {
          let stageId = 'job_pending'
          if (j.status === 'IN_PROGRESS') stageId = 'job_progress'
          if (j.status === 'DONE') stageId = 'done'
          if (j.status === 'CANCELLED') continue

          combined.push({
            id: `job_${j.id}`,
            realId: j.id,
            type: 'JOB',
            title: j.title || `Order ${j.order?.number || 'Unknown'}`,
            subtitle: j.order?.customer?.companyName || 'Unknown Customer',
            value: j.order?.total || 0,
            date: j.createdAt,
            stageId,
            status: j.status
          })
        }
      }

      // Sort by date descending
      combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      setItems(combined)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return (
    <>
      <PageHeader
        title="Business Overview"
        description="Unified view of all active quotes and production jobs"
        breadcrumbs={[{ label: 'Dashboard' }, { label: 'Overview' }]}
        actions={
          <div className="flex rounded-lg border border-[hsl(214,32%,91%)] bg-white p-0.5 dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
            <button
              onClick={() => setView('kanban')}
              className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all ${view === 'kanban' ? 'bg-[hsl(221,83%,53%)] text-white shadow-sm' : 'text-[hsl(215,16%,47%)] hover:text-[hsl(222,47%,11%)] dark:hover:text-white'}`}
            >
              <Columns className="h-3.5 w-3.5" /> Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-all ${view === 'list' ? 'bg-[hsl(221,83%,53%)] text-white shadow-sm' : 'text-[hsl(215,16%,47%)] hover:text-[hsl(222,47%,11%)] dark:hover:text-white'}`}
            >
              <List className="h-3.5 w-3.5" /> List
            </button>
          </div>
        }
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <p className="text-sm text-[hsl(215,16%,47%)]">Loading overview...</p>
        </div>
      ) : view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const colItems = items.filter(i => i.stageId === col.id)
            const totalValue = colItems.reduce((sum, item) => sum + Number(item.value || 0), 0)

            return (
              <div key={col.id} className="flex w-[300px] shrink-0 flex-col">
                <div className={`mb-3 flex flex-col gap-2 rounded-lg p-3 border border-[hsl(214,32%,91%)] dark:border-white/10 ${col.bg}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
                      <span className="text-sm font-semibold text-[hsl(222,47%,11%)] dark:text-white">
                        {col.label}
                      </span>
                    </div>
                    <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold text-[hsl(222,47%,11%)] dark:bg-black/20 dark:text-white">
                      {colItems.length}
                    </span>
                  </div>
                  {totalValue > 0 && (
                    <div className="text-xs font-medium text-[hsl(215,16%,47%)]">
                      {formatCurrency(totalValue)}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {colItems.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => router.push(item.type === 'QUOTE' ? `/dashboard/quotes/${item.realId}` : `/dashboard/production/${item.realId}`)}
                      className="cursor-pointer rounded-xl border border-[hsl(214,32%,91%)] bg-white p-3 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          {item.type === 'QUOTE' ? <FileText className="h-3.5 w-3.5 text-blue-500" /> : <Factory className="h-3.5 w-3.5 text-purple-500" />}
                          <p className="text-sm font-semibold text-[hsl(222,47%,11%)] dark:text-white line-clamp-1">
                            {item.title}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-[hsl(215,16%,47%)] mb-2">{item.subtitle}</p>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(item.value)}
                        </span>
                        <span className="text-[hsl(215,16%,47%)]">{formatDate(item.date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] overflow-hidden">
          <table className="w-full text-left text-sm text-[hsl(215,16%,47%)]">
            <thead className="bg-[hsl(210,40%,98%)] text-xs uppercase text-[hsl(215,16%,47%)] dark:bg-[hsl(217,33%,17%)] dark:text-[hsl(215,16%,47%)]">
              <tr>
                <th className="px-4 py-3 font-medium">Type / ID</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Value</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(214,32%,91%)] dark:divide-[hsl(217,33%,17%)]">
              {items.map(item => (
                <tr 
                  key={item.id} 
                  onClick={() => router.push(item.type === 'QUOTE' ? `/dashboard/quotes/${item.realId}` : `/dashboard/production/${item.realId}`)}
                  className="hover:bg-[hsl(210,40%,98%)] dark:hover:bg-white/5 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {item.type === 'QUOTE' ? <FileText className="h-4 w-4 text-blue-500" /> : <Factory className="h-4 w-4 text-purple-500" />}
                      <span className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{item.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{item.subtitle}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-[hsl(214,32%,91%)] px-2 py-0.5 text-xs font-medium dark:bg-white/10 dark:text-white">
                      {COLUMNS.find(c => c.id === item.stageId)?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(item.value)}</td>
                  <td className="px-4 py-3">{formatDate(item.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
