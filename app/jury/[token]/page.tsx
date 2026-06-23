'use client'
import { useState, useEffect } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
const CRITERIA=[{key:'problemSignificance',label:'Problem Significance',desc:'How real, urgent, and large is the problem?'},{key:'productQuality',label:'Product Quality',desc:'How well-built, functional, and polished is the product?'},{key:'aiUtilisation',label:'AI Utilisation',desc:'How effectively and meaningfully is AI used?'},{key:'businessPotential',label:'Business Potential',desc:'How viable, scalable, and differentiated is the business?'}]
export default function JuryScoringPage({params}:{params:Promise<{token:string}>}){
  const [token,setToken]=useState('')
  const [jury,setJury]=useState<any>(null)
  const [demoDay,setDemoDay]=useState<any>(null)
  const [slots,setSlots]=useState<any[]>([])
  const [active,setActive]=useState(0)
  const [scores,setScores]=useState<Record<string,Record<string,number>>>({})
  const [feedback,setFeedback]=useState<Record<string,string>>({})
  const [saving,setSaving]=useState<string|null>(null)
  const [saved,setSaved]=useState<Record<string,boolean>>({})
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  useEffect(()=>{params.then(p=>{setToken(p.token);fetch('/dvl/api/demo-day/score?token='+p.token).then(r=>r.json()).then(d=>{if(d.error){setError(d.error);setLoading(false);return};setJury(d.jury);setDemoDay(d.demoDay);setSlots(d.slots);const sc:any={},fb:any={},sv:any={};d.slots.forEach((s:any)=>{if(s.scores.length>0){const x=s.scores[0];sc[s.id]={problemSignificance:x.problemSignificance??0,productQuality:x.productQuality??0,aiUtilisation:x.aiUtilisation??0,businessPotential:x.businessPotential??0};fb[s.id]=x.feedback??'';sv[s.id]=true}});setScores(sc);setFeedback(fb);setSaved(sv);setLoading(false)}).catch(()=>{setError('Failed to load');setLoading(false)})})},[])
  function setScore(slotId:string,key:string,val:number){setScores(p=>({...p,[slotId]:{...(p[slotId]??{}),[key]:val}}));setSaved(p=>({...p,[slotId]:false}))}
  async function submitScore(slotId:string){setSaving(slotId);const sc=scores[slotId]??{};const res=await fetch('/dvl/api/demo-day/score',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,slotId,feedback:feedback[slotId]??'',...sc})});setSaving(null);if(res.ok)setSaved(p=>({...p,[slotId]:true}))}
  const slot=slots[active];const scored=slots.filter(s=>saved[s.id]).length
  const P='#7c6af7',BG='#0f0f1a',CARD='#1a1a2e',BORDER='#2d2b6e'
  if(loading)return(<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:BG}}><Loader2 className="w-8 h-8 animate-spin" style={{color:P}}/></div>)
  if(error)return(<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:BG,textAlign:'center'}}><div><p style={{fontSize:22,fontWeight:700,color:'#fff',marginBottom:8}}>Invalid link</p><p style={{color:'#a78bfa'}}>{error}</p></div></div>)
  return(<div style={{minHeight:'100vh',background:BG,color:'#f0f0f0',fontFamily:'Arial,sans-serif'}}>
    <div style={{background:CARD,borderBottom:'1px solid '+BORDER,padding:'14px 20px'}}>
      <div style={{maxWidth:680,margin:'0 auto',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div><p style={{fontSize:11,color:P,fontWeight:700,letterSpacing:2,textTransform:'uppercase',margin:0}}>IFHE · Digital Venture Lab</p><p style={{fontSize:16,fontWeight:700,color:'#fff',margin:'2px 0 0'}}>{demoDay?.title}</p></div>
        <div style={{textAlign:'right'}}><p style={{fontSize:12,color:'#a78bfa',margin:0}}>{jury?.name}</p><p style={{fontSize:11,color:'#6b7280',margin:'2px 0 0'}}>{jury?.organisation} · {jury?.round==='ROUND_1'?'Round 1':'Finals'}</p></div>
      </div>
    </div>
    <div style={{maxWidth:680,margin:'0 auto',padding:'20px 16px 80px'}}>
      <div style={{background:CARD,borderRadius:12,padding:'14px 18px',marginBottom:20,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <span style={{fontSize:13,color:'#a78bfa'}}>{scored} of {slots.length} scored</span>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {slots.map((s,i)=>(<button key={s.id} onClick={()=>setActive(i)} style={{width:32,height:32,borderRadius:'50%',border:'none',cursor:'pointer',fontSize:11,fontWeight:700,background:i===active?P:saved[s.id]?'#10b981':BORDER,color:'#fff'}}>{i+1}</button>))}
        </div>
      </div>
      {slot&&(<div>
        <div style={{background:CARD,borderRadius:16,padding:20,marginBottom:16}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
            <div>
              <p style={{fontSize:11,color:P,fontWeight:700,letterSpacing:1.5,textTransform:'uppercase',margin:0}}>Slot {active+1}{slot.slotTime?' · '+slot.slotTime:''}{slot.room?' · '+slot.room:''}</p>
              <p style={{fontSize:22,fontWeight:700,color:'#fff',margin:'4px 0 2px'}}>{slot.team.ventureName??slot.team.name}</p>
              <p style={{fontSize:13,color:'#6b7280',margin:0}}>{slot.team.name} · {slot.team.course}</p>
            </div>
            {saved[slot.id]&&<CheckCircle2 style={{color:'#10b981',width:24,height:24,flexShrink:0}}/>}
          </div>
          {slot.team.problemStatement&&(<div style={{background:BG,borderRadius:8,padding:'10px 14px',marginBottom:10}}><p style={{fontSize:10,color:P,fontWeight:700,textTransform:'uppercase',letterSpacing:1,margin:'0 0 4px'}}>Problem</p><p style={{fontSize:13,color:'#d1d5db',margin:0,lineHeight:1.6}}>{slot.team.problemStatement}</p></div>)}
          {slot.team.aiComponents&&(<div style={{background:BG,borderRadius:8,padding:'10px 14px',marginBottom:10}}><p style={{fontSize:10,color:P,fontWeight:700,textTransform:'uppercase',letterSpacing:1,margin:'0 0 4px'}}>AI Components</p><p style={{fontSize:13,color:'#d1d5db',margin:0}}>{slot.team.aiComponents}</p></div>)}
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:8}}>{slot.team.members.map((m:any,i:number)=>(<span key={i} style={{fontSize:11,background:BORDER,color:'#a78bfa',padding:'3px 10px',borderRadius:20}}>{m.student.user.name??'—'}</span>))}</div>
        </div>
        <div style={{background:CARD,borderRadius:16,padding:20,marginBottom:16}}>
          <p style={{fontSize:14,fontWeight:700,color:'#fff',margin:'0 0 16px'}}>Score this team <span style={{fontSize:11,color:'#6b7280',fontWeight:400}}>1=lowest · 10=highest</span></p>
          {CRITERIA.map(c=>{const val=scores[slot.id]?.[c.key]??0;return(<div key={c.key} style={{marginBottom:20}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'baseline',marginBottom:3}}><p style={{fontSize:13,fontWeight:600,color:'#e5e7eb',margin:0}}>{c.label}</p><span style={{fontSize:24,fontWeight:700,color:val>0?P:'#4b5563',minWidth:28,textAlign:'right'}}>{val>0?val:'—'}</span></div>
            <p style={{fontSize:11,color:'#6b7280',margin:'0 0 8px'}}>{c.desc}</p>
            <div style={{display:'flex',gap:4}}>{[1,2,3,4,5,6,7,8,9,10].map(n=>(<button key={n} onClick={()=>setScore(slot.id,c.key,n)} style={{flex:1,height:38,borderRadius:6,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,background:val===n?P:val>=n?'#3b2ba0':BORDER,color:val>=n?'#fff':'#6b7280',transition:'all 0.1s'}}>{n}</button>))}</div>
          </div>)})}
          {Object.values(scores[slot.id]??{}).filter(Boolean).length===4&&(<div style={{background:BG,borderRadius:8,padding:'10px 14px',marginBottom:16,textAlign:'center'}}><p style={{fontSize:11,color:P,margin:'0 0 2px',textTransform:'uppercase',letterSpacing:1}}>Average Score</p><p style={{fontSize:32,fontWeight:700,color:P,margin:0}}>{(Object.values(scores[slot.id]).reduce((a:number,b:number)=>a+b,0)/4).toFixed(1)}<span style={{fontSize:14,color:'#6b7280'}}> / 10</span></p></div>)}
          <textarea rows={3} placeholder="Feedback for the team (optional)..." value={feedback[slot.id]??''} onChange={e=>{setFeedback(p=>({...p,[slot.id]:e.target.value}));setSaved(p=>({...p,[slot.id]:false}))}} style={{width:'100%',background:BG,border:'1px solid '+BORDER,borderRadius:8,color:'#d1d5db',fontSize:13,padding:'10px 12px',resize:'none',outline:'none',boxSizing:'border-box'}}/>
          <button onClick={()=>submitScore(slot.id)} disabled={saving===slot.id||Object.values(scores[slot.id]??{}).filter(Boolean).length<4} style={{width:'100%',marginTop:12,padding:'14px',borderRadius:10,border:'none',cursor:'pointer',background:saved[slot.id]?'#10b981':P,color:'#fff',fontSize:15,fontWeight:700,opacity:Object.values(scores[slot.id]??{}).filter(Boolean).length<4?0.4:1}}>
            {saving===slot.id?'Saving...':saved[slot.id]?'✓ Saved — update score':'Submit Score'}
          </button>
        </div>
        <div style={{display:'flex',gap:10}}>
          {active>0&&(<button onClick={()=>setActive(a=>a-1)} style={{flex:1,padding:'12px',borderRadius:10,border:'1px solid '+BORDER,background:'transparent',color:'#a78bfa',fontSize:14,cursor:'pointer'}}>← Previous</button>)}
          {active<slots.length-1&&(<button onClick={()=>setActive(a=>a+1)} style={{flex:1,padding:'12px',borderRadius:10,border:'none',background:BORDER,color:'#fff',fontSize:14,cursor:'pointer'}}>Next team →</button>)}
        </div>
      </div>)}
    </div>
  </div>)
}
