'use client'

import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { phaseLabel, phaseColor } from '@/lib/utils'
import { Rocket, Edit3, Save, X, ExternalLink, FolderOpen, Loader2 } from 'lucide-react'

interface Team {
  id: string
  name: string
  ventureName: string | null
  course: string
  sector: string | null
  currentPhase: string
  problemStatement: string | null
  targetUsers: string | null
  businessOpportunity: string | null
  aiComponents: string | null
  technologyStack: string | null
  driveFolderId: string | null
  members: { student: { user: { name: string | null; email: string } }; role: string | null }[]
  facultyGuide: { user: { name: string | null } } | null
  mentor: { user: { name: string | null }; organisation: string | null } | null
}

export default function VenturePage() {
  const [team, setTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<Partial<Team>>({})

  useEffect(() => {
    fetch('/api/teams/mine')
      .then((r) => r.json())
      .then((data) => {
        setTeam(data)
        setForm(data ?? {})
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    if (!team) return
    setSaving(true)
    const res = await fetch(`/api/teams/${team.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const updated = await res.json()
      setTeam(updated)
      setEditing(false)
    }
    setSaving(false)
  }

  const field = (key: keyof Team, label: string, placeholder: string, multiline = false) => (
    <div>
      <label className="form-label">{label}</label>
      {editing ? (
        multiline ? (
          <textarea
            rows={3}
            className="form-input resize-none"
            value={(form[key] as string) ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            placeholder={placeholder}
          />
        ) : (
          <input
            type="text"
            className="form-input"
            value={(form[key] as string) ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            placeholder={placeholder}
          />
        )
      ) : (
        <p className="text-sm py-2.5 px-3 rounded-lg min-h-[42px]"
           style={{ background: 'var(--surface-raised)', color: team?.[key] ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          {(team?.[key] as string) || <span className="italic">Not filled in yet</span>}
        </p>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--dvl-purple)' }} />
      </div>
    )
  }

  return (
    <div className="page-enter">
      <PageHeader
        title="Project Profile"
        subtitle="Your venture's core information"
        actions={
          team ? (
            editing ? (
              <div className="flex gap-2">
                <button onClick={() => { setEditing(false); setForm(team) }} className="btn-secondary">
                  <X className="w-4 h-4" /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="btn-primary">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <><Save className="w-4 h-4" /> Save changes</>}
                </button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} className="btn-secondary">
                <Edit3 className="w-4 h-4" /> Edit profile
              </button>
            )
          ) : null
        }
      />

      <div className="page-body space-y-6">
        {team ? (
          <>
            {/* Header card */}
            <div className="card flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                   style={{ background: 'var(--dvl-purple-dim)' }}>
                <Rocket className="w-6 h-6" style={{ color: 'var(--dvl-purple)' }} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-xl font-semibold">{team.ventureName ?? team.name}</h2>
                  <span className={`phase-badge ${phaseColor(team.currentPhase)} text-xs`}>
                    {phaseLabel(team.currentPhase)}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {team.name} · {team.course} {team.sector ? `· ${team.sector}` : ''}
                </p>
                {team.driveFolderId && (
                  <a
                    href={`https://drive.google.com/drive/folders/${team.driveFolderId}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-xs text-brand hover:underline"
                  >
                    <FolderOpen className="w-3.5 h-3.5" /> Open Google Drive folder
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Problem & opportunity */}
            <div className="card space-y-4">
              <h3 className="text-base font-semibold pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                Problem & Opportunity
              </h3>
              {field('problemStatement', 'Problem statement', 'Describe the problem your venture is solving', true)}
              {field('targetUsers', 'Target users', 'Who are the primary users or customers?', true)}
              {field('businessOpportunity', 'Business opportunity', 'What is the market opportunity?', true)}
            </div>

            {/* Technology */}
            <div className="card space-y-4">
              <h3 className="text-base font-semibold pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                Technology & AI
              </h3>
              {field('aiComponents', 'AI components', 'Which AI tools / models are you building with?', true)}
              {field('technologyStack', 'Technology stack', 'e.g. React Native, FastAPI, PostgreSQL', true)}
            </div>

            {/* Team */}
            <div className="card">
              <h3 className="text-base font-semibold pb-2 mb-4 border-b" style={{ borderColor: 'var(--border)' }}>
                Team & Guides
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-medium mb-3 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Team Members</p>
                  <div className="space-y-2">
                    {team.members.map((m, i) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                             style={{ background: 'var(--dvl-indigo)' }}>
                          {m.student.user.name?.charAt(0) ?? '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{m.student.user.name}</p>
                          {m.role && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{m.role}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium mb-3 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Guides</p>
                  <div className="space-y-2">
                    {team.facultyGuide && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                             style={{ background: 'var(--dvl-purple)' }}>
                          {team.facultyGuide.user.name?.charAt(0) ?? 'F'}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{team.facultyGuide.user.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Faculty Guide</p>
                        </div>
                      </div>
                    )}
                    {team.mentor && (
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                             style={{ background: 'var(--dvl-teal)' }}>
                          {team.mentor.user.name?.charAt(0) ?? 'M'}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{team.mentor.user.name}</p>
                          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            Industry Mentor {team.mentor.organisation ? `· ${team.mentor.organisation}` : ''}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="card text-center py-20">
            <Rocket className="w-10 h-10 mx-auto mb-4 opacity-20" />
            <h2 className="text-lg font-semibold mb-2">No venture assigned yet</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Your faculty will add you to a team.</p>
          </div>
        )}
      </div>
    </div>
  )
}
// FileUpload is available for workspace files
