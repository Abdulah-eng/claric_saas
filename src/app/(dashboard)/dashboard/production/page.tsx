'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/data-table'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Eye, LayoutGrid, List } from 'lucide-react'

const STAGES = [
  { id: 'PRE_PRESS', title: 'Pre-Press / Artwork' },
  { id: 'PRINTING', title: 'Printing' },
  { id: 'FINISHING', title: 'Finishing' },
  { id: 'PACKAGING', title: 'Packaging & QC' }
]

export default function ProductionKanbanPage() {
  const router = useRouter()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')

  const fetchJobs = () => {
    setLoading(true)
    fetch(`/api/production-jobs`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setJobs(json.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const handleDragStart = (e: React.DragEvent, jobId: string) => {
    e.dataTransfer.setData('jobId', jobId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, newStage: string) => {
    e.preventDefault()
    const jobId = e.dataTransfer.getData('jobId')
    if (!jobId) return

    const job = jobs.find(j => j.id === jobId)
    if (!job || job.stage === newStage) return

    // Optimistic update
    setJobs(jobs.map(j => j.id === jobId ? { ...j, stage: newStage } : j))

    await fetch(`/api/production-jobs/${jobId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: newStage }),
    })
  }

  return (
    <div className="pb-10 h-full flex flex-col">
      <div className="flex justify-between items-end mb-6">
        <PageHeader title="Production Board" description="Track and manage active production jobs." />
        <div className="flex bg-[hsl(214,32%,91%)] p-1 rounded-lg dark:bg-[hsl(217,33%,17%)]">
          <button 
            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 ${viewMode === 'kanban' ? 'bg-white shadow text-[hsl(222,47%,11%)] dark:bg-[hsl(222,47%,11%)] dark:text-white' : 'text-[hsl(215,16%,47%)]'}`}
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid className="h-4 w-4" /> Kanban
          </button>
          <button 
            className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 ${viewMode === 'list' ? 'bg-white shadow text-[hsl(222,47%,11%)] dark:bg-[hsl(222,47%,11%)] dark:text-white' : 'text-[hsl(215,16%,47%)]'}`}
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" /> List
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 animate-pulse rounded-xl bg-[hsl(210,40%,93%)] dark:bg-[hsl(217,33%,17%)]" />
      ) : viewMode === 'kanban' ? (
        <div className="flex flex-1 gap-6 overflow-x-auto pb-4">
          {STAGES.map(stage => {
            const stageJobs = jobs.filter(j => j.stage === stage.id && j.status !== 'DONE' && j.status !== 'CANCELLED')
            
            return (
              <div 
                key={stage.id} 
                className="flex-shrink-0 w-[350px] bg-[hsl(210,40%,98%)] dark:bg-[hsl(217,33%,17%)] rounded-xl border border-[hsl(214,32%,91%)] dark:border-white/5 flex flex-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
              >
                <div className="p-4 border-b border-[hsl(214,32%,91%)] dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-black/20 rounded-t-xl">
                  <h3 className="font-semibold text-[hsl(222,47%,11%)] dark:text-white">{stage.title}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-[hsl(214,32%,91%)] dark:bg-[hsl(222,47%,11%)] text-xs font-medium text-[hsl(215,16%,47%)]">{stageJobs.length}</span>
                </div>
                <div className="p-3 flex-1 overflow-y-auto space-y-3">
                  {stageJobs.map(job => (
                    <div 
                      key={job.id} 
                      draggable 
                      onDragStart={(e) => handleDragStart(e, job.id)}
                      onClick={() => router.push(`/dashboard/production/${job.id}`)}
                      className="bg-white dark:bg-[hsl(222,47%,11%)] p-4 rounded-lg shadow-sm border border-[hsl(214,32%,91%)] dark:border-white/10 cursor-grab active:cursor-grabbing hover:border-primary transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold px-2 py-1 bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-400 rounded-md">
                          {job.order.orderNumber}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${job.status === 'IN_PROGRESS' ? 'bg-emerald-100 text-emerald-700' : job.status === 'ON_HOLD' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
                          {job.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="font-semibold text-[hsl(222,47%,11%)] dark:text-white text-sm mb-1 line-clamp-1">{job.title}</h4>
                      <p className="text-xs text-[hsl(215,16%,47%)] mb-3 line-clamp-1">{job.order.customer.companyName}</p>
                      
                      <div className="flex justify-between items-center text-xs text-[hsl(215,16%,47%)] border-t border-[hsl(214,32%,91%)] dark:border-white/10 pt-3 mt-3">
                        <div className="flex items-center gap-3">
                          <span title="Tasks">✓ {job._count.tasks}</span>
                          <span title="Quality Checks">★ {job._count.qualityChecks}</span>
                        </div>
                        <span>{formatDate(job.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                  {stageJobs.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-sm text-[hsl(215,16%,47%)] border-2 border-dashed border-[hsl(214,32%,91%)] dark:border-white/10 rounded-lg">
                      Drop jobs here
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-[hsl(217,33%,17%)] rounded-xl border border-[hsl(214,32%,91%)] dark:border-white/10 overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-[hsl(210,40%,98%)] dark:bg-black/20 text-[hsl(215,16%,47%)] font-semibold border-b border-[hsl(214,32%,91%)] dark:border-white/10">
              <tr>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(214,32%,91%)] dark:divide-white/10">
              {jobs.map(job => (
                <tr key={job.id} className="hover:bg-[hsl(210,40%,98%)] dark:hover:bg-black/10">
                  <td className="px-4 py-3 font-semibold text-[hsl(222,47%,11%)] dark:text-white">{job.order.orderNumber}</td>
                  <td className="px-4 py-3 text-[hsl(222,47%,11%)] dark:text-white">{job.title}</td>
                  <td className="px-4 py-3 text-[hsl(215,16%,47%)]">{job.order.customer.companyName}</td>
                  <td className="px-4 py-3 text-[hsl(215,16%,47%)]">{STAGES.find(s => s.id === job.stage)?.title || job.stage}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${job.status === 'IN_PROGRESS' ? 'bg-emerald-100 text-emerald-700' : job.status === 'DONE' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-700'}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[hsl(215,16%,47%)]">{formatDate(job.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => router.push(`/dashboard/production/${job.id}`)} className="p-1.5 text-[hsl(215,16%,47%)] hover:bg-white hover:shadow rounded-md border border-transparent hover:border-[hsl(214,32%,91%)]">
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
