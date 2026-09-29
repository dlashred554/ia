// Proveedor real: API HTTP de Replicate (https://replicate.com/docs/reference/http).
// Requiere REPLICATE_API_TOKEN. Cada clip consume créditos según el modelo elegido.
const fs = require('fs');
const BASE = 'https://api.replicate.com/v1';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(url, options, headers) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const r = await fetch(url, { ...options, headers });
    if (r.status !== 429) {
      if (!r.ok) throw new Error(`Replicate ${r.status}: ${(await r.text()).slice(0, 300)}`);
      return r.json();
    }
    await sleep(10000); // límite de peticiones: espera y reintenta
  }
  throw new Error('Replicate: demasiadas peticiones (límite de tu cuenta). Inténtalo más tarde.');
}

module.exports = {
  name: 'replicate',
  requiresApiKey: true,
  envVar: 'REPLICATE_API_TOKEN',
  clipSeconds: +process.env.CLIP_SECONDS || 6,
  notice: 'Depende de la API externa de Replicate y consume créditos por cada clip. Los vídeos largos generan muchos clips. Los límites dependen de tu cuenta.',
  isConfigured: () => !!process.env.REPLICATE_API_TOKEN,

  async generateClip({ prompt, outPath }) {
    const model = process.env.REPLICATE_MODEL || 'minimax/video-01';
    const extra = process.env.REPLICATE_EXTRA_INPUT ? JSON.parse(process.env.REPLICATE_EXTRA_INPUT) : {};
    const headers = { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`, 'Content-Type': 'application/json' };

    let p = await api(`${BASE}/models/${model}/predictions`,
      { method: 'POST', body: JSON.stringify({ input: { prompt, ...extra } }) }, headers);

    const start = Date.now();
    while (!['succeeded', 'failed', 'canceled'].includes(p.status)) {
      if (Date.now() - start > 10 * 60 * 1000) throw new Error('Replicate: el clip tardó más de 10 minutos.');
      await sleep(3000);
      p = await api(p.urls.get, { method: 'GET' }, headers);
    }
    if (p.status !== 'succeeded') throw new Error(`Replicate: ${p.error || p.status}`);

    const url = Array.isArray(p.output) ? p.output[0] : p.output;
    const file = await fetch(url);
    if (!file.ok) throw new Error(`No se pudo descargar el clip (${file.status}).`);
    fs.writeFileSync(outPath, Buffer.from(await file.arrayBuffer()));
  },
};
