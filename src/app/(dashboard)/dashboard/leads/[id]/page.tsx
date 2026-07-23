'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/form'
import { Badge, LeadStatusBadge } from '@/components/ui/badge'
import { 
  Building2, Mail, Phone, Globe, UserPlus, FileText, 
  Clock, Activity, Edit, Plus, MessageSquare, Tag, MessageCircle
} from 'lucide-react'
import { formatCurrency, formatRelativeTime, formatDate } from '@/lib/utils'
import { FollowUpsList } from '@/components/crm/follow-ups-list'

type Lead = any

export default function LeadDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  
  const [loading, setLoading] = useState(true)
  const [lead, setLead] = useState<Lead | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'followups'>('overview')
  
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [activityForm, setActivityForm] = useState({ type: 'NOTE', title: '', notes: '' })
  const [savingActivity, setSavingActivity] = useState(false)

  const refreshData = useCallback(() => {
    fetch(`/api/leads/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setLead(data.data)
      })
  }, [id])

  useEffect(() => {
    fetch(`/api/leads/${id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setLead(json.data)
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingActivity(true)
    const res = await fetch(`/api/leads/${id}/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(activityForm)
    })
    setSavingActivity(false)
    if (res.ok) {
      setShowActivityModal(false)
      refreshData()
    }
  }

  const handleConvert = () => {
    // Basic navigation or call convert API
    router.push(`/dashboard/leads/${id}/convert`)
  }

  if (loading) return <div className="p-8 text-center text-sm text-[hsl(215,16%,47%)]">Loading lead details...</div>
  if (!lead) return <div className="p-8 text-center text-sm text-red-500">Lead not found</div>

  const tabs = [
    { key: 'overview', label: 'Overview', count: null },
    { key: 'activities', label: 'Notes & Activities', count: lead.activities?.length || 0 },
    { key: 'followups', label: 'Follow-ups', count: lead.followUps?.filter((f: any) => !f.isDone)?.length || 0 },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'CALL': return <Phone className="h-4 w-4" />
      case 'EMAIL': return <Mail className="h-4 w-4" />
      case 'MEETING': return <UserPlus className="h-4 w-4" />
      case 'NOTE': return <FileText className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-[hsl(222,47%,11%)] dark:text-white">
              {lead.companyName}
            </h1>
            <Badge variant="outline">{lead.type === 'INDIVIDUAL' ? 'Individual' : 'Business'}</Badge>
            <LeadStatusBadge status={lead.status} />
          </div>
          <div className="flex items-center gap-4 text-sm text-[hsl(215,16%,47%)]">
            {lead.contactName && <span className="flex items-center gap-1.5"><UserPlus className="h-3.5 w-3.5" /> {lead.contactName}</span>}
            {lead.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {lead.email}</span>}
            {lead.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {lead.phone}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {!lead.customerId && (
            <Button onClick={handleConvert} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckCircle2 className="h-4 w-4" /> Convert to Customer
            </Button>
          )}
        </div>
      </div>

      <div className="border-b border-[hsl(214,32%,91%)] dark:border-white/10">
        <nav className="-mb-px flex space-x-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`
                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
                ${activeTab === tab.key
                  ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                  : 'border-transparent text-[hsl(215,16%,47%)] hover:border-[hsl(214,32%,91%)] hover:text-[hsl(222,47%,11%)] dark:hover:border-white/10 dark:hover:text-white'}
              `}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${activeTab === tab.key ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-[hsl(210,40%,96%)] text-[hsl(215,16%,47%)] dark:bg-white/5 dark:text-white/60'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="pt-4">
        {activeTab === 'overview' && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <div className="rounded-xl border border-[hsl(214,32%,91%)] p-6 dark:border-white/10">
                <h3 className="font-semibold text-[hsl(222,47%,11%)] dark:text-white mb-4">Lead Information</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-[hsl(215,16%,47%)] mb-1">Company</p>
                    <p className="text-sm text-[hsl(222,47%,11%)] dark:text-white">{lead.companyName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[hsl(215,16%,47%)] mb-1">Contact</p>
                    <p className="text-sm text-[hsl(222,47%,11%)] dark:text-white">{lead.contactName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[hsl(215,16%,47%)] mb-1">Estimated Value</p>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{lead.estimatedValue ? formatCurrency(lead.estimatedValue) : '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[hsl(215,16%,47%)] mb-1">Source</p>
                    <p className="text-sm text-[hsl(222,47%,11%)] dark:text-white">{lead.source || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
               <div className="rounded-xl border border-[hsl(214,32%,91%)] p-6 dark:border-white/10">
                <h3 className="font-semibold text-[hsl(222,47%,11%)] dark:text-white mb-4">Additional Details</h3>
                <div className="space-y-4">
                  {lead.notes && (
                    <div>
                      <p className="text-xs text-[hsl(215,16%,47%)] mb-1">General Notes</p>
                      <p className="text-sm text-[hsl(222,47%,11%)] dark:text-white whitespace-pre-wrap">{lead.notes}</p>
                    </div>
                  )}
                  {lead.tags && lead.tags.length > 0 && (
                    <div>
                      <p className="text-xs text-[hsl(215,16%,47%)] mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {lead.tags.map((tag: string) => (
                          <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-[hsl(214,32%,91%)] px-2 py-1 text-xs font-medium text-[hsl(215,16%,47%)] dark:bg-white/10 dark:text-white/70">
                            <Tag className="h-3 w-3" /> {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-semibold text-[hsl(222,47%,11%)] dark:text-white">Activity Log & Notes</h3>
              <Button onClick={() => setShowActivityModal(true)} size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Add Note / Activity
              </Button>
            </div>
            
            <div className="space-y-4">
              {(!lead.activities || lead.activities.length === 0) ? (
                <div className="rounded-xl border border-dashed border-[hsl(214,32%,91%)] p-8 text-center text-sm text-[hsl(215,16%,47%)] dark:border-white/10">
                  No activities recorded yet. Add a note, call log, or message.
                </div>
              ) : (
                <div className="relative border-l-2 border-[hsl(214,32%,91%)] dark:border-white/10 ml-3 pl-6 space-y-6">
                  {lead.activities.map((act: any) => (
                    <div key={act.id} className="relative">
                      <div className="absolute -left-[35px] top-1 flex h-8 w-8 items-center justify-center rounded-full bg-white border border-[hsl(214,32%,91%)] text-[hsl(215,16%,47%)] shadow-sm dark:bg-black dark:border-white/10">
                        {getActivityIcon(act.type)}
                      </div>
                      <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-4 shadow-sm dark:border-white/5 dark:bg-[hsl(217,33%,17%)]">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm text-[hsl(222,47%,11%)] dark:text-white">{act.title}</h4>
                          <span className="text-xs text-[hsl(215,16%,47%)]">{formatRelativeTime(act.createdAt)}</span>
                        </div>
                        {act.notes && (
                          <p className="text-sm text-[hsl(215,16%,47%)] whitespace-pre-wrap">{act.notes}</p>
                        )}
                        <div className="mt-3 flex items-center gap-2">
                           <span className="inline-flex items-center rounded-md bg-[hsl(210,40%,96%)] px-2 py-1 text-xs font-medium text-[hsl(215,16%,47%)] dark:bg-white/5 dark:text-white/60">
                            {act.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'followups' && (
          <div className="animate-in fade-in">
             <FollowUpsList 
                followUps={lead.followUps || []} 
                targetId={lead.id} 
                targetType="lead" 
                onRefresh={refreshData}
              />
          </div>
        )}
      </div>

      <Modal
        open={showActivityModal}
        onClose={() => setShowActivityModal(false)}
        title="Log Note / Activity"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowActivityModal(false)}>Cancel</Button>
            <Button form="form-activity" type="submit" loading={savingActivity}>Save Activity</Button>
          </>
        }
      >
        <form id="form-activity" onSubmit={handleAddActivity} className="space-y-4">
          <Select 
            label="Activity Type"
            value={activityForm.type}
            onChange={e => setActivityForm({...activityForm, type: e.target.value})}
            options={[
              { value: 'NOTE', label: 'General Note' },
              { value: 'CALL', label: 'Phone Call' },
              { value: 'EMAIL', label: 'Email' },
              { value: 'MEETING', label: 'Meeting' },
              { value: 'OTHER', label: 'Text / Facebook / Other' }
            ]}
          />
          <Input 
            label="Title / Summary" 
            placeholder="e.g. Spoke on Phone, FB Message" 
            value={activityForm.title}
            onChange={e => setActivityForm({...activityForm, title: e.target.value})}
            required 
          />
          <Textarea 
            label="Details" 
            placeholder="Notes about the interaction..." 
            value={activityForm.notes}
            onChange={e => setActivityForm({...activityForm, notes: e.target.value})}
            rows={4}
          />
        </form>
      </Modal>
    </div>
  )
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
