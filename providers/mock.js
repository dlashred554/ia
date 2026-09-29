const { run } = require('../lib/ffmpeg');

module.exports = {
  name: 'mock',
  requiresApiKey: false,
  envVar: null,
  clipSeconds: +process.env.CLIP_SECONDS || 6,
  notice: 'Modo demostración: no usa IA; genera patrones de prueba con ffmpeg.',
  isConfigured: () => true,
  async generateClip({ seconds, outPath }) {
    await run(['-f', 'lavfi', '-i', `testsrc2=size=540x960:rate=30:duration=${Math.max(1, Math.ceil(seconds))}`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', outPath]);
  },
};