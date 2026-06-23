'use client'
import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Copy, Plus, Loader2, ExternalLink } from 'lucide-react'

type Team={id:string;name:string;ventureName:string|null;course:string;currentPhase:string;progressPct:number;members:{student:{user:{name:string|null}}}[];shortlist?:{status:string;notes:string|null;rank:number|null}|null;facultyGuide?:{user:{name:string|null}}|null}
type Jury={id:string;name:string;email:string;organisation:string|null;designation:string|null;round:string;token:string}
type Slot={id:string;teamId:string;round:string;slotTime:string|null;room:string|null;order:number;team:{name:string;ventureName:string|null};scores:any[]}
type DemoDay={id:string;title:string;date:string;venue:string|null;status:string;slots:Slot[];jury:Jury[]}
const SC:Record<string,string>={PENDING:'bg-gray-100 text-gray-600',SHORTLISTED:'bg-green-100 text-green-700',NOT_SHORTLISTED:'bg-red-100 text-red-600',FINALIST:'bg-violet-100 text-violet-700'}

export default function DemoDayPage(){
  const [demoDay,setDemoDay]=useState<DemoDay|null>(null)
  const [teams,setTeams]=useState<Team[]>([])
  const [loading,setLoading]=useState(true)
  const [tab,setTab]=useState<'overview'|'shortlist'|'slots'|'jury'|'leaderboard'>('overview')
  const [toast,setToast]=useState('')
  const [creating,setCreating]=useState(false)
  const [form,setForm]=useState({title:'DVL Demo Day 2026',date:'',venue:''})
  const [juryForm,setJuryForm]=useState({name:'',email:'',organisation:'',designation:'',round:'ROUND_1'})

  const showToast=(m:string)=>{setToast(m);setTimeout(()=>setToast(''),3500)}

  async function load(){
    try {
      const [dd,tm]=await Promise.all([
        fetch('/dvl/api/demo-day').then(r=>r.json()),
        fetch('/dvl/api/demo-day/shortlist').then(r=>r.json())
      ])
      setDemoDay(dd&&dd.id?dd:null)
      setTeams(Array.isArray(tm)?tm:[])
    } catch(e) { console.error(e) }
    setLoading(false)
  }
  useEffect(()=>{load()},[])

  async function createDemoDay(){
    if(!form.date){showToast('Please set a date');return}
    setCreating(true)
    const res=await fetch('/dvl/api/demo-day',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
    if(res.ok){await load();showToast('Demo Day created!')}
    setCreating(false)
  }

  async function updateStatus(status:string){
    await fetch('/dvl/api/demo-day',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:demoDay!.id,status})})
    await load()
  }

  async function setShortlist(teamId:string,status:string){
    await fetch('/dvl/api/demo-day/shortlist',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({teamId,status})})
    await load()
  }

  async function addSlot(teamId:string,round:string){
    await fetch('/dvl/api/demo-day/slots',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({demoDayId:demoDay!.id,teamId,round,order:0})})
    await load();showToast('Slot added')
  }

  async function removeSlot(id:string){
    await fetch('/dvl/api/demo-day/slots',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})
    await load()
  }

  async function addJury(){
    if(!juryForm.name||!juryForm.email){showToast('Name and email required');return}
    const res=await fetch('/dvl/api/demo-day/jury',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...juryForm,demoDayId:demoDay!.id})})
    const data=await res.json()
    await load()
    if(data.scoringUrl){navigator.clipboard.writeText(data.scoringUrl).catch(()=>{});showToast('Jury added! Scoring link copied to clipboard')}
    setJuryForm({name:'',email:'',organisation:'',designation:'',round:'ROUND_1'})
  }

  async function removeJury(id:string){
    await fetch('/dvl/api/demo-day/jury',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({id})})
    await load()
  }

  const leaderboard=(demoDay?.slots||[])
    .filter(s=>s.scores&&s.scores.length>0)
    .map(s=>({...s,avgScore:s.scores.reduce((a:number,sc:any)=>a+(sc.totalScore??0),0)/s.scores.length}))
    .sort((a,b)=>b.avgScore-a.avgScore)

  const shortlisted=teams.filter(t=>['SHORTLISTED','FINALIST'].includes(t.shortlist?.status??''))
  const finalists=teams.filter(t=>t.shortlist?.status==='FINALIST')
  const allTeams=teams.filter(t=>!t.name.startsWith('__INDIVIDUAL__'))

  if(loading) return(
    <div className="page-enter">
      <div className="page-body flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin" style={{color:'var(--dvl-purple)'}}/>
      </div>
    </div>
  )

  return(
    <div className="page-enter">
      <PageHeader
        title="Demo Day"
        subtitle={demoDay
          ? demoDay.title+' · '+new Date(demoDay.date).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})
          : 'Plan and run your Demo Day'}
        actions={demoDay&&(
          <select className="px-3 py-1.5 text-sm rounded-lg border" style={{borderColor:'var(--border-default)'}}
            value={demoDay.status} onChange={e=>updateStatus(e.target.value)}>
            {['DRAFT','SCHEDULED','IN_PROGRESS','COMPLETED'].map(s=>(
              <option key={s} value={s}>{s.replace('_',' ')}</option>
            ))}
          </select>
        )}
      />

      <div className="page-body space-y-6">

        {/* Create event */}
        {!demoDay&&(
          <div className="card space-y-4">
            <h3 className="font-semibold">Create Demo Day event</h3>
            <p className="text-sm" style={{color:'var(--text-secondary)'}}>Set up your Demo Day. You can shortlist teams, schedule slots, and add jury members after creating the event.</p>
            <div className="grid grid-cols-3 gap-3">
              <input className="px-3 py-2 rounded-lg border text-sm" style={{borderColor:'var(--border-default)'}}
                placeholder="Event title" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
              <input type="datetime-local" className="px-3 py-2 rounded-lg border text-sm" style={{borderColor:'var(--border-default)'}}
                value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/>
              <input className="px-3 py-2 rounded-lg border text-sm" style={{borderColor:'var(--border-default)'}}
                placeholder="Venue (optional)" value={form.venue} onChange={e=>setForm(f=>({...f,venue:e.target.value}))}/>
            </div>
            <button onClick={createDemoDay} disabled={creating} className="btn-primary flex items-center gap-2">
              {creating?<Loader2 className="w-4 h-4 animate-spin"/>:<Plus className="w-4 h-4"/>}
              Create Demo Day
            </button>
          </div>
        )}

        {demoDay&&(<>
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              {label:'Total teams',val:allTeams.length,color:'text-gray-900'},
              {label:'Shortlisted',val:shortlisted.length,color:'text-green-600'},
              {label:'Finalists',val:finalists.length,color:'text-violet-600'},
              {label:'Scores submitted',val:(demoDay.slots||[]).reduce((a,s)=>a+(s.scores?.length||0),0),color:'text-amber-600'},
            ].map(s=>(
              <div key={s.label} className="card p-4">
                <p className="text-xs uppercase tracking-wide font-medium" style={{color:'var(--text-muted)'}}>{s.label}</p>
                <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.val}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b" style={{borderColor:'var(--border-default)'}}>
            {(['overview','shortlist','slots','jury','leaderboard'] as const).map(t=>(
              <button key={t} onClick={()=>setTab(t)}
                className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${tab===t?'border-b-2':'opacity-60'}`}
                style={tab===t?{borderColor:'var(--dvl-purple)',color:'var(--dvl-purple)'}:{}}>
                {t}
                {t==='shortlist'&&shortlisted.length>0&&<span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold text-white" style={{background:'var(--dvl-purple)'}}>{shortlisted.length}</span>}
                {t==='jury'&&(demoDay.jury||[]).length>0&&<span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-bold text-white" style={{background:'var(--dvl-purple)'}}>{(demoDay.jury||[]).length}</span>}
              </button>
            ))}
          </div>

          {/* Overview */}
          {tab==='overview'&&(
            <div className="space-y-4">
              <div className="card space-y-4">
                <h3 className="font-semibold">Event details</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide mb-1" style={{color:'var(--text-muted)'}}>Date & Time</p>
                    <p className="font-medium">{new Date(demoDay.date).toLocaleString('en-IN',{dateStyle:'full',timeStyle:'short'})}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide mb-1" style={{color:'var(--text-muted)'}}>Venue</p>
                    <p className="font-medium">{demoDay.venue||'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide mb-1" style={{color:'var(--text-muted)'}}>Status</p>
                    <p className="font-medium">{demoDay.status.replace(/_/g,' ')}</p>
                  </div>
                </div>
              </div>
              <div className="card space-y-3">
                <h3 className="font-semibold">Quick guide</h3>
                {[
                  {n:'1',label:'Shortlist tab',desc:'Mark teams as Shortlisted — they get an in-app notification'},
                  {n:'2',label:'Slots tab',desc:'Add shortlisted teams to Round 1, assign time and room. After Round 1, promote top teams to Finals.'},
                  {n:'3',label:'Jury tab',desc:'Add external jury members — each gets a unique scoring link. Copy and send via WhatsApp or email.'},
                  {n:'4',label:'Leaderboard tab',desc:'Live rankings update as jury scores come in. Visible to all after the event.'},
                ].map(s=>(
                  <div key={s.n} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5" style={{background:'var(--dvl-purple)'}}>{s.n}</div>
                    <div><p className="text-sm font-semibold">{s.label}</p><p className="text-xs mt-0.5" style={{color:'var(--text-secondary)'}}>{s.desc}</p></div>
                  </div>
                ))}
                <div className="pt-2 border-t" style={{borderColor:'var(--border-default)'}}>
                  <p className="text-sm font-medium mb-1">Public showcase</p>
                  <a href="https://www.sanjayfuloria.tech/dvl-showcase" target="_blank"
                    className="text-sm flex items-center gap-1 hover:underline" style={{color:'var(--dvl-purple)'}}>
                    <ExternalLink className="w-3.5 h-3.5"/> sanjayfuloria.tech/dvl-showcase
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Shortlist */}
          {tab==='shortlist'&&(
            <div className="card overflow-hidden p-0">
              <table className="data-table">
                <thead>
                  <tr><th>Team</th><th>Course</th><th>Phase</th><th>Members</th><th>Faculty</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {allTeams.length===0&&(
                    <tr><td colSpan={7} className="text-center py-10" style={{color:'var(--text-muted)'}}>No teams found</td></tr>
                  )}
                  {allTeams.map(t=>{
                    const st=t.shortlist?.status??'PENDING'
                    return(
                      <tr key={t.id}>
                        <td>
                          <p className="font-medium text-sm">{t.ventureName??t.name}</p>
                          <p className="text-xs" style={{color:'var(--text-muted)'}}>{t.name}</p>
                        </td>
                        <td><span className="tag tag-gray text-xs">{t.course}</span></td>
                        <td className="text-xs">{t.currentPhase}</td>
                        <td className="text-xs">{t.members.length}</td>
                        <td className="text-xs">{t.facultyGuide?.user.name??'—'}</td>
                        <td>
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${SC[st]??''}`}>
                            {st.replace(/_/g,' ')}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-1 flex-wrap">
                            {!['SHORTLISTED','FINALIST'].includes(st)&&(
                              <button onClick={()=>setShortlist(t.id,'SHORTLISTED')}
                                className="text-xs px-2 py-1 rounded bg-green-50 text-green-700 hover:bg-green-100">
                                Shortlist
                              </button>
                            )}
                            {st==='SHORTLISTED'&&(
                              <button onClick={()=>setShortlist(t.id,'FINALIST')}
                                className="text-xs px-2 py-1 rounded text-white hover:opacity-80"
                                style={{background:'var(--dvl-purple)'}}>
                                → Finals
                              </button>
                            )}
                            {['SHORTLISTED','FINALIST'].includes(st)&&(
                              <button onClick={()=>setShortlist(t.id,'NOT_SHORTLISTED')}
                                className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100">
                                Remove
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Slots */}
          {tab==='slots'&&(
            <div className="space-y-6">
              {(['ROUND_1','FINAL'] as const).map(round=>{
                const rs=(demoDay.slots||[]).filter(s=>s.round===round)
                const eligible=round==='ROUND_1'?shortlisted:finalists
                return(
                  <div key={round} className="card">
                    <h3 className="font-semibold mb-1">
                      {round==='ROUND_1'?'Round 1 — Shortlist Pitches':'Finals'}
                      <span className="tag tag-gray font-normal text-xs ml-2">{rs.length} slots</span>
                    </h3>
                    <p className="text-xs mb-4" style={{color:'var(--text-muted)'}}>
                      {round==='ROUND_1'?'Shortlist teams first, then add them here':'Promote teams to Finalist in the Shortlist tab, then add them here'}
                    </p>
                    {rs.length>0&&(
                      <div className="space-y-2 mb-4">
                        {rs.map((sl,i)=>(
                          <div key={sl.id} className="flex items-center gap-3 p-3 rounded-lg" style={{background:'var(--surface-raised)'}}>
                            <span className="text-xs font-mono w-4 text-center shrink-0" style={{color:'var(--text-muted)'}}>{i+1}</span>
                            <span className="text-sm font-medium flex-1">{sl.team.ventureName??sl.team.name}</span>
                            <input
                              className="text-xs px-2 py-1 rounded border w-28" style={{borderColor:'var(--border-default)'}}
                              placeholder="10:00 AM" defaultValue={sl.slotTime??''}
                              onBlur={async e=>{
                                await fetch('/dvl/api/demo-day/slots',{method:'POST',headers:{'Content-Type':'application/json'},
                                  body:JSON.stringify({demoDayId:demoDay.id,teamId:sl.teamId,round,slotTime:e.target.value,room:sl.room,order:i})})
                                await load()
                              }}/>
                            <input
                              className="text-xs px-2 py-1 rounded border w-28" style={{borderColor:'var(--border-default)'}}
                              placeholder="Room / Hall" defaultValue={sl.room??''}
                              onBlur={async e=>{
                                await fetch('/dvl/api/demo-day/slots',{method:'POST',headers:{'Content-Type':'application/json'},
                                  body:JSON.stringify({demoDayId:demoDay.id,teamId:sl.teamId,round,slotTime:sl.slotTime,room:e.target.value,order:i})})
                                await load()
                              }}/>
                            <span className="text-xs text-green-600 shrink-0">{sl.scores?.length||0} scores</span>
                            <button onClick={()=>removeSlot(sl.id)} className="text-xs text-red-400 hover:text-red-600 shrink-0">✕</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="border-t pt-3" style={{borderColor:'var(--border-default)'}}>
                      <p className="text-xs mb-2 font-medium" style={{color:'var(--text-muted)'}}>
                        {eligible.length===0
                          ? round==='ROUND_1'?'No shortlisted teams yet — go to Shortlist tab first':'No finalists yet — promote teams in Shortlist tab'
                          : 'Add to this round:'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {eligible.filter(t=>!rs.find(s=>s.teamId===t.id)).map(t=>(
                          <button key={t.id} onClick={()=>addSlot(t.id,round)}
                            className="text-xs px-3 py-1.5 rounded-lg border hover:bg-violet-50 transition-colors"
                            style={{borderColor:'var(--dvl-purple)',color:'var(--dvl-purple)'}}>
                            + {t.ventureName??t.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Jury */}
          {tab==='jury'&&(
            <div className="space-y-4">
              <div className="card space-y-3">
                <h3 className="font-semibold">Add jury member</h3>
                <p className="text-xs" style={{color:'var(--text-secondary)'}}>A unique scoring link is auto-generated for each jury member. Copy it and send via WhatsApp or email — no login needed.</p>
                <div className="grid grid-cols-2 gap-3">
                  <input className="px-3 py-2 rounded-lg border text-sm" style={{borderColor:'var(--border-default)'}}
                    placeholder="Full name *" value={juryForm.name} onChange={e=>setJuryForm(f=>({...f,name:e.target.value}))}/>
                  <input className="px-3 py-2 rounded-lg border text-sm" style={{borderColor:'var(--border-default)'}}
                    placeholder="Email *" value={juryForm.email} onChange={e=>setJuryForm(f=>({...f,email:e.target.value}))}/>
                  <input className="px-3 py-2 rounded-lg border text-sm" style={{borderColor:'var(--border-default)'}}
                    placeholder="Organisation" value={juryForm.organisation} onChange={e=>setJuryForm(f=>({...f,organisation:e.target.value}))}/>
                  <input className="px-3 py-2 rounded-lg border text-sm" style={{borderColor:'var(--border-default)'}}
                    placeholder="Designation" value={juryForm.designation} onChange={e=>setJuryForm(f=>({...f,designation:e.target.value}))}/>
                  <select className="px-3 py-2 rounded-lg border text-sm" style={{borderColor:'var(--border-default)'}}
                    value={juryForm.round} onChange={e=>setJuryForm(f=>({...f,round:e.target.value}))}>
                    <option value="ROUND_1">Round 1</option>
                    <option value="FINAL">Finals</option>
                  </select>
                  <button onClick={addJury} className="btn-primary">Add jury member</button>
                </div>
              </div>

              {(demoDay.jury||[]).length>0&&(
                <div className="card overflow-hidden p-0">
                  <table className="data-table">
                    <thead><tr><th>Name</th><th>Organisation</th><th>Round</th><th>Scoring Link</th><th></th></tr></thead>
                    <tbody>
                      {(demoDay.jury||[]).map(j=>{
                        const url='https://www.sanjayfuloria.tech/dvl/jury/'+j.token
                        return(
                          <tr key={j.id}>
                            <td>
                              <p className="font-medium text-sm">{j.name}</p>
                              <p className="text-xs" style={{color:'var(--text-muted)'}}>{j.email}</p>
                            </td>
                            <td className="text-sm">{j.organisation??'—'}<br/><span className="text-xs" style={{color:'var(--text-muted)'}}>{j.designation}</span></td>
                            <td><span className="tag tag-gray text-xs">{j.round==='ROUND_1'?'Round 1':'Finals'}</span></td>
                            <td>
                              <div className="flex items-center gap-2">
                                <code className="text-xs p-1.5 rounded block truncate max-w-[220px]"
                                  style={{background:'var(--surface-raised)'}}>{url}</code>
                                <button
                                  onClick={()=>{navigator.clipboard.writeText(url).then(()=>showToast('Link copied!')).catch(()=>showToast(url))}}
                                  className="p-1.5 rounded hover:bg-violet-50 shrink-0"
                                  title="Copy link">
                                  <Copy className="w-3.5 h-3.5" style={{color:'var(--dvl-purple)'}}/>
                                </button>
                              </div>
                            </td>
                            <td>
                              <button onClick={()=>removeJury(j.id)} className="text-xs text-red-400 hover:text-red-600">Remove</button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {(demoDay.jury||[]).length===0&&(
                <div className="card text-center py-10" style={{color:'var(--text-muted)'}}>
                  <p className="text-sm font-medium">No jury members added yet</p>
                  <p className="text-xs mt-1">Add jury members above — each gets a unique scoring link</p>
                </div>
              )}
            </div>
          )}

          {/* Leaderboard */}
          {tab==='leaderboard'&&(
            <div className="space-y-4">
              {(['ROUND_1','FINAL'] as const).map(round=>{
                const rb=leaderboard.filter((s:any)=>s.round===round)
                return(
                  <div key={round} className="card">
                    <h3 className="font-semibold mb-4">{round==='ROUND_1'?'Round 1 Rankings':'Finals Rankings'}</h3>
                    {rb.length===0?(
                      <p className="text-sm" style={{color:'var(--text-muted)'}}>
                        No scores yet — {round==='ROUND_1'?'add slots and jury members to get started':'promote finalists and add Finals jury first'}
                      </p>
                    ):(
                      <div className="space-y-2">
                        {rb.map((s:any,i:number)=>(
                          <div key={s.id} className="flex items-center gap-4 p-3 rounded-lg" style={{background:'var(--surface-raised)'}}>
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                              i===0?'bg-yellow-400 text-gray-900':i===1?'bg-gray-400 text-white':i===2?'bg-amber-600 text-white':'bg-gray-100 text-gray-600'
                            }`}>{i+1}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{s.team.ventureName??s.team.name}</p>
                              <p className="text-xs" style={{color:'var(--text-muted)'}}>{s.scores.length} jury score{s.scores.length!==1?'s':''}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-2xl font-bold" style={{color:'var(--dvl-purple)'}}>{s.avgScore.toFixed(1)}</p>
                              <p className="text-xs" style={{color:'var(--text-muted)'}}>/ 10</p>
                            </div>
                            <div style={{width:80}} className="shrink-0">
                              <div className="progress-bar">
                                <div className="progress-fill" style={{width:(s.avgScore/10*100)+'%'}}/>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>)}
      </div>

      {toast&&(
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg z-50 max-w-sm">
          {toast}
        </div>
      )}
    </div>
  )
}
