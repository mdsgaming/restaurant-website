'use client'

import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getAllUsers, updateUserProfile, addAuditLog } from '@/lib/firestore'
import { formatDate } from '@/lib/utils'
import { Modal, ConfirmModal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { RoleBadge } from '@/components/ui/Badge'
import type { AppUser, UserRole } from '@/types'
import toast from 'react-hot-toast'
import { SectionLoader } from '@/components/ui/LoadingSpinner'

export default function AdminUsersPage() {
  const { appUser, isDeveloper, isAdmin } = useAuth()
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [editModal, setEditModal] = useState<AppUser | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'ASSISTANT' as UserRole })

  async function load() {
    try {
      setUsers(await getAllUsers())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleCreate() {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      return toast.error('Name, email and password are required')
    }
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters')

    // Only DEVELOPER can create DEVELOPER accounts
    if (form.role === 'DEVELOPER' && !isDeveloper) {
      return toast.error('Only Developer accounts can create other Developer accounts')
    }

    setCreating(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create user')
      await addAuditLog({
        userId: appUser!.uid,
        userName: appUser!.name,
        userRole: appUser!.role,
        action: 'created user account',
        resource: 'users',
        details: { email: form.email, role: form.role },
      })
      toast.success('User created successfully')
      setCreateModal(false)
      setForm({ name: '', email: '', password: '', role: 'ASSISTANT' })
      load()
    } catch (e: unknown) {
      toast.error((e as Error).message)
    } finally {
      setCreating(false)
    }
  }

  async function handleToggleActive(user: AppUser) {
    try {
      await updateUserProfile(user.uid, { isActive: !user.isActive })
      await addAuditLog({
        userId: appUser!.uid,
        userName: appUser!.name,
        userRole: appUser!.role,
        action: user.isActive ? 'deactivated user' : 'activated user',
        resource: 'users',
        details: { targetUser: user.email },
      })
      toast.success(user.isActive ? 'User deactivated' : 'User activated')
      load()
    } catch { toast.error('Failed to update user') }
  }

  async function handleRoleChange(user: AppUser, newRole: UserRole) {
    if (newRole === 'DEVELOPER' && !isDeveloper) {
      return toast.error('Only Developer accounts can grant Developer access')
    }
    try {
      await updateUserProfile(user.uid, { role: newRole })
      await fetch(`/api/users/${user.uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })
      await addAuditLog({
        userId: appUser!.uid,
        userName: appUser!.name,
        userRole: appUser!.role,
        action: `changed user role to ${newRole}`,
        resource: 'users',
        details: { targetUser: user.email, newRole },
      })
      toast.success('Role updated')
      setEditModal(null)
      load()
    } catch { toast.error('Failed to update role') }
  }

  async function handleDelete() {
    if (!deleteConfirm) return
    try {
      const res = await fetch(`/api/users/${deleteConfirm}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      await addAuditLog({
        userId: appUser!.uid,
        userName: appUser!.name,
        userRole: appUser!.role,
        action: 'deleted user account',
        resource: 'users',
        details: { uid: deleteConfirm },
      })
      toast.success('User deleted')
      setDeleteConfirm(null)
      load()
    } catch { toast.error('Delete failed') }
  }

  const canManageUser = (target: AppUser) => {
    if (target.uid === appUser?.uid) return false
    if (target.role === 'DEVELOPER' && !isDeveloper) return false
    return true
  }

  const roleOptions: { value: UserRole; label: string }[] = [
    { value: 'ASSISTANT', label: 'Assistant' },
    { value: 'ADMIN', label: 'Admin' },
    ...(isDeveloper ? [{ value: 'DEVELOPER' as UserRole, label: 'Developer' }] : []),
  ]

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-charcoal">User Management</h1>
          <p className="text-sm text-charcoal/50 mt-0.5">Manage staff accounts and permissions.</p>
        </div>
        <Button onClick={() => setCreateModal(true)}>
          <Plus className="w-4 h-4" /> Add User
        </Button>
      </div>

      {loading ? (
        <SectionLoader />
      ) : (
        <div className="admin-card overflow-hidden p-0">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="admin-table-th">Name</th>
                <th className="admin-table-th">Email</th>
                <th className="admin-table-th">Role</th>
                <th className="admin-table-th">Status</th>
                <th className="admin-table-th">Joined</th>
                <th className="admin-table-th" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50/50">
                  <td className="admin-table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-primary text-xs font-bold">{user.name?.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="font-medium">{user.name}</span>
                      {user.uid === appUser?.uid && <span className="text-xs text-gray-400">(you)</span>}
                    </div>
                  </td>
                  <td className="admin-table-td text-gray-500">{user.email}</td>
                  <td className="admin-table-td"><RoleBadge role={user.role} /></td>
                  <td className="admin-table-td">
                    <span className={`text-xs font-medium ${user.isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="admin-table-td text-gray-400 text-xs">{formatDate(user.createdAt)}</td>
                  <td className="admin-table-td">
                    {canManageUser(user) && (
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditModal(user)} className="p-1.5 text-gray-400 hover:text-primary hover:bg-gray-50 rounded" title="Edit role">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleToggleActive(user)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-gray-50 rounded" title={user.isActive ? 'Deactivate' : 'Activate'}>
                          {user.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        {isDeveloper && (
                          <button onClick={() => setDeleteConfirm(user.uid)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-50 rounded" title="Delete">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="text-center py-12 text-gray-400"><p className="text-sm">No users found</p></div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Create New User" size="sm">
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Full Name *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="input-base" placeholder="Jane Smith" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Email Address *</label>
            <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="input-base" placeholder="jane@restaurant.com" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Password *</label>
            <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="input-base" placeholder="Min. 8 characters" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Role *</label>
            <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))} className="input-base">
              {roleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="ghost" onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={creating}>Create User</Button>
          </div>
        </div>
      </Modal>

      {/* Edit Role Modal */}
      {editModal && (
        <Modal isOpen={!!editModal} onClose={() => setEditModal(null)} title="Change Role" size="sm">
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-600">Changing role for <strong>{editModal.name}</strong></p>
            <div className="space-y-2">
              {roleOptions.map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 p-3 border rounded-sm cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="radio" name="role" value={opt.value} defaultChecked={editModal.role === opt.value} onChange={() => handleRoleChange(editModal, opt.value)} className="accent-primary" />
                  <span className="text-sm font-medium text-charcoal">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </Modal>
      )}

      <ConfirmModal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message="This will permanently delete the user account and all their data. This cannot be undone."
        confirmLabel="Delete User"
      />
    </div>
  )
}
