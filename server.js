require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { getProvider } = require('./providers');
const { planScenes } = require('./lib/planner');
const ff = require('./lib/ffmpeg');

const app = express();
const OUT = path.join(__dirname, 'output');
fs.mkdirSync(OUT, { recursive: true });
const provider = getProvider();
const MAX_SECONDS = +process.env.MAX_TOTAL_SECONDS || 180;
const jobs = new Map();

app.use(express.json({ limit: '100kb' }));
app.use('/videos', express.static(OUT));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.get('/api/config', (req, res) => res.json({
  provider: provider.name,
  requiresApiKey: provider.requiresApiKey,
  configured: provider.isConfigured(),
  envVar: provider.envVar,
  clipSeconds: provider.clipSeconds,
  maxSeconds: MAX_SECONDS,
  notice: provider.notice,
}));

app.post('/api/generate', (req, res) => {
  const { prompt, duration, style } = req.body || {};
  const seconds = Math.round(Number(duration));
  if (typeof prompt !== 'string' || prompt.trim().length < 5) return res.status(400).json({ error: 'Escribe un prompt de al menos 5 caracteres.' });
  if (!(seconds >= 1 && seconds <= MAX_SECONDS)) return res.status(400).json({ error: `La duración debe estar entre 1 y ${MAX_SECONDS} segundos.` });
  if (!provider.isConfigured()) return res.status(503).json({ error: `Falta configurar la variable de entorno ${provider.envVar}.` });

  const job = { id: crypto.randomUUID(), status: 'running', progress: 0, message: 'Analizando el prompt…' };
  jobs.set(job.id, job);
  setTimeout(() => jobs.delete(job.id), 60 * 60 * 1000);
  runJob(job, prompt, seconds, typeof style === 'string' ? style.slice(0, 100) : '');
  res.status(202).json({ id: job.id });
});

app.get('/api/jobs/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  return job ? res.json(job) : res.status(404).json({ error: 'Trabajo no encontrado o caducado.' });
});

async function runJob(job, prompt, seconds, style) {
  const dir = path.join(OUT, job.id);
  try {
    fs.mkdirSync(dir, { recursive: true });
    const scenes = planScenes(prompt, style, seconds, provider.clipSeconds);
    job.scenes = scenes.length;
    const clips = [];
    for (let i = 0; i < scenes.length; i++) {
      job.message = scenes.length > 1 ? `Generando escena ${i + 1} de ${scenes.length}…` : 'Generando clip…';
      const raw = path.join(dir, `raw${i}.mp4`);
      const norm = path.join(dir, `scene${i}.mp4`);
      await provider.generateClip({ prompt: scenes[i].prompt, seconds: scenes[i].seconds, outPath: raw });
      await ff.normalize(raw, norm, scenes[i].seconds);
      fs.unlinkSync(raw);
      clips.push(norm);
      job.progress = Math.round(((i + 1) / (scenes.length + 1)) * 100);
    }
    job.message = 'Uniendo escenas…';
    const finalPath = path.join(dir, 'video.mp4');
    if (clips.length === 1) fs.copyFileSync(clips[0], finalPath);
    else await ff.concat(clips, finalPath, path.join(dir, 'list.txt'));
    job.duration = await ff.duration(finalPath);
    job.url = `/videos/${job.id}/video.mp4`;
    job.progress = 100;
    job.message = 'Listo';
    job.status = 'done';
  } catch (e) {
    console.error(e);
    job.status = 'error';
    job.error = e.message;
  }
}

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`http://localhost:${port} — proveedor: ${provider.name}`));
