const fs = require('fs');
const crypto = require('crypto');

const API = 'https://api.replicate.com/v1';
const MODEL = 'wan-video/wan-2.1-1.3b';
const TOKEN = () => process.env.REPLICATE_API_TOKEN || '';

const sleep = ms => new Promise(r => setTimeout(r, ms));

function configured() {
  return Boolean(TOKEN());
}

async function api(path, options = {}) {
  const headers = {
    Authorization: `Bearer ${TOKEN()}`,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const r = await fetch(API + path, { ...options, headers });
  const text = await r.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { error: text }; }
  if (!r.ok) {
    throw new Error(data.detail || data.error || `Replicate ${r.status}`);
  }
  return data;
}

module.exports = {
  name: 'replicate-wan-2.1-1.3b',
  requiresApiKey: true,
  envVar: 'REPLICATE_API_TOKEN',
  clipSeconds: 5,
  notice: 'Generación online con Wan 2.1. No necesitas instalar nada en tu portátil. La API de Replicate cobra según el modelo y uso.',
  isConfigured: configured,

  async generateClip({ prompt, outPath }) {
    const prediction = await api('/models/wan-video/wan-2.1-1.3b/predictions', {
      method: 'POST',
      headers: { Prefer: 'wait=5' },
      body: JSON.stringify({
        input: {
          prompt,
          frame_num: 81,
          resolution: '480p',
          aspect_ratio: '9:16',
          sample_steps: 30,
          sample_guide_scale: 6,
          seed: crypto.randomInt(0, 2147483647),
        },
      }),
    });

    let current = prediction;
    const started = Date.now();

    while (current.status === 'starting' || current.status === 'processing') {
      if (Date.now() - started > 30 * 60 * 1000) {
        await api(`/predictions/${current.id}/cancel`, { method: 'POST' }).catch(() => {});
        throw new Error('La generación tardó más de 30 minutos y se canceló.');
      }
      await sleep(2000);
      current = await api(`/predictions/${current.id}`);
    }

    if (current.status !== 'succeeded') {
      throw new Error(current.error || `La generación terminó con estado: ${current.status}`);
    }

    const output = current.output;
    const url = typeof output === 'string' ? output : Array.isArray(output) ? output[0] : null;
    if (!url) throw new Error('Replicate terminó sin devolver un vídeo.');

    const r = await fetch(url);
    if (!r.ok) throw new Error(`No se pudo descargar el vídeo generado (${r.status}).`);
    fs.writeFileSync(outPath, Buffer.from(await r.arrayBuffer()));
  },
};
