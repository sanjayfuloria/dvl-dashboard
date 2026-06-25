'use client'
import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Users, Search, UserX } from 'lucide-react'

type S={id:string;userId:string;name:string|null;email:string;enrollNo:string|null;section:string|null;dvlCourse:string|null;team:{id:string;name:string;course:string}|null;teamRole:string|null}
type T={id:string;name:string;course:string}

const sc:Record<string,string>={
  'MDT-A':'bg-purple-100 text-purple-700',
  'MPB-A':'bg-teal-100 text-teal-700',
  'MPB-B':'bg-blue-100 text-blue-700',
  'B2B-B':'bg-amber-100 text-amber-700',
}

export default function Page(){
  const [students,setStudents]=useState<S[]>([])
  const [teams,setTeams]=useState<T[]>([])
  const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState('')
  const [fSec,setFSec]=useState('ALL')
  const [assigning,setAssigning]=useState<string|null>(null)
  const [selTeam,setSelTeam]=useState<Record<string,string>>({})
  const [saving,setSaving]=useState<string|null>(null)
  const [toast,setToast]=useState('')
  const [editing,setEditing]=useState<S|null>(null)
  const [editForm,setEditForm]=useState({section:'',dvlCourse:'',secondary:''})
  const [editSaving,setEditSaving]=useState(false)
  const [mounted,setMounted]=useState(false)

  useEffect(()=>{ setMounted(true) },[])

  async function load(){
    setLoading(true)
    const [sr,tr]=await Promise.all([fetch('/dvl/api/admin/students').then(r=>r.json()),fetch('/dvl/api/teams').then(r=>r.json())])
    setStudents(sr||[]);setTeams(tr||[]);setLoading(false)
  }
  useEffect(()=>{load()},[])

  const sections=useMemo(()=>['ALL',...Array.from(new Set(students.map(s=>s.section).filter(Boolean) as string[])).sort()],[students])
  const filtered=students.filter(s=>
    (!search||s.name?.toLowerCase().includes(search.toLowerCase())||s.email.toLowerCase().includes(search.toLowerCase())||s.enrollNo?.includes(search))
    &&(fSec==='ALL'||s.section===fSec)
  )

  function showToast(m:string){setToast(m);setTimeout(()=>setToast(''),3000)}

  async function assign(studentId:string,teamId:string){
    setSaving(studentId)
    await fetch('/dvl/api/admin/students/assign',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({studentId,teamId})})
    setSaving(null);setAssigning(null);showToast('Student assigned');load()
  }
  async function remove(studentId:string){
    setSaving(studentId)
    await fetch('/dvl/api/admin/students/assign',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({studentId})})
    setSaving(null);showToast('Student removed from team');load()
  }

  async function saveEdit(){
    if(!editing)return
    setEditSaving(true)
    let secondarySections:{section:string;course:string}[]=[]
    if(editForm.secondary.trim()){
      secondarySections=editForm.secondary.split(',').map(s=>{
        const sec=s.trim().toUpperCase()
        const course=sec.startsWith('MDT')?'MDT':sec.startsWith('MPB')?'MPB':sec.startsWith('B2B')?'B2B':''
        return{section:sec,course}
      }).filter(s=>s.course)
    }
    const res=await fetch('/dvl/api/admin/students',{
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({userId:editing.userId,section:editForm.section,dvlCourse:editForm.dvlCourse,secondarySections})
    })
    setEditSaving(false)
    if(res.ok){setEditing(null);showToast('✓ Student profile updated');load()}
  }

  return(
    <div className="page-enter">
      <PageHeader title="Students" subtitle={`${students.length} students in the programme`}
        actions={<button onClick={load} className="btn-secondary flex items-center gap-2 text-sm"><Users className="w-4 h-4"/>Refresh</button>}/>
      <div className="page-body space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
            <input className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none" placeholder="Search name, email, enrol no…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <select className="px-3 py-2 rounded-lg border border-gray-200 text-sm" value={fSec} onChange={e=>setFSec(e.target.value)}>
            {sections.map(s=><option key={s} value={s}>{s==='ALL'?'All Sections':s}</option>)}
          </select>
          <span className="text-sm text-gray-500">{filtered.length} shown</span>
        </div>

        <div className="card overflow-hidden p-0">
          {loading?(
            <div className="text-center py-12 text-gray-400">Loading…</div>
          ):(
            <table className="data-table">
              <thead>
                <tr>{['Student','Enrol No','Section','Team','Actions'].map(h=>(
                  <th key={h}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.map(s=>(
                  <tr key={s.id}>
                    <td>
                      <p className="font-medium text-sm">{s.name??'—'}</p>
                      <p className="text-xs text-gray-400">{s.email}</p>
                    </td>
                    <td className="text-sm font-mono text-gray-600">{s.enrollNo??'—'}</td>
                    <td>
                      {s.section
                        ?<span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${sc[s.section]??'bg-gray-100 text-gray-700'}`}>{s.section}</span>
                        :'—'}
                    </td>
                    <td>
                      {s.team
                        ?<div><p className="text-sm font-medium">{s.team.name}</p><p className="text-xs text-gray-400">{s.team.course} · {s.teamRole}</p></div>
                        :<span className="text-xs text-gray-400">No team</span>}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Edit section */}
                        <button onClick={()=>{setEditing(s);setEditForm({section:s.section??'',dvlCourse:s.dvlCourse??'',secondary:''})}}
                          className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-600 hover:bg-gray-50">
                          ✏ Edit
                        </button>
                        {/* Assign/reassign team */}
                        {assigning===s.id?(
                          <div className="flex items-center gap-1">
                            <select className="text-xs px-2 py-1 rounded border border-gray-200" value={selTeam[s.id]??''} onChange={e=>setSelTeam(p=>({...p,[s.id]:e.target.value}))}>
                              <option value="">— pick team —</option>
                              {teams.map(t=><option key={t.id} value={t.id}>{t.name} ({t.course})</option>)}
                            </select>
                            <button disabled={!selTeam[s.id]||saving===s.id} onClick={()=>assign(s.id,selTeam[s.id])} className="text-xs px-2 py-1 bg-violet-600 text-white rounded disabled:opacity-40">{saving===s.id?'…':'Assign'}</button>
                            <button onClick={()=>setAssigning(null)} className="text-xs px-2 py-1 border border-gray-200 rounded">✕</button>
                          </div>
                        ):(
                          <button onClick={()=>setAssigning(s.id)} className="text-xs px-2 py-1 border border-violet-200 text-violet-700 rounded hover:bg-violet-50">
                            {s.team?'Reassign':'Assign'}
                          </button>
                        )}
                        {s.team&&(
                          <button disabled={saving===s.id} onClick={()=>remove(s.id)} className="text-xs px-2 py-1 border border-red-200 text-red-500 rounded hover:bg-red-50 disabled:opacity-40">
                            <UserX className="w-3 h-3"/>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {toast&&<div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg z-50">{toast}</div>}

      {editing && mounted && createPortal(
        <div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}
          onClick={e=>{if(e.target===e.currentTarget)setEditing(null)}}>
          <div style={{background:'white',borderRadius:16,padding:28,maxWidth:480,width:'100%',boxShadow:'0 24px 80px rgba(0,0,0,0.25)'}}>
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:4}}>Edit Student Profile</h2>
            <p style={{fontSize:13,color:'#6b7280',marginBottom:20}}>{editing.name} · {editing.email}</p>

            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,fontWeight:600,display:'block',marginBottom:6}}>Primary Section</label>
              <select value={editForm.section} onChange={e=>{
                const sec=e.target.value
                const course=sec.startsWith('MDT')?'MDT':sec.startsWith('MPB')?'MPB':sec.startsWith('B2B')?'B2B':''
                setEditForm(f=>({...f,section:sec,dvlCourse:course}))
              }} style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1px solid #e5e7eb',fontSize:14,boxSizing:'border-box' as any}}>
                <option value="">— select section —</option>
                <option value="MDT-A">MDT-A — Managing Digital Transformation</option>
                <option value="MPB-A">MPB-A — Marketing for Platform Businesses</option>
                <option value="MPB-B">MPB-B — Marketing for Platform Businesses</option>
                <option value="B2B-B">B2B-B — Business-to-Business Marketing</option>
              </select>
            </div>

            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,fontWeight:600,display:'block',marginBottom:4}}>Primary Course (auto-set)</label>
              <input value={editForm.dvlCourse} readOnly style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1px solid #e5e7eb',fontSize:14,background:'#f9fafb',color:'#6b7280',boxSizing:'border-box' as any}}/>
            </div>

            <div style={{marginBottom:20}}>
              <label style={{fontSize:12,fontWeight:600,display:'block',marginBottom:4}}>
                Additional Sections <span style={{fontWeight:400,color:'#9ca3af'}}>(comma-separated, e.g. MPB-A, B2B-B)</span>
              </label>
              <input value={editForm.secondary} onChange={e=>setEditForm(f=>({...f,secondary:e.target.value}))}
                placeholder="e.g. MPB-A  or  MPB-A, B2B-B"
                style={{width:'100%',padding:'8px 12px',borderRadius:8,border:'1px solid #e5e7eb',fontSize:14,boxSizing:'border-box' as any}}/>
              <p style={{fontSize:11,color:'#9ca3af',marginTop:4}}>Leave blank if student is in one section only.</p>
            </div>

            <div style={{display:'flex',gap:12}}>
              <button onClick={()=>setEditing(null)} disabled={editSaving}
                style={{flex:1,padding:'10px',borderRadius:8,border:'1px solid #e5e7eb',background:'white',cursor:'pointer',fontSize:14}}>
                Cancel
              </button>
              <button onClick={saveEdit} disabled={editSaving||!editForm.section}
                style={{flex:1,padding:'10px',borderRadius:8,border:'none',background:'#5B4BD4',color:'white',cursor:editForm.section?'pointer':'not-allowed',fontSize:14,fontWeight:600,opacity:(!editForm.section||editSaving)?0.5:1}}>
                {editSaving?'Saving…':'Save changes'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
