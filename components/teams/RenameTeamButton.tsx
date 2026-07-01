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
    <button
      onClick={() => { setName(currentName); setEditing(true) }}
      title="Rename this team"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
        padding: '3px 10px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 600,
        cursor: 'pointer',
        background: '#EDE9FF',
        color: '#5B4BD4',
        border: '1px solid #c4b5fd',
        letterSpacing: 0.2,
      }}>
      ✏ Rename
    </button>
  )

  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          style={{
            padding: '5px 10px',
            borderRadius: 8,
            border: '2px solid #5B4BD4',
            fontSize: 13,
            outline: 'none',
            width: 180,
            fontWeight: 500,
          }}
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          autoFocus
          placeholder="New team name…"
        />
        <button
          onClick={save}
          disabled={saving}
          style={{
            padding: '5px 14px',
            borderRadius: 8,
            border: 'none',
            background: '#5B4BD4',
            color: 'white',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            opacity: saving ? 0.6 : 1,
          }}>
          {saving ? '…' : 'Save'}
        </button>
        <button
          onClick={() => { setEditing(false); setError('') }}
          style={{
            padding: '5px 10px',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            background: 'white',
            color: '#6b7280',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}>
          Cancel
        </button>
      </div>
      {error && (
        <p style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>⚠ {error}</p>
      )}
    </div>
  )
}
