'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/ui/data-table'
import { Plus, Store, Globe, MoreHorizontal, Copy, Check, Power, Trash2, ExternalLink, Loader2, X, Link as LinkIcon } from 'lucide-react'

function CreateStoreModal({ onClose, onCreated }: { onClose: () => void, onCreated: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name'),
          slug: fd.get('slug'),
          description: fd.get('description'),
          isPublic: fd.get('isPublic') === 'on',
        })
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'Failed to create store')
      onCreated()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl dark:bg-[hsl(222,47%,11%)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[hsl(214,32%,91%)] px-6 py-4 dark:border-white/10">
          <h2 className="text-lg font-semibold text-[hsl(222,47%,11%)] dark:text-white">Create New Store</h2>
          <button onClick={onClose} className="rounded p-1 text-[hsl(215,16%,47%)] hover:bg-[hsl(214,32%,91%)] dark:hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">{error}</div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white">Store Name</label>
            <input name="name" required placeholder="e.g. Main Storefront" className="w-full rounded-lg border border-[hsl(214,32%,91%)] bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/10 dark:text-white" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white">Store URL Slug</label>
            <div className="flex items-center rounded-lg border border-[hsl(214,32%,91%)] bg-transparent dark:border-white/10 overflow-hidden">
              <span className="bg-[hsl(210,40%,96%)] px-3 py-2 text-xs text-[hsl(215,16%,47%)] dark:bg-white/5 whitespace-nowrap">/store/</span>
              <input name="slug" required placeholder="my-store" className="flex-1 bg-transparent px-3 py-2 text-sm outline-none dark:text-white" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white">Description (optional)</label>
            <textarea name="description" rows={3} placeholder="Brief description of this store..." className="w-full rounded-lg border border-[hsl(214,32%,91%)] bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/10 dark:text-white resize-none" />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" name="isPublic" id="isPublic" className="h-4 w-4 rounded border-gray-300 text-primary" />
            <label htmlFor="isPublic" className="text-sm text-[hsl(222,47%,11%)] dark:text-white">Make store publicly accessible</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-[hsl(215,16%,47%)] hover:bg-[hsl(214,32%,91%)] dark:hover:bg-white/10">Cancel</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Store
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function StoreCard({ store, onRefresh }: { store: any, onRefresh: () => void }) {
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  const storeUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/store/${store.slug}`

  const copyUrl = () => {
    navigator.clipboard.writeText(storeUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const toggleActive = async () => {
    setShowMenu(false)
    await fetch(`/api/stores/${store.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !store.isActive })
    })
    onRefresh()
  }

  const deleteStore = async () => {
    setShowMenu(false)
    if (!confirm('Delete this store? This cannot be undone.')) return
    await fetch(`/api/stores/${store.id}`, { method: 'DELETE' })
    onRefresh()
  }

  return (
    <div className="group relative flex flex-col rounded-2xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-white/5 dark:bg-[hsl(217,33%,17%)]">
      {/* Top */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${store.themeColor}20` }}
          >
            <Store className="h-6 w-6" style={{ color: store.themeColor }} />
          </div>
          <div>
            <h3 className="font-semibold text-[hsl(222,47%,11%)] dark:text-white">{store.name}</h3>
            <p className="text-xs text-[hsl(215,16%,47%)]">/store/{store.slug}</p>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded-lg p-1.5 text-[hsl(215,16%,47%)] hover:bg-[hsl(210,40%,96%)] dark:hover:bg-white/10"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-8 z-20 w-40 rounded-lg border border-[hsl(214,32%,91%)] bg-white p-1 shadow-lg dark:border-white/10 dark:bg-[hsl(222,47%,11%)]">
                <button onClick={toggleActive} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-[hsl(222,47%,11%)] hover:bg-[hsl(210,40%,96%)] dark:text-white dark:hover:bg-white/10">
                  <Power className="h-4 w-4 text-[hsl(215,16%,47%)]" />
                  {store.isActive ? 'Deactivate' : 'Activate'}
                </button>
                <hr className="my-1 border-[hsl(214,32%,91%)] dark:border-white/10" />
                <button onClick={deleteStore} className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10">
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="mb-5 flex-1 text-sm text-[hsl(215,16%,47%)] line-clamp-2">
        {store.description || 'No description provided.'}
      </p>

      {/* Badges */}
      <div className="mb-5 flex flex-wrap gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${store.isActive
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'
          : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400'}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${store.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`} />
          {store.isActive ? 'Active' : 'Inactive'}
        </span>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${store.isPublic
          ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-400'
          : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400'}`}
        >
          <Globe className="h-3 w-3" />
          {store.isPublic ? 'Public' : 'Private'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={copyUrl}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[hsl(214,32%,91%)] px-3 py-2 text-sm font-medium text-[hsl(215,16%,47%)] transition-colors hover:border-primary hover:text-primary dark:border-white/10"
        >
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied!' : 'Copy URL'}
        </button>
        <a
          href={storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg border border-[hsl(214,32%,91%)] px-3 py-2 text-sm font-medium text-[hsl(215,16%,47%)] transition-colors hover:border-primary hover:text-primary dark:border-white/10"
        >
          <ExternalLink className="h-4 w-4" /> Preview
        </a>
      </div>
    </div>
  )
}

export default function CompanyStoresPage() {
  const [stores, setStores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const fetchStores = () => {
    setLoading(true)
    fetch('/api/stores')
      .then(r => r.json())
      .then(json => { if (json.success) setStores(json.data) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchStores() }, [])

  return (
    <div className="pb-20 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <PageHeader
          title="Company Stores"
          description="Manage your customer-facing storefronts and product portals."
        />
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Create Store
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 animate-pulse rounded-2xl bg-[hsl(210,40%,93%)] dark:bg-[hsl(217,33%,17%)]" />
          ))}
        </div>
      ) : stores.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[hsl(214,32%,91%)] bg-white py-20 dark:border-white/10 dark:bg-[hsl(217,33%,17%)]">
          <Store className="h-12 w-12 text-[hsl(215,16%,47%)] mb-4 opacity-40" />
          <h3 className="text-lg font-semibold text-[hsl(222,47%,11%)] dark:text-white">No stores yet</h3>
          <p className="mt-1 text-sm text-[hsl(215,16%,47%)]">Create your first customer-facing storefront.</p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-6 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" /> Create Store
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {stores.map(store => (
            <StoreCard key={store.id} store={store} onRefresh={fetchStores} />
          ))}
        </div>
      )}

      {showCreate && <CreateStoreModal onClose={() => setShowCreate(false)} onCreated={fetchStores} />}
    </div>
  )
}
