import express from 'express';
import { resolve } from 'node:path';
import { startRun, runs, validateTarget } from './hunter';
const app = express();
app.use(express.json({limit:'8kb'}));
app.use('/api', (req,res,next)=>{
  const origin=req.get('origin');
  if (origin && !['http://127.0.0.1:4204','http://127.0.0.1:5204'].includes(origin)) {res.status(403).json({error:'Local origin required'});return;}
  next();
});
app.get('/api/health', (_req,res) => res.json({ ok: true, project: 'bug-cam' }));
app.use('/fixture',express.static(resolve('fixtures/buggy-site')));
app.use('/api/artifacts',express.static(resolve('artifacts/hunts'),{dotfiles:'deny',index:false}));
app.post('/api/scan',(req,res)=>{
  try {validateTarget(req.body?.target);res.status(202).json(startRun('scan'));}
  catch(e){res.status((e as Error).message.includes('active')?409:400).json({error:(e as Error).message});}
});
app.post('/api/reproduce',(req,res)=>{
  const source=runs.get(req.body?.runId);
  if(!source?.issue || source.state!=='complete' || source.kind!=='scan') {res.status(400).json({error:'A completed hunt with an issue is required'});return;}
  try {res.status(202).json(startRun('reproduce',source));}catch(e){res.status(409).json({error:(e as Error).message});}
});
app.get('/api/runs/:id',(req,res)=>{const run=runs.get(req.params.id);run?res.json(run):res.status(404).json({error:'Run not found'});});
app.listen(5204, '127.0.0.1', () => console.log('[bug-cam] api ready on 5204'));
