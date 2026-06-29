'use client'
import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Search, Plus } from 'lucide-react'

type User = { id: string; name: string | null; email: string; role: string; createdAt: string }

const ROLE_COLORS: Record<string, string> = {
  ADMIN:   'bg-red-100 text-red-700',
  FACULTY: 'bg-blue-100 text-blue-700',
  MENTOR:  'bg-green-100 text-green-700',
  STUDENT: 'bg-purple-100 text-purple-700',
}

export default function UsersPage() {
  const [users, setUsers]     = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')

  useEffect(() => {
    fetch('/dvl/api/admin/users')
      .then(r => r.json())
      .then(d => { setUsers(d); setLoading(false) })
  }, [])

  const filtered = users.filter(u =>
    (roleFilter === 'ALL' || u.role === roleFilter) &&
    (!search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="page-enter">
      <PageHeader title="Faculty & Staff" subtitle="Manage non-student user accounts" />
      <div className="page-body space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none"
              placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            {['ALL','ADMIN','FACULTY','MENTOR'].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                style={{
                  background: roleFilter === r ? 'var(--dvl-purple)' : 'white',
                  color: roleFilter === r ? 'white' : 'var(--text-secondary)',
                  borderColor: roleFilter === r ? 'var(--dvl-purple)' : 'var(--border)',
                }}>
                {r === 'ALL' ? 'All' : r.charAt(0) + r.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden p-0">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading…</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>{['Name','Email','Role','Created'].map(h => <th key={h}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id}>
                    <td className="font-medium text-sm">{u.name ?? '—'}</td>
                    <td className="text-sm text-gray-500">{u.email}</td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-700'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="text-xs text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
