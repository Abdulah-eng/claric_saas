'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, Phone, Mail, Globe, DollarSign,
  UserCheck, MoreHorizontal, ChevronRight, Columns,
  List, Filter, Clock, Calendar,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge, LeadStatusBadge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/form'
import { DataTable, PageHeader, Pagination } from '@/components/ui/data-table'
import { formatDate, formatCurrency, getInitials, formatRelativeTime } from '@/lib/utils'

type Lead = {
  id: string
  companyName: string
  contactName: string | null
  email: string | null
  phone: string | null
  status: string
  type: string
  estimatedValue: any
  source: string | null
  tags: string[]
  createdAt: string
  assignedTo: { id: string; name: string | null; avatarUrl: string | null } | null
  _count: { activities: number }
}

const LEAD_STAGES = ['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL', 'WON', 'LOST'] as const

const STAGE_COLORS: Record<string, string> = {
  NEW: 'border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-900/20',
  CONTACTED: 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20',
  QUALIFIED: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20',
  PROPOSAL: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20',
  WON: 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20',
  LOST: 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20',
}

const STAGE_HEADER: Record<string, string> = {
  NEW: 'bg-sky-500',
  CONTACTED: 'bg-purple-500',
  QUALIFIED: 'bg-amber-500',
  PROPOSAL: 'bg-blue-500',
  WON: 'bg-emerald-500',
  LOST: 'bg-red-500',
}

const SOURCE_OPTIONS = [
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'email_campaign', label: 'Email Campaign' },
  { value: 'trade_show', label: 'Trade Show' },
  { value: 'other', label: 'Other' },
]

const STATUS_OPTIONS = LEAD_STAGES.map((s) => ({
  value: s,
  label: s.charAt(0) + s.slice(1).toLowerCase(),
}))

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    type: 'BUSINESS',
    companyName: '', contactName: '', email: '', phone: '',
    source: '', status: 'NEW', estimatedValue: '', notes: '', tags: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const perPage = 100

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page), perPage: String(perPage),
        ...(search && { q: search }),
        ...(statusFilter && { status: statusFilter }),
      })
      const res = await fetch(`/api/leads?${params}`)
      const json = await res.json()
      if (json.success) {
        setLeads(json.data)
        setTotal(json.meta?.total ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => {
    const t = setTimeout(fetchLeads, 300)
    return () => clearTimeout(t)
  }, [fetchLeads])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormErrors({})
    setCreating(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          estimatedValue: form.estimatedValue ? Number(form.estimatedValue) : undefined,
          tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        }),
      })
      const json = await res.json()
      if (json.success) {
        setShowCreate(false)
        fetchLeads()
      } else {
        if (json.errors) setFormErrors(json.errors)
      }
    } finally {
      setCreating(false)
    }
  }

  async function handleStageChange(leadId: string, newStatus: string) {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
    )
    await fetch(`/api/leads/${leadId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
  }

  // Kanban columns
  const columns = LEAD_STAGES.map((stage) => ({
    stage,
    leads: leads.filter((l) => l.status === stage),
  }))

  const tableColumns = [
    {
      key: 'company',
      header: 'Company',
      render: (row: Lead) => (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-xs font-bold text-white">
            {getInitials(row.companyName)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{row.companyName}</p>
              <Badge variant="outline" className="text-[10px]">{row.type === 'INDIVIDUAL' ? 'Individual' : 'Business'}</Badge>
            </div>
            {row.contactName && <p className="text-xs text-[hsl(215,16%,47%)]">{row.contactName}</p>}
          </div>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (row: Lead) => <LeadStatusBadge status={row.status} /> },
    {
      key: 'estimatedValue',
      header: 'Value',
      render: (row: Lead) => (
        <span className="font-medium">{row.estimatedValue ? formatCurrency(row.estimatedValue) : '—'}</span>
      ),
    },
    {
      key: 'assignedTo',
      header: 'Assigned',
      render: (row: Lead) => row.assignedTo ? (
        <div className="flex items-center gap-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
            {getInitials(row.assignedTo.name ?? 'U')}
          </div>
          <span className="text-xs">{row.assignedTo.name}</span>
        </div>
      ) : <span className="text-xs text-[hsl(215,16%,47%)]">Unassigned</span>,
    },
    { key: 'createdAt', header: 'Created', render: (row: Lead) => <span className="text-xs text-[hsl(215,16%,47%)]">{formatDate(row.createdAt)}</span> },
  ]

  return (
    <>
      <PageHeader
        title="Leads"
        description={`${total} leads in pipeline`}
        breadcrumbs={[{ label: 'CRM' }, { label: 'Leads' }]}
        actions={
          <div className="flex items-center gap-2">
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
            <Button id="btn-new-lead" icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
              New Lead
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(215,16%,47%)]" />
          <input
            type="search"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="h-9 w-full rounded-lg border border-[hsl(214,32%,91%)] bg-white pl-9 pr-3 text-sm text-[hsl(222,47%,11%)] placeholder:text-[hsl(215,16%,60%)] outline-none focus:border-[hsl(221,83%,53%)] focus:ring-2 focus:ring-[hsl(221,83%,53%)]/20 dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-lg border border-[hsl(214,32%,91%)] bg-white px-3 text-sm text-[hsl(222,47%,11%)] outline-none focus:border-[hsl(221,83%,53%)] dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] dark:text-white"
        >
          <option value="">All Stages</option>
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Kanban view */}
      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(({ stage, leads: stageLeads }) => (
            <div key={stage} className="flex w-72 shrink-0 flex-col">
              {/* Column header */}
              <div className={`mb-3 flex items-center justify-between rounded-lg p-3 ${STAGE_COLORS[stage]}`}>
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${STAGE_HEADER[stage]}`} />
                  <span className="text-sm font-semibold text-[hsl(222,47%,11%)] dark:text-white capitalize">
                    {stage.charAt(0) + stage.slice(1).toLowerCase()}
                  </span>
                  <span className="rounded-full bg-white/70 px-1.5 py-0.5 text-xs font-bold text-[hsl(222,47%,11%)] dark:bg-black/20 dark:text-white">
                    {stageLeads.length}
                  </span>
                </div>
                <span className="text-xs font-medium text-[hsl(215,16%,47%)]">
                  {stageLeads.reduce((sum, l) => sum + Number(l.estimatedValue ?? 0), 0) > 0
                    ? formatCurrency(stageLeads.reduce((sum, l) => sum + Number(l.estimatedValue ?? 0), 0))
                    : ''}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {loading ? (
                  Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-24 animate-pulse rounded-xl bg-[hsl(210,40%,93%)] dark:bg-[hsl(217,33%,17%)]" />
                  ))
                ) : stageLeads.length === 0 ? (
                  <div className="rounded-xl border-2 border-dashed border-[hsl(214,32%,91%)] p-4 text-center dark:border-[hsl(217,33%,17%)]">
                    <p className="text-xs text-[hsl(215,16%,47%)]">No leads</p>
                  </div>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="cursor-pointer rounded-xl border border-[hsl(214,32%,91%)] bg-white p-3 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]"
                      onClick={() => router.push(`/dashboard/leads/${lead.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[hsl(222,47%,11%)] dark:text-white line-clamp-1">
                            {lead.companyName}
                          </p>
                          {lead.type === 'INDIVIDUAL' && <Badge variant="outline" className="text-[10px] scale-75 origin-left">Ind</Badge>}
                        </div>
                        <button
                          onClick={(e) => e.stopPropagation()}
                          className="ml-1 shrink-0 text-[hsl(215,16%,47%)] hover:text-[hsl(222,47%,11%)] dark:hover:text-white"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                      {lead.contactName && (
                        <p className="mt-0.5 text-xs text-[hsl(215,16%,47%)]">{lead.contactName}</p>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        {lead.estimatedValue ? (
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(lead.estimatedValue)}
                          </span>
                        ) : <span />}
                        {lead.assignedTo && (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white">
                            {getInitials(lead.assignedTo.name ?? 'U')}
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-[hsl(215,16%,47%)]">{formatRelativeTime(lead.createdAt)}</span>
                        {lead._count.activities > 0 && (
                          <span className="text-[10px] text-[hsl(215,16%,47%)]">
                            {lead._count.activities} activities
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <>
          <DataTable
            columns={tableColumns}
            data={leads}
            loading={loading}
            emptyMessage="No leads found. Add your first lead!"
            onRowClick={(row) => router.push(`/dashboard/leads/${row.id}`)}
          />
          {total > perPage && (
            <Pagination page={page} totalPages={Math.ceil(total / perPage)} total={total} perPage={perPage} onPageChange={setPage} />
          )}
        </>
      )}

      {/* Create Lead Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Lead"
        description="Add a new lead to your pipeline"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button form="form-create-lead" type="submit" loading={creating}>Create Lead</Button>
          </>
        }
      >
        <form id="form-create-lead" onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Select id="type" label="Client Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} options={[{ value: 'BUSINESS', label: 'Business' }, { value: 'INDIVIDUAL', label: 'Individual' }]} />
            <Input id="leadCompanyName" label={form.type === 'INDIVIDUAL' ? "Full Name" : "Company Name"} value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} error={formErrors['companyName']} required placeholder={form.type === 'INDIVIDUAL' ? "John Doe" : "Acme Corp"} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input id="leadContactName" label="Contact Name" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="John Smith" />
            <Input id="leadEmail" label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" />
            <Input id="leadPhone" label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 555-0100" />
            <Input id="leadValue" label="Estimated Value ($)" type="number" value={form.estimatedValue} onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })} placeholder="5000" />
            <Select id="leadSource" label="Lead Source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} options={SOURCE_OPTIONS} placeholder="Select source" />
            <Select id="leadStatus" label="Stage" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} options={STATUS_OPTIONS} />
          </div>
          <Textarea id="leadNotes" label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any notes about this lead..." rows={3} />
          <Input id="leadTags" label="Tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="enterprise, priority (comma-separated)" hint="Separate tags with commas" />
        </form>
      </Modal>
    </>
  )
}
