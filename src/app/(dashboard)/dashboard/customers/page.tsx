'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, Users, Building2, Phone, Mail, Tag, MoreHorizontal } from 'lucide-react'
import { DataTable, PageHeader, EmptyState, Pagination } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/form'
import { formatDate, formatCurrency, getInitials } from '@/lib/utils'

type Customer = {
  id: string
  companyName: string
  email: string | null
  phone: string | null
  billingCity: string | null
  billingCountry: string
  tags: string[]
  createdAt: string
  type: string
  _count: { quotes: number; orders: number; contacts: number }
}

const INDUSTRY_OPTIONS = [
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'construction', label: 'Construction' },
  { value: 'other', label: 'Other' },
]

const COUNTRY_OPTIONS = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
]

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    type: 'BUSINESS',
    companyName: '',
    email: '',
    phone: '',
    industry: '',
    website: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingCountry: 'US',
    billingPostal: '',
    notes: '',
    tags: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const perPage = 20

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
        ...(search && { q: search }),
      })
      const res = await fetch(`/api/customers?${params}`)
      const json = await res.json()
      if (json.success) {
        setCustomers(json.data)
        setTotal(json.meta?.total ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    const t = setTimeout(fetchCustomers, 300)
    return () => clearTimeout(t)
  }, [fetchCustomers])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setFormErrors({})
    setCreating(true)
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        }),
      })
      const json = await res.json()
      if (json.success) {
        setShowCreate(false)
        setForm({ type: 'BUSINESS', companyName: '', email: '', phone: '', industry: '', website: '', billingAddress: '', billingCity: '', billingState: '', billingCountry: 'US', billingPostal: '', notes: '', tags: '' })
        fetchCustomers()
      } else {
        if (json.errors) setFormErrors(json.errors)
      }
    } finally {
      setCreating(false)
    }
  }

  const columns = [
    {
      key: 'company',
      header: 'Company',
      render: (row: Customer) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white">
            {getInitials(row.companyName)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{row.companyName}</p>
              <Badge variant="outline" className="text-[10px]">{row.type === 'INDIVIDUAL' ? 'Individual' : 'Business'}</Badge>
            </div>
            {row.billingCity && (
              <p className="text-xs text-[hsl(215,16%,47%)]">
                {row.billingCity}, {row.billingCountry}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (row: Customer) => (
        <div className="space-y-0.5">
          {row.email && (
            <div className="flex items-center gap-1.5 text-xs text-[hsl(215,16%,47%)]">
              <Mail className="h-3 w-3" /> {row.email}
            </div>
          )}
          {row.phone && (
            <div className="flex items-center gap-1.5 text-xs text-[hsl(215,16%,47%)]">
              <Phone className="h-3 w-3" /> {row.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'tags',
      header: 'Tags',
      render: (row: Customer) => (
        <div className="flex flex-wrap gap-1">
          {row.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px]">
              {tag}
            </Badge>
          ))}
          {row.tags.length > 3 && (
            <Badge variant="outline" className="text-[10px]">+{row.tags.length - 3}</Badge>
          )}
        </div>
      ),
    },
    {
      key: 'activity',
      header: 'Activity',
      render: (row: Customer) => (
        <div className="flex items-center gap-3 text-xs text-[hsl(215,16%,47%)]">
          <span title="Quotes">{row._count.quotes} quotes</span>
          <span title="Orders">{row._count.orders} orders</span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row: Customer) => (
        <span className="text-xs text-[hsl(215,16%,47%)]">{formatDate(row.createdAt)}</span>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Customers"
        description={`${total} total customers`}
        breadcrumbs={[{ label: 'CRM' }, { label: 'Customers' }]}
        actions={
          <Button
            id="btn-new-customer"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreate(true)}
          >
            New Customer
          </Button>
        }
      />

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(215,16%,47%)]" />
          <input
            type="search"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="h-9 w-full rounded-lg border border-[hsl(214,32%,91%)] bg-white pl-9 pr-3 text-sm text-[hsl(222,47%,11%)] placeholder:text-[hsl(215,16%,60%)] outline-none focus:border-[hsl(221,83%,53%)] focus:ring-2 focus:ring-[hsl(221,83%,53%)]/20 dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] dark:text-white"
          />
        </div>
        <Button variant="outline" size="sm" icon={<Filter className="h-3.5 w-3.5" />}>
          Filter
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        emptyMessage="No customers yet. Add your first customer!"
        onRowClick={(row) => router.push(`/dashboard/customers/${row.id}`)}
      />

      {total > perPage && (
        <Pagination
          page={page}
          totalPages={Math.ceil(total / perPage)}
          total={total}
          perPage={perPage}
          onPageChange={setPage}
        />
      )}

      {/* Create Customer Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="New Customer"
        description="Add a new customer to your CRM"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button form="form-create-customer" type="submit" loading={creating}>Create Customer</Button>
          </>
        }
      >
        <form id="form-create-customer" onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 grid grid-cols-2 gap-4">
              <Select
                id="type"
                label="Client Type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                options={[
                  { value: 'BUSINESS', label: 'Business' },
                  { value: 'INDIVIDUAL', label: 'Individual' },
                ]}
              />
              <Input
                id="companyName"
                label={form.type === 'INDIVIDUAL' ? "Full Name" : "Company Name"}
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                error={formErrors['companyName']}
                required
                placeholder={form.type === 'INDIVIDUAL' ? "John Doe" : "Acme Corporation"}
              />
            </div>
            <Input
              id="email"
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={formErrors['email']}
              placeholder="hello@company.com"
            />
            <Input
              id="phone"
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+1 555-0100"
            />
            <Select
              id="industry"
              label="Industry"
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              options={INDUSTRY_OPTIONS}
              placeholder="Select industry"
            />
            <Input
              id="website"
              label="Website"
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://company.com"
            />
          </div>

          <div className="border-t border-[hsl(214,32%,91%)] pt-4 dark:border-[hsl(217,33%,17%)]">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[hsl(215,16%,47%)]">
              Billing Address
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Input
                  id="billingAddress"
                  label="Street Address"
                  value={form.billingAddress}
                  onChange={(e) => setForm({ ...form, billingAddress: e.target.value })}
                  placeholder="123 Main St"
                />
              </div>
              <Input
                id="billingCity"
                label="City"
                value={form.billingCity}
                onChange={(e) => setForm({ ...form, billingCity: e.target.value })}
                placeholder="New York"
              />
              <Input
                id="billingState"
                label="State"
                value={form.billingState}
                onChange={(e) => setForm({ ...form, billingState: e.target.value })}
                placeholder="NY"
              />
              <Select
                id="billingCountry"
                label="Country"
                value={form.billingCountry}
                onChange={(e) => setForm({ ...form, billingCountry: e.target.value })}
                options={COUNTRY_OPTIONS}
              />
              <Input
                id="billingPostal"
                label="Postal Code"
                value={form.billingPostal}
                onChange={(e) => setForm({ ...form, billingPostal: e.target.value })}
                placeholder="10001"
              />
            </div>
          </div>

          <Textarea
            id="notes"
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Any internal notes about this customer..."
            rows={3}
          />
          <Input
            id="tags"
            label="Tags"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="vip, wholesale, retail (comma-separated)"
            hint="Separate tags with commas"
          />
        </form>
      </Modal>
    </>
  )
}
