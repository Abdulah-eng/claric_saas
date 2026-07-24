'use client'

import { useState, useEffect, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Mail, Phone, Globe, MapPin, Tag, Edit, Plus,
  FileText, ShoppingCart, Receipt, MessageSquare, UserPlus,
  Clock, CheckCircle, Trash2, Box, Save, X, PlusCircle, Check, MoreVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge, QuoteStatusBadge, OrderStatusBadge, InvoiceStatusBadge } from '@/components/ui/badge'
import { Input, Select, Textarea } from '@/components/ui/form'
import { formatDate, formatCurrency, getInitials, formatRelativeTime } from '@/lib/utils'
import { PageHeader } from '@/components/ui/data-table'

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [customer, setCustomer] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'activity' | 'tasks' | 'samples' | 'portal'>('overview')
  
  // List data for dropdowns
  const [users, setUsers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])

  // Inline forms toggles and states
  const [savingDetails, setSavingDetails] = useState(false)
  const [detailsForm, setDetailsForm] = useState({
    type: 'BUSINESS',
    companyName: '',
    website: '',
    email: '',
    phone: '',
    billingAddress: '',
    billingCity: '',
    billingState: '',
    billingCountry: 'US',
    billingPostal: '',
    notes: ''
  })

  // Contacts Form state
  const [showAddContact, setShowAddContact] = useState(false)
  const [editingContactId, setEditingContactId] = useState<string | null>(null)
  const [contactForm, setContactForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    title: '',
    department: '',
    isPrimary: false,
    notes: ''
  })
  const [savingContact, setSavingContact] = useState(false)

  // Tasks Form state
  const [showAddTask, setShowAddTask] = useState(false)
  const [taskForm, setTaskForm] = useState({
    title: '',
    dueDate: '',
    assignedToId: '',
    notes: ''
  })
  const [savingTask, setSavingTask] = useState(false)

  // Samples Form state
  const [showAddSample, setShowAddSample] = useState(false)
  const [sampleForm, setSampleForm] = useState({
    productId: '',
    description: '',
    carrier: '',
    trackingNumber: '',
    status: 'REQUESTED',
    totalValue: 0,
    notes: ''
  })
  const [savingSample, setSavingSample] = useState(false)

  // Activity Form state
  const [activityForm, setActivityForm] = useState({
    source: 'Phone call',
    subject: '',
    occurredAt: new Date().toISOString().substring(0, 16),
    contactId: '',
    notes: ''
  })
  const [savingActivity, setSavingActivity] = useState(false)
  const [activityFilter, setActivityFilter] = useState('All sources')

  // Portal Invitation state
  const [inviteContactId, setInviteContactId] = useState('')
  const [invitingPortal, setInvitingPortal] = useState(false)

  const fetchCustomer = useCallback(() => {
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const data = json.data
          setCustomer(data)
          setDetailsForm({
            type: data.type,
            companyName: data.companyName,
            website: data.website || '',
            email: data.email || '',
            phone: data.phone || '',
            billingAddress: data.billingAddress || '',
            billingCity: data.billingCity || '',
            billingState: data.billingState || '',
            billingCountry: data.billingCountry || 'US',
            billingPostal: data.billingPostal || '',
            notes: data.notes || ''
          })
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    fetchCustomer()
  }, [fetchCustomer])

  useEffect(() => {
    fetch('/api/users?perPage=100')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setUsers(json.data)
      })
    fetch('/api/products?perPage=100')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setProducts(json.data)
      })
  }, [])

  async function handleUpdateDetails(e: React.FormEvent) {
    e.preventDefault()
    setSavingDetails(true)
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(detailsForm),
      })
      const json = await res.json()
      if (json.success) {
        setCustomer((prev: any) => ({ ...prev, ...json.data }))
        alert('Client details saved successfully!')
      }
    } finally {
      setSavingDetails(false)
    }
  }

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault()
    if (!contactForm.firstName) return
    setSavingContact(true)
    try {
      const res = await fetch(`/api/customers/${id}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      })
      const json = await res.json()
      if (json.success) {
        fetchCustomer()
        setShowAddContact(false)
        resetContactForm()
      }
    } finally {
      setSavingContact(false)
    }
  }

  async function handleEditContact(e: React.FormEvent) {
    e.preventDefault()
    if (!contactForm.firstName || !editingContactId) return
    setSavingContact(true)
    try {
      const res = await fetch(`/api/customers/${id}/contacts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactId: editingContactId,
          ...contactForm
        }),
      })
      const json = await res.json()
      if (json.success) {
        fetchCustomer()
        setShowAddContact(false)
        setEditingContactId(null)
        resetContactForm()
      }
    } finally {
      setSavingContact(false)
    }
  }

  function handleEditContactClick(c: any) {
    setEditingContactId(c.id)
    setContactForm({
      firstName: c.firstName,
      lastName: c.lastName || '',
      email: c.email || '',
      phone: c.phone || '',
      title: c.title || '',
      department: c.department || '',
      isPrimary: c.isPrimary,
      notes: c.notes || ''
    })
    setShowAddContact(true)
    // Scroll to the top of the tab container where form is rendered
    window.scrollTo({ top: 300, behavior: 'smooth' })
  }

  async function handleMakePrimary(contactId: string) {
    await fetch(`/api/customers/${id}/contacts`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId, isPrimary: true }),
    })
    fetchCustomer()
  }

  function resetContactForm() {
    setContactForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      title: '',
      department: '',
      isPrimary: false,
      notes: ''
    })
  }

  async function handleRemoveContact(contactId: string) {
    if (!confirm('Remove this contact?')) return
    await fetch(`/api/customers/${id}/contacts`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId })
    })
    fetchCustomer()
  }

  async function handleLogActivity(e: React.FormEvent) {
    e.preventDefault()
    if (!activityForm.subject) return
    setSavingActivity(true)
    try {
      const res = await fetch(`/api/customers/${id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityForm),
      })
      const json = await res.json()
      if (json.success) {
        fetchCustomer()
        setActivityForm({
          source: 'Phone call',
          subject: '',
          occurredAt: new Date().toISOString().substring(0, 16),
          contactId: '',
          notes: ''
        })
      }
    } finally {
      setSavingActivity(false)
    }
  }

  async function handleInvitePortal(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteContactId) return
    setInvitingPortal(true)
    try {
      const res = await fetch(`/api/customers/${id}/portal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId: inviteContactId }),
      })
      if (res.ok) {
        fetchCustomer()
        setInviteContactId('')
      }
    } finally {
      setInvitingPortal(false)
    }
  }

  async function handleRevokePortal(contactId: string) {
    if (!confirm('Revoke portal access for this contact?')) return
    await fetch(`/api/customers/${id}/portal`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactId }),
    })
    fetchCustomer()
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault()
    if (!taskForm.title || !taskForm.dueDate) return
    setSavingTask(true)
    try {
      const res = await fetch('/api/follow-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskForm,
          customerId: id
        }),
      })
      const json = await res.json()
      if (json.success) {
        fetchCustomer()
        setShowAddTask(false)
        setTaskForm({
          title: '',
          dueDate: '',
          assignedToId: '',
          notes: ''
        })
      }
    } finally {
      setSavingTask(false)
    }
  }

  async function handleToggleTask(taskId: string, isDone: boolean) {
    await fetch(`/api/follow-ups/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDone: !isDone })
    })
    fetchCustomer()
  }

  async function handleAddSample(e: React.FormEvent) {
    e.preventDefault()
    if (!sampleForm.description) return
    setSavingSample(true)
    try {
      const res = await fetch('/api/samples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sampleForm,
          customerId: id,
          items: []
        }),
      })
      const json = await res.json()
      if (json.success) {
        fetchCustomer()
        setShowAddSample(false)
        setSampleForm({
          productId: '',
          description: '',
          carrier: '',
          trackingNumber: '',
          status: 'REQUESTED',
          totalValue: 0,
          notes: ''
        })
      }
    } finally {
      setSavingSample(false)
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
        <p className="text-[hsl(215,16%,47%)]">Client not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => router.push('/dashboard/customers')}>Go back</Button>
      </div>
    )
  }

  const TABS = [
    { key: 'overview', label: 'Overview' },
    { key: 'contacts', label: `Contacts ${customer.contacts?.length ?? 0}` },
    { key: 'activity', label: 'Activity' },
    { key: 'tasks', label: `Tasks ${customer.followUps?.filter((f: any) => !f.isDone)?.length || 0}` },
    { key: 'samples', label: `Sample Boxes ${customer.samples?.length ?? 0}` },
    { key: 'portal', label: 'Portal Access' },
  ]

  const filteredActivities = customer.activities?.filter((act: any) => {
    if (activityFilter === 'All sources') return true
    return act.source === activityFilter
  }) || []

  const contactsWithPortal = customer.contacts?.filter((c: any) => c.hasPortalAccess) || []
  const contactsWithoutPortal = customer.contacts?.filter((c: any) => !c.hasPortalAccess) || []

  return (
    <div className="max-w-6xl mx-auto pb-20">
      {/* Back + Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/dashboard/customers')}
            className="mb-3 flex items-center gap-1.5 text-sm text-[hsl(215,16%,47%)] hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Clients
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[hsl(222,47%,11%)] dark:text-white">
              {customer.companyName}
            </h1>
            <Badge variant="outline" className="text-xs py-0.5">
              {customer.type === 'INDIVIDUAL' ? 'Individual' : 'Business'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/customers')}
            icon={<ArrowLeft className="h-3.5 w-3.5" />}
          >
            All Clients
          </Button>
          <Button
            size="sm"
            onClick={handleUpdateDetails}
            loading={savingDetails}
            icon={<Save className="h-3.5 w-3.5" />}
            className="bg-orange-600 hover:bg-orange-700 text-white border-none rounded-lg font-semibold"
          >
            Save Client
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 border-b border-[hsl(214,32%,91%)] dark:border-[hsl(217,33%,17%)] overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors shrink-0 ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-[hsl(215,16%,47%)] hover:text-primary dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <form onSubmit={handleUpdateDetails} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Details Card */}
            <div className="lg:col-span-2 space-y-6">
              <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
                <h3 className="mb-4 text-base font-bold text-[hsl(222,47%,11%)] dark:text-white">Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Type"
                      value={detailsForm.type}
                      onChange={(e) => setFormVal('type', e.target.value)}
                      options={[
                        { value: 'BUSINESS', label: 'Business' },
                        { value: 'INDIVIDUAL', label: 'Individual' }
                      ]}
                    />
                    <Input
                      label="Name *"
                      value={detailsForm.companyName}
                      onChange={(e) => setFormVal('companyName', e.target.value)}
                      required
                    />
                  </div>
                  <Input
                    label="Website"
                    value={detailsForm.website}
                    onChange={(e) => setFormVal('website', e.target.value)}
                    placeholder="https://"
                  />
                  <Input
                    label="Email"
                    value={detailsForm.email}
                    onChange={(e) => setFormVal('email', e.target.value)}
                    placeholder="email@example.com"
                  />
                  <Input
                    label="Phone"
                    value={detailsForm.phone}
                    onChange={(e) => setFormVal('phone', e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
              </div>

              {/* Billing Address Card */}
              <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
                <h3 className="mb-4 text-base font-bold text-[hsl(222,47%,11%)] dark:text-white">Billing Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      label="Address Line 1"
                      value={detailsForm.billingAddress}
                      onChange={(e) => setFormVal('billingAddress', e.target.value)}
                    />
                  </div>
                  <Input
                    label="City"
                    value={detailsForm.billingCity}
                    onChange={(e) => setFormVal('billingCity', e.target.value)}
                  />
                  <Input
                    label="State"
                    value={detailsForm.billingState}
                    onChange={(e) => setFormVal('billingState', e.target.value)}
                  />
                  <Input
                    label="Postal Code"
                    value={detailsForm.billingPostal}
                    onChange={(e) => setFormVal('billingPostal', e.target.value)}
                  />
                  <Input
                    label="Country"
                    value={detailsForm.billingCountry}
                    onChange={(e) => setFormVal('billingCountry', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Notes Card */}
            <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] self-start">
              <h3 className="mb-4 text-base font-bold text-[hsl(222,47%,11%)] dark:text-white">Notes</h3>
              <Textarea
                label="Internal Notes"
                value={detailsForm.notes}
                onChange={(e) => setFormVal('notes', e.target.value)}
                placeholder="Type details about this client..."
                rows={8}
              />
              <div className="mt-4">
                <Button
                  type="submit"
                  loading={savingDetails}
                  icon={<Save className="h-4 w-4" />}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold border-none rounded-lg py-2"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'contacts' && (
          <div className="space-y-6">
            {/* Inline Add/Edit Contact Form */}
            {showAddContact ? (
              <form onSubmit={editingContactId ? handleEditContact : handleAddContact} className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] space-y-4">
                <h3 className="text-base font-bold text-[hsl(222,47%,11%)] dark:text-white">
                  {editingContactId ? 'Edit Contact' : 'Add Contact'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Input
                    label="First Name *"
                    value={contactForm.firstName}
                    onChange={(e) => setContactForm({ ...contactForm, firstName: e.target.value })}
                    required
                  />
                  <Input
                    label="Last Name"
                    value={contactForm.lastName}
                    onChange={(e) => setContactForm({ ...contactForm, lastName: e.target.value })}
                  />
                  <Input
                    label="Title"
                    value={contactForm.title}
                    onChange={(e) => setContactForm({ ...contactForm, title: e.target.value })}
                    placeholder="e.g. Co-Founder"
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  />
                  <Input
                    label="Phone"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  />
                  <Input
                    label="Department"
                    value={contactForm.department}
                    onChange={(e) => setContactForm({ ...contactForm, department: e.target.value })}
                  />
                  <div className="lg:col-span-3">
                    <Textarea
                      label="Notes"
                      value={contactForm.notes}
                      onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                      placeholder="Special contact preferences..."
                      rows={2}
                    />
                  </div>
                  <div className="lg:col-span-3 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPrimary"
                      checked={contactForm.isPrimary}
                      onChange={(e) => setContactForm({ ...contactForm, isPrimary: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                    <label htmlFor="isPrimary" className="text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white cursor-pointer">
                      Primary Contact
                    </label>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => { setShowAddContact(false); setEditingContactId(null); resetContactForm(); }}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={savingContact} className="bg-orange-600 hover:bg-orange-700 text-white font-semibold border-none rounded-lg px-6">
                    {editingContactId ? 'Save Changes' : 'Add Contact'}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-[hsl(214,32%,91%)] dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
                <span className="text-lg font-bold text-[hsl(222,47%,11%)] dark:text-white">Contacts</span>
                <Button
                  size="sm"
                  icon={<UserPlus className="h-4 w-4" />}
                  onClick={() => { setEditingContactId(null); resetContactForm(); setShowAddContact(true); }}
                  className="bg-orange-600 hover:bg-orange-700 text-white border-none rounded-lg"
                >
                  Add Contact
                </Button>
              </div>
            )}

            {/* Contacts list table */}
            <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white shadow-sm overflow-hidden dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
              <table className="w-full text-left text-sm text-[hsl(215,16%,47%)]">
                <thead className="bg-[hsl(210,40%,98%)] text-xs uppercase text-[hsl(215,16%,47%)] dark:bg-[hsl(217,33%,17%)]">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Name</th>
                    <th className="px-6 py-3 font-semibold">Title</th>
                    <th className="px-6 py-3 font-semibold">Email</th>
                    <th className="px-6 py-3 font-semibold">Phone</th>
                    <th className="px-6 py-3 font-semibold">Prefers</th>
                    <th className="px-6 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(214,32%,91%)] dark:divide-[hsl(217,33%,17%)]">
                  {customer.contacts?.map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5">
                      <td className="px-6 py-4 font-semibold text-[hsl(222,47%,11%)] dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{c.firstName} {c.lastName}</span>
                          {c.isPrimary && (
                            <span className="text-[10px] font-semibold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                              Primary
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">{c.title || '—'}</td>
                      <td className="px-6 py-4">{c.email || '—'}</td>
                      <td className="px-6 py-4">{c.phone || '—'}</td>
                      <td className="px-6 py-4">{c.department || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!c.isPrimary && (
                            <button
                              onClick={() => handleMakePrimary(c.id)}
                              className="border border-amber-500 hover:bg-amber-500/10 text-amber-500 text-xs px-2.5 py-1 font-semibold rounded bg-transparent transition-colors"
                            >
                              Make primary
                            </button>
                          )}
                          <button
                            onClick={() => handleEditContactClick(c)}
                            className="border border-amber-500 hover:bg-amber-500/10 text-amber-500 text-xs px-2.5 py-1 font-semibold rounded bg-transparent transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemoveContact(c.id)}
                            className="border border-red-500 hover:bg-red-500/10 text-red-500 text-xs px-2.5 py-1 font-semibold rounded bg-transparent transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!customer.contacts?.length && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-[hsl(215,16%,47%)]">
                        No contacts listed. Click "+ Add Contact" to log the first one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="bg-[hsl(210,40%,98%)] dark:bg-[hsl(217,33%,17%)] px-6 py-3 border-t border-[hsl(214,32%,91%)] dark:border-none">
                <p className="text-xs text-[hsl(215,16%,47%)]">
                  One contact is always primary — quotes, invoices and portal invitations default to them. Removing the primary promotes the next contact automatically.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Log an interaction */}
            <form onSubmit={handleLogActivity} className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] space-y-4">
              <h3 className="text-base font-bold text-[hsl(222,47%,11%)] dark:text-white mb-2">Log an interaction</h3>
              
              <Select
                label="Source *"
                value={activityForm.source}
                onChange={(e) => setActivityForm({ ...activityForm, source: e.target.value })}
                options={[
                  { value: 'Phone call', label: 'Phone call' },
                  { value: 'Email', label: 'Email' },
                  { value: 'Text message', label: 'Text message' },
                  { value: 'Meeting', label: 'Meeting' },
                  { value: 'Note', label: 'Note' },
                ]}
                required
              />

              <Input
                label="Subject *"
                value={activityForm.subject}
                onChange={(e) => setActivityForm({ ...activityForm, subject: e.target.value })}
                required
                placeholder="e.g. Christmas gifting enquiry"
              />

              <Input
                label="When did this happen? *"
                type="datetime-local"
                value={activityForm.occurredAt}
                onChange={(e) => setActivityForm({ ...activityForm, occurredAt: e.target.value })}
                required
              />

              <Select
                label="Contact"
                value={activityForm.contactId}
                onChange={(e) => setActivityForm({ ...activityForm, contactId: e.target.value })}
                options={[
                  { value: '', label: 'Not specified' },
                  ...(customer.contacts || []).map((c: any) => ({
                    value: c.id,
                    label: `${c.firstName} ${c.lastName || ''}`.trim()
                  }))
                ]}
              />

              <Textarea
                label="Notes"
                value={activityForm.notes}
                onChange={(e) => setActivityForm({ ...activityForm, notes: e.target.value })}
                placeholder="What was discussed?"
                rows={3}
              />

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  loading={savingActivity}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold border-none rounded-lg px-6"
                >
                  Log Activity
                </Button>
              </div>
            </form>

            {/* Timeline */}
            <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-[hsl(222,47%,11%)] dark:text-white">Timeline</h3>
                <div className="w-40">
                  <select
                    value={activityFilter}
                    onChange={(e) => setActivityFilter(e.target.value)}
                    className="w-full rounded border border-[hsl(214,32%,91%)] h-8 px-2 text-xs dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] dark:text-white"
                  >
                    <option value="All sources">All sources</option>
                    <option value="Phone call">Phone calls</option>
                    <option value="Email">Emails</option>
                    <option value="Text message">Text messages</option>
                    <option value="Meeting">Meetings</option>
                    <option value="Note">Notes</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 max-h-[500px] pr-2">
                {filteredActivities.map((act: any) => {
                  let icon = <MessageSquare className="h-4 w-4" />
                  if (act.source === 'Phone call') icon = <Phone className="h-4 w-4" />
                  if (act.source === 'Email') icon = <Mail className="h-4 w-4" />
                  if (act.source === 'Meeting') icon = <Globe className="h-4 w-4" />
                  if (act.source === 'Note') icon = <FileText className="h-4 w-4" />

                  return (
                    <div key={act.id} className="p-4 rounded-xl border border-[hsl(214,32%,91%)] dark:border-white/5 bg-[hsl(210,40%,98%)] dark:bg-[hsl(217,33%,17%)] flex gap-3 relative group">
                      <div className="h-8 w-8 shrink-0 rounded bg-white border border-gray-100 dark:bg-black/20 dark:border-none flex items-center justify-center text-primary">
                        {icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-sm text-[hsl(222,47%,11%)] dark:text-white truncate">{act.subject}</p>
                          <button className="text-gray-400 hover:text-gray-600 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] text-[hsl(215,16%,47%)] mt-0.5">
                          {act.source}
                          {act.contact && ` • ${act.contact.firstName} ${act.contact.lastName || ''}`}
                          {` • ${formatDate(act.occurredAt)}`}
                        </p>
                        {act.notes && (
                          <p className="text-xs text-[hsl(215,16%,47%)] mt-2 bg-white dark:bg-black/10 p-2 rounded border border-gray-50 dark:border-none whitespace-pre-wrap">
                            {act.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
                {filteredActivities.length === 0 && (
                  <div className="text-center py-12 text-sm text-[hsl(215,16%,47%)]">
                    No timeline activity logged under this filter.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* Inline Add Task Form */}
            {showAddTask ? (
              <form onSubmit={handleAddTask} className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] space-y-4">
                <h3 className="text-base font-bold text-[hsl(222,47%,11%)] dark:text-white">Assign Task</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Input
                    label="Title / Task *"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    required
                    placeholder="e.g. Call to discuss proposal"
                  />
                  <Input
                    label="Due Date *"
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    required
                  />
                  <Select
                    label="Assigned To"
                    value={taskForm.assignedToId}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedToId: e.target.value })}
                    options={users.map(u => ({ value: u.id, label: `${u.firstName} ${u.lastName}` }))}
                    placeholder="Select team member"
                  />
                  <div className="lg:col-span-3">
                    <Textarea
                      label="Notes"
                      value={taskForm.notes}
                      onChange={(e) => setTaskForm({ ...taskForm, notes: e.target.value })}
                      placeholder="Additional tasks context..."
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddTask(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={savingTask} className="bg-orange-600 hover:bg-orange-700 text-white font-semibold border-none rounded-lg px-6">
                    Assign Task
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => setShowAddTask(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold border-none rounded-lg"
                >
                  Create Task
                </Button>
              </div>
            )}

            {/* Tasks list */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Pending */}
              <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] space-y-4">
                <h3 className="text-base font-bold text-[hsl(222,47%,11%)] dark:text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> Pending ({customer.followUps?.filter((f: any) => !f.isDone).length ?? 0})
                </h3>
                <div className="space-y-3">
                  {customer.followUps?.filter((f: any) => !f.isDone).map((f: any) => (
                    <div key={f.id} className="flex gap-3 p-4 rounded-lg bg-[hsl(210,40%,98%)] dark:bg-[hsl(217,33%,17%)] border border-gray-100 dark:border-none relative group">
                      <button
                        onClick={() => handleToggleTask(f.id, f.isDone)}
                        className="mt-0.5 text-gray-300 hover:text-emerald-500 transition-colors shrink-0"
                      >
                        <Clock className="h-5 w-5" />
                      </button>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[hsl(222,47%,11%)] dark:text-white">{f.title}</p>
                        {f.notes && <p className="text-xs text-[hsl(215,16%,47%)] mt-1">{f.notes}</p>}
                        <div className="mt-2 flex items-center justify-between text-xs text-[hsl(215,16%,47%)]">
                          <span>Due: {formatDate(f.dueDate)}</span>
                          {f.assignedTo && (
                            <span className="font-medium text-orange-600 dark:text-orange-400">
                              Assigned to: {f.assignedTo.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {!customer.followUps?.some((f: any) => !f.isDone) && (
                    <p className="text-center text-sm text-[hsl(215,16%,47%)] py-6">No pending tasks.</p>
                  )}
                </div>
              </div>

              {/* Completed */}
              <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] space-y-4">
                <h3 className="text-base font-bold text-[hsl(222,47%,11%)] dark:text-white flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" /> Completed ({customer.followUps?.filter((f: any) => f.isDone).length ?? 0})
                </h3>
                <div className="space-y-3">
                  {customer.followUps?.filter((f: any) => f.isDone).map((f: any) => (
                    <div key={f.id} className="flex gap-3 p-4 rounded-lg bg-[hsl(210,40%,98%)] dark:bg-[hsl(217,33%,17%)] border border-gray-100 dark:border-none relative group opacity-75">
                      <button
                        onClick={() => handleToggleTask(f.id, f.isDone)}
                        className="mt-0.5 text-emerald-500 hover:text-gray-300 transition-colors shrink-0"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[hsl(215,16%,47%)] line-through">{f.title}</p>
                        <span className="text-[10px] text-[hsl(215,16%,47%)]">Done: {formatDate(f.dueDate)}</span>
                      </div>
                    </div>
                  ))}
                  {!customer.followUps?.some((f: any) => f.isDone) && (
                    <p className="text-center text-sm text-[hsl(215,16%,47%)] py-6">No completed tasks.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'samples' && (
          <div className="space-y-6">
            {/* Inline Log Sample Form */}
            {showAddSample ? (
              <form onSubmit={handleAddSample} className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] space-y-4">
                <h3 className="text-base font-bold text-[hsl(222,47%,11%)] dark:text-white">Log Sample Box</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Select
                    label="Catalog Product"
                    value={sampleForm.productId}
                    onChange={(e) => setSampleForm({ ...sampleForm, productId: e.target.value })}
                    options={products.map(p => ({ value: p.id, label: p.name }))}
                    placeholder="Select catalog product (optional)"
                  />
                  <Input
                    label="Description *"
                    value={sampleForm.description}
                    onChange={(e) => setSampleForm({ ...sampleForm, description: e.target.value })}
                    required
                    placeholder="e.g. Sample box of customizable mugs"
                  />
                  <Input
                    label="Total Value ($)"
                    type="number"
                    value={sampleForm.totalValue}
                    onChange={(e) => setSampleForm({ ...sampleForm, totalValue: Number(e.target.value) })}
                    placeholder="0"
                  />
                  <Input
                    label="Carrier"
                    value={sampleForm.carrier}
                    onChange={(e) => setSampleForm({ ...sampleForm, carrier: e.target.value })}
                    placeholder="e.g. FedEx, UPS"
                  />
                  <Input
                    label="Tracking Number"
                    value={sampleForm.trackingNumber}
                    onChange={(e) => setSampleForm({ ...sampleForm, trackingNumber: e.target.value })}
                    placeholder="Tracking details"
                  />
                  <Select
                    label="Status"
                    value={sampleForm.status}
                    onChange={(e) => setSampleForm({ ...sampleForm, status: e.target.value })}
                    options={[
                      { value: 'REQUESTED', label: 'Requested' },
                      { value: 'SHIPPED', label: 'Shipped' },
                      { value: 'DELIVERED', label: 'Delivered' },
                      { value: 'CONVERTED', label: 'Converted' },
                      { value: 'DECLINED', label: 'Declined' }
                    ]}
                  />
                  <div className="lg:col-span-3">
                    <Textarea
                      label="Notes"
                      value={sampleForm.notes}
                      onChange={(e) => setSampleForm({ ...sampleForm, notes: e.target.value })}
                      placeholder="Add tracking notes, recipient detail..."
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddSample(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={savingSample} className="bg-orange-600 hover:bg-orange-700 text-white font-semibold border-none rounded-lg px-6">
                    Log Sample
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex justify-end">
                <Button
                  size="sm"
                  icon={<Plus className="h-4 w-4" />}
                  onClick={() => setShowAddSample(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold border-none rounded-lg"
                >
                  Log Sample Box
                </Button>
              </div>
            )}

            {/* Sample Boxes list */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {customer.samples?.map((s: any) => (
                <div key={s.id} className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-5 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] space-y-3 relative group">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm text-[hsl(222,47%,11%)] dark:text-white line-clamp-1">{s.description}</p>
                      <p className="text-xs text-[hsl(215,16%,47%)]">Logged: {formatDate(s.createdAt)}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {s.status}
                    </Badge>
                  </div>
                  <div className="text-xs space-y-1.5 pt-1.5 border-t border-gray-100 dark:border-white/5">
                    {s.product && (
                      <p className="text-[hsl(215,16%,47%)]">
                        <span className="font-medium text-[hsl(222,47%,11%)] dark:text-white">Product:</span> {s.product.name}
                      </p>
                    )}
                    {(s.carrier || s.trackingNumber) && (
                      <p className="text-[hsl(215,16%,47%)]">
                        <span className="font-medium text-[hsl(222,47%,11%)] dark:text-white">Tracking:</span> {s.carrier || ''} {s.trackingNumber ? `(${s.trackingNumber})` : ''}
                      </p>
                    )}
                    <p className="text-[hsl(215,16%,47%)]">
                      <span className="font-medium text-[hsl(222,47%,11%)] dark:text-white">Value:</span> {formatCurrency(s.totalValue)}
                    </p>
                    {s.notes && (
                      <p className="text-xs text-[hsl(215,16%,47%)] mt-1 whitespace-pre-wrap">{s.notes}</p>
                    )}
                  </div>
                </div>
              ))}
              {!customer.samples?.length && (
                <div className="col-span-3 py-10 text-center text-sm text-[hsl(215,16%,47%)]">
                  No sample boxes logged under this client record.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'portal' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Access Panel */}
            <div className="md:col-span-2 rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[hsl(222,47%,11%)] dark:text-white">Portal access</h3>
                {contactsWithPortal.length === 0 ? (
                  <p className="text-sm text-[hsl(215,16%,47%)] mt-2">
                    Nobody at this client has portal access yet.
                  </p>
                ) : (
                  <div className="mt-4 border border-[hsl(214,32%,91%)] dark:border-white/5 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm text-[hsl(215,16%,47%)]">
                      <thead className="bg-[hsl(210,40%,98%)] text-xs uppercase text-[hsl(215,16%,47%)] dark:bg-[hsl(217,33%,17%)]">
                        <tr>
                          <th className="px-4 py-2 font-semibold">Name</th>
                          <th className="px-4 py-2 font-semibold">Email</th>
                          <th className="px-4 py-2 font-semibold">Invited On</th>
                          <th className="px-4 py-2 text-right font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[hsl(214,32%,91%)] dark:divide-white/5">
                        {contactsWithPortal.map((c: any) => (
                          <tr key={c.id}>
                            <td className="px-4 py-3 font-medium text-[hsl(222,47%,11%)] dark:text-white">{c.firstName} {c.lastName}</td>
                            <td className="px-4 py-3">{c.email}</td>
                            <td className="px-4 py-3">{formatDate(c.portalInviteSentAt)}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleRevokePortal(c.id)}
                                className="border border-red-500 hover:bg-red-500/10 text-red-500 text-xs px-2.5 py-1 font-semibold rounded bg-transparent transition-colors"
                              >
                                Revoke
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Invite Form */}
              <form onSubmit={handleInvitePortal} className="border-t border-[hsl(214,32%,91%)] dark:border-white/5 pt-6 space-y-4">
                <h4 className="font-bold text-sm text-[hsl(222,47%,11%)] dark:text-white">Invite a contact</h4>
                <div className="flex flex-col sm:flex-row gap-3 items-end">
                  <div className="flex-1 w-full">
                    <Select
                      label=""
                      value={inviteContactId}
                      onChange={(e) => setInviteContactId(e.target.value)}
                      options={[
                        { value: '', label: 'Choose a person...' },
                        ...contactsWithoutPortal.map((c: any) => ({
                          value: c.id,
                          label: `${c.firstName} ${c.lastName || ''} — ${c.email || 'no email'}`.trim()
                        }))
                      ]}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    loading={invitingPortal}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-semibold border-none rounded-lg px-6 h-9"
                  >
                    Send Invitation
                  </Button>
                </div>
              </form>
            </div>

            {/* Right Instructions Panel */}
            <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] space-y-4 h-fit">
              <h3 className="font-bold text-base text-[hsl(222,47%,11%)] dark:text-white">How access works</h3>
              <div className="text-sm text-[hsl(215,16%,47%)] space-y-4 leading-relaxed">
                <p>
                  An invitation emails a link that is valid for a fortnight. The person chooses their own password — nobody here ever sets or sees it.
                </p>
                <p>
                  Access is tied to this client. Somebody signed in here can see this company's quotes, proofs, invoices and orders, and nothing belonging to anybody else.
                </p>
                <p>
                  Switch off ends their session immediately and keeps the record of who had access. Remove deletes it entirely.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  function setFormVal(field: string, val: any) {
    setDetailsForm((prev) => ({ ...prev, [field]: val }))
  }
}
