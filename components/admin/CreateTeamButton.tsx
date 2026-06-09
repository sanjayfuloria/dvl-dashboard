'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2 } from 'lucide-react'

interface Props {
  faculty: { id: string; user: { name: string | null }; designation: string | null }[]
  mentors: { id: string; user: { name: string | null }; organisation: string | null }[]
  students: { id: string; user: { name: string | null; email: string } }[]
}

export function CreateTeamButton({ faculty, mentors, students }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [form, setForm] = useState({
    name: '', ventureName: '', course: 'MPB', sector: '',
    facultyGuideId: '', mentorId: '', problemStatement: '',
  })
  const router = useRouter()

  function toggleStudent(id: string) {
    setSelectedStudents(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/dvl/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        memberUserIds: selectedStudents,
        facultyGuideId: form.facultyGuideId || undefined,
        mentorId: form.mentorId || undefined,
      }),
    })
    setLoading(false)
    if (res.ok) {
      setOpen(false)
      setForm({ name: '', ventureName: '', course: 'MPB', sector: '', facultyGuideId: '', mentorId: '', problemStatement: '' })
      setSelectedStudents([])
      router.refresh()
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="w-4 h-4" /> Create team
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              background: 'rgba(0,0,0,0.5)',
            }}
          />
          {/* Modal - centered with flexbox on viewport */}
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 51,
            width: '90vw',
            maxWidth: 640,
            maxHeight: '85vh',
            overflowY: 'auto',
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
          }}>
            {/* Header */}
            <div style={{
              position: 'sticky', top: 0, background: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)',
              zIndex: 1,
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Create new team</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                  Fill in the team details below
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="btn-ghost p-2">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label className="form-label">Team name *</label>
                  <input required className="form-input" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Team Alpha" />
                </div>
                <div>
                  <label className="form-label">Venture name</label>
                  <input className="form-input" value={form.ventureName}
                    onChange={e => setForm(f => ({ ...f, ventureName: e.target.value }))}
                    placeholder="AgriConnect" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label className="form-label">Course *</label>
                  <select required className="form-input" value={form.course}
                    onChange={e => setForm(f => ({ ...f, course: e.target.value }))}>
                    <option value="MPB">MPB — Managing Platform Businesses</option>
                    <option value="MDT">MDT — Managing Digital Transformation</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Sector</label>
                  <input className="form-input" value={form.sector}
                    onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
                    placeholder="AgriTech, FinTech, EdTech…" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label className="form-label">Faculty guide</label>
                  <select className="form-input" value={form.facultyGuideId}
                    onChange={e => setForm(f => ({ ...f, facultyGuideId: e.target.value }))}>
                    <option value="">— Select faculty —</option>
                    {faculty.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.user.name} {f.designation ? `(${f.designation})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Industry mentor</label>
                  <select className="form-input" value={form.mentorId}
                    onChange={e => setForm(f => ({ ...f, mentorId: e.target.value }))}>
                    <option value="">— Select mentor —</option>
                    {mentors.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.user.name} {m.organisation ? `(${m.organisation})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Problem statement</label>
                <textarea rows={3} className="form-input" style={{ resize: 'none' }}
                  value={form.problemStatement}
                  onChange={e => setForm(f => ({ ...f, problemStatement: e.target.value }))}
                  placeholder="Describe the problem this team will tackle…" />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label className="form-label">
                  Add students ({selectedStudents.length} selected)
                </label>
                <div style={{
                  maxHeight: 180, overflowY: 'auto',
                  border: '1px solid var(--border)', borderRadius: 8,
                }}>
                  {students.length > 0 ? students.map((s, i) => (
                    <label key={s.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', cursor: 'pointer',
                      borderBottom: i < students.length - 1 ? '1px solid var(--border)' : 'none',
                      background: selectedStudents.includes(s.id) ? 'var(--dvl-purple-dim)' : 'transparent',
                    }}>
                      <input type="checkbox"
                        checked={selectedStudents.includes(s.id)}
                        onChange={() => toggleStudent(s.id)} />
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>{s.user.name ?? '—'}</p>
                        <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{s.user.email}</p>
                      </div>
                    </label>
                  )) : (
                    <p style={{ padding: 16, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
                      No students found. Add student users first.
                    </p>
                  )}
                </div>
              </div>

              {/* Sticky footer buttons */}
              <div style={{
                position: 'sticky', bottom: 0, background: 'white',
                paddingTop: 16, borderTop: '1px solid var(--border)',
                display: 'flex', gap: 12,
              }}>
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create team'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  )
}
