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
    name: '',
    ventureName: '',
    course: 'MPB',
    sector: '',
    facultyGuideId: '',
    mentorId: '',
    problemStatement: '',
  })
  const router = useRouter()

  function toggleStudent(id: string) {
    setSelectedStudents(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch('/api/teams', {
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
      router.refresh()
    }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-primary">
        <Plus className="w-4 h-4" /> Create team
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
             style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-semibold">Create new team</h2>
              <button onClick={() => setOpen(false)} className="btn-ghost p-2"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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

              <div>
                <label className="form-label">Problem statement</label>
                <textarea rows={2} className="form-input resize-none" value={form.problemStatement}
                  onChange={e => setForm(f => ({ ...f, problemStatement: e.target.value }))}
                  placeholder="Describe the problem this team will tackle…" />
              </div>

              {/* Student selection */}
              <div>
                <label className="form-label">Add students ({selectedStudents.length} selected)</label>
                <div className="max-h-48 overflow-y-auto border rounded-lg divide-y"
                     style={{ borderColor: 'var(--border)' }}>
                  {students.map(s => (
                    <label key={s.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(s.id)}
                        onChange={() => toggleStudent(s.id)}
                        className="rounded"
                      />
                      <div>
                        <p className="text-sm font-medium">{s.user.name ?? '—'}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.user.email}</p>
                      </div>
                    </label>
                  ))}
                  {students.length === 0 && (
                    <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
                      No students found. Add student users first.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
