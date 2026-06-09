'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X, Loader2 } from 'lucide-react'
import { useEffect, useState as useStatePortal } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  faculty: { id: string; user: { name: string | null }; designation: string | null }[]
  mentors: { id: string; user: { name: string | null }; organisation: string | null }[]
  students: { id: string; user: { name: string | null; email: string } }[]
}

export function CreateTeamButton({ faculty, mentors, students }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [form, setForm] = useState({
    name: '', ventureName: '', course: 'MPB', sector: '',
    facultyGuideId: '', mentorId: '', problemStatement: '',
  })
  const router = useRouter()

  function toggleStudent(id: string) {
    setSelectedStudents(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  function reset() {
    setForm({ name: '', ventureName: '', course: 'MPB', sector: '', facultyGuideId: '', mentorId: '', problemStatement: '' })
    setSelectedStudents([])
    setSuccess(false)
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
      setSuccess(true)
      router.refresh()
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid var(--border-strong)', fontSize: 13,
    background: 'var(--surface-card)', color: 'var(--text-primary)',
    outline: 'none', boxSizing: 'border-box' as const,
  }

  const labelStyle = {
    display: 'block', fontSize: 12, fontWeight: 600,
    marginBottom: 6, color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const, letterSpacing: '0.04em',
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="w-4 h-4" /> Create team
      </button>

      {open && typeof window !== 'undefined' && createPortal(
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', overflowY: 'auto', padding: '32px 16px 64px' }}
          onClick={(e) => { if (e.target === e.currentTarget && !loading) { setOpen(false); reset() } }}
        >
          <div style={{ width: '100%', maxWidth: 560, margin: '0 auto', background: 'white', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.25)' }}>
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '20px 28px', borderBottom: '1px solid var(--border)',
                position: 'sticky', top: 0, background: 'white',
                borderRadius: '16px 16px 0 0', zIndex: 1,
              }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {success ? 'Team created!' : 'Create new team'}
                  </h2>
                  <p style={{ margin: '3px 0 0', fontSize: 13, color: 'var(--text-secondary)' }}>
                    {success ? 'A Google Drive folder has been created for this team.' : 'Fill in the details to set up a new venture team.'}
                  </p>
                </div>
                {!loading && (
                  <button onClick={() => { setOpen(false); reset() }} className="btn-ghost p-2">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {success ? (
                /* Success state */
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'var(--dvl-purple-dim)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px', fontSize: 28,
                  }}>🚀</div>
                  <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 6 }}>Team created successfully</p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 28 }}>
                    The team workspace and Google Drive folder are ready.
                  </p>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button
                      onClick={() => { reset(); }}
                      className="btn-secondary px-6"
                    >
                      Create another
                    </button>
                    <button
                      onClick={() => { setOpen(false); reset() }}
                      className="btn-primary px-6"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                /* Form */
                <form onSubmit={handleSubmit}>
                  <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Team & Venture name */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label style={labelStyle}>Team name *</label>
                        <input required style={inputStyle} value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                          placeholder="Team Alpha" />
                      </div>
                      <div>
                        <label style={labelStyle}>Venture name</label>
                        <input style={inputStyle} value={form.ventureName}
                          onChange={e => setForm(f => ({ ...f, ventureName: e.target.value }))}
                          placeholder="AgriConnect" />
                      </div>
                    </div>

                    {/* Course & Sector */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label style={labelStyle}>Course *</label>
                        <select required style={inputStyle} value={form.course}
                          onChange={e => setForm(f => ({ ...f, course: e.target.value }))}>
                          <option value="MPB">MPB — Platform Businesses</option>
                          <option value="MDT">MDT — Digital Transformation</option>
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Sector</label>
                        <input style={inputStyle} value={form.sector}
                          onChange={e => setForm(f => ({ ...f, sector: e.target.value }))}
                          placeholder="AgriTech, FinTech, EdTech…" />
                      </div>
                    </div>

                    {/* Faculty & Mentor */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label style={labelStyle}>Faculty guide</label>
                        <select style={inputStyle} value={form.facultyGuideId}
                          onChange={e => setForm(f => ({ ...f, facultyGuideId: e.target.value }))}>
                          <option value="">— Select faculty —</option>
                          {faculty.map(f => (
                            <option key={f.id} value={f.id}>
                              {f.user.name}{f.designation ? ` (${f.designation})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Industry mentor</label>
                        <select style={inputStyle} value={form.mentorId}
                          onChange={e => setForm(f => ({ ...f, mentorId: e.target.value }))}>
                          <option value="">— Select mentor —</option>
                          {mentors.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.user.name}{m.organisation ? ` (${m.organisation})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Problem statement */}
                    <div>
                      <label style={labelStyle}>Problem statement</label>
                      <textarea rows={3}
                        style={{ ...inputStyle, resize: 'none' }}
                        value={form.problemStatement}
                        onChange={e => setForm(f => ({ ...f, problemStatement: e.target.value }))}
                        placeholder="Describe the problem this team will tackle…" />
                    </div>

                    {/* Students */}
                    <div>
                      <label style={labelStyle}>
                        Add students
                        {selectedStudents.length > 0 && (
                          <span style={{ marginLeft: 6, color: 'var(--dvl-purple)', fontWeight: 700 }}>
                            {selectedStudents.length} selected
                          </span>
                        )}
                      </label>
                      <div style={{
                        border: '1px solid var(--border)', borderRadius: 8,
                        maxHeight: 180, overflowY: 'auto',
                      }}>
                        {students.length > 0 ? students.map((s, i) => (
                          <label key={s.id} style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 14px', cursor: 'pointer',
                            borderBottom: i < students.length - 1 ? '1px solid var(--border)' : 'none',
                            background: selectedStudents.includes(s.id) ? 'var(--dvl-purple-dim)' : 'transparent',
                            transition: 'background 0.1s',
                          }}>
                            <input type="checkbox"
                              checked={selectedStudents.includes(s.id)}
                              onChange={() => toggleStudent(s.id)}
                              style={{ accentColor: 'var(--dvl-purple)', width: 15, height: 15 }} />
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>{s.user.name ?? '—'}</p>
                              <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{s.user.email}</p>
                            </div>
                            {selectedStudents.includes(s.id) && (
                              <span style={{ fontSize: 10, color: 'var(--dvl-purple)', fontWeight: 600 }}>✓ Added</span>
                            )}
                          </label>
                        )) : (
                          <p style={{ padding: 16, textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                            No students found. Add student users first.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer buttons */}
                  <div style={{
                    display: 'flex', gap: 12, padding: '16px 28px 24px',
                    borderTop: '1px solid var(--border)',
                  }}>
                    <button type="button" onClick={() => { setOpen(false); reset() }}
                      className="btn-secondary" style={{ flex: 1 }}>
                      Cancel
                    </button>
                    <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 2 }}>
                      {loading
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating team…</>
                        : <><Plus className="w-4 h-4" /> Create team</>}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
        document.body
      )}
    </>
  )
}
