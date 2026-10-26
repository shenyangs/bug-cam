import { useState } from 'react';
import type { Run } from '../server/hunter';
export default function App() {
  const [hunt,setHunt]=useState<Run|null>(null),[repro,setRepro]=useState<Run|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [showVideo,setShowVideo]=useState(false);
  const [detailsOpen,setDetailsOpen]=useState(true);
  const [selected,setSelected]=useState<number|null>(null);
  async function run(kind:'scan'|'reproduce') {
    setBusy(true);setError('');setShowVideo(false);setSelected(null);
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
  const issue=hunt?.issue;
  const evidence=selected === null ? (repro?.issue || issue) : hunt?.attempts[selected];
  const time=(value:string)=>new Date(value).toLocaleTimeString('zh-CN',{hour12:false});
  const offset=(value:string)=>`${((new Date(value).getTime()-new Date(hunt!.startedAt).getTime())/1000).toFixed(1)}s`;
  const selectStep=(index:number)=>{setSelected(index);setShowVideo(false);};
  return <main>
    <a className="skip" href="#hunt-button">跳到开始扫描</a>
    <header className="appbar">
      <a className="wordmark" href="/" aria-label="BugCam 首页"><span className="mark" aria-hidden="true">B<span>·</span></span>BugCam</a>
      <span className="appname">故障回放台</span><span className="local">本地会话 / Chromium</span>
    </header>
    <section className="projectbar" aria-label="扫描目标">
      <div><span className="eyebrow">当前项目 · 预置故障示例</span><h1>Parcel <span>导出故障</span></h1></div>
      <div className="target"><span>扫描目标：本地测试页面</span><code>127.0.0.1:5204/fixture/</code></div>
      <button id="hunt-button" className="primary" disabled={busy} onClick={()=>run('scan')}><span aria-hidden="true">{busy?'◌':'●'}</span>{busy?'浏览器运行中…':hunt?'重新扫描':'开始扫描'}</button>
    </section>
    {error&&<div role="alert" className="error">{error} 点击扫描按钮可重试。</div>}
    <section className={`desk ${detailsOpen?'with-details':''}`} aria-busy={busy} aria-label="探索记录与异常证据">
      <div className="viewer">
        <div className="viewerbar"><span>{evidence ? `${selected===null&&repro?.issue?'独立复现':'扫描记录'} / ${evidence.label}` : '现场监看'}</span><button className="text-button" aria-expanded={detailsOpen} aria-controls="error-details" onClick={()=>setDetailsOpen(!detailsOpen)}>{detailsOpen?'收起详情':'展开详情'} <span aria-hidden="true">{detailsOpen?'↗':'↙'}</span></button></div>
        <div className={`stage ${busy?'is-loading':''}`}>
          {evidence ? (showVideo?<video key={evidence.video} aria-label="真实浏览器复现录像" controls autoPlay src={evidence.video}/>:<img src={evidence.screenshot} alt={`${evidence.label}后的真实浏览器截图`}/>) : <div className="empty-stage">
            <span className="frame-corner" aria-hidden="true"/>
            <span className="eyebrow">{busy?'正在录制浏览器操作':'还没有浏览器记录'}</span>
            <h2>{busy?'等待第一帧。':'从一次点击开始。'}</h2>
            <p>{busy?'每个步骤完成后，截图会出现在下方。':'开始扫描，查看哪次操作触发了异常。'}</p>
            {!busy&&<span className="start-guide">扫描 → 复现 → 查看录像</span>}
          </div>}
        </div>
        <div className="transport">
          <span className="timecode">{evidence?time(evidence.timestamp):'— : — : —'}</span>
          {evidence&&<><button className="play-button" onClick={()=>setShowVideo(!showVideo)}><span aria-hidden="true">{showVideo?'▣':'▷'}</span>{showVideo?'显示截图':selected!==null?'观看步骤录像':repro?.issue?'观看复现录像':'观看现场录像'}</button><a className="open-video" href={evidence.video} target="_blank" rel="noreferrer">打开原片 ↗</a></>}
          <span className="record-status" role="status">{busy?'● 正在执行并保存证据':evidence?'真实浏览器记录':'等待扫描'}</span>
        </div>
      </div>
      {detailsOpen&&<aside id="error-details" className="inspector" aria-label="错误详情">
        <div className="inspector-title">检查器 <span>{issue?'已确认异常':'待检查'}</span></div>
        {issue?<>
          <span className="issue-type">JavaScript / pageerror</span>
          <h2>{issue.errors[0]}</h2>
          <p className="detail-note">在另一个浏览器上下文中再次触发了相同错误。</p>
          <div className="repro-path"><span>复现路径</span><p>打开本地页面 <span aria-hidden="true">→</span> 点击 <code>{issue.locator}</code></p></div>
          <button className="reproduce" aria-label="复现异常" disabled={busy} onClick={()=>run('reproduce')}>↻ 复现异常</button>
          {repro?.state==='complete'&&<p className="repro-status" role="status" data-testid="repro-result">{repro.reproduced?'✓ 已在全新上下文中复现相同异常':'此次未复现相同异常'}</p>}
          <dl className="timestamps"><div><dt>发现时间</dt><dd>{time(issue.timestamp)}</dd></div>{repro?.issue&&<div><dt>复现时间</dt><dd>{time(repro.issue.timestamp)}</dd></div>}</dl>
          <details className="stack" open><summary>原始调用栈</summary><pre aria-label="原始浏览器调用栈">{issue.stack}</pre></details>
        </>:<div className="inspector-empty"><span aria-hidden="true">[ ! ]</span><p>出错的那一刻，<br/>会留在这里。</p><small>扫描后可查看异常和调用栈，<br/>也可以独立重跑一次。</small>{hunt?.state==='complete'&&<p>本次未发现可重复触发的页面异常。</p>}</div>}
      </aside>}
      <section className="timeline" aria-label="操作时间线">
        <div className="timeline-heading"><h2>操作时间线</h2><span>{hunt?`${hunt.attempts.length} 次操作 · 始于 ${time(hunt.startedAt)}`:'扫描后生成实际操作记录'}</span></div>
        <div className="ruler" aria-hidden="true"/>
        {hunt?.attempts.length ? <ol className="clips">{hunt.attempts.map((a,i)=><li key={a.timestamp}><button className={`clip ${a.errors.length?'fault':''}`} aria-label={`查看步骤 ${i+1}：${a.label}`} aria-pressed={evidence===a} onClick={()=>selectStep(i)}><span className="clip-index">{String(i+1).padStart(2,'0')}</span><div><strong>{a.label}</strong><small>{a.errors.length?'页面异常': '未观察到异常'} · <code>{a.locator}</code></small></div><time>+{offset(a.timestamp)}</time></button></li>)}</ol>:<div className="empty-track">{busy?'正在打开示例页面…':'没有片段。开始扫描后，点选步骤查看对应画面。'}</div>}
      </section>
    </section>
    <footer><span>预置故障示例 · 启发式探索 · 未使用 AI 模型</span><details><summary>使用范围</summary><p>仅扫描内置页面，最多 8 个控件，限时 30 秒另加证据保存时间。不访问外部网站或用户凭据。重启服务后需重新扫描；旧录像仍保留在本地。</p></details></footer>
  </main>;
}
