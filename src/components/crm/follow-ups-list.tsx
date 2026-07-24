'use client'

import { useState } from 'react'
import { Check, Clock, Edit, MoreHorizontal, Plus, Trash2, CheckCircle2, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input, Textarea } from '@/components/ui/form'
import { formatDate } from '@/lib/utils'

type FollowUp = {
  id: string
  title: string
  notes: string | null
  dueDate: string
  isDone: boolean
}

type Props = {
  followUps: FollowUp[]
  targetId: string
  targetType: 'customer' | 'lead'
  onRefresh: () => void
}

export function FollowUpsList({ followUps, targetId, targetType, onRefresh }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [form, setForm] = useState({ title: '', notes: '', dueDate: '' })

  const handleOpenNew = () => {
    setEditingId(null)
    setForm({ title: '', notes: '', dueDate: new Date().toISOString().split('T')[0] })
    setShowModal(true)
  }

  const handleOpenEdit = (f: FollowUp) => {
    setEditingId(f.id)
    setForm({ 
      title: f.title, 
      notes: f.notes || '', 
      dueDate: new Date(f.dueDate).toISOString().split('T')[0] 
    })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      const url = editingId ? `/api/follow-ups/${editingId}` : '/api/follow-ups'
      const method = editingId ? 'PUT' : 'POST'
      
      const payload: any = {
        title: form.title,
        notes: form.notes,
        dueDate: new Date(form.dueDate).toISOString(),
      }
      
      if (!editingId) {
        if (targetType === 'customer') payload.customerId = targetId
        if (targetType === 'lead') payload.leadId = targetId
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      if (res.ok) {
        setShowModal(false)
        onRefresh()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleDone = async (id: string, isDone: boolean) => {
    await fetch(`/api/follow-ups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDone: !isDone })
    })
    onRefresh()
  }

  const deleteFollowUp = async (id: string) => {
    if (!confirm('Delete this follow-up?')) return
    await fetch(`/api/follow-ups/${id}`, { method: 'DELETE' })
    onRefresh()
  }

  const pending = followUps.filter(f => !f.isDone).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  const completed = followUps.filter(f => f.isDone).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-[hsl(222,47%,11%)] dark:text-white">Follow-up Reminders</h3>
          <p className="text-sm text-[hsl(215,16%,47%)]">Track tasks and calls to make.</p>
        </div>
        <Button onClick={handleOpenNew} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Add Reminder
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pending Tasks */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-[hsl(222,47%,11%)] dark:text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Pending ({pending.length})
          </h4>
          
          {pending.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[hsl(214,32%,91%)] p-6 text-center text-sm text-[hsl(215,16%,47%)] dark:border-white/10">
              No pending follow-ups.
            </div>
          ) : (
            <div className="space-y-3">
              {pending.map(f => {
                const isOverdue = new Date(f.dueDate) < new Date(new Date().setHours(0,0,0,0))
                return (
                  <div key={f.id} className="flex gap-3 rounded-xl border border-[hsl(214,32%,91%)] bg-white p-4 shadow-sm dark:border-white/5 dark:bg-[hsl(217,33%,17%)] relative group">
                    <button onClick={() => toggleDone(f.id, f.isDone)} className="mt-0.5 text-[hsl(214,32%,85%)] hover:text-emerald-500 transition-colors">
                      <Circle className="h-5 w-5" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-sm text-[hsl(222,47%,11%)] dark:text-white truncate pr-8">{f.title}</p>
                      </div>
                      {f.notes && <p className="text-xs text-[hsl(215,16%,47%)] mt-1 line-clamp-2">{f.notes}</p>}
                      <div className={`mt-2 text-xs font-medium ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-primary dark:text-blue-400'}`}>
                        {isOverdue ? 'Overdue: ' : 'Due: '} {formatDate(f.dueDate)}
                      </div>
                    </div>
                    {/* Hover actions */}
                    <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white dark:bg-[hsl(217,33%,17%)]">
                      <button onClick={() => handleOpenEdit(f)} className="p-1 rounded hover:bg-[hsl(210,40%,96%)] text-[hsl(215,16%,47%)] dark:hover:bg-white/10">
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => deleteFollowUp(f.id)} className="p-1 rounded hover:bg-red-50 text-red-500 dark:hover:bg-red-500/10">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Completed Tasks */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-[hsl(222,47%,11%)] dark:text-white flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Completed ({completed.length})
          </h4>
          
          {completed.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[hsl(214,32%,91%)] p-6 text-center text-sm text-[hsl(215,16%,47%)] dark:border-white/10">
              No completed tasks.
            </div>
          ) : (
            <div className="space-y-3 opacity-70">
              {completed.map(f => (
                <div key={f.id} className="flex gap-3 rounded-xl border border-[hsl(214,32%,91%)] bg-[hsl(210,40%,98%)] p-4 dark:border-white/5 dark:bg-white/5 relative group">
                  <button onClick={() => toggleDone(f.id, f.isDone)} className="mt-0.5 text-emerald-500 hover:text-[hsl(214,32%,85%)] transition-colors">
                    <CheckCircle2 className="h-5 w-5" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[hsl(215,16%,47%)] line-through truncate">{f.title}</p>
                  </div>
                  <button onClick={() => deleteFollowUp(f.id)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-red-500 dark:hover:bg-red-500/10">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Follow-up' : 'New Follow-up'}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button form="form-follow-up" type="submit" loading={loading}>Save</Button>
          </>
        }
      >
        <form id="form-follow-up" onSubmit={handleSave} className="space-y-4">
          <Input 
            label="Title / Task" 
            value={form.title} 
            onChange={e => setForm({...form, title: e.target.value})} 
            required 
            placeholder="Call to discuss quote"
          />
          <Input 
            label="Due Date" 
            type="date" 
            value={form.dueDate} 
            onChange={e => setForm({...form, dueDate: e.target.value})} 
            required 
          />
          <Textarea 
            label="Notes (Optional)" 
            value={form.notes} 
            onChange={e => setForm({...form, notes: e.target.value})} 
            placeholder="Any specific details to remember..."
            rows={3}
          />
        </form>
      </Modal>
    </div>
  )
}
