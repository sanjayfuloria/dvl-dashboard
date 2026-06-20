'use client'
import { useState, useEffect, useMemo } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Users, Search, UserCheck, UserX, RefreshCw } from 'lucide-react'
type S={id:string;userId:string;name:string|null;email:string;enrollNo:string|null;section:string|null;dvlCourse:string|null;team:{id:string;name:string;course:string}|null;teamRole:string|null}
type T={id:string;name:string;course:string}
export default function Page(){
  const [students,setStudents]=useState<S[]>([])
  const [teams,setTeams]=useState<T[]>([])
  const [loading,setLoading]=useState(true)
  const [search,setSearch]=useState('')
  const [fSec,setFSec]=useState('ALL')
  const [fTeam,setFTeam]=useState('ALL')
  const [assigning,setAssigning]=useState<string|null>(null)
  const [selTeam,setSelTeam]=useState<Record<string,string>>({})
  const [saving,setSaving]=useState<string|null>(null)
  const [toast,setToast]=useState<string|null>(null)
  const showToast=(m:string)=>{setToast(m);setTimeout(()=>setToast(null),3000)}
  async function load(){
    setLoading(true)
    const [sr,tr]=await Promise.all([fetch('/dvl/api/admin/students'),fetch('/dvl/api/admin/teams')])
    if(sr.ok)setStudents(await sr.json())
    if(tr.ok){const d=await tr.json();setTeams((d.teams??d).filter((t:T)=>!t.name.startsWith('__INDIVIDUAL__')))}
    setLoading(false)
  }
  useEffect(()=>{load()},[])
  const sections=useMemo(()=>['ALL',...Array.from(new Set(students.map(s=>s.section).filter(Boolean)as string[])).sort()],[students])
  const filtered=useMemo(()=>students.filter(s=>{
    const q=search.toLowerCase()
    return(!q||s.name?.toLowerCase().includes(q)||s.email.includes(q)||(s.enrollNo??'').includes(q))
      &&(fSec==='ALL'||s.section===fSec)
      &&(fTeam==='ALL'?true:fTeam==='assigned'?!!s.team:!s.team)
  }),[students,search,fSec,fTeam])
  async function assign(sid:string,tid:string){
    setSaving(sid)
    const r=await fetch('/dvl/api/admin/students/assign',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({studentProfileId:sid,teamId:tid})})
    showToast(r.ok?'Assigned!':'Failed');if(r.ok)await load();setSaving(null);setAssigning(null)
  }
  async function remove(sid:string){
    setSaving(sid)
    await fetch('/dvl/api/admin/students/assign',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({studentProfileId:sid})})
    showToast('Removed');await load();setSaving(null)
  }
  const sc:Record<string,string>={'MDT-A':'bg-violet-100 text-violet-800','MPB-A':'bg-blue-100 text-blue-800','MPB-B':'bg-cyan-100 text-cyan-800','B2B-B':'bg-amber-100 text-amber-800'}
  const stats={total:students.length,assigned:students.filter(s=>s.team&&!s.team.name.startsWith('__INDIVIDUAL__')).length,individual:students.filter(s=>s.team?.name.startsWith('__INDIVIDUAL__')).length,unassigned:students.filter(s=>!s.team).length}
  return(
    <div className="space-y-6">
      <PageHeader title="Student Roster" subtitle={`AY 2026-27 · Semester 3 · ${stats.total} students`} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {([['Total',stats.total,'text-gray-900'],['In a Team',stats.assigned,'text-green-600'],['Individual',stats.individual,'text-blue-600'],['Unassigned',stats.unassigned,'text-amber-600']]as[string,number,string][]).map(([l,v,c])=>(
          <div key={l} className="bg-white rounded-xl border border-gray-100 p-4"><p className="text-xs text-gray-500 uppercase tracking-wide font-medium">{l}</p><p className={`text-3xl font-bold mt-1 ${c}`}>{v}</p></div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/><input className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="Search name, email, enrol no…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <select className="px-3 py-2 rounded-lg border border-gray-200 text-sm" value={fSec} onChange={e=>setFSec(e.target.value)}>{sections.map(s=><option key={s} value={s}>{s==='ALL'?'All Sections':s}</option>)}</select>
        <select className="px-3 py-2 rounded-lg border border-gray-200 text-sm" value={fTeam} onChange={e=>setFTeam(e.target.value)}><option value="ALL">All students</option><option value="assigned">In a team</option><option value="unassigned">Unassigned</option></select>
        <button onClick={load} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50"><RefreshCw className="w-4 h-4 text-gray-500"/></button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {loading?<div className="p-12 text-center text-gray-400 text-sm">Loading…</div>:filtered.length===0?<div className="p-12 text-center text-gray-400 text-sm">No students match.</div>:(
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 bg-gray-50">{['Student','Enrol No','Section','Team','Actions'].map(h=><th key={h} className="text-left px-4 py-3 font-medium text-gray-500 text-xs uppercase tracking-wide">{h}</th>)}</tr></thead>
            <tbody>{filtered.map((s,i)=>{
              const isInd=s.team?.name.startsWith('__INDIVIDUAL__')
              return(<tr key={s.id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${i%2?'bg-gray-50/30':''}`}>
                <td className="px-4 py-3"><p className="font-medium text-gray-900">{s.name??'—'}</p><p className="text-xs text-gray-400">{s.email}</p></td>
                <td className="px-4 py-3 text-gray-600 font-mono text-xs">{s.enrollNo??'—'}</td>
                <td className="px-4 py-3">{s.section?<span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${sc[s.section]??'bg-gray-100 text-gray-700'}`}>{s.section}</span>:'—'}</td>
                <td className="px-4 py-3">{isInd?<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700"><UserCheck className="w-3 h-3"/>Individual</span>:s.team?<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700"><Users className="w-3 h-3"/>{s.team.name}</span>:<span className="text-xs text-gray-400 italic">Unassigned</span>}</td>
                <td className="px-4 py-3">{assigning===s.id?(<div className="flex items-center gap-2"><select className="text-xs px-2 py-1 rounded border border-gray-200" value={selTeam[s.id]??''} onChange={e=>setSelTeam(p=>({...p,[s.id]:e.target.value}))}><option value="">— pick team —</option>{teams.map(t=><option key={t.id} value={t.id}>{t.name} ({t.course})</option>)}</select><button disabled={!selTeam[s.id]||saving===s.id} onClick={()=>assign(s.id,selTeam[s.id])} className="text-xs px-2 py-1 bg-violet-600 text-white rounded disabled:opacity-40">{saving===s.id?'…':'Assign'}</button><button onClick={()=>setAssigning(null)} className="text-xs px-2 py-1 border border-gray-200 rounded">Cancel</button></div>):(<div className="flex items-center gap-2"><button onClick={()=>setAssigning(s.id)} className="text-xs px-3 py-1 border border-violet-200 text-violet-700 rounded hover:bg-violet-50">{s.team?'Reassign':'Assign Team'}</button>{s.team&&<button disabled={saving===s.id} onClick={()=>remove(s.id)} className="text-xs px-2 py-1 border border-red-200 text-red-500 rounded hover:bg-red-50 disabled:opacity-40"><UserX className="w-3 h-3"/></button>}</div>)}</td>
              </tr>)
            })}</tbody>
          </table></div>
        )}
      </div>
      {toast&&<div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg z-50">{toast}</div>}
    </div>
  )
}
