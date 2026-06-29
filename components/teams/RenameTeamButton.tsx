'use client'
import { useState } from 'react'

export function RenameTeamButton({ teamId, currentName }: { teamId: string; currentName: string }) {
  const [editing, setEditing] = useState(false)
  const [name, setName]       = useState(currentName)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  async function save() {
    if (!name.trim() || name.trim() === currentName) { setEditing(false); return }
    setSaving(true); setError('')
    const res = await fetch(`/dvl/api/teams/${teamId}/rename`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() })
    })
    const d = await res.json()
    setSaving(false)
    if (res.ok) { setEditing(false); window.location.reload() }
    else setError(d.error ?? 'Failed')
  }

  if (!editing) return (
    <button onClick={() => { setName(currentName); setEditing(true) }}
      className="text-xs px-1.5 py-0.5 rounded ml-1"
      style={{ color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}
      title="Rename team">✏
    </button>
  )

  return (
    <div className="flex flex-col gap-1 mt-1">
      <div className="flex items-center gap-1">
        <input className="px-2 py-1 rounded border text-sm focus:outline-none"
          style={{ borderColor: 'var(--dvl-purple)', width: 160 }}
          value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key==='Enter') save(); if (e.key==='Escape') setEditing(false) }}
          autoFocus/>
        <button onClick={save} disabled={saving}
          className="text-xs px-2 py-1 rounded text-white disabled:opacity-40"
          style={{ background: 'var(--dvl-purple)' }}>
          {saving ? '…' : 'Save'}
        </button>
        <button onClick={() => setEditing(false)}
          className="text-xs px-2 py-1 rounded"
          style={{ border: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>✕
        </button>
      </div>
      {error && <p className="text-xs" style={{ color: '#DC2626' }}>{error}</p>}
    </div>
  )
}
