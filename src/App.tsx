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
        if(Date.now()>end)throw new Error('等待浏览器运行超时，请检查服务后重试');
        await new Promise(r=>setTimeout(r,300));
        const poll=await fetch(`/api/runs/${result.id}`);result=await poll.json();if(!poll.ok)throw new Error(result.error);update(result);
      }
      if(result.state==='failed')throw new Error(result.message);
    }catch(e){setError(e instanceof TypeError || e instanceof SyntaxError ? '无法连接本地服务。请运行 npm run doctor 检查，再运行 npm run dev 后重试。' : (e as Error).message);}finally{setBusy(false);}
  }
  const issue=hunt?.issue, evidence=repro?.issue || issue;
  return <main><a className="skip" href="#hunt-button">跳到开始扫描</a><header><div className="brand"><Aperture size={27}/> BugCam <span>/ 实验室</span></div><div className="mode"><i/> 本地 Chromium <span>启发式探索 · 未使用 AI 模型</span></div></header>
    <section className="intro"><div><div className="eyebrow">浏览器异常捕手</div><h1>找到异常。<br/><span>留下证据。</span></h1><p>有界探索，捕获真实浏览器异常。<br/>独立重放点击，确认问题可复现。</p><p className="guide">① 开始扫描 → ② 复现异常 → ③ 观看录像</p></div><div className="target"><span className="eyebrow">01 / 受控测试环境</span><h3>扫描目标：本地测试页面</h3><code>127.0.0.1:5204/fixture/</code><div className="tags"><span>预置故障示例</span><span>最多 8 个控件</span><span>限时 30 秒</span></div><button id="hunt-button" className="primary" disabled={busy} onClick={()=>run('scan')}><Play size={16}/>{busy?'浏览器运行中…':hunt?'重新扫描':'开始扫描'}<ArrowUpRight size={18}/></button></div></section>
    {error&&<div role="alert" className="error">{error} 可点击“重新扫描”再次尝试。</div>}
    <section className="workspace" aria-busy={busy} aria-label="探索记录与异常证据"><div className="timeline panel"><div className="panelhead"><span>探索日志</span><span>{hunt?.attempts.length ?? 0} 次操作</span></div><div className="timelinebody"><div className="step"><Circle size={16}/><div><strong>独立浏览器会话</strong><small>{hunt?new Date(hunt.startedAt).toLocaleTimeString():'等待首次扫描'}</small></div></div>{hunt?.attempts.map((a,i)=><div className={`step ${a.errors.length?'bad':''}`} key={i}>{a.errors.length?<AlertTriangle size={16}/>:<Check size={16}/>}<div><strong>{a.label}</strong><code>{a.locator}</code><small>{a.errors.length?'已捕获页面异常':'未观察到页面异常'}</small></div></div>)}{busy&&<div className="scanning" role="status">● 正在使用 Chromium 探索…</div>}{!hunt&&<p className="empty">此处每项操作均来自真实的 Playwright 浏览器执行。</p>}</div><div className="scope">仅扫描内置故障示例。<br/>不访问外部网站或用户凭据。</div></div>
    <div className="result panel"><div className="panelhead"><span>异常证据</span><span className={issue?'red':'dim'}>{issue?'● 已确认异常':'○ 等待扫描'}</span></div>{issue?<div className="resultbody"><div className="errorline"><AlertTriangle size={22}/><div><span>未捕获的页面异常</span><h2>{issue.errors[0]}</h2></div></div><div className="evidencegrid"><div><pre aria-label="原始浏览器调用栈">{issue.stack}</pre><div className="reprosteps"><span>最小复现步骤</span><p>1. 打开本地故障示例<br/>2. 点击 <code>{issue.locator}</code></p></div><button className="secondary" disabled={busy} onClick={()=>run('reproduce')}><RotateCcw size={16}/> 复现异常</button>{repro?.state==='complete'&&<p className={repro.reproduced?'success':'red'} role="status" data-testid="repro-result">{repro.reproduced?'✓ 已在全新上下文中复现相同异常':'此次未复现相同异常'}</p>}<small>发现时间 {new Date(issue.timestamp).toLocaleTimeString()}{repro?.issue&&<> · 重放时间 {new Date(repro.issue.timestamp).toLocaleTimeString()}</>}</small></div><div className="capture">{showVideo?<video aria-label="真实浏览器复现录像" controls autoPlay src={evidence?.video}/>:<img src={evidence?.screenshot} alt="异常发生后的真实浏览器截图"/>}<button className="video" onClick={()=>setShowVideo(!showVideo)}><Play size={14}/>{showVideo?'显示截图':'观看复现录像'}</button><a href={evidence?.video} target="_blank" rel="noreferrer">新窗口打开录像 ↗</a></div></div></div>:<div className="waiting"><Aperture size={62}/><h2>让异常有据可查。</h2><p>开始扫描，记录触发控件、<br/>浏览器调用栈、截图与录像。</p>{hunt?.state==='complete'&&<p>未发现可重复触发的页面异常。</p>}</div>}</div></section><footer><span>BUGCAM / 本地示例有界异常检测</span><span>真实浏览器执行 · 示例故意包含缺陷</span></footer></main>;
}
