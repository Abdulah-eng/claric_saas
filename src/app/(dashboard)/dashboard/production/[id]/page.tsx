'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, Clock, Save, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/data-table'

export default function ProductionJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [job, setJob] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const fetchJob = () => {
    fetch(`/api/production-jobs/${id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setJob(json.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchJob()
  }, [id])

  async function updateJobStage(stage: string) {
    await fetch(`/api/production-jobs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage }),
    })
    fetchJob()
  }

  async function updateJobStatus(status: string) {
    await fetch(`/api/production-jobs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchJob()
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTaskTitle) return
    await fetch(`/api/production-jobs/${id}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTaskTitle }),
    })
    setNewTaskTitle('')
    fetchJob()
  }

  async function updateTask(taskId: string, status: string) {
    await fetch(`/api/production-jobs/${id}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchJob()
  }

  async function deleteTask(taskId: string) {
    await fetch(`/api/production-jobs/${id}/tasks/${taskId}`, {
      method: 'DELETE',
    })
    fetchJob()
  }

  if (loading) return <div className="animate-pulse h-96 rounded-xl bg-[hsl(210,40%,93%)] dark:bg-[hsl(217,33%,17%)]" />
  if (!job) return <div className="py-20 text-center">Job not found</div>

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="mb-4 flex items-center justify-between">
        <button type="button" onClick={() => router.push('/dashboard/production')} className="flex items-center gap-1.5 text-sm text-[hsl(215,16%,47%)] hover:text-[hsl(222,47%,11%)] dark:hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to Board
        </button>
      </div>

      <PageHeader
        title={job.title}
        description={`For Order ${job.order.orderNumber} - ${job.order.customer.companyName}`}
        actions={
          <div className="flex gap-2">
            <select 
              value={job.stage} 
              onChange={(e) => updateJobStage(e.target.value)}
              className="rounded-md border border-[hsl(214,32%,91%)] bg-white px-3 py-1.5 text-sm font-medium dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] dark:text-white"
            >
              <option value="PRE_PRESS">Pre-Press</option>
              <option value="PRINTING">Printing</option>
              <option value="FINISHING">Finishing</option>
              <option value="PACKAGING">Packaging</option>
            </select>
            <select 
              value={job.status} 
              onChange={(e) => updateJobStatus(e.target.value)}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium ${job.status === 'DONE' ? 'bg-primary/10 text-primary border-blue-200' : 'bg-white border-[hsl(214,32%,91%)] dark:bg-[hsl(222,47%,11%)] dark:border-[hsl(217,33%,17%)] dark:text-white'}`}
            >
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="DONE">Done</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Order Details Preview */}
          <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
            <h3 className="font-semibold text-[hsl(222,47%,11%)] dark:text-white mb-4">Order Items to Produce</h3>
            <ul className="space-y-3">
              {job.order.items.map((item: any) => (
                <li key={item.id} className="flex justify-between items-center bg-[hsl(210,40%,98%)] dark:bg-black/20 p-3 rounded-lg border border-[hsl(214,32%,91%)] dark:border-white/5">
                  <div>
                    <p className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{item.product?.name || item.description}</p>
                    {item.product && <p className="text-xs text-[hsl(215,16%,47%)]">{item.description}</p>}
                  </div>
                  <span className="font-bold text-lg">{Number(item.quantity)} qty</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tasks List */}
          <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
            <div className="p-4 border-b border-[hsl(214,32%,91%)] dark:border-white/5 flex justify-between items-center">
              <h3 className="font-semibold text-[hsl(222,47%,11%)] dark:text-white">Production Tasks</h3>
            </div>
            
            <div className="p-4 space-y-3">
              {job.tasks.map((task: any) => (
                <div key={task.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => updateTask(task.id, task.status === 'DONE' ? 'PENDING' : 'DONE')}
                      className={`h-5 w-5 rounded-full border flex items-center justify-center ${task.status === 'DONE' ? 'bg-primary border-primary text-white' : 'border-[hsl(215,16%,47%)] text-transparent'}`}
                    >
                      <CheckCircle className="h-3 w-3" />
                    </button>
                    <span className={`text-sm ${task.status === 'DONE' ? 'text-[hsl(215,16%,47%)] line-through' : 'font-medium text-[hsl(222,47%,11%)] dark:text-white'}`}>
                      {task.title}
                    </span>
                  </div>
                  <button onClick={() => deleteTask(task.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              <form onSubmit={addTask} className="mt-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Add a new task..."
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className="flex-1 rounded-md border border-[hsl(214,32%,91%)] px-3 py-1.5 text-sm outline-none dark:border-[hsl(217,33%,17%)] dark:bg-black/20 dark:text-white"
                />
                <Button type="submit" size="sm" variant="outline" icon={<Plus className="h-4 w-4" />}>Add</Button>
              </form>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Progress / Status */}
          <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
            <h3 className="font-semibold text-[hsl(222,47%,11%)] dark:text-white mb-4">Job Info</h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-[hsl(215,16%,47%)] text-xs mb-1">Stage</p>
                <p className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{job.stage.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-[hsl(215,16%,47%)] text-xs mb-1">Status</p>
                <p className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{job.status.replace('_', ' ')}</p>
              </div>
              {job.actualStart && (
                <div>
                  <p className="text-[hsl(215,16%,47%)] text-xs mb-1">Started</p>
                  <p className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{new Date(job.actualStart).toLocaleString()}</p>
                </div>
              )}
              {job.actualEnd && (
                <div>
                  <p className="text-[hsl(215,16%,47%)] text-xs mb-1">Completed</p>
                  <p className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{new Date(job.actualEnd).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
