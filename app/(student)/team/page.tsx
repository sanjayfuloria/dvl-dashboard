'use client'
import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Users, User, Plus, LogIn, LogOut, Search, Info, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react'

type Slot = { section: string; course: string }
type TeamInfo = { id: string; name: string; isIndividual: boolean; course: string; memberCount: number; role: string }
type OT = { id: string; name: string; course: string; sector: string|null; ventureName: string|null; memberCount: number; members:(string|null)[] }

const COURSE_LABELS: Record<string,string> = {
  MDT: 'Managing Digital Transformation',
  MPB: 'Marketing for Platform Businesses',
  B2B: 'Business-to-Business Marketing',
}
const CC: Record<string,{bg:string;border:string;text:string;badge:string}> = {
  MDT: {bg:'#EDE9FF',border:'#5B4BD4',text:'#3B2BA0',badge:'#5B4BD4'},
  MPB: {bg:'#D1FAF5',border:'#0D9488',text:'#065F46',badge:'#0D9488'},
  B2B: {bg:'#FEF3C7',border:'#F59E0B',text:'#92400E',badge:'#F59E0B'},
}
const fallbackCC = {bg:'#F3F4F6',border:'#6B7280',text:'#1F2937',badge:'#6B7280'}

export default function Page() {
  const [slots,setSlots]           = useState<Slot[]>([])
  const [myTeams,setMyTeams]       = useState<Record<string,TeamInfo>>({})
  const [openTeams,setOpenTeams]   = useState<OT[]>([])
  const [activeCourse,setActiveCourse] = useState<string|null>(null)
  const [scope,setScope]           = useState<'section'|'all'>('section')
  const [search,setSearch]         = useState('')
  const [newName,setNewName]       = useState('')
  const [showCreate,setShowCreate] = useState<string|null>(null)
  const [loading,setLoading]       = useState(true)
  const [saving,setSaving]         = useState(false)
  const [toast,setToast]           = useState<{msg:string;type:'ok'|'err'}|null>(null)
  const [renaming,setRenaming]     = useState<string|null>(null)  // course being renamed
  const [renameName,setRenameName] = useState('')
  const [renameSaving,setRenameSaving] = useState(false)

  const showToast = (msg:string,type:'ok'|'err'='ok') => {
    setToast({msg,type}); setTimeout(()=>setToast(null),4000)
  }

  async function load(course?:string) {
    setLoading(true)
    const c = course ?? activeCourse ?? ''
    const r = await fetch(`/dvl/api/student/teams?scope=${scope}${c?'&course='+c:''}`)
    if (r.ok) {
      const d = await r.json()
      setSlots(d.slots ?? [])
      setMyTeams(d.myTeams ?? {})
      setOpenTeams(d.openTeams ?? [])
      if (!activeCourse && d.slots?.length > 0) setActiveCourse(d.slots[0].course)
    }
    setLoading(false)
  }

  useEffect(()=>{ load() },[scope])

  async function renameTeam(teamId: string, course: string) {
    if (!renameName.trim()) return
    setRenameSaving(true)
    const res = await fetch(`/dvl/api/teams/${teamId}/rename`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: renameName.trim() })
    })
    const d = await res.json()
    setRenameSaving(false)
    if (res.ok) {
      showToast('Team name updated!', 'ok')
      setRenaming(null); setRenameName('')
      await load(course)
    } else {
      showToast(d.error ?? 'Failed to rename', 'err')
    }
  }

  async function act(action:string, course:string, teamId?:string, teamName?:string) {
    setSaving(true)
    const r = await fetch('/dvl/api/student/teams',{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({action,teamId,teamName,course})
    })
    const d = await r.json()
    if (r.ok) {
      const msgs: Record<string,string> = {
        join:'Joined the team!', create:'Team created — you are Team Lead!',
        individual:'Set as individual project.', leave:'Left the team.',
      }
      showToast(msgs[action]??'Done!','ok')
      setShowCreate(null); setNewName(''); await load(course)
    } else {
      showToast(d.error??'Something went wrong','err')
    }
    setSaving(false)
  }

  const isMultiCourse = slots.length > 1
  const completedSlots = slots.filter(s => myTeams[s.course])
  const allComplete = completedSlots.length === slots.length && slots.length > 0
  const pendingSlots = slots.filter(s => !myTeams[s.course])

  const filtered = openTeams.filter(t =>
    (!search || t.name.toLowerCase().includes(search.toLowerCase()) ||
     (t.ventureName?.toLowerCase().includes(search.toLowerCase()))) &&
    (!activeCourse || t.course === activeCourse)
  )

  return (
    <div className="page-enter">
      <PageHeader title="My Team" subtitle="Choose your team for each course you are enrolled in" />
      <div className="page-body space-y-6">

        {/* Multi-course mandatory warning */}
        {isMultiCourse && (
          <div className="card" style={{background:'#FEF3C7',border:'2px solid #F59E0B',borderLeft:'4px solid #F59E0B'}}>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{color:'#92400E'}}/>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{color:'#92400E'}}>
                  You are enrolled in {slots.length} courses — you must form or join a separate team for EACH course
                </p>
                <p className="text-xs mt-1" style={{color:'#78350F'}}>
                  {completedSlots.length} of {slots.length} completed
                  {pendingSlots.length > 0 && ` · Still pending: ${pendingSlots.map(s=>s.course+' ('+s.section+')').join(', ')}`}
                </p>
              </div>
              {allComplete && <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{color:'#16A34A'}}/>}
            </div>
          </div>
        )}

        {/* Rules banner */}
        <div className="card" style={{background:'var(--dvl-purple-dim)',borderLeft:'4px solid var(--dvl-purple)'}}>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 shrink-0 mt-0.5" style={{color:'var(--dvl-purple)'}}/>
            <div>
              <p className="font-semibold text-sm mb-2" style={{color:'var(--dvl-purple)'}}>Team Rules — Please read before selecting</p>
              <ul className="space-y-1.5 text-sm" style={{color:'var(--text-primary)'}}>
                <li className="flex items-start gap-2">
                  <span className="font-bold shrink-0" style={{color:'var(--dvl-purple)'}}>①</span>
                  <span><strong>Group team:</strong> Exactly <strong>5 members</strong>. Create a team and have 4 others join, or join an existing team that needs members.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold shrink-0" style={{color:'var(--dvl-purple)'}}>②</span>
                  <span><strong>Individual project:</strong> Exactly <strong>1 person — only you</strong>. No one else can join your individual project.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold shrink-0" style={{color:'var(--dvl-purple)'}}>③</span>
                  <span>There is <strong>no in-between</strong> — teams are either 5-member group teams or 1-member individual projects.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold shrink-0" style={{color:'var(--dvl-purple)'}}>④</span>
                  <span>The <strong>Join button disappears</strong> once a team reaches 5 members. You can leave and change before the deadline.</span>
                </li>
                {isMultiCourse && (
                  <li className="flex items-start gap-2">
                    <span className="font-bold shrink-0" style={{color:'#92400E'}}>⑤</span>
                    <span style={{color:'#92400E'}}><strong>You are in multiple courses.</strong> You must complete team selection separately for each course shown below.</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Course tabs */}
        {isMultiCourse && (
          <div className="flex gap-2 flex-wrap">
            {slots.map(slot => {
              const c = CC[slot.course] ?? fallbackCC
              const hasTeam = !!myTeams[slot.course]
              const isActive = activeCourse === slot.course
              return (
                <button key={slot.course}
                  onClick={()=>{ setActiveCourse(slot.course); load(slot.course) }}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    background: isActive ? c.badge : 'white',
                    color: isActive ? 'white' : c.text,
                    border: `2px solid ${c.badge}`,
                  }}>
                  {hasTeam
                    ? <CheckCircle2 className="w-4 h-4"/>
                    : <AlertCircle className="w-4 h-4"/>}
                  {slot.course} — {slot.section}
                </button>
              )
            })}
          </div>
        )}

        {/* Per-course slot UI */}
        {slots.filter(s => !isMultiCourse || s.course === activeCourse).map(slot => {
          const c = CC[slot.course] ?? fallbackCC
          const myTeam = myTeams[slot.course]

          return (
            <div key={slot.course} className="space-y-4">
              {isMultiCourse && (
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{background:c.badge}}>
                    {slot.course}
                  </span>
                  <span className="text-sm font-medium" style={{color:'var(--text-secondary)'}}>
                    {COURSE_LABELS[slot.course] ?? slot.course} · {slot.section}
                  </span>
                </div>
              )}

              {/* Current team */}
              {myTeam && (
                <div className="card flex items-center justify-between gap-4"
                  style={{border:`2px solid ${myTeam.isIndividual?'#BFDBFE':'#BBF7D0'}`,
                    background:myTeam.isIndividual?'#EFF6FF':'#F0FDF4'}}>
                  <div className="flex items-center gap-3">
                    {myTeam.isIndividual
                      ? <User className="w-6 h-6 shrink-0" style={{color:'#2563EB'}}/>
                      : <Users className="w-6 h-6 shrink-0" style={{color:'#16A34A'}}/>}
                    <div className="flex-1 min-w-0">
                      {renaming === slot.course ? (
                        <div className="flex gap-2 items-center">
                          <input className="flex-1 px-2 py-1 rounded border text-sm focus:outline-none"
                            style={{borderColor:'#5B4BD4'}}
                            value={renameName} onChange={e=>setRenameName(e.target.value)}
                            onKeyDown={e=>e.key==='Enter'&&renameTeam(myTeam.id,slot.course)}
                            autoFocus placeholder="New team name…"/>
                          <button onClick={()=>renameTeam(myTeam.id,slot.course)} disabled={renameSaving}
                            className="text-xs px-2 py-1 rounded font-medium text-white disabled:opacity-40"
                            style={{background:'#5B4BD4'}}>
                            {renameSaving?'…':'Save'}
                          </button>
                          <button onClick={()=>{setRenaming(null);setRenameName('')}}
                            className="text-xs px-2 py-1 rounded" style={{color:'#6B7280'}}>✕</button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="font-semibold" style={{color:myTeam.isIndividual?'#1E3A8A':'#14532D'}}>
                            {myTeam.isIndividual ? 'Individual project (1 member)' : myTeam.name}
                          </p>
                          {(myTeam.role === 'Team Lead' || myTeam.role === 'Individual') && (
                            <button onClick={()=>{setRenaming(slot.course);setRenameName(myTeam.name)}}
                              className="text-xs px-1.5 py-0.5 rounded"
                              style={{color:'#6B7280',border:'1px solid #E5E7EB'}}>✏</button>
                          )}
                        </div>
                      )}
                      <p className="text-xs mt-0.5" style={{color:'#6B7280'}}>
                        {myTeam.isIndividual
                          ? 'Working independently — only you, no one can join'
                          : `${myTeam.memberCount} of 5 members · ${myTeam.role} · Others can still join until full`}
                      </p>
                    </div>
                  </div>
                  <button onClick={()=>act('leave',slot.course)} disabled={saving}
                    className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg shrink-0 disabled:opacity-40"
                    style={{border:'1px solid #D1D5DB',background:'white',color:'#6B7280',cursor:'pointer'}}>
                    <LogOut className="w-3.5 h-3.5"/> Leave
                  </button>
                </div>
              )}

              {/* Options */}
              {!myTeam && (
                <div className="grid grid-cols-3 gap-4">
                  <div className="card cursor-pointer hover:shadow-md transition-shadow text-center space-y-2"
                    style={{border:`2px dashed ${c.badge}`,background:c.bg}}
                    onClick={()=>setShowCreate(slot.course)}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{background:c.badge}}>
                      <Plus className="w-6 h-6 text-white"/>
                    </div>
                    <p className="font-semibold text-sm" style={{color:c.text}}>Create a Team</p>
                    <p className="text-xs" style={{color:'var(--text-secondary)'}}>
                      Start a 5-member group team. You are Team Lead — 4 others can join.
                    </p>
                  </div>

                  <div className="card cursor-pointer hover:shadow-md transition-shadow text-center space-y-2"
                    style={{border:'2px dashed #16A34A',background:'#F0FDF4'}}
                    onClick={()=>{ setActiveCourse(slot.course); document.getElementById('open-teams')?.scrollIntoView({behavior:'smooth'}) }}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{background:'#16A34A'}}>
                      <LogIn className="w-6 h-6 text-white"/>
                    </div>
                    <p className="font-semibold text-sm" style={{color:'#15803D'}}>Join a Team</p>
                    <p className="text-xs" style={{color:'var(--text-secondary)'}}>
                      Browse open {slot.course} teams below. Join one that has fewer than 5 members.
                    </p>
                  </div>

                  <div className="card cursor-pointer hover:shadow-md transition-shadow text-center space-y-2"
                    style={{border:'2px dashed #2563EB',background:'#EFF6FF'}}
                    onClick={()=>setShowCreate('__IND__'+slot.course)}>
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto" style={{background:'#2563EB'}}>
                      <User className="w-6 h-6 text-white"/>
                    </div>
                    <p className="font-semibold text-sm" style={{color:'#1D4ED8'}}>Go Individual</p>
                    <p className="text-xs" style={{color:'var(--text-secondary)'}}>
                      1-member project — <strong>only you</strong>. No one else can join.
                    </p>
                  </div>
                </div>
              )}

              {/* Create group team form */}
              {showCreate === slot.course && !myTeam && (
                <div className="card space-y-3" style={{border:`1px solid ${c.badge}`}}>
                  <div>
                    <p className="font-semibold text-sm">Create a {slot.course} group team</p>
                    <p className="text-xs mt-0.5" style={{color:'var(--text-secondary)'}}>
                      You will be Team Lead. Share the team name with 4 classmates so they can find and join it below.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <input className="flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none"
                      style={{borderColor:'var(--border-default)'}}
                      placeholder="Team name (e.g. VentureX, AgriConnect…)"
                      value={newName} onChange={e=>setNewName(e.target.value)}
                      onKeyDown={e=>e.key==='Enter'&&newName.trim()&&act('create',slot.course,undefined,newName)}/>
                    <button disabled={saving||!newName.trim()} onClick={()=>act('create',slot.course,undefined,newName)}
                      className="btn-primary disabled:opacity-40">
                      {saving?'Creating…':'Create'}
                    </button>
                    <button onClick={()=>setShowCreate(null)} className="btn-secondary">Cancel</button>
                  </div>
                </div>
              )}

              {/* Individual project name form */}
              {showCreate === '__IND__'+slot.course && !myTeam && (
                <div className="card space-y-3" style={{border:'1px solid #2563EB',background:'#EFF6FF'}}>
                  <div>
                    <p className="font-semibold text-sm" style={{color:'#1D4ED8'}}>Name your individual project</p>
                    <p className="text-xs mt-0.5" style={{color:'var(--text-secondary)'}}>
                      This is a 1-member project — only you. Give it a name that reflects your venture idea.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <input className="flex-1 px-3 py-2 rounded-lg border text-sm focus:outline-none"
                      style={{borderColor:'#2563EB'}}
                      placeholder="Project name (e.g. SoloVenture, MyStartup…)"
                      value={newName} onChange={e=>setNewName(e.target.value)}
                      onKeyDown={e=>e.key==='Enter'&&newName.trim()&&act('individual',slot.course,undefined,newName)}/>
                    <button disabled={saving||!newName.trim()} onClick={()=>act('individual',slot.course,undefined,newName)}
                      className="btn-primary disabled:opacity-40" style={{background:'#2563EB'}}>
                      {saving?'Creating…':'Confirm'}
                    </button>
                    <button onClick={()=>setShowCreate(null)} className="btn-secondary">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Open teams browser */}
        <div id="open-teams" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="font-semibold">
                Open Teams
                {activeCourse && <span className="ml-2 text-sm font-normal" style={{color:'var(--text-muted)'}}>— {activeCourse}</span>}
              </h2>
              <p className="text-xs mt-0.5" style={{color:'var(--text-muted)'}}>Teams with fewer than 5 members that you can join</p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isMultiCourse && (
                <div className="flex gap-1">
                  {slots.map(s=>{
                    const c = CC[s.course] ?? fallbackCC
                    return (
                      <button key={s.course}
                        onClick={()=>{ setActiveCourse(s.course); load(s.course) }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                        style={{
                          background:activeCourse===s.course?c.badge:'white',
                          color:activeCourse===s.course?'white':c.text,
                          borderColor:c.badge
                        }}>
                        {s.course}
                      </button>
                    )
                  })}
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{color:'var(--text-muted)'}}/>
                <input className="pl-8 pr-3 py-1.5 text-sm rounded-lg border" style={{borderColor:'var(--border-default)'}}
                  placeholder="Search teams…" value={search} onChange={e=>setSearch(e.target.value)}/>
              </div>
              <div className="flex rounded-lg border overflow-hidden text-sm" style={{borderColor:'var(--border-default)'}}>
                <button onClick={()=>setScope('section')} className="px-3 py-1.5 transition-colors"
                  style={{background:scope==='section'?'var(--dvl-purple)':'transparent',color:scope==='section'?'white':'var(--text-secondary)'}}>
                  My section
                </button>
                <button onClick={()=>setScope('all')} className="px-3 py-1.5 transition-colors"
                  style={{background:scope==='all'?'var(--dvl-purple)':'transparent',color:scope==='all'?'white':'var(--text-secondary)'}}>
                  All sections
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-sm" style={{color:'var(--text-muted)'}}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="card text-center py-12 space-y-1">
              <p className="font-medium" style={{color:'var(--text-muted)'}}>No open teams found</p>
              <p className="text-xs" style={{color:'var(--text-muted)'}}>
                {scope==='section'?'Try "All sections" or create your own team.':'Be the first to create one!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filtered.map(t=>{
                const isFull = t.memberCount >= 5
                const alreadyInCourse = !!myTeams[t.course]
                const c = CC[t.course] ?? fallbackCC
                return (
                  <div key={t.id} className="card hover:shadow-md transition-shadow" style={{opacity:isFull?0.7:1}}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{background:c.badge}}>{t.course}</span>
                          <h3 className="font-semibold text-sm truncate">{t.name}</h3>
                        </div>
                        {t.ventureName && <p className="text-xs truncate" style={{color:'var(--dvl-purple)'}}>{t.ventureName}</p>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-sm" style={{color:'var(--text-secondary)'}}>
                        <Users className="w-4 h-4"/>
                        <span className="font-medium">{t.memberCount}/5</span>
                        {t.members.filter(Boolean).length>0 && (
                          <span className="text-xs" style={{color:'var(--text-muted)'}}>
                            · {t.members.filter(Boolean).slice(0,2).join(', ')}{t.memberCount>2?'…':''}
                          </span>
                        )}
                      </div>
                      {isFull ? (
                        <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{background:'#FEE2E2',color:'#DC2626'}}>Full</span>
                      ) : alreadyInCourse ? (
                        <span className="text-xs" style={{color:'var(--text-muted)'}}>Already in {t.course} team</span>
                      ) : (
                        <button disabled={saving} onClick={()=>act('join',t.course,t.id)}
                          className="text-sm px-3 py-1.5 rounded-lg font-medium text-white disabled:opacity-40"
                          style={{background:'#16A34A',cursor:'pointer'}}>
                          Join
                        </button>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {Array.from({length:5}).map((_,i)=>(
                        <div key={i} className="h-1.5 flex-1 rounded-full"
                          style={{background:i<t.memberCount?c.badge:'var(--surface-raised)'}}/>
                      ))}
                    </div>
                    <p className="text-xs mt-1" style={{color:'var(--text-muted)'}}>
                      {5-t.memberCount} spot{5-t.memberCount!==1?'s':''} remaining
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 flex items-center gap-2 text-sm px-4 py-3 rounded-xl shadow-lg z-50 text-white"
          style={{background:toast.type==='ok'?'#16A34A':'#DC2626',maxWidth:360}}>
          {toast.type==='ok'
            ?<CheckCircle2 className="w-4 h-4 shrink-0"/>
            :<AlertCircle className="w-4 h-4 shrink-0"/>}
          {toast.msg}
        </div>
      )}
    </div>
  )
}
