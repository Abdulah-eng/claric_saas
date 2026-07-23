'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Save, Building, Palette, Settings2, Bell, Mail, CreditCard, Zap, CheckCircle2, XCircle, Send, Loader2 } from 'lucide-react'

export default function SettingsPage() {
  const [data, setData] = useState<any>({ settings: {}, whiteLabel: {}, company: {} })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('company')
  const [testEmailLoading, setTestEmailLoading] = useState(false)
  const [testEmailResult, setTestEmailResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const fetchSettings = () => {
    setLoading(true)
    fetch('/api/settings')
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSaving(false)
  }

  const handleChange = (section: string, field: string, value: any) => {
    setData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const handleSendTestEmail = async () => {
    setTestEmailLoading(true)
    setTestEmailResult(null)
    try {
      const res = await fetch('/api/settings/test-email', { method: 'POST' })
      const json = await res.json()
      setTestEmailResult({ ok: json.success, msg: json.data?.message || json.error || 'Unknown error' })
    } catch {
      setTestEmailResult({ ok: false, msg: 'Failed to send request' })
    } finally {
      setTestEmailLoading(false)
    }
  }

  if (loading) return <div className="animate-pulse h-96 rounded-xl bg-[hsl(210,40%,93%)] dark:bg-[hsl(217,33%,17%)]" />

  const tabs = [
    { id: 'company', label: 'Company Profile', icon: Building },
    { id: 'whitelabel', label: 'White Label', icon: Palette },
    { id: 'general', label: 'General Settings', icon: Settings2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'email', label: 'Email & SMTP', icon: Mail },
    { id: 'payments', label: 'Payment Gateways', icon: CreditCard },
    { id: 'integrations', label: 'Integrations', icon: Zap },
  ]

  return (
    <div className="pb-20 max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-8">
        <PageHeader title="Platform Settings" description="Manage your company profile, branding, and system preferences." />
        <Button onClick={handleSave} disabled={saving} icon={<Save className="h-4 w-4" />}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 space-y-1">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-[hsl(215,16%,47%)] hover:bg-[hsl(214,32%,91%)] hover:text-[hsl(222,47%,11%)] dark:hover:bg-[hsl(217,33%,17%)] dark:hover:text-white'}`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <form onSubmit={handleSave} className="bg-white dark:bg-[hsl(217,33%,17%)] p-8 rounded-2xl border border-[hsl(214,32%,91%)] dark:border-white/5 shadow-sm space-y-6">
            
            {activeTab === 'company' && (
              <div className="space-y-6 animate-in fade-in">
                <h3 className="text-lg font-semibold text-[hsl(222,47%,11%)] dark:text-white mb-4">Company Profile</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-2">Company Name</label>
                    <input type="text" value={data.company?.name || ''} onChange={(e) => handleChange('company', 'name', e.target.value)} className="w-full rounded-md border border-[hsl(214,32%,91%)] px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-black/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-2">Legal Name</label>
                    <input type="text" value={data.company?.legalName || ''} onChange={(e) => handleChange('company', 'legalName', e.target.value)} className="w-full rounded-md border border-[hsl(214,32%,91%)] px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-black/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-2">Support Email</label>
                    <input type="email" value={data.company?.email || ''} onChange={(e) => handleChange('company', 'email', e.target.value)} className="w-full rounded-md border border-[hsl(214,32%,91%)] px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-black/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-2">Phone</label>
                    <input type="text" value={data.company?.phone || ''} onChange={(e) => handleChange('company', 'phone', e.target.value)} className="w-full rounded-md border border-[hsl(214,32%,91%)] px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-black/20 focus:border-blue-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-2">Address</label>
                    <input type="text" value={data.company?.address || ''} onChange={(e) => handleChange('company', 'address', e.target.value)} className="w-full rounded-md border border-[hsl(214,32%,91%)] px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-black/20 focus:border-blue-500" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'whitelabel' && (
              <div className="space-y-6 animate-in fade-in">
                <h3 className="text-lg font-semibold text-[hsl(222,47%,11%)] dark:text-white mb-4">Branding & White Label</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-2">Primary Color (Hex)</label>
                    <div className="flex gap-2">
                      <input type="color" value={data.whiteLabel?.primaryColor || '#2563EB'} onChange={(e) => handleChange('whiteLabel', 'primaryColor', e.target.value)} className="h-10 w-10 rounded border-0 p-0" />
                      <input type="text" value={data.whiteLabel?.primaryColor || '#2563EB'} onChange={(e) => handleChange('whiteLabel', 'primaryColor', e.target.value)} className="flex-1 rounded-md border border-[hsl(214,32%,91%)] px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-black/20 focus:border-blue-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-2">Portal Title</label>
                    <input type="text" value={data.whiteLabel?.portalTitle || ''} onChange={(e) => handleChange('whiteLabel', 'portalTitle', e.target.value)} placeholder="e.g. Acme Customer Portal" className="w-full rounded-md border border-[hsl(214,32%,91%)] px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-black/20 focus:border-blue-500" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-2">Custom CSS</label>
                    <textarea value={data.whiteLabel?.customCss || ''} onChange={(e) => handleChange('whiteLabel', 'customCss', e.target.value)} rows={5} className="w-full rounded-md border border-[hsl(214,32%,91%)] px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-black/20 focus:border-blue-500 font-mono" placeholder="/* Custom CSS for portal */" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'general' && (
              <div className="space-y-6 animate-in fade-in">
                <h3 className="text-lg font-semibold text-[hsl(222,47%,11%)] dark:text-white mb-4">General Preferences</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-2">Quote Prefix</label>
                    <input type="text" value={data.settings?.quotePrefix || ''} onChange={(e) => handleChange('settings', 'quotePrefix', e.target.value)} className="w-full rounded-md border border-[hsl(214,32%,91%)] px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-black/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-2">Order Prefix</label>
                    <input type="text" value={data.settings?.orderPrefix || ''} onChange={(e) => handleChange('settings', 'orderPrefix', e.target.value)} className="w-full rounded-md border border-[hsl(214,32%,91%)] px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-black/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-2">Invoice Prefix</label>
                    <input type="text" value={data.settings?.invoicePrefix || ''} onChange={(e) => handleChange('settings', 'invoicePrefix', e.target.value)} className="w-full rounded-md border border-[hsl(214,32%,91%)] px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-black/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-2">Quote Expiry Days</label>
                    <input type="number" value={data.settings?.quoteExpiryDays || 30} onChange={(e) => handleChange('settings', 'quoteExpiryDays', Number(e.target.value))} className="w-full rounded-md border border-[hsl(214,32%,91%)] px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-black/20 focus:border-blue-500" />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-in fade-in">
                <h3 className="text-lg font-semibold text-[hsl(222,47%,11%)] dark:text-white mb-1">Notification Preferences</h3>
                <p className="text-sm text-[hsl(215,16%,47%)] mb-6">Choose which events trigger email notifications for your team.</p>

                <div className="space-y-4">
                  {[
                    { field: 'notifyOnLeadAssigned', label: 'Lead Assigned', description: 'Notify the assigned sales rep when a lead is assigned to them.' },
                    { field: 'notifyOnQuoteApproved', label: 'Quote Approved', description: 'Notify staff when a customer approves a quote.' },
                    { field: 'notifyOnOrderCreated', label: 'Order Created', description: 'Notify production when a new order is confirmed.' },
                    { field: 'notifyOnInvoiceOverdue', label: 'Invoice Overdue', description: 'Notify finance staff when an invoice payment is overdue.' },
                  ].map(({ field, label, description }) => (
                    <div key={field} className="flex items-start justify-between gap-4 rounded-xl border border-[hsl(214,32%,91%)] p-4 dark:border-white/10">
                      <div>
                        <p className="text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white">{label}</p>
                        <p className="text-xs text-[hsl(215,16%,47%)] mt-0.5">{description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleChange('settings', field, !data.settings?.[field])}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                          data.settings?.[field] ? 'bg-blue-600' : 'bg-[hsl(214,32%,85%)] dark:bg-[hsl(217,33%,25%)]'
                        }`}
                      >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
                          data.settings?.[field] ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h3 className="text-lg font-semibold text-[hsl(222,47%,11%)] dark:text-white mb-1">Email & SMTP</h3>
                  <p className="text-sm text-[hsl(215,16%,47%)] mb-6">Configure how outbound emails are sent from your workspace.</p>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-2">From Email Address</label>
                      <input type="email" value={data.settings?.emailFromAddress || ''} onChange={(e) => handleChange('settings', 'emailFromAddress', e.target.value)} placeholder="no-reply@yourcompany.com" className="w-full rounded-md border border-[hsl(214,32%,91%)] px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-black/20 focus:border-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-[hsl(214,32%,91%)] pt-6 dark:border-white/10">
                  <h4 className="text-base font-semibold text-[hsl(222,47%,11%)] dark:text-white mb-4">Option 1 — Resend (Recommended)</h4>
                  <div>
                    <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-2">Resend API Key</label>
                    <input type="password" placeholder={data.settings?.resendApiKeyEncrypted ? '••••••••••••••••' : 'Enter Resend API key'} onChange={(e) => handleChange('settings', 'resendApiKeyEncrypted', e.target.value)} className="w-full rounded-md border border-[hsl(214,32%,91%)] px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-black/20 focus:border-blue-500" />
                    <p className="mt-1.5 text-xs text-[hsl(215,16%,47%)]">Get your API key from <span className="font-mono text-blue-500">resend.com/api-keys</span></p>
                  </div>
                </div>

                <div className="border-t border-[hsl(214,32%,91%)] pt-6 dark:border-white/10">
                  <h4 className="text-base font-semibold text-[hsl(222,47%,11%)] dark:text-white mb-4">Option 2 — Custom SMTP</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-2">SMTP Host</label>
                      <input type="text" value={data.settings?.smtpHost || ''} onChange={(e) => handleChange('settings', 'smtpHost', e.target.value)} placeholder="smtp.gmail.com" className="w-full rounded-md border border-[hsl(214,32%,91%)] px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-black/20 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-2">SMTP Port</label>
                      <input type="number" value={data.settings?.smtpPort || ''} onChange={(e) => handleChange('settings', 'smtpPort', Number(e.target.value))} placeholder="587" className="w-full rounded-md border border-[hsl(214,32%,91%)] px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-black/20 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-2">SMTP Username</label>
                      <input type="text" value={data.settings?.smtpUser || ''} onChange={(e) => handleChange('settings', 'smtpUser', e.target.value)} placeholder="user@gmail.com" className="w-full rounded-md border border-[hsl(214,32%,91%)] px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-black/20 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-2">SMTP Password</label>
                      <input type="password" placeholder={data.settings?.smtpPasswordEncrypted ? '••••••••' : 'Enter SMTP password'} onChange={(e) => handleChange('settings', 'smtpPasswordEncrypted', e.target.value)} className="w-full rounded-md border border-[hsl(214,32%,91%)] px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-black/20 focus:border-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-[hsl(214,32%,91%)] pt-6 dark:border-white/10">
                  <h4 className="text-base font-semibold text-[hsl(222,47%,11%)] dark:text-white mb-4">Option 3 — Google Workspace (OAuth)</h4>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-[hsl(210,40%,98%)] border border-[hsl(214,32%,91%)] dark:bg-white/5 dark:border-white/10">
                    <div>
                      <h4 className="text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white">Gmail / Google Workspace</h4>
                      <p className="text-xs text-[hsl(215,16%,47%)] mt-1">
                        {data.settings?.smtpUser 
                          ? `Connected as: ${data.settings.smtpUser}` 
                          : 'Connect your Google account to send and receive emails directly.'}
                      </p>
                    </div>
                    {data.settings?.smtpUser ? (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm('Are you sure you want to disconnect Google?')) return
                          await fetch('/api/integrations/google/connect', { method: 'DELETE' })
                          window.location.reload()
                        }}
                        className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:bg-transparent dark:hover:bg-red-500/10"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <a
                        href="/api/integrations/google/connect"
                        className="flex items-center gap-2 rounded-lg bg-white border border-[hsl(214,32%,91%)] px-4 py-2 text-sm font-medium text-[hsl(222,47%,11%)] hover:bg-[hsl(210,40%,98%)] transition-colors shadow-sm dark:bg-[hsl(217,33%,17%)] dark:border-white/10 dark:text-white dark:hover:bg-white/5"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Sign in with Google
                      </a>
                    )}
                  </div>
                </div>

                <div className="border-t border-[hsl(214,32%,91%)] pt-6 dark:border-white/10">
                  <h4 className="text-base font-semibold text-[hsl(222,47%,11%)] dark:text-white mb-4">Option 4 — Microsoft Office 365 (OAuth)</h4>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-[hsl(210,40%,98%)] border border-[hsl(214,32%,91%)] dark:bg-white/5 dark:border-white/10">
                    <div>
                      <h4 className="text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white">Outlook / Office 365</h4>
                      <p className="text-xs text-[hsl(215,16%,47%)] mt-1">
                        {data.settings?.office365User 
                          ? `Connected as: ${data.settings.office365User}` 
                          : 'Connect your Microsoft account to send and receive emails directly.'}
                      </p>
                    </div>
                    {data.settings?.office365User ? (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm('Are you sure you want to disconnect Microsoft?')) return
                          await fetch('/api/integrations/microsoft/connect', { method: 'DELETE' })
                          window.location.reload()
                        }}
                        className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:bg-transparent dark:hover:bg-red-500/10"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <a
                        href="/api/integrations/microsoft/connect"
                        className="flex items-center gap-2 rounded-lg bg-[#00A4EF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0092d6] transition-colors shadow-sm"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                        </svg>
                        Sign in with Microsoft
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-xl bg-[hsl(210,40%,97%)] p-4 dark:bg-black/20">
                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={testEmailLoading}
                    className="flex items-center gap-2 rounded-lg bg-[hsl(221,83%,53%)] px-4 py-2 text-sm font-medium text-white hover:bg-[hsl(221,83%,48%)] disabled:opacity-60"
                  >
                    {testEmailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send Test Email
                  </button>
                  {testEmailResult && (
                    <div className={`flex items-center gap-2 text-sm ${testEmailResult.ok ? 'text-emerald-600' : 'text-red-500'}`}>
                      {testEmailResult.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      {testEmailResult.msg}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h3 className="text-lg font-semibold text-[hsl(222,47%,11%)] dark:text-white mb-1">Payment Gateways</h3>
                  <p className="text-sm text-[hsl(215,16%,47%)] mb-6">Connect your payment processors to accept online payments from customers.</p>
                </div>

                {/* Stripe */}
                <div className="rounded-xl border border-[hsl(214,32%,91%)] p-6 dark:border-white/10">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(258,90%,66%)]/10 text-[hsl(258,90%,66%)] font-bold text-sm">S</div>
                      <div>
                        <p className="font-semibold text-[hsl(222,47%,11%)] dark:text-white">Stripe</p>
                        <p className="text-xs text-[hsl(215,16%,47%)]">Accept cards, wallets, and more</p>
                      </div>
                    </div>
                    {data.settings?.stripeAccountId ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(214,32%,91%)] px-2.5 py-1 text-xs font-medium text-[hsl(215,16%,47%)] dark:bg-white/10">
                        <XCircle className="h-3.5 w-3.5" /> Not Connected
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-[hsl(210,40%,98%)] border border-[hsl(214,32%,91%)] dark:bg-white/5 dark:border-white/10">
                    <div>
                      <h4 className="text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white">Stripe Connect</h4>
                      <p className="text-xs text-[hsl(215,16%,47%)] mt-1">
                        {data.settings?.stripeAccountId 
                          ? `Connected Account ID: ${data.settings.stripeAccountId}` 
                          : 'Connect your Stripe account to start accepting payments.'}
                      </p>
                    </div>
                    {data.settings?.stripeAccountId ? (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm('Are you sure you want to disconnect Stripe?')) return
                          await fetch('/api/integrations/stripe/connect', { method: 'DELETE' })
                          window.location.reload()
                        }}
                        className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:bg-transparent dark:hover:bg-red-500/10"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <a
                        href="/api/integrations/stripe/connect"
                        className="flex items-center gap-2 rounded-lg bg-[#635BFF] px-4 py-2 text-sm font-medium text-white hover:bg-[#5851E5] transition-colors shadow-sm"
                      >
                        <svg viewBox="0 0 60 60" className="h-4 w-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                          <path d="M59.64 14.28h-8.06c-3.14 0-5.24 1.11-6.8 3.07l-13.78 18.2-5.94-15.17c-1.3-3.32-4.54-6.1-8.15-6.1H.17v5.77h16.79c1.61 0 2.92 1.3 3.51 2.82l9.04 23.03v-4.88L41.34 22.9c.78-1.04 2-1.64 3.3-1.64h15V14.28z" />
                          <path d="M29.5 45.71l-5.69-14.53-7.53 18.98c-1.32 3.32-4.55 6.1-8.17 6.1H.17v5.77h8.04c3.62 0 5.72-1.11 7.28-3.07l14.01-13.25z" />
                        </svg>
                        Connect with Stripe
                      </a>
                    )}
                  </div>
                </div>

                {/* Square */}
                <div className="rounded-xl border border-[hsl(214,32%,91%)] p-6 dark:border-white/10">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black/5 text-black dark:bg-white/10 dark:text-white font-bold text-sm">□</div>
                      <div>
                        <p className="font-semibold text-[hsl(222,47%,11%)] dark:text-white">Square</p>
                        <p className="text-xs text-[hsl(215,16%,47%)]">In-person and online payments</p>
                      </div>
                    </div>
                    {data.settings?.squareAccessTokenEncrypted ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(214,32%,91%)] px-2.5 py-1 text-xs font-medium text-[hsl(215,16%,47%)] dark:bg-white/10">
                        <XCircle className="h-3.5 w-3.5" /> Not Connected
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-2">Access Token</label>
                      <input type="password" placeholder={data.settings?.squareAccessTokenEncrypted ? '••••••••••••••••' : 'Enter access token'} onChange={(e) => handleChange('settings', 'squareAccessTokenEncrypted', e.target.value)} className="w-full rounded-md border border-[hsl(214,32%,91%)] px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-black/20 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-2">Location ID</label>
                      <input type="text" value={data.settings?.squareLocationId || ''} onChange={(e) => handleChange('settings', 'squareLocationId', e.target.value)} placeholder="Enter Square location ID" className="w-full rounded-md border border-[hsl(214,32%,91%)] px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-black/20 focus:border-blue-500" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'integrations' && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h3 className="text-lg font-semibold text-[hsl(222,47%,11%)] dark:text-white mb-4">Twilio (SMS)</h3>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg bg-[hsl(210,40%,98%)] border border-[hsl(214,32%,91%)] dark:bg-white/5 dark:border-white/10">
                    <div>
                      <h4 className="text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white">Twilio Account</h4>
                      <p className="text-xs text-[hsl(215,16%,47%)] mt-1">
                        {data.settings?.twilioAccountSid 
                          ? `Connected Account SID: ${data.settings.twilioAccountSid}` 
                          : 'Connect your Twilio account to send and receive text messages.'}
                      </p>
                    </div>
                    {data.settings?.twilioAccountSid ? (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm('Are you sure you want to disconnect Twilio?')) return
                          await fetch('/api/integrations/twilio/connect', { method: 'DELETE' })
                          window.location.reload()
                        }}
                        className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:bg-transparent dark:hover:bg-red-500/10"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <a
                        href="/api/integrations/twilio/connect"
                        className="flex items-center gap-2 rounded-lg bg-[#F22F46] px-4 py-2 text-sm font-medium text-white hover:bg-[#D9263A] transition-colors shadow-sm"
                      >
                        Connect with Twilio
                      </a>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-[hsl(214,32%,91%)] dark:border-white/10">
                  <h3 className="text-lg font-semibold text-[hsl(222,47%,11%)] dark:text-white mb-4">Facebook Messenger</h3>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg bg-[hsl(210,40%,98%)] border border-[hsl(214,32%,91%)] dark:bg-white/5 dark:border-white/10">
                    <div>
                      <h4 className="text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white">Facebook Page</h4>
                      <p className="text-xs text-[hsl(215,16%,47%)] mt-1">
                        {data.settings?.facebookPageId 
                          ? `Connected Page ID: ${data.settings.facebookPageId}` 
                          : 'Connect your Facebook Page to sync Messenger conversations.'}
                      </p>
                    </div>
                    {data.settings?.facebookPageId ? (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm('Are you sure you want to disconnect Facebook?')) return
                          await fetch('/api/integrations/facebook/connect', { method: 'DELETE' })
                          window.location.reload()
                        }}
                        className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:bg-transparent dark:hover:bg-red-500/10"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <a
                        href="/api/integrations/facebook/connect"
                        className="flex items-center gap-2 rounded-lg bg-[#1877F2] px-4 py-2 text-sm font-medium text-white hover:bg-[#166FE5] transition-colors shadow-sm"
                      >
                        Connect with Facebook
                      </a>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-[hsl(214,32%,91%)] dark:border-white/10">
                  <h3 className="text-lg font-semibold text-[hsl(222,47%,11%)] dark:text-white mb-4">QuickBooks Online</h3>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg bg-[hsl(210,40%,98%)] border border-[hsl(214,32%,91%)] dark:bg-white/5 dark:border-white/10">
                    <div>
                      <h4 className="text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white">QuickBooks</h4>
                      <p className="text-xs text-[hsl(215,16%,47%)] mt-1">
                        {data.settings?.tenant?.qbConnections?.length > 0
                          ? `Connected (Realm ID: ${data.settings.tenant.qbConnections[0].realmId})` 
                          : 'Connect to QuickBooks Online to sync customers, quotes, and invoices.'}
                      </p>
                    </div>
                    {data.settings?.tenant?.qbConnections?.length > 0 ? (
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm('Are you sure you want to disconnect QuickBooks?')) return
                          await fetch('/api/integrations/quickbooks/connect', { method: 'DELETE' })
                          window.location.reload()
                        }}
                        className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-500/20 dark:bg-transparent dark:hover:bg-red-500/10"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <a
                        href="/api/integrations/quickbooks/connect"
                        className="flex items-center gap-2 rounded-lg bg-[#2CA01C] px-4 py-2 text-sm font-medium text-white hover:bg-[#238016] transition-colors shadow-sm"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="2" fill="none" />
                          <path d="M12 6v12M6 12h12" stroke="white" strokeWidth="2" />
                        </svg>
                        Connect to QuickBooks
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            
          </form>
        </div>
      </div>
    </div>
  )
}
