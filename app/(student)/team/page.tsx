'use client'
import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Users, User, Plus, LogIn, LogOut, Search } from 'lucide-react'
type OT={id:string;name:string;course:string;sector:string|null;ventureName:string|null;memberCount:number;members:(string|null)[]}
type MT={id:string;name:string;isIndividual:boolean;course:string;memberCount:number}
export default function Page(){
  const [myTeam,setMyTeam]=useState<MT|null>(null)
  const [openTeams,setOpenTeams]=useState<OT[]>([])
  const [section,setSection]=useState<string|null>(null)
  const [scope,setScope]=useState<'section'|'all'>('section')
  const [search,setSearch]=useState('')
  const [newName,setNewName]=useState('')
  const [showCreate,setShowCreate]=useState(false)
  const [loading,setLoading]=useState(true)
  const [saving,setSaving]=useState(false)
  const [toast,setToast]=useState<string|null>(null)
  const showToast=(m:string)=>{setToast(m);setTimeout(()=>setToast(null),3500)}
  async function load(){
    setLoading(true)
    const r=await fetch(`/dvl/api/student/teams?scope=${scope}`)
    if(r.ok){const d=await r.json();setMyTeam(d.myTeam);setOpenTeams(d.openTeams);setSection(d.studentSection)}
    setLoading(false)
  }
  useEffect(()=>{load()},[scope])
  async function act(action:string,teamId?:string,teamName?:string){
    setSaving(true)
    const r=await fetch('/dvl/api/student/teams',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,teamId,teamName})})
    const d=await r.json()
    if(r.ok){showToast(action==='join'?'Joined!':action==='create'?'Team created — you are Team Lead!':action==='individual'?'Set as individual.':'Left team.');setShowCreate(false);setNewName('');await load()}
    else showToast(d.error??'Something went wrong')
    setSaving(false)
  }
  const filtered=openTeams.filter(t=>!search||t.name.toLowerCase().includes(search.toLowerCase()))
  return(
    <div className="space-y-6">
      <PageHeader title="Team Selection" subtitle="Choose your project team for the Digital Venture Lab" />
      {myTeam&&(<div className={`rounded-xl border-2 p-5 flex items-start justify-between ${myTeam.isIndividual?'border-blue-200 bg-blue-50':'border-green-200 bg-green-50'}`}>
        <div className="flex items-center gap-3">
          {myTeam.isIndividual?<User className="w-6 h-6 text-blue-600"/>:<Users className="w-6 h-6 text-green-600"/>}
          <div><p className={`font-semibold ${myTeam.isIndividual?'text-blue-900':'text-green-900'}`}>{myTeam.isIndividual?'Individual project':'Team: '+myTeam.name}</p><p className="text-sm text-gray-500 mt-0.5">{myTeam.isIndividual?'You can still join a team before the deadline.':`Course: ${myTeam.course}`}</p></div>
        </div>
        <button onClick={()=>act('leave')} disabled={saving} className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-white text-gray-600 disabled:opacity-40"><LogOut className="w-3.5 h-3.5"/>Leave</button>
      </div>)}
      {!myTeam&&(<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div onClick={()=>setShowCreate(true)} className="cursor-pointer border-2 border-dashed border-violet-200 rounded-xl p-6 hover:border-violet-400 hover:bg-violet-50 transition-all text-center"><Plus className="w-8 h-8 text-violet-400 mx-auto mb-2"/><p className="font-semibold text-violet-700">Create a Team</p><p className="text-sm text-gray-500 mt-1">Start a new team and invite others</p></div>
        <div onClick={()=>document.getElementById('open-teams')?.scrollIntoView({behavior:'smooth'})} className="cursor-pointer border-2 border-dashed border-green-200 rounded-xl p-6 hover:border-green-400 hover:bg-green-50 transition-all text-center"><LogIn className="w-8 h-8 text-green-400 mx-auto mb-2"/><p className="font-semibold text-green-700">Join a Team</p><p className="text-sm text-gray-500 mt-1">Browse open teams below</p></div>
        <div onClick={()=>act('individual')} className="cursor-pointer border-2 border-dashed border-blue-200 rounded-xl p-6 hover:border-blue-400 hover:bg-blue-50 transition-all text-center"><User className="w-8 h-8 text-blue-400 mx-auto mb-2"/><p className="font-semibold text-blue-700">Go Individual</p><p className="text-sm text-gray-500 mt-1">Work on the project by yourself</p></div>
      </div>)}
      {showCreate&&(<div className="bg-white rounded-xl border border-violet-100 p-5 space-y-3"><h3 className="font-semibold text-gray-900">Create a new team</h3><input className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="Team name (e.g. VentureX)" value={newName} onChange={e=>setNewName(e.target.value)}/><div className="flex gap-2"><button disabled={saving||!newName.trim()} onClick={()=>act('create',undefined,newName)} className="px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 disabled:opacity-40">{saving?'Creating…':'Create Team'}</button><button onClick={()=>setShowCreate(false)} className="px-4 py-2 border border-gray-200 text-sm rounded-lg hover:bg-gray-50">Cancel</button></div></div>)}
      <div id="open-teams" className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-semibold text-gray-900">Open Teams</h2>
          <div className="flex items-center gap-2">
            <div className="relative"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"/><input className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
              <button onClick={()=>setScope('section')} className={`px-3 py-1.5 ${scope==='section'?'bg-violet-600 text-white':'hover:bg-gray-50 text-gray-600'}`}>My section ({section})</button>
              <button onClick={()=>setScope('all')} className={`px-3 py-1.5 ${scope==='all'?'bg-violet-600 text-white':'hover:bg-gray-50 text-gray-600'}`}>All sections</button>
            </div>
          </div>
        </div>
        {loading?<div className="text-center text-gray-400 py-12 text-sm">Loading…</div>:filtered.length===0?<div className="text-center text-gray-400 py-12 text-sm">No open teams. {scope==='section'?'Try "All sections".':'Be the first to create one!'}</div>:(
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{filtered.map(t=>(
            <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:border-violet-200 transition-colors">
              <div className="flex items-start justify-between mb-3"><div><h3 className="font-semibold text-gray-900">{t.name}</h3>{t.ventureName&&<p className="text-xs text-violet-600 mt-0.5">{t.ventureName}</p>}</div><span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">{t.course}</span></div>
              {t.sector&&<p className="text-xs text-gray-500 mb-3">Sector: {t.sector}</p>}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sm text-gray-500"><Users className="w-4 h-4"/><span>{t.memberCount}/5</span><span className="text-xs text-gray-400 ml-1">({t.members.filter(Boolean).slice(0,2).join(', ')}{t.memberCount>2?'…':''})</span></div>
                <button disabled={saving||!!myTeam||t.memberCount>=5} onClick={()=>act('join',t.id)} className="text-sm px-3 py-1.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-40">{t.memberCount>=5?'Full':'Join'}</button>
              </div>
              <div className="mt-3 flex gap-1">{Array.from({length:5}).map((_,i)=><div key={i} className={`h-1.5 flex-1 rounded-full ${i<t.memberCount?'bg-violet-400':'bg-gray-100'}`}/>)}</div>
            </div>
          ))}</div>
        )}
      </div>
      {toast&&<div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg z-50">{toast}</div>}
    </div>
  )
}
