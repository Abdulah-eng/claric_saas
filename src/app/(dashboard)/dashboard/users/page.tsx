'use client'

import { useState, useEffect } from 'react'
import { PageHeader, DataTable } from '@/components/ui/data-table'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Plus, Search, Shield, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showInviteModal, setShowInviteModal] = useState(false)
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'SALES_REP',
    password: ''
  })
  const [saving, setSaving] = useState(false)

  const fetchUsers = () => {
    setLoading(true)
    fetch(`/api/users?q=${searchQuery}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setUsers(json.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const delay = setTimeout(fetchUsers, 300)
    return () => clearTimeout(delay)
  }, [searchQuery])

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    setSaving(false)
    if (res.ok) {
      setShowInviteModal(false)
      setFormData({ firstName: '', lastName: '', email: '', role: 'SALES_REP', password: '' })
      fetchUsers()
    } else {
      alert('Failed to invite user')
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      accessor: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
            {row.firstName.charAt(0)}{row.lastName.charAt(0)}
          </div>
          <span className="font-semibold text-[hsl(222,47%,11%)] dark:text-white">
            {row.firstName} {row.lastName}
          </span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      accessor: (row: any) => <span className="text-[hsl(215,16%,47%)]">{row.email}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      accessor: (row: any) => (
        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400 flex items-center gap-1.5 w-max">
          {row.role === 'COMPANY_ADMIN' || row.role === 'SUPER_ADMIN' ? <Shield className="h-3 w-3" /> : <User className="h-3 w-3" />}
          {row.role.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row: any) => (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${row.isActive ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
          {row.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      accessor: (row: any) => <span className="text-[hsl(215,16%,47%)] text-sm">{row.lastLoginAt ? formatDate(row.lastLoginAt) : 'Never'}</span>,
    },
  ]

  return (
    <div className="pb-10">
      <PageHeader title="Users & Roles" description="Manage team members and their permissions." />

      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(215,16%,47%)]" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-[hsl(214,32%,91%)] bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-[hsl(222,47%,11%)] dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]"
            />
          </div>
          <Button onClick={() => setShowInviteModal(true)} icon={<Plus className="h-4 w-4" />}>
            Invite User
          </Button>
        </div>

        <DataTable columns={columns} data={users} loading={loading} />
      </div>

      {showInviteModal && (
        <Modal open={showInviteModal} title="Invite New User" onClose={() => setShowInviteModal(false)}>
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-1">First Name</label>
                <input required type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="w-full rounded-md border border-[hsl(214,32%,91%)] bg-white px-3 py-2 text-sm outline-none dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-1">Last Name</label>
                <input required type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="w-full rounded-md border border-[hsl(214,32%,91%)] bg-white px-3 py-2 text-sm outline-none dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-1">Email</label>
              <input required type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full rounded-md border border-[hsl(214,32%,91%)] bg-white px-3 py-2 text-sm outline-none dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-1">Role</label>
              <select required value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full rounded-md border border-[hsl(214,32%,91%)] bg-white px-3 py-2 text-sm outline-none dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]">
                <option value="COMPANY_ADMIN">Company Admin</option>
                <option value="SALES_REP">Sales Representative</option>
                <option value="PRODUCTION_MANAGER">Production Manager</option>
                <option value="DESIGNER">Designer</option>
                <option value="FINANCE_STAFF">Finance Staff</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[hsl(222,47%,11%)] dark:text-white mb-1">Temporary Password</label>
              <input required type="password" minLength={8} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full rounded-md border border-[hsl(214,32%,91%)] bg-white px-3 py-2 text-sm outline-none dark:border-[hsl(217,33%,17%)] dark:bg-[hsl(222,47%,11%)]" />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowInviteModal(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Inviting...' : 'Invite User'}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
