'use client'

import { useState } from 'react'
import { Plus, Search, Building2, MoreHorizontal, Edit, Power, Trash2 } from 'lucide-react'
import { CreateTenantModal } from './create-tenant-modal'
import { EditTenantModal } from './edit-tenant-modal'
import { useRouter } from 'next/navigation'

type TenantData = {
  id: string
  name: string
  slug: string
  plan: string
  isActive: boolean
  userCount: number
  createdAt: string
  admin: { name: string | null; email: string } | null
}

function TenantRow({ tenant, onEdit }: { tenant: TenantData, onEdit: (tenant: TenantData) => void }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const router = useRouter()

  const handleToggleStatus = async () => {
    setShowDropdown(false)
    if (confirm(`Are you sure you want to ${tenant.isActive ? 'suspend' : 'activate'} this company?`)) {
      try {
        await fetch(`/api/tenants/${tenant.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive: !tenant.isActive })
        })
        router.refresh()
      } catch (err) {
        console.error(err)
      }
    }
  }

  const handleDelete = async () => {
    setShowDropdown(false)
    if (confirm('Are you sure you want to delete this company? This action cannot be undone if it succeeds.')) {
      try {
        const res = await fetch(`/api/tenants/${tenant.id}`, {
          method: 'DELETE'
        })
        const json = await res.json()
        if (!json.success) {
          alert(json.error || 'Failed to delete company')
        } else {
          router.refresh()
        }
      } catch (err) {
        console.error(err)
      }
    }
  }

  return (
    <tr className="group hover:bg-[hsl(210,40%,96%)]/50 dark:hover:bg-[hsl(217,33%,17%)]/50">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[hsl(210,40%,96%)] dark:bg-[hsl(217,33%,17%)]">
            <Building2 className="h-5 w-5 text-[hsl(221,83%,53%)]" />
          </div>
          <div>
            <div className="font-medium text-[hsl(222,47%,11%)] dark:text-white">
              {tenant.name}
            </div>
            <div className="text-xs text-[hsl(215,16%,47%)]">{tenant.slug}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        {tenant.admin ? (
          <div>
            <div className="font-medium text-[hsl(222,47%,11%)] dark:text-white">
              {tenant.admin.name || 'Admin'}
            </div>
            <div className="text-xs text-[hsl(215,16%,47%)]">{tenant.admin.email}</div>
          </div>
        ) : (
          <span className="text-xs italic text-[hsl(215,16%,47%)]">No admin</span>
        )}
      </td>
      <td className="px-6 py-4">
        <span className="rounded-full bg-[hsl(221,83%,53%)]/10 px-2 py-1 text-xs font-semibold text-[hsl(221,83%,53%)]">
          {tenant.plan}
        </span>
      </td>
      <td className="px-6 py-4 text-[hsl(215,16%,47%)]">
        {tenant.userCount} users
      </td>
      <td className="px-6 py-4">
        {tenant.isActive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-500/20 dark:text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            Suspended
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-right relative">
        <button 
          onClick={() => setShowDropdown(!showDropdown)}
          className="rounded p-1.5 text-[hsl(215,16%,47%)] hover:bg-[hsl(214,32%,91%)] hover:text-[hsl(222,47%,11%)] dark:hover:bg-[hsl(217,33%,17%)] dark:hover:text-white"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {showDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
            <div className="absolute right-6 top-10 z-20 w-40 rounded-lg border border-[hsl(214,32%,91%)] bg-white p-1 shadow-lg dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
              <button
                onClick={() => { setShowDropdown(false); onEdit(tenant); }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[hsl(222,47%,11%)] hover:bg-[hsl(210,40%,96%)] dark:text-white dark:hover:bg-[hsl(217,33%,17%)]"
              >
                <Edit className="h-4 w-4 text-[hsl(215,16%,47%)]" />
                Edit
              </button>
              <button
                onClick={handleToggleStatus}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[hsl(222,47%,11%)] hover:bg-[hsl(210,40%,96%)] dark:text-white dark:hover:bg-[hsl(217,33%,17%)]"
              >
                <Power className="h-4 w-4 text-[hsl(215,16%,47%)]" />
                {tenant.isActive ? 'Suspend' : 'Activate'}
              </button>
              <hr className="my-1 border-[hsl(214,32%,91%)] dark:border-[hsl(217,33%,17%)]" />
              <button
                onClick={handleDelete}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </>
        )}
      </td>
    </tr>
  )
}

export function TenantsList({ initialData }: { initialData: TenantData[] }) {
  const [showModal, setShowModal] = useState(false)
  const [editingTenant, setEditingTenant] = useState<TenantData | null>(null)
  const [search, setSearch] = useState('')

  const filtered = initialData.filter(t => 
    t.name.toLowerCase().includes(search.toLowerCase()) || 
    t.slug.toLowerCase().includes(search.toLowerCase()) ||
    t.admin?.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(215,16%,47%)]" />
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[hsl(214,32%,91%)] bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-[hsl(221,83%,53%)] focus:ring-1 focus:ring-[hsl(221,83%,53%)] dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)] dark:text-white"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-[hsl(221,83%,53%)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[hsl(221,83%,48%)]"
        >
          <Plus className="h-4 w-4" />
          Add Company
        </button>
      </div>

      {/* Data Table */}
      <div className="rounded-xl border border-[hsl(214,32%,91%)] bg-white shadow-sm overflow-hidden dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[hsl(214,32%,91%)] bg-[hsl(210,40%,96%)] text-[hsl(215,16%,47%)] dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(217,33%,17%)]/50">
              <tr>
                <th className="px-6 py-3 font-medium">Company</th>
                <th className="px-6 py-3 font-medium">Admin</th>
                <th className="px-6 py-3 font-medium">Plan</th>
                <th className="px-6 py-3 font-medium">Users</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[hsl(214,32%,91%)] dark:divide-[hsl(217,33%,17%)]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-[hsl(215,16%,47%)]">
                    No companies found.
                  </td>
                </tr>
              ) : (
                filtered.map((tenant) => (
                  <TenantRow key={tenant.id} tenant={tenant} onEdit={setEditingTenant} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && <CreateTenantModal onClose={() => setShowModal(false)} />}
      
      {/* Edit Modal (using a simplified version or same modal structure) */}
      {editingTenant && (
        <EditTenantModal tenant={editingTenant} onClose={() => setEditingTenant(null)} />
      )}
    </div>
  )
}
