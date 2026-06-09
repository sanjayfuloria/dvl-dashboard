'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { Search, Plus, Loader2, X, Mail, UserCog } from 'lucide-react'

interface User {
  id: string
  name: string | null
  email: string
  role: string
  createdAt: Date
  emailVerified: Date | null
}

interface Props {
  users: User[]
}

const ROLES = ['STUDENT', 'FACULTY', 'MENTOR', 'ADMIN']

export function UserManagementClient({ users }: Props) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('STUDENT')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [changingRole, setChangingRole] = useState<string | null>(null)
  const router = useRouter()
  const [, startTransition] = useTransition()

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.email.includes(search) || u.name?.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchSearch && matchRole
  })

  async function changeRole(userId: string, role: string) {
    setChangingRole(userId)
    await fetch('/api/admin/users/role', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    })
    setChangingRole(null)
    startTransition(() => router.refresh())
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteLoading(true)
    const res = await fetch('/api/admin/users/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    })
    setInviteLoading(false)
    if (res.ok) {
      setInviteSuccess(true)
      setTimeout(() => {
        setInviteOpen(false)
        setInviteSuccess(false)
        setInviteEmail('')
        startTransition(() => router.refresh())
      }, 1500)
    }
  }

  const tagClass = (role: string) => {
    const map: Record<string, string> = {
      ADMIN: 'tag-red',
      FACULTY: 'tag-purple',
      MENTOR: 'tag-amber',
      STUDENT: 'tag-teal',
    }
    return `tag ${map[role] ?? 'tag-gray'}`
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9"
          />
        </div>
        <div className="flex gap-1">
          {['ALL', ...ROLES].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                roleFilter === r
                  ? 'text-white'
                  : ''
              }`}
              style={roleFilter === r ? { background: 'var(--dvl-purple)' } : { color: 'var(--text-secondary)' }}
            >
              {r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <button onClick={() => setInviteOpen(true)} className="btn-primary ml-auto">
          <Plus className="w-4 h-4" /> Invite user
        </button>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Verified</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                         style={{ background: 'var(--dvl-indigo)' }}>
                      {user.name?.charAt(0)?.toUpperCase() ?? user.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{user.name ?? '—'}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className={tagClass(user.role)}>{user.role.toLowerCase()}</span>
                </td>
                <td>
                  <span className={user.emailVerified ? 'tag-green tag' : 'tag-gray tag'}>
                    {user.emailVerified ? 'Verified' : 'Pending'}
                  </span>
                </td>
                <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {formatDate(user.createdAt)}
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <select
                      value={user.role}
                      onChange={(e) => changeRole(user.id, e.target.value)}
                      disabled={changingRole === user.id}
                      className="form-input py-1 text-xs w-32"
                    >
                      {ROLES.map(r => (
                        <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
                      ))}
                    </select>
                    {changingRole === user.id && <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--dvl-purple)' }} />}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                  No users match your search
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Invite modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-semibold">Invite user</h2>
              <button onClick={() => setInviteOpen(false)} className="btn-ghost p-2"><X className="w-4 h-4" /></button>
            </div>
            {inviteSuccess ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <Mail className="w-5 h-5 text-green-600" />
                </div>
                <p className="font-medium">User created successfully</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  They can sign in with a magic link at any time.
                </p>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="p-6 space-y-4">
                <div>
                  <label className="form-label">Email address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@ifhe.edu.in"
                    required
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Role</label>
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="form-input">
                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setInviteOpen(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={inviteLoading} className="btn-primary flex-1">
                    {inviteLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create user'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
