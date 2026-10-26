import { useState } from 'react';
import { Aperture, ArrowUpRight, Play, RotateCcw, Check, Circle, AlertTriangle } from 'lucide-react';
import type { Run } from '../server/hunter';
export default function App() {
  const [hunt,setHunt]=useState<Run|null>(null),[repro,setRepro]=useState<Run|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [showVideo,setShowVideo]=useState(false);
  async function run(kind:'scan'|'reproduce') {
    setBusy(true);setError('');setShowVideo(false);
    if(kind==='scan'){setHunt(null);setRepro(null);}
    const update=kind==='scan'?setHunt:setRepro;
    try {
      const response=await fetch(`/api/${kind}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(kind==='scan'?{}:{runId:hunt?.id})});
      let result=await response.json();if(!response.ok)throw new Error(result.error);
      update(result);
      const end=Date.now()+40_000;
      while(result.state==='running') {
        if(Date.now()>end)throw new Error('Timed out waiting for browser run');
        await new Promise(r=>setTimeout(r,300));
        const poll=await fetch(`/api/runs/${result.id}`);result=await poll.json();if(!poll.ok)throw new Error(result.error);update(result);
      }
      if(result.state==='failed')throw new Error(result.message);
    }catch(e){setError((e as Error).message);}finally{setBusy(false);}
  }
  const issue=hunt?.issue, evidence=repro?.issue || issue;
  return <main><header><div className="brand"><Aperture size={27}/> BugCam <span>/ LAB</span></div><div className="mode"><i/> LOCAL CHROMIUM <span>HEURISTIC · NO MODEL</span></div></header>
    <section className="intro"><div><div className="eyebrow">BROWSER CRASH HUNTER</div><h1>Find the crash.<br/><span>Keep the proof.</span></h1><p>Bounded exploration. A real browser error.<br/>An independently replayed click.</p></div><div className="target"><span className="eyebrow">01 / CONTROLLED ENVIRONMENT</span><h3>Target: Local test site</h3><code>127.0.0.1:5204/fixture/</code><div className="tags"><span>SEEDED BUG FIXTURE</span><span>8 CONTROLS MAX</span><span>30s LIMIT</span></div><button className="primary" disabled={busy} onClick={()=>run('scan')}><Play size={16}/>{busy?'Browser running…':hunt?'Start new hunt':'Start Hunt'}<ArrowUpRight size={18}/></button></div></section>
    {error&&<div role="alert" className="error">{error}</div>}
    <section className="workspace"><div className="timeline panel"><div className="panelhead"><span>EXPLORATION LOG</span><span>{hunt?.attempts.length ?? 0} actions</span></div><div className="timelinebody"><div className="step"><Circle size={16}/><div><strong>Isolated browser session</strong><small>{hunt?new Date(hunt.startedAt).toLocaleTimeString():'Waiting for your first hunt'}</small></div></div>{hunt?.attempts.map((a,i)=><div className={`step ${a.errors.length?'bad':''}`} key={i}>{a.errors.length?<AlertTriangle size={16}/>:<Check size={16}/>}<div><strong>{a.label}</strong><code>{a.locator}</code><small>{a.errors.length?'pageerror captured':'No browser error observed'}</small></div></div>)}{busy&&<div className="scanning">● Exploring in Chromium…</div>}{!hunt&&<p className="empty">Every action shown here comes from an actual Playwright run.</p>}</div><div className="scope">Scope locked to the bundled fixture.<br/>No external sites or credentials.</div></div>
    <div className="result panel"><div className="panelhead"><span>CRASH EVIDENCE</span><span className={issue?'red':'dim'}>{issue?'● CONFIRMED CRASH':'○ AWAITING RUN'}</span></div>{issue?<div className="resultbody"><div className="errorline"><AlertTriangle size={22}/><div><span>UNCAUGHT PAGE ERROR</span><h2>{issue.errors[0]}</h2></div></div><div className="evidencegrid"><div><pre>{issue.stack}</pre><div className="reprosteps"><span>MINIMAL REPRO</span><p>1. Open local fixture<br/>2. Click <code>{issue.locator}</code></p></div><button className="secondary" disabled={busy} onClick={()=>run('reproduce')}><RotateCcw size={16}/> Reproduce</button>{repro?.state==='complete'&&<p className={repro.reproduced?'success':'red'} data-testid="repro-result">{repro.reproduced?'✓ Same error reproduced in a fresh context':'Error did not reproduce'}</p>}<small>Detected {new Date(issue.timestamp).toLocaleTimeString()}{repro?.issue&&<> · Replayed {new Date(repro.issue.timestamp).toLocaleTimeString()}</>}</small></div><div className="capture">{showVideo?<video controls autoPlay src={evidence?.video}/>:<img src={evidence?.screenshot} alt="Actual browser screenshot after crash"/>}<button className="video" onClick={()=>setShowVideo(!showVideo)}><Play size={14}/>{showVideo?'Show screenshot':'Watch recorded repro'}</button><a href={evidence?.video} target="_blank" rel="noreferrer">Open video ↗</a></div></div></div>:<div className="waiting"><Aperture size={62}/><h2>Your next bug has a paper trail.</h2><p>Start a hunt to capture the selector,<br/>browser stack, screenshot, and recording.</p>{hunt?.state==='complete'&&<p>No reproducible page error found.</p>}</div>}</div></section><footer><span>BUGCAM / BOUNDED LOCAL DEMO CRASH DETECTION</span><span>Real browser execution · Intentionally buggy fixture</span></footer></main>;
}
