'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Input, Select, Textarea } from '@/components/ui/form'
import { Plus, Trash2, Camera, Save, ArrowLeft } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function SampleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sample, setSample] = useState<any>(null)

  useEffect(() => {
    fetch(`/api/samples/${id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setSample(json.data)
      })
      .finally(() => setLoading(false))
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/samples/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sample),
      })
      const json = await res.json()
      if (json.success) {
        alert('Sample saved successfully!')
        router.refresh()
      } else {
        const errorMsg = json.errors ? JSON.stringify(json.errors, null, 2) : json.error
        alert(`Failed to save sample details:\n${errorMsg}`)
      }
    } catch (err) {
      alert('Failed to save sample details due to an error.')
    } finally {
      setSaving(false)
    }
  }

  const addItem = () => {
    setSample((prev: any) => ({
      ...prev,
      items: [...prev.items, { name: '', customizationType: 'None', quantity: 1, unitValue: 0, notes: '' }]
    }))
  }

  const removeItem = (index: number) => {
    setSample((prev: any) => ({
      ...prev,
      items: prev.items.filter((_: any, i: number) => i !== index)
    }))
  }

  const updateItem = (index: number, field: string, value: any) => {
    setSample((prev: any) => {
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], [field]: value }
      return { ...prev, items: newItems }
    })
  }

  const addImageUrl = () => {
    const url = prompt('Enter image URL:')
    if (url) {
      setSample((prev: any) => ({ ...prev, imageUrls: [...(prev.imageUrls || []), url] }))
    }
  }

  const removeImageUrl = (index: number) => {
    setSample((prev: any) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_: any, i: number) => i !== index)
    }))
  }

  if (loading) return <div className="p-10 text-center">Loading...</div>
  if (!sample) return <div className="p-10 text-center">Sample not found</div>

  const computedTotal = sample.items.reduce((acc: number, item: any) => acc + (item.quantity * item.unitValue), 0)

  return (
    <div className="pb-10 max-w-5xl mx-auto">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push('/dashboard/samples')} icon={<ArrowLeft className="h-4 w-4" />}>
          Back to Samples
        </Button>
      </div>

      <PageHeader 
        title={`Sample Box: ${sample.description}`}
        description={`Status: ${sample.status}`}
        actions={<Button onClick={handleSave} loading={saving} icon={<Save className="h-4 w-4" />}>Save Changes</Button>}
      />

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Items Section */}
          <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[hsl(222,47%,11%)] dark:text-white">Sample Contents</h2>
              <Button size="sm" variant="outline" onClick={addItem} icon={<Plus className="h-4 w-4" />}>Add Item</Button>
            </div>
            
            {sample.items.length === 0 ? (
              <div className="text-center py-6 text-[hsl(215,16%,47%)] text-sm border-2 border-dashed border-[hsl(214,32%,91%)] dark:border-[hsl(217,33%,17%)] rounded-lg">
                No items added to this sample box yet.
              </div>
            ) : (
              <div className="space-y-4">
                {sample.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4 items-start p-4 bg-[hsl(210,40%,98%)] dark:bg-white/5 rounded-lg border border-[hsl(214,32%,91%)] dark:border-white/10">
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <Input label="Item Name" required value={item.name} onChange={(e) => updateItem(idx, 'name', e.target.value)} placeholder="e.g. Leather Coaster" />
                        <Select 
                          label="Customization" 
                          value={item.customizationType || ''} 
                          onChange={(e) => updateItem(idx, 'customizationType', e.target.value)}
                          options={[
                            { value: 'None', label: 'None' },
                            { value: 'UV Printed', label: 'UV Printed' },
                            { value: 'Engraved', label: 'Engraved' },
                            { value: 'Embroidery', label: 'Embroidery' },
                            { value: 'Other', label: 'Other' },
                          ]}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input label="Quantity" type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} />
                        <Input label="Unit Value ($)" type="number" step="0.01" min="0" value={item.unitValue} onChange={(e) => updateItem(idx, 'unitValue', parseFloat(e.target.value) || 0)} />
                      </div>
                    </div>
                    <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700 p-2 mt-6">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                
                <div className="flex justify-end pt-4 border-t border-[hsl(214,32%,91%)] dark:border-white/10 text-[hsl(222,47%,11%)] dark:text-white font-semibold">
                  Total Box Value: {formatCurrency(computedTotal)}
                </div>
              </div>
            )}
          </div>

          {/* Photos Section */}
          <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[hsl(222,47%,11%)] dark:text-white">Photos</h2>
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="sample-photo-upload"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const formData = new FormData()
                    formData.append('file', file)
                    try {
                      const res = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                      })
                      const json = await res.json()
                      if (json.success) {
                        setSample((prev: any) => ({
                          ...prev,
                          imageUrls: [...(prev.imageUrls || []), json.data.url]
                        }))
                      } else {
                        alert(json.error || 'Upload failed')
                      }
                    } catch (err) {
                      console.error(err)
                      alert('Failed to upload image')
                    }
                  }}
                />
                <label
                  htmlFor="sample-photo-upload"
                  className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-[hsl(214,32%,91%)] bg-white px-3 py-1.5 text-sm font-medium text-[hsl(222,47%,11%)] hover:bg-[hsl(210,40%,98%)] dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] dark:text-white dark:hover:bg-[hsl(217,33%,15%)]"
                >
                  <Camera className="h-4 w-4 mr-2" /> Upload Photo
                </label>
                <Button size="sm" variant="outline" onClick={addImageUrl}>Attach URL</Button>
              </div>
            </div>
            
            {!sample.imageUrls || sample.imageUrls.length === 0 ? (
              <div className="text-center py-6 text-[hsl(215,16%,47%)] text-sm border-2 border-dashed border-[hsl(214,32%,91%)] dark:border-[hsl(217,33%,17%)] rounded-lg">
                No photos attached to this sample box.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {sample.imageUrls.map((url: string, idx: number) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-[hsl(214,32%,91%)] dark:border-white/10 aspect-square">
                    <img src={url} alt={`Sample photo ${idx + 1}`} className="object-cover w-full h-full" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button onClick={() => removeImageUrl(idx)} className="text-white bg-red-500 rounded-full p-2 hover:bg-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* General Details */}
          <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white p-6 shadow-sm dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
            <h2 className="text-lg font-bold text-[hsl(222,47%,11%)] dark:text-white mb-4">Details</h2>
            <div className="space-y-4">
              <Select 
                label="Status" 
                value={sample.status} 
                onChange={(e) => setSample({...sample, status: e.target.value})}
                options={[
                  { value: 'REQUESTED', label: 'Requested' },
                  { value: 'SHIPPED', label: 'Hand Delivered' },
                  { value: 'DELIVERED', label: 'Confirmed Delivery' },
                  { value: 'CONVERTED', label: 'Converted' },
                  { value: 'DECLINED', label: 'Declined' },
                ]}
              />
              
              <Textarea label="Description" value={sample.description} onChange={(e) => setSample({...sample, description: e.target.value})} rows={2} />
              <Input label="Delivered At" type="date" value={sample.deliveredAt ? sample.deliveredAt.split('T')[0] : ''} onChange={(e) => setSample({...sample, deliveredAt: e.target.value})} />
              <Input label="Follow-up Date" type="date" value={sample.followUpDate ? sample.followUpDate.split('T')[0] : ''} onChange={(e) => setSample({...sample, followUpDate: e.target.value})} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
