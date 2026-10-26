import express from 'express';
const app = express(); app.use(express.json({limit:'512kb'}));
app.get('/api/health', (_req,res) => res.json({ ok: true, project: 'bug-cam' }));
app.listen(5204, '127.0.0.1', () => console.log('[bug-cam] api ready on 5204'));
