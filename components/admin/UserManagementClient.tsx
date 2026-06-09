'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { Search, Plus, Loader2, X, Eye, EyeOff, RefreshCw, Copy, Check } from 'lucide-react'

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

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function UserManagementClient({ users }: Props) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<{ email: string; password: string } | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [changingRole, setChangingRole] = useState<string | null>(null)
  const [settingPasswordFor, setSettingPasswordFor] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [form, setForm] = useState({ name: '', email: '', role: 'STUDENT', password: generatePassword() })
  const router = useRouter()
  const [, startTransition] = useTransition()

  const filtered = users.filter((u) => {
    const matchSearch = !search || u.email.includes(search) || u.name?.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchSearch && matchRole
  })

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function changeRole(userId: string, role: string) {
    setChangingRole(userId)
    await fetch('/dvl/api/admin/users/role', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role, notify: true }),
    })
    setChangingRole(null)
    startTransition(() => router.refresh())
  }

  async function handleSetPassword(userId: string) {
    if (!newPassword.trim()) return
    setSettingPasswordFor(userId)
    await fetch('/dvl/api/admin/users/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password: newPassword }),
    })
    setSettingPasswordFor(null)
    setNewPassword('')
    alert('Password updated successfully')
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/dvl/api/admin/users/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, sendWelcomeEmail: true }),
    })
    if (res.ok) {
      const { userId } = await res.json()
      await fetch('/dvl/api/admin/users/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, password: form.password }),
      })
      setSuccess({ email: form.email, password: form.password })
    }
    setLoading(false)
  }

  const tagClass = (role: string) => {
    const map: Record<string, string> = {
      ADMIN: 'tag-red', FACULTY: 'tag-purple', MENTOR: 'tag-amber', STUDENT: 'tag-teal',
    }
    return `tag ${map[role] ?? 'tag-gray'}`
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search by name or email…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9" />
        </div>
        <div className="flex gap-1">
          {['ALL', ...ROLES].map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={roleFilter === r ? { background: 'var(--dvl-purple)', color: 'white' } : { color: 'var(--text-secondary)' }}>
              {r.charAt(0) + r.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary ml-auto">
          <Plus className="w-4 h-4" /> Add user
        </button>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Change role</th>
              <th>Reset password</th>
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
                <td><span className={tagClass(user.role)}>{user.role.toLowerCase()}</span></td>
                <td>
                  <span className={user.emailVerified ? 'tag-green tag' : 'tag-gray tag'}>
                    {user.emailVerified ? 'Active' : 'Pending'}
                  </span>
                </td>
                <td className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {formatDate(user.createdAt)}
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <select value={user.role} onChange={(e) => changeRole(user.id, e.target.value)}
                      disabled={changingRole === user.id}
                      className="form-input py-1 text-xs w-28">
                      {ROLES.map(r => (
                        <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
                      ))}
                    </select>
                    {changingRole === user.id && <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: 'var(--dvl-purple)' }} />}
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <input
                      type="password"
                      placeholder="New password"
                      value={settingPasswordFor === user.id ? newPassword : ''}
                      onFocus={() => { setSettingPasswordFor(user.id); setNewPassword('') }}
                      onChange={(e) => { setSettingPasswordFor(user.id); setNewPassword(e.target.value) }}
                      className="form-input py-1 text-xs w-32"
                    />
                    <button
                      onClick={() => handleSetPassword(user.id)}
                      disabled={settingPasswordFor !== user.id || !newPassword}
                      className="btn-primary text-xs px-2 py-1 disabled:opacity-40"
                    >
                      Set
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
                  No users match your search
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add user modal */}
      {open && (
        <div>
          <div onClick={() => { if (!success) setOpen(false) }}
            style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)' }} />
          <div style={{
            position: 'fixed', inset: 0, zIndex: 51,
            overflowY: 'auto', padding: '32px 16px',
            display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          }}>
            <div style={{
              width: '100%', maxWidth: 480,
              background: 'white', borderRadius: 16,
              boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 24px', borderBottom: '1px solid var(--border)',
                position: 'sticky', top: 0, background: 'white', borderRadius: '16px 16px 0 0', zIndex: 1,
              }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Add new user</h2>
                {!success && (
                  <button onClick={() => setOpen(false)} className="btn-ghost p-2">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {success ? (
                <div style={{ padding: 32 }}>
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
                    <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>User created successfully</p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      Share these credentials with <strong>{success.email}</strong>
                    </p>
                  </div>
                  <div style={{ background: 'var(--surface-raised)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Login URL</p>
                      <p style={{ fontSize: 13, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                        https://www.sanjayfuloria.tech/dvl/login
                      </p>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</p>
                      <p style={{ fontSize: 13, fontFamily: 'monospace' }}>{success.email}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Password</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <p style={{ fontSize: 14, fontFamily: 'monospace', fontWeight: 600, flex: 1, color: 'var(--dvl-purple)' }}>
                          {success.password}
                        </p>
                        <button
                          onClick={() => copyToClipboard(`Login: https://www.sanjayfuloria.tech/dvl/login\nEmail: ${success!.email}\nPassword: ${success!.password}`)}
                          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1"
                        >
                          {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy all</>}
                        </button>
                      </div>
                    </div>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20, textAlign: 'center' }}>
                    A welcome email with login details has been sent to the user.
                  </p>
                  <button
                    onClick={() => {
                      setOpen(false)
                      setSuccess(null)
                      setForm({ name: '', email: '', role: 'STUDENT', password: generatePassword() })
                      startTransition(() => router.refresh())
                    }}
                    className="btn-primary w-full"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleCreate} style={{ padding: 24 }}>
                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label">Full name</label>
                    <input className="form-input" value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Dr. Priya Sharma" />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label">Email address *</label>
                    <input type="email" required className="form-input" value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="priya@ifhe.edu.in" />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label">Role *</label>
                    <select required className="form-input" value={form.role}
                      onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                      {ROLES.map(r => (
                        <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <label className="form-label" style={{ margin: 0 }}>Password *</label>
                      <button type="button"
                        onClick={() => setForm(f => ({ ...f, password: generatePassword() }))}
                        className="btn-ghost text-xs px-2 py-1 flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" /> Generate new
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required className="form-input pr-10"
                        value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        minLength={8} />
                      <button type="button"
                        onClick={() => setShowPassword(s => !s)}
                        style={{
                          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                          background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                        }}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      A random password has been generated. You can change it or generate a new one.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <button type="button" onClick={() => setOpen(false)} className="btn-secondary" style={{ flex: 1 }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>
                      {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create user'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
