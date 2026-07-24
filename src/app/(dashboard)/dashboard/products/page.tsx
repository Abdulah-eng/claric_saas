'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Filter, Package, Tag, Edit, MoreHorizontal, Layers, ArrowUpRight } from 'lucide-react'
import { DataTable, PageHeader, Pagination } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/form'
import { formatCurrency, formatDate } from '@/lib/utils'

type Product = any

export default function ProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    name: '', sku: '', categoryId: '', description: '',
    basePrice: '', costPrice: '', tags: '', imageUrl: '',
  })
  const [showCreateCategory, setShowCreateCategory] = useState(false)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const perPage = 20

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), perPage: String(perPage), ...(search && { q: search }) })
      const res = await fetch(`/api/products?${params}`)
      const json = await res.json()
      if (json.success) {
        setProducts(json.data)
        setTotal(json.meta?.total ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetch('/api/categories').then(r => r.json()).then(j => { if (j.success) setCategories(j.data) })
  }, [])

  useEffect(() => {
    const t = setTimeout(fetchProducts, 300)
    return () => clearTimeout(t)
  }, [fetchProducts])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          basePrice: Number(form.basePrice) || 0,
          costPrice: form.costPrice ? Number(form.costPrice) : undefined,
          tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          imageUrls: form.imageUrl ? [form.imageUrl] : [],
        }),
      })
      const json = await res.json()
      if (json.success) {
        setShowCreate(false)
        fetchProducts()
      }
    } finally {
      setCreating(false)
    }
  }

  async function handleCreateCategory() {
    if (!categoryName) return
    setCreatingCategory(true)
    try {
      const slug = categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: categoryName, slug }),
      })
      const json = await res.json()
      if (json.success) {
        setCategories([...categories, json.data])
        setForm({ ...form, categoryId: json.data.id })
        setShowCreateCategory(false)
        setCategoryName('')
      }
    } finally {
      setCreatingCategory(false)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (json.success) {
        setForm({ ...form, imageUrl: json.data.url })
      } else {
        alert(json.error || 'Upload failed')
      }
    } catch (err) {
      console.error(err)
      alert('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const columns = [
    {
      key: 'product',
      header: 'Product',
      render: (row: Product) => (
        <div className="flex items-center gap-3">
          {row.imageUrls?.[0] ? (
            <img src={row.imageUrls[0]} alt={row.name} className="h-10 w-10 shrink-0 rounded-xl object-cover bg-[hsl(210,40%,96%)] dark:bg-[hsl(217,33%,17%)] border border-[hsl(214,32%,91%)] dark:border-white/10" />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(210,40%,96%)] dark:bg-[hsl(217,33%,17%)]">
              <Package className="h-5 w-5 text-[hsl(215,16%,47%)]" />
            </div>
          )}
          <div>
            <p className="font-medium text-[hsl(222,47%,11%)] dark:text-white">{row.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {row.sku && <span className="text-xs text-[hsl(215,16%,47%)] font-mono">{row.sku}</span>}
              <span className="text-xs text-[hsl(215,16%,47%)]">({row.category?.name})</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Base Price',
      render: (row: Product) => (
        <div>
          <span className="font-semibold text-[hsl(222,47%,11%)] dark:text-white">{formatCurrency(row.basePrice)}</span>
          <p className="text-xs text-[hsl(215,16%,47%)]">/{row.unit}</p>
        </div>
      ),
    },
    {
      key: 'margin',
      header: 'Margin',
      render: (row: Product) => {
        if (!row.costPrice) return <span className="text-xs text-[hsl(215,16%,47%)]">—</span>
        const margin = ((row.basePrice - row.costPrice) / row.basePrice) * 100
        return (
          <div className="flex items-center gap-1.5">
            <span className="font-medium">{margin.toFixed(1)}%</span>
            <ArrowUpRight className="h-3 w-3 text-emerald-500" />
          </div>
        )
      },
    },
    {
      key: 'tiers',
      header: 'Tiers',
      render: (row: Product) => (
        <span className="text-xs font-medium px-2 py-1 bg-[hsl(210,40%,96%)] dark:bg-[hsl(217,33%,17%)] rounded-md">
          {row._count.tierPrices} levels
        </span>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Product Catalog"
        description="Manage your products, pricing, and variants"
        breadcrumbs={[{ label: 'Catalog' }, { label: 'Products' }]}
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreate(true)}>
            Add Product
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(215,16%,47%)]" />
          <input
            type="search"
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="h-9 w-full rounded-lg border border-[hsl(214,32%,91%)] bg-white pl-9 pr-3 text-sm text-[hsl(222,47%,11%)] outline-none focus:border-[hsl(var(--primary))] focus:ring-2 dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] dark:text-white"
          />
        </div>
        <Button variant="outline" size="sm" icon={<Filter className="h-3.5 w-3.5" />}>Filter</Button>
      </div>

      <DataTable columns={columns} data={products} loading={loading} />

      {total > perPage && <Pagination page={page} totalPages={Math.ceil(total / perPage)} total={total} perPage={perPage} onPageChange={setPage} />}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Add Product" size="md" footer={
        <>
          <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button form="form-create-product" type="submit" loading={creating}>Create</Button>
        </>
      }>
        <form id="form-create-product" onSubmit={handleCreate} className="space-y-4">
          <Input label="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div className="grid grid-cols-2 gap-4">
            <Input label="SKU" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[hsl(222,47%,20%)] dark:text-[hsl(210,40%,85%)]">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                {showCreateCategory ? (
                  <>
                    <input
                      type="text"
                      className="flex h-9 w-full rounded-lg border border-[hsl(214,32%,91%)] bg-white px-3 py-2 text-sm outline-none dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(217,33%,17%)] dark:text-white"
                      placeholder="Category name"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                    />
                    <Button type="button" size="sm" onClick={handleCreateCategory} loading={creatingCategory}>Save</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowCreateCategory(false)}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <select
                      className="flex h-9 w-full rounded-lg border border-[hsl(214,32%,91%)] bg-white px-3 py-2 text-sm outline-none dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(217,33%,17%)] dark:text-white"
                      value={form.categoryId}
                      onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                      required
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowCreateCategory(true)} icon={<Plus className="h-4 w-4" />}>New</Button>
                  </>
                )}
              </div>
            </div>
            <Input label="Base Price ($)" type="number" step="0.01" min="0" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} required />
            <Input label="Cost Price ($)" type="number" step="0.01" min="0" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} hint="For margin calculation" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[hsl(222,47%,20%)] dark:text-[hsl(210,40%,85%)]">Product Image</label>
            <div className="flex gap-2 items-center">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="product-photo-upload"
                onChange={handleImageUpload}
              />
              <label
                htmlFor="product-photo-upload"
                className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-[hsl(214,32%,91%)] bg-white px-3 h-9 text-sm font-medium text-[hsl(222,47%,11%)] hover:bg-[hsl(210,40%,98%)] dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] dark:text-white dark:hover:bg-[hsl(217,33%,15%)] shrink-0"
              >
                {uploadingImage ? 'Uploading...' : 'Upload Image'}
              </label>
              <Input className="flex-1" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="Or enter image URL" />
            </div>
            {form.imageUrl && (
              <div className="mt-2 h-20 w-20 rounded-lg border border-[hsl(214,32%,91%)] dark:border-white/10 overflow-hidden">
                <img src={form.imageUrl} alt="Preview" className="h-full w-full object-cover" />
              </div>
            )}
          </div>
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
          <Input label="Tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} hint="Comma separated" />
        </form>
      </Modal>
    </>
  )
}
