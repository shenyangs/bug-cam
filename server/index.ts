import express from 'express';
import { resolve } from 'node:path';
import { startRun, runs, validateTarget } from './hunter';
const app = express();
app.use(express.json({limit:'8kb'}));
app.use('/api', (req,res,next)=>{
  const origin=req.get('origin');
  if (origin && !['http://127.0.0.1:4204','http://127.0.0.1:5204'].includes(origin)) {res.status(403).json({error:'仅允许本地界面发起请求'});return;}
  next();
});
app.get('/api/health', (_req,res) => res.json({ ok: true, project: 'bug-cam' }));
app.use('/fixture',express.static(resolve('fixtures/buggy-site')));
app.use('/api/artifacts',express.static(resolve('artifacts/hunts'),{dotfiles:'deny',index:false}));
app.post('/api/scan',(req,res)=>{
  try {validateTarget(req.body?.target);res.status(202).json(startRun('scan'));}
  catch(e){res.status((e as Error).message.includes('正在运行')?409:400).json({error:(e as Error).message});}
});
app.post('/api/reproduce',(req,res)=>{
  const source=runs.get(req.body?.runId);
  if(!source?.issue || source.state!=='complete' || source.kind!=='scan') {res.status(400).json({error:'请先完成扫描并找到可复现的异常'});return;}
  try {res.status(202).json(startRun('reproduce',source));}catch(e){res.status(409).json({error:(e as Error).message});}
});
app.get('/api/runs/:id',(req,res)=>{const run=runs.get(req.params.id);run?res.json(run):res.status(404).json({error:'未找到该次运行记录，请重新扫描'});});
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => { res.status(400).json({error:'请求内容无法处理，请使用界面重试。'}); });
app.listen(5204, '127.0.0.1', () => console.log('[BugCam] API 已启动：http://127.0.0.1:5204/api/health\n[BugCam] 请在浏览器访问：http://127.0.0.1:4204（仅本机，零 Key 演示）')).on('error', (error: NodeJS.ErrnoException) => { console.error(`[BugCam] 服务启动失败：${error.code === 'EADDRINUSE' ? '端口 5204 已占用，请停止自己已启动的服务后重试。' : '请运行 npm run doctor 检查环境。'} 技术代码：${error.code}`); process.exit(1); });
