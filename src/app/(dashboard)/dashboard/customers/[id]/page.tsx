'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Mail, Phone, Globe, MapPin, Tag, Edit, Plus,
  FileText, ShoppingCart, Receipt, MessageSquare, UserPlus,
  Clock, Star, MoreHorizontal, Building2, Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge, QuoteStatusBadge, OrderStatusBadge, InvoiceStatusBadge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/form'
import { formatDate, formatCurrency, getInitials, formatRelativeTime } from '@/lib/utils'
import { PageHeader } from '@/components/ui/data-table'
import { FollowUpsList } from '@/components/crm/follow-ups-list'

type Customer = any

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'quotes' | 'orders' | 'invoices' | 'contacts' | 'messages' | 'followups'>('overview')
  const [showAddContact, setShowAddContact] = useState(false)
  const [contactForm, setContactForm] = useState({ firstName: '', lastName: '', email: '', phone: '', title: '', department: '', isPrimary: false })
  const [savingContact, setSavingContact] = useState(false)

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setCustomer(json.data)
      })
      .finally(() => setLoading(false))
  }, [id])

  const refreshData = useCallback(() => {
    fetch(`/api/customers/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setCustomer(data.data)
      })
  }, [id])

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault()
    setSavingContact(true)
    try {
      const res = await fetch(`/api/customers/${id}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      })
      const json = await res.json()
      if (json.success) {
        setCustomer((prev: any) => ({
          ...prev,
          contacts: [...(prev.contacts ?? []), json.data],
        }))
        setShowAddContact(false)
        setContactForm({ firstName: '', lastName: '', email: '', phone: '', title: '', department: '', isPrimary: false })
      }
    } finally {
      setSavingContact(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-[hsl(210,40%,93%)] dark:bg-[hsl(217,33%,17%)]" />
        ))}
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-[hsl(215,16%,47%)]">Customer not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go back</Button>
      </div>
    )
  }

  const TABS = [
    { key: 'overview', label: 'Overview', count: null },
    { key: 'quotes', label: 'Quotes', count: customer._count?.quotes },
    { key: 'orders', label: 'Orders', count: customer._count?.orders },
    { key: 'invoices', label: 'Invoices', count: customer._count?.invoices },
    ...(customer.type === 'BUSINESS' ? [{ key: 'contacts', label: 'Contacts', count: customer.contacts?.length }] : []),
    { key: 'followups', label: 'Follow-ups', count: customer.followUps?.filter((f: any) => !f.isDone)?.length || 0 },
    { key: 'messages', label: 'Messages', count: customer._count?.messages },
  ]

  return (
    <>
      {/* Back + Header */}
      <div className="mb-4">
        <button
          onClick={() => router.push('/dashboard/customers')}
          className="mb-3 flex items-center gap-1.5 text-sm text-[hsl(215,16%,47%)] hover:text-[hsl(222,47%,11%)] dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Customers
        </button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-bold text-white shadow-lg">
              {getInitials(customer.companyName)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-[hsl(222,47%,11%)] dark:text-white">
                  {customer.companyName}
                </h1>
                <Badge variant="outline">{customer.type === 'INDIVIDUAL' ? 'Individual' : 'Business'}</Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[hsl(215,16%,47%)]">
                {customer.email && (
                  <a href={`mailto:${customer.email}`} className="flex items-center gap-1.5 hover:text-[hsl(221,83%,53%)]">
                    <Mail className="h-3.5 w-3.5" /> {customer.email}
                  </a>
                )}
                {customer.phone && (
                  <a href={`tel:${customer.phone}`} className="flex items-center gap-1.5 hover:text-[hsl(221,83%,53%)]">
                    <Phone className="h-3.5 w-3.5" /> {customer.phone}
                  </a>
                )}
                {(customer.billingCity || customer.billingCountry) && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {[customer.billingCity, customer.billingState, customer.billingCountry].filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {customer.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              icon={<FileText className="h-3.5 w-3.5" />}
              onClick={() => router.push(`/dashboard/quotes/new?customerId=${id}`)}
            >
              New Quote
            </Button>
            <Button
              size="sm"
              icon={<Edit className="h-3.5 w-3.5" />}
            >
              Edit
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Quotes', value: customer._count?.quotes ?? 0, icon: <FileText className="h-4 w-4" />, color: 'from-blue-500 to-blue-600' },
          { label: 'Total Orders', value: customer._count?.orders ?? 0, icon: <ShoppingCart className="h-4 w-4" />, color: 'from-purple-500 to-purple-600' },
          { label: 'Total Invoices', value: customer._count?.invoices ?? 0, icon: <Receipt className="h-4 w-4" />, color: 'from-amber-500 to-amber-600' },
          { label: 'Messages', value: customer._count?.messages ?? 0, icon: <MessageSquare className="h-4 w-4" />, color: 'from-emerald-500 to-emerald-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-4 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-[hsl(215,16%,47%)]">{s.label}</p>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white ${s.color}`}>
                {s.icon}
              </div>
            </div>
            <p className="mt-2 text-2xl font-bold text-[hsl(222,47%,11%)] dark:text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-0.5 border-b border-[hsl(214,32%,91%)] dark:border-[hsl(217,33%,17%)]">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'border-[hsl(221,83%,53%)] text-[hsl(221,83%,53%)]'
                : 'border-transparent text-[hsl(215,16%,47%)] hover:text-[hsl(222,47%,11%)] dark:hover:text-white'
            }`}
          >
            {tab.label}
            {tab.count !== null && tab.count !== undefined && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                activeTab === tab.key
                  ? 'bg-[hsl(221,83%,53%)]/15 text-[hsl(221,83%,53%)]'
                  : 'bg-[hsl(210,40%,93%)] text-[hsl(215,16%,47%)] dark:bg-[hsl(217,33%,17%)]'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Company Details */}
          <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-5 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[hsl(222,47%,11%)] dark:text-white">
              <Building2 className="h-4 w-4 text-[hsl(215,16%,47%)]" /> Company Details
            </h3>
            <dl className="space-y-3 text-sm">
              {[
                { label: 'Legal Name', value: customer.legalName },
                { label: 'Industry', value: customer.industry },
                { label: 'Website', value: customer.website, isLink: true },
                { label: 'Billing Address', value: [customer.billingAddress, customer.billingCity, customer.billingState, customer.billingPostal, customer.billingCountry].filter(Boolean).join(', ') },
                { label: 'Customer Since', value: formatDate(customer.createdAt) },
              ].map(({ label, value, isLink }) =>
                value ? (
                  <div key={label}>
                    <dt className="text-[hsl(215,16%,47%)]">{label}</dt>
                    <dd className="mt-0.5 font-medium text-[hsl(222,47%,11%)] dark:text-white">
                      {isLink ? (
                        <a href={value} target="_blank" rel="noopener noreferrer" className="text-[hsl(221,83%,53%)] hover:underline">
                          {value}
                        </a>
                      ) : value}
                    </dd>
                  </div>
                ) : null
              )}
            </dl>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2 rounded-xl border border-[hsl(214,32%,91%)] bg-white p-5 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[hsl(222,47%,11%)] dark:text-white">
              <Activity className="h-4 w-4 text-[hsl(215,16%,47%)]" /> Activity Timeline
            </h3>
            <div className="space-y-3">
              {/* Recent quotes */}
              {customer.quotes?.map((q: any) => (
                <div key={q.id} className="flex items-center justify-between rounded-lg bg-[hsl(210,40%,98%)] px-3 py-2 dark:bg-[hsl(217,33%,17%)]">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/15">
                      <FileText className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[hsl(222,47%,11%)] dark:text-white">{q.quoteNumber}</p>
                      <p className="text-[10px] text-[hsl(215,16%,47%)]">{formatDate(q.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <QuoteStatusBadge status={q.status} />
                    <span className="text-xs font-semibold text-[hsl(222,47%,11%)] dark:text-white">
                      {formatCurrency(q.total)}
                    </span>
                  </div>
                </div>
              ))}
              {/* Recent orders */}
              {customer.orders?.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between rounded-lg bg-[hsl(210,40%,98%)] px-3 py-2 dark:bg-[hsl(217,33%,17%)]">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/15">
                      <ShoppingCart className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[hsl(222,47%,11%)] dark:text-white">{o.orderNumber}</p>
                      <p className="text-[10px] text-[hsl(215,16%,47%)]">{formatDate(o.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={o.status} />
                    <span className="text-xs font-semibold text-[hsl(222,47%,11%)] dark:text-white">
                      {formatCurrency(o.total)}
                    </span>
                  </div>
                </div>
              ))}
              {(!customer.quotes?.length && !customer.orders?.length) && (
                <p className="text-center text-sm text-[hsl(215,16%,47%)] py-6">No activity yet</p>
              )}
            </div>
          </div>

          {/* Notes */}
          {customer.notes && (
            <div className="lg:col-span-3 rounded-xl border border-[hsl(214,32%,91%)] bg-white p-5 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
              <h3 className="mb-2 text-sm font-semibold text-[hsl(222,47%,11%)] dark:text-white">Internal Notes</h3>
              <p className="text-sm text-[hsl(215,16%,47%)] whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'contacts' && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-[hsl(215,16%,47%)]">{customer.contacts?.length ?? 0} contacts</p>
            <Button size="sm" icon={<UserPlus className="h-3.5 w-3.5" />} onClick={() => setShowAddContact(true)}>
              Add Contact
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {customer.contacts?.map((c: any) => (
              <div key={c.id} className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-4 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-sm font-bold text-white">
                      {getInitials(`${c.firstName} ${c.lastName}`)}
                    </div>
                    <div>
                      <p className="font-medium text-[hsl(222,47%,11%)] dark:text-white">
                        {c.firstName} {c.lastName}
                      </p>
                      {c.title && <p className="text-xs text-[hsl(215,16%,47%)]">{c.title}</p>}
                      {c.isPrimary && <Badge variant="success" className="mt-1 text-[10px]">Primary</Badge>}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1.5">
                  {c.email && (
                    <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-xs text-[hsl(215,16%,47%)] hover:text-[hsl(221,83%,53%)]">
                      <Mail className="h-3 w-3" /> {c.email}
                    </a>
                  )}
                  {c.phone && (
                    <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-xs text-[hsl(215,16%,47%)] hover:text-[hsl(221,83%,53%)]">
                      <Phone className="h-3 w-3" /> {c.phone}
                    </a>
                  )}
                  {c.department && (
                    <p className="text-xs text-[hsl(215,16%,47%)]">{c.department}</p>
                  )}
                </div>
              </div>
            ))}
            {!customer.contacts?.length && (
              <p className="col-span-3 py-8 text-center text-sm text-[hsl(215,16%,47%)]">
                No contacts yet. Add the first contact.
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'quotes' && (
        <div className="space-y-3">
          {customer.quotes?.map((q: any) => (
            <div key={q.id} className="flex items-center justify-between rounded-xl border border-[hsl(214,32%,91%)] bg-white p-4 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
              <div>
                <p className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{q.quoteNumber}</p>
                <p className="text-xs text-[hsl(215,16%,47%)]">{formatDate(q.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <QuoteStatusBadge status={q.status} />
                <p className="font-semibold text-[hsl(222,47%,11%)] dark:text-white">{formatCurrency(q.total)}</p>
              </div>
            </div>
          ))}
          {!customer.quotes?.length && <p className="py-8 text-center text-sm text-[hsl(215,16%,47%)]">No quotes yet.</p>}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-3">
          {customer.orders?.map((o: any) => (
            <div key={o.id} className="flex items-center justify-between rounded-xl border border-[hsl(214,32%,91%)] bg-white p-4 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
              <div>
                <p className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{o.orderNumber}</p>
                <p className="text-xs text-[hsl(215,16%,47%)]">{formatDate(o.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <OrderStatusBadge status={o.status} />
                <p className="font-semibold text-[hsl(222,47%,11%)] dark:text-white">{formatCurrency(o.total)}</p>
              </div>
            </div>
          ))}
          {!customer.orders?.length && <p className="py-8 text-center text-sm text-[hsl(215,16%,47%)]">No orders yet.</p>}
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="space-y-3">
          {customer.invoices?.map((inv: any) => (
            <div key={inv.id} className="flex items-center justify-between rounded-xl border border-[hsl(214,32%,91%)] bg-white p-4 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
              <div>
                <p className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{inv.invoiceNumber}</p>
                <p className="text-xs text-[hsl(215,16%,47%)]">{formatDate(inv.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <InvoiceStatusBadge status={inv.status} />
                <div className="text-right">
                  <p className="font-semibold text-[hsl(222,47%,11%)] dark:text-white">{formatCurrency(inv.total)}</p>
                  {Number(inv.amountDue) > 0 && (
                    <p className="text-xs text-red-500">Due: {formatCurrency(inv.amountDue)}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!customer.invoices?.length && <p className="py-8 text-center text-sm text-[hsl(215,16%,47%)]">No invoices yet.</p>}
        </div>
      )}

      {/* Follow-ups Tab */}
      {activeTab === 'followups' && (
        <div className="animate-in fade-in">
          <FollowUpsList 
            followUps={customer.followUps || []} 
            targetId={customer.id} 
            targetType="customer" 
            onRefresh={refreshData}
          />
        </div>
      )}

      {/* Add Contact Modal */}
      <Modal
        open={showAddContact}
        onClose={() => setShowAddContact(false)}
        title="Add Contact"
        size="md"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowAddContact(false)}>Cancel</Button>
            <Button form="form-add-contact" type="submit" loading={savingContact}>Add Contact</Button>
          </>
        }
      >
        <form id="form-add-contact" onSubmit={handleAddContact} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input id="firstName" label="First Name" value={contactForm.firstName} onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })} required />
            <Input id="lastName" label="Last Name" value={contactForm.lastName} onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })} required />
            <Input id="contactEmail" label="Email" type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
            <Input id="contactPhone" label="Phone" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })} />
            <Input id="contactTitle" label="Title" value={contactForm.title} onChange={(e) => setContactForm({ ...contactForm, title: e.target.value })} placeholder="CEO, Manager..." />
            <Input id="contactDepartment" label="Department" value={contactForm.department} onChange={(e) => setContactForm({ ...contactForm, department: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-[hsl(222,47%,11%)] dark:text-white cursor-pointer">
            <input
              type="checkbox"
              checked={contactForm.isPrimary}
              onChange={(e) => setContactForm({ ...contactForm, isPrimary: e.target.checked })}
              className="h-4 w-4 rounded border-[hsl(214,32%,91%)]"
            />
            Set as primary contact
          </label>
        </form>
      </Modal>
    </>
  )
}
