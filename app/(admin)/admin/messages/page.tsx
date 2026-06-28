'use client'
import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Send, Users, User, CheckCircle2, AlertCircle, Loader2, Search } from 'lucide-react'

type Student = { id: string; name: string|null; email: string; section: string|null; course: string|null }
const SECTIONS = ['MDT-A','MPB-A','MPB-B','B2B-B']

export default function MessagesPage() {
  const [mode, setMode]         = useState<'individual'|'broadcast'>('individual')
  const [students, setStudents] = useState<Student[]>([])
  const [search, setSearch]     = useState('')
  const [selected, setSelected] = useState<Student|null>(null)
  const [section, setSection]   = useState<string>('all')
  const [subject, setSubject]   = useState('')
  const [body, setBody]         = useState('')
  const [sending, setSending]   = useState(false)
  const [result, setResult]     = useState<{sent:number;failed:number;total:number;errors:string[]}|null>(null)
  const [error, setError]       = useState('')

  useEffect(() => { fetch('/dvl/api/admin/messages').then(r=>r.json()).then(setStudents) }, [])

  const filtered = students.filter(s =>
    !search || s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.section?.toLowerCase().includes(search.toLowerCase())
  )
  const broadcastCount = section === 'all' ? students.length : students.filter(s=>s.section===section).length

  async function handleSend() {
    if (!subject.trim()) { setError('Please enter a subject'); return }
    if (!body.trim())    { setError('Please enter a message'); return }
    if (mode === 'individual' && !selected) { setError('Please select a student'); return }
    setError(''); setSending(true); setResult(null)
    const payload: any = { mode, subject, body }
    if (mode === 'individual') payload.userId = selected!.id
    if (mode === 'broadcast' && section !== 'all') payload.section = section
    const res = await fetch('/dvl/api/admin/messages', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) })
    const data = await res.json()
    setSending(false)
    if (res.ok) { setResult(data); setSubject(''); setBody(''); setSelected(null); setSearch('') }
    else setError(data.error ?? 'Something went wrong')
  }

  return (
    <div className="page-enter">
      <PageHeader title="Messages" subtitle="Send emails to individual students or broadcast to an entire section" />
      <div className="page-body space-y-6">

        {result && (
          <div className="card flex items-start gap-3" style={{background:result.failed===0?'#F0FDF4':'#FEF3C7',border:`1px solid ${result.failed===0?'#BBF7D0':'#FDE68A'}`}}>
            {result.failed===0 ? <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{color:'#16A34A'}}/> : <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{color:'#92400E'}}/>}
            <div>
              <p className="font-semibold text-sm" style={{color:result.failed===0?'#14532D':'#92400E'}}>
                {result.failed===0 ? `✓ All ${result.sent} emails sent successfully` : `${result.sent} sent, ${result.failed} failed out of ${result.total}`}
              </p>
              {result.errors.map((e,i)=><p key={i} className="text-xs mt-0.5" style={{color:'#92400E'}}>{e}</p>)}
            </div>
          </div>
        )}

        <div className="grid grid-cols-5 gap-6">
          <div className="col-span-3 space-y-4">

            <div className="card p-1.5 flex gap-1.5" style={{background:'var(--surface-raised)'}}>
              {(['individual','broadcast'] as const).map(m => (
                <button key={m} onClick={()=>{setMode(m);setResult(null)}}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{background:mode===m?'white':'transparent',color:mode===m?'var(--dvl-purple)':'var(--text-muted)',boxShadow:mode===m?'0 1px 4px rgba(0,0,0,0.1)':'none'}}>
                  {m==='individual'?<User className="w-4 h-4"/>:<Users className="w-4 h-4"/>}
                  {m==='individual'?'Individual':'Broadcast'}
                </button>
              ))}
            </div>

            {mode==='individual' ? (
              <div className="card space-y-3">
                <p className="font-semibold text-sm">Select student</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{color:'var(--text-muted)'}}/>
                  <input className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm focus:outline-none" style={{borderColor:'var(--border-default)'}}
                    placeholder="Search by name, email or section…" value={search} onChange={e=>setSearch(e.target.value)}/>
                </div>
                {selected ? (
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{background:'var(--dvl-purple-dim)',border:'1px solid var(--dvl-purple)'}}>
                    <div>
                      <p className="text-sm font-semibold" style={{color:'var(--dvl-purple)'}}>{selected.name}</p>
                      <p className="text-xs" style={{color:'var(--text-muted)'}}>{selected.email} · {selected.section}</p>
                    </div>
                    <button onClick={()=>{setSelected(null);setSearch('')}} className="text-xs px-2 py-1 rounded" style={{color:'var(--dvl-purple)'}}>✕ Clear</button>
                  </div>
                ) : search && (
                  <div className="border rounded-lg overflow-hidden max-h-52 overflow-y-auto" style={{borderColor:'var(--border-default)'}}>
                    {filtered.length===0 ? (
                      <p className="text-xs text-center py-4" style={{color:'var(--text-muted)'}}>No students found</p>
                    ) : filtered.slice(0,20).map(s=>(
                      <button key={s.id} onClick={()=>{setSelected(s);setSearch('')}}
                        className="w-full text-left px-3 py-2.5 hover:bg-violet-50 border-b last:border-0 transition-colors" style={{borderColor:'var(--border-default)'}}>
                        <p className="text-sm font-medium">{s.name}</p>
                        <p className="text-xs" style={{color:'var(--text-muted)'}}>{s.email} · {s.section}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="card space-y-3">
                <p className="font-semibold text-sm">Select recipients</p>
                <div className="flex gap-2 flex-wrap">
                  {['all',...SECTIONS].map(s=>(
                    <button key={s} onClick={()=>setSection(s)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors"
                      style={{background:section===s?'var(--dvl-purple)':'white',color:section===s?'white':'var(--text-secondary)',borderColor:section===s?'var(--dvl-purple)':'var(--border-default)'}}>
                      {s==='all'?'All students':s}
                    </button>
                  ))}
                </div>
                <p className="text-xs" style={{color:'var(--text-muted)'}}>
                  {broadcastCount} student{broadcastCount!==1?'s':''} will receive this email{section!=='all'?' in '+section:''} · CC: sanjay.fuloria@ibsindia.org
                </p>
              </div>
            )}

            <div className="card space-y-2">
              <label className="text-sm font-semibold">Subject</label>
              <input className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none" style={{borderColor:'var(--border-default)'}}
                placeholder="e.g. DVL Dashboard — Important Update" value={subject} onChange={e=>setSubject(e.target.value)}/>
            </div>

            <div className="card space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold">Message</label>
                <span className="text-xs" style={{color:'var(--text-muted)'}}>Addressed personally to each student</span>
              </div>
              <textarea rows={10} className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none resize-none" style={{borderColor:'var(--border-default)',fontFamily:'inherit',lineHeight:1.7}}
                placeholder={"Type your message here…\n\nFor example:\nPlease log in to the DVL Dashboard and complete your team selection before the deadline.\n\nURL: https://www.sanjayfuloria.tech/dvl"}
                value={body} onChange={e=>setBody(e.target.value)}/>
              <p className="text-xs" style={{color:'var(--text-muted)'}}>
                Greeting ("Dear [Name],") and sign-off are added automatically.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm" style={{background:'#FEE2E2',color:'#DC2626'}}>
                <AlertCircle className="w-4 h-4 shrink-0"/> {error}
              </div>
            )}

            <button onClick={handleSend} disabled={sending}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold disabled:opacity-50">
              {sending
                ? <><Loader2 className="w-4 h-4 animate-spin"/>Sending…</>
                : <><Send className="w-4 h-4"/>
                    {mode==='individual'
                      ? `Send to ${selected?.name ?? 'selected student'}`
                      : `Broadcast to ${broadcastCount} student${broadcastCount!==1?'s':''}`}
                  </>}
            </button>
          </div>

          <div className="col-span-2 space-y-4">
            <div className="card space-y-3">
              <p className="font-semibold text-sm">Email preview</p>
              <div className="rounded-lg overflow-hidden border" style={{borderColor:'var(--border-default)'}}>
                <div style={{background:'linear-gradient(135deg,#3b2ba0,#5B4BD4)',padding:'14px 18px'}}>
                  <p style={{fontSize:9,fontWeight:700,letterSpacing:2,textTransform:'uppercase',color:'#c4b5fd',margin:'0 0 4px'}}>IFHE · Digital Venture Lab</p>
                  <p style={{fontSize:13,fontWeight:800,color:'white',margin:0}}>{subject||'Your subject line'}</p>
                </div>
                <div style={{padding:'14px 18px',background:'white'}}>
                  <p style={{fontSize:11,color:'#374151',margin:'0 0 6px'}}>Dear {mode==='individual'?(selected?.name?.split(' ')[0]??'Student'):'[Student name]'},</p>
                  <p style={{fontSize:11,color:'#374151',whiteSpace:'pre-wrap',margin:'0 0 8px',lineHeight:1.6,maxHeight:120,overflow:'hidden'}}>{body||'Your message will appear here…'}</p>
                  <p style={{fontSize:11,color:'#374151',margin:0}}>Best wishes,<br/><strong>Prof. Sanjay Fuloria</strong></p>
                </div>
                <div style={{background:'#1f2937',padding:'10px 18px',textAlign:'center'}}>
                  <p style={{fontSize:9,color:'#9ca3af',margin:0}}>DVL Dashboard · IFHE Hyderabad · AY 2026-27</p>
                </div>
              </div>
            </div>

            <div className="card space-y-2" style={{background:'var(--dvl-purple-dim)'}}>
              <p className="font-semibold text-sm" style={{color:'var(--dvl-purple)'}}>Tips</p>
              <ul className="space-y-1.5 text-xs" style={{color:'var(--text-secondary)'}}>
                <li>• Greeting and sign-off added automatically</li>
                <li>• CC always goes to sanjay.fuloria@ibsindia.org</li>
                <li>• Individual: password resets, personal follow-ups</li>
                <li>• Broadcast: announcements, deadlines, reminders</li>
                <li>• Filter by section for targeted messages</li>
                <li>• Powered by Google SMTP — no daily send limits</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
