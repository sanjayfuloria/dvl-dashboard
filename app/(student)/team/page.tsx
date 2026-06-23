'use client'
import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Users, User, Plus, LogIn, LogOut, Search, Info, AlertCircle, CheckCircle2 } from 'lucide-react'

type OT = { id:string; name:string; course:string; sector:string|null; ventureName:string|null; memberCount:number; members:(string|null)[] }
type MT = { id:string; name:string; isIndividual:boolean; course:string; memberCount:number }

export default function Page() {
  const [myTeam,setMyTeam]     = useState<MT|null>(null)
  const [openTeams,setOpenTeams] = useState<OT[]>([])
  const [section,setSection]   = useState<string|null>(null)
  const [scope,setScope]       = useState<'section'|'all'>('section')
  const [search,setSearch]     = useState('')
  const [newName,setNewName]   = useState('')
  const [showCreate,setShowCreate] = useState(false)
  const [loading,setLoading]   = useState(true)
  const [saving,setSaving]     = useState(false)
  const [toast,setToast]       = useState<{msg:string;type:'ok'|'err'}|null>(null)

  const showToast = (msg:string, type:'ok'|'err'='ok') => {
    setToast({msg,type}); setTimeout(()=>setToast(null),4000)
  }

  async function load() {
    setLoading(true)
    const r = await fetch(`/dvl/api/student/teams?scope=${scope}`)
    if (r.ok) {
      const d = await r.json()
      setMyTeam(d.myTeam); setOpenTeams(d.openTeams); setSection(d.studentSection)
    }
    setLoading(false)
  }
  useEffect(()=>{ load() },[scope])

  async function act(action:string, teamId?:string, teamName?:string) {
    setSaving(true)
    const r = await fetch('/dvl/api/student/teams', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({action, teamId, teamName})
    })
    const d = await r.json()
    if (r.ok) {
      const msgs: Record<string,string> = {
        join: 'You have joined the team!',
        create: 'Team created — you are Team Lead!',
        individual: 'Set as individual project.',
        leave: 'You have left the team.',
      }
      showToast(msgs[action] ?? 'Done!', 'ok')
      setShowCreate(false); setNewName(''); await load()
    } else {
      showToast(d.error ?? 'Something went wrong', 'err')
    }
    setSaving(false)
  }

  const filtered = openTeams.filter(t =>
    !search || t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.ventureName?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="page-enter">
      <PageHeader title="Team Selection" subtitle="Choose how you want to work on your DVL venture" />
      <div className="page-body space-y-6">

        {/* ── Rules banner ─────────────────────────────────────────────── */}
        <div className="card" style={{background:'var(--dvl-purple-dim)',border:'1px solid var(--dvl-purple)',borderLeft:'4px solid var(--dvl-purple)'}}>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 shrink-0 mt-0.5" style={{color:'var(--dvl-purple)'}}/>
            <div>
              <p className="font-semibold text-sm mb-2" style={{color:'var(--dvl-purple)'}}>Team Rules — Please read before selecting</p>
              <ul className="space-y-1.5 text-sm" style={{color:'var(--text-primary)'}}>
                <li className="flex items-start gap-2"><span className="font-bold shrink-0" style={{color:'var(--dvl-purple)'}}>①</span><span><strong>Group teams:</strong> 2 to 5 students. Once you create a team, others can join until it is full.</span></li>
                <li className="flex items-start gap-2"><span className="font-bold shrink-0" style={{color:'var(--dvl-purple)'}}>②</span><span><strong>Individual project:</strong> Only 1 person. No one else can join your individual project.</span></li>
                <li className="flex items-start gap-2"><span className="font-bold shrink-0" style={{color:'var(--dvl-purple)'}}>③</span><span><strong>Maximum 5 members</strong> per group team. The Join button disappears when a team is full.</span></li>
                <li className="flex items-start gap-2"><span className="font-bold shrink-0" style={{color:'var(--dvl-purple)'}}>④</span><span><strong>You can change your mind</strong> — leave your current team and join or create another before the deadline.</span></li>
                <li className="flex items-start gap-2"><span className="font-bold shrink-0" style={{color:'var(--dvl-purple)'}}>⑤</span><span><strong>Section scope:</strong> By default you see teams from your section. Toggle to "All sections" for cross-section teams.</span></li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Current team status ──────────────────────────────────────── */}
        {myTeam && (
          <div className={`card flex items-start justify-between gap-4 ${myTeam.isIndividual ? 'border-blue-200' : 'border-green-200'}`}
               style={{border:'2px solid',borderColor: myTeam.isIndividual ? '#bfdbfe' : '#bbf7d0', background: myTeam.isIndividual ? '#eff6ff' : '#f0fdf4'}}>
            <div className="flex items-center gap-3">
              {myTeam.isIndividual
                ? <User className="w-6 h-6 shrink-0" style={{color:'#2563eb'}}/>
                : <Users className="w-6 h-6 shrink-0" style={{color:'#16a34a'}}/>}
              <div>
                <p className="font-semibold" style={{color: myTeam.isIndividual ? '#1e3a8a' : '#14532d'}}>
                  {myTeam.isIndividual ? 'Individual project' : myTeam.name}
                </p>
                <p className="text-xs mt-0.5" style={{color:'#6b7280'}}>
                  {myTeam.isIndividual
                    ? 'You are working independently. You can still join a group team before the deadline.'
                    : `${myTeam.memberCount} member${myTeam.memberCount !== 1 ? 's' : ''} · ${myTeam.course} · You can leave and join another team before the deadline`}
                </p>
              </div>
            </div>
            <button onClick={()=>act('leave')} disabled={saving}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg shrink-0 disabled:opacity-40"
              style={{border:'1px solid #d1d5db',background:'white',color:'#6b7280',cursor:'pointer'}}>
              <LogOut className="w-3.5 h-3.5"/> Leave
            </button>
          </div>
        )}

        {/* ── Options when not in a team ───────────────────────────────── */}
        {!myTeam && (
          <div className="grid grid-cols-3 gap-4">
            {/* Create */}
            <div className="card cursor-pointer hover:shadow-md transition-shadow text-center space-y-2"
                 style={{border:'2px dashed',borderColor:'var(--dvl-purple)',background:'var(--dvl-purple-dim)'}}
                 onClick={()=>setShowCreate(true)}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{background:'var(--dvl-purple)'}}>
                <Plus className="w-6 h-6 text-white"/>
              </div>
              <p className="font-semibold" style={{color:'var(--dvl-purple)'}}>Create a Team</p>
              <p className="text-xs" style={{color:'var(--text-secondary)'}}>Start a group team (2–5 members). Others can join using the team browser below.</p>
            </div>

            {/* Join */}
            <div className="card cursor-pointer hover:shadow-md transition-shadow text-center space-y-2"
                 style={{border:'2px dashed',borderColor:'#16a34a',background:'#f0fdf4'}}
                 onClick={()=>document.getElementById('open-teams')?.scrollIntoView({behavior:'smooth'})}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{background:'#16a34a'}}>
                <LogIn className="w-6 h-6 text-white"/>
              </div>
              <p className="font-semibold" style={{color:'#15803d'}}>Join a Team</p>
              <p className="text-xs" style={{color:'var(--text-secondary)'}}>Browse open group teams below and join one with space available (max 5 members).</p>
            </div>

            {/* Individual */}
            <div className="card cursor-pointer hover:shadow-md transition-shadow text-center space-y-2"
                 style={{border:'2px dashed',borderColor:'#2563eb',background:'#eff6ff'}}
                 onClick={()=>act('individual')}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{background:'#2563eb'}}>
                <User className="w-6 h-6 text-white"/>
              </div>
              <p className="font-semibold" style={{color:'#1d4ed8'}}>Go Individual</p>
              <p className="text-xs" style={{color:'var(--text-secondary)'}}>Work on your own venture. <strong>Only you</strong> — no one else can join your individual project.</p>
            </div>
          </div>
        )}

        {/* ── Create team form ─────────────────────────────────────────── */}
        {showCreate && !myTeam && (
          <div className="card space-y-4" style={{border:'1px solid var(--dvl-purple)'}}>
            <div>
              <h3 className="font-semibold mb-1">Create a group team</h3>
              <p className="text-xs" style={{color:'var(--text-secondary)'}}>
                You will be the Team Lead. Other students can find your team below and join — up to a maximum of 5 members total.
              </p>
            </div>
            <div className="flex gap-3">
              <input
                className="flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none"
                style={{borderColor:'var(--border-default)'}}
                placeholder="Team name (e.g. VentureX, AgriConnect…)"
                value={newName}
                onChange={e=>setNewName(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&newName.trim()&&act('create',undefined,newName)}
              />
              <button disabled={saving||!newName.trim()} onClick={()=>act('create',undefined,newName)}
                className="btn-primary disabled:opacity-40">
                {saving ? 'Creating…' : 'Create Team'}
              </button>
              <button onClick={()=>setShowCreate(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        )}

        {/* ── Open teams browser ───────────────────────────────────────── */}
        <div id="open-teams" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-semibold">Open Teams</h2>
              <p className="text-xs mt-0.5" style={{color:'var(--text-muted)'}}>Teams with fewer than 5 members that you can join</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{color:'var(--text-muted)'}}/>
                <input className="pl-8 pr-3 py-1.5 text-sm rounded-lg border" style={{borderColor:'var(--border-default)'}}
                  placeholder="Search teams…" value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <div className="flex rounded-lg border overflow-hidden text-sm" style={{borderColor:'var(--border-default)'}}>
                <button onClick={()=>setScope('section')}
                  className="px-3 py-1.5 transition-colors"
                  style={{background:scope==='section'?'var(--dvl-purple)':'transparent',color:scope==='section'?'white':'var(--text-secondary)'}}>
                  My section {section?`(${section})`:''}
                </button>
                <button onClick={()=>setScope('all')}
                  className="px-3 py-1.5 transition-colors"
                  style={{background:scope==='all'?'var(--dvl-purple)':'transparent',color:scope==='all'?'white':'var(--text-secondary)'}}>
                  All sections
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-sm" style={{color:'var(--text-muted)'}}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="card text-center py-12 space-y-2">
              <p className="font-medium" style={{color:'var(--text-muted)'}}>No open teams found</p>
              <p className="text-xs" style={{color:'var(--text-muted)'}}>
                {scope==='section' ? 'Try switching to "All sections" or create your own team.' : 'Be the first to create a team!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filtered.map(t => {
                const isFull = t.memberCount >= 5
                const canJoin = !myTeam && !isFull
                return (
                  <div key={t.id} className="card hover:shadow-md transition-shadow"
                       style={{opacity: isFull ? 0.7 : 1}}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{t.name}</h3>
                        {t.ventureName && <p className="text-xs mt-0.5 truncate" style={{color:'var(--dvl-purple)'}}>{t.ventureName}</p>}
                      </div>
                      <span className="tag tag-gray text-xs ml-2 shrink-0">{t.course}</span>
                    </div>

                    {t.sector && <p className="text-xs mb-3" style={{color:'var(--text-muted)'}}>Sector: {t.sector}</p>}

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5 text-sm" style={{color:'var(--text-secondary)'}}>
                        <Users className="w-4 h-4"/>
                        <span className="font-medium">{t.memberCount}/5</span>
                        {t.members.filter(Boolean).length > 0 && (
                          <span className="text-xs" style={{color:'var(--text-muted)'}}>
                            · {t.members.filter(Boolean).slice(0,2).join(', ')}{t.memberCount > 2 ? '…' : ''}
                          </span>
                        )}
                      </div>
                      {isFull ? (
                        <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{background:'#fee2e2',color:'#dc2626'}}>Full</span>
                      ) : myTeam ? (
                        <span className="text-xs" style={{color:'var(--text-muted)'}}>Leave your team first</span>
                      ) : (
                        <button disabled={saving} onClick={()=>act('join',t.id)}
                          className="text-sm px-3 py-1.5 rounded-lg font-medium text-white disabled:opacity-40"
                          style={{background:'#16a34a',cursor:'pointer'}}>
                          Join
                        </button>
                      )}
                    </div>

                    {/* Member bar */}
                    <div className="flex gap-1">
                      {Array.from({length:5}).map((_,i)=>(
                        <div key={i} className="h-1.5 flex-1 rounded-full"
                             style={{background: i < t.memberCount ? 'var(--dvl-purple)' : 'var(--surface-raised)'}}/>
                      ))}
                    </div>
                    <p className="text-xs mt-1" style={{color:'var(--text-muted)'}}>
                      {5 - t.memberCount} {5 - t.memberCount === 1 ? 'spot' : 'spots'} remaining
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 text-sm px-4 py-3 rounded-xl shadow-lg z-50 text-white"
             style={{background: toast.type === 'ok' ? '#16a34a' : '#dc2626', maxWidth:360}}>
          {toast.type === 'ok'
            ? <CheckCircle2 className="w-4 h-4 shrink-0"/>
            : <AlertCircle className="w-4 h-4 shrink-0"/>}
          {toast.msg}
        </div>
      )}
    </div>
  )
}
