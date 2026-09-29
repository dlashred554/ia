const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE = process.env.COMFYUI_URL || 'http://127.0.0.1:8188';
const WORKFLOW = process.env.COMFYUI_WORKFLOW || path.join(__dirname, '..', 'comfyui', 'workflow_api.json');
const sleep = ms => new Promise(r => setTimeout(r, ms));

function configured() { return fs.existsSync(WORKFLOW); }

function deepReplace(value, replacements) {
  if (typeof value === 'string') {
    let s = value;
    for (const [from, to] of Object.entries(replacements)) s = s.split(from).join(String(to));
    return s;
  }
  if (Array.isArray(value)) return value.map(v => deepReplace(v, replacements));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = deepReplace(v, replacements);
    return out;
  }
  return value;
}

async function getJson(url, options) {
  const r = await fetch(url, options);
  if (!r.ok) throw new Error(`ComfyUI ${r.status}: ${(await r.text()).slice(0,300)}`);
  return r.json();
}

module.exports = {
  name: 'local-comfyui',
  requiresApiKey: false,
  envVar: 'COMFYUI_WORKFLOW',
  clipSeconds: +process.env.CLIP_SECONDS || 4,
  notice: 'Generación local: los clips se procesan en tu PC mediante ComfyUI. No se usa una API de vídeo externa.',
  isConfigured: configured,
  async generateClip({ prompt, seconds, outPath }) {
    if (!configured()) throw new Error('Falta comfyui/workflow_api.json.');
    const workflow = JSON.parse(fs.readFileSync(WORKFLOW, 'utf8'));
    const clientId = crypto.randomUUID();
    const payload = deepReplace(workflow, {
      '__PROMPT__': prompt,
      '__SEED__': Math.floor(Math.random() * 2147483647),
      '__FRAMES__': Math.max(8, Math.round(seconds * 8)),
      '__FILENAME__': `ia_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
    });
    const queued = await getJson(`${BASE}/prompt`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({prompt:payload, client_id:clientId}) });
    const promptId = queued.prompt_id;
    if (!promptId) throw new Error('ComfyUI no devolvió prompt_id.');
    const started = Date.now();
    while (Date.now() - started < 30*60*1000) {
      await sleep(1500);
      const history = await getJson(`${BASE}/history/${promptId}`);
      const item = history[promptId];
      if (!item) continue;
      if (item.status?.status_str === 'error') throw new Error('ComfyUI no pudo ejecutar el workflow. Revisa su consola.');
      for (const node of Object.values(item.outputs || {})) {
        for (const key of ['gifs','videos','images']) {
          const arr = node[key];
          if (!Array.isArray(arr) || !arr.length || !arr[0].filename) continue;
          const file = arr[0];
          const qs = new URLSearchParams({filename:file.filename, subfolder:file.subfolder || '', type:file.type || 'output'});
          const r = await fetch(`${BASE}/view?${qs}`);
          if (!r.ok) throw new Error(`No se pudo descargar la salida de ComfyUI (${r.status}).`);
          fs.writeFileSync(outPath, Buffer.from(await r.arrayBuffer()));
          return;
        }
      }
    }
    throw new Error('ComfyUI tardó más de 30 minutos en generar el clip.');
  },
};